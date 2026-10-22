import {beginColonization,currentSystems,type ColonizeMove} from './colonization';
import {beginBasicFleet,type BasicFleetMove} from './basic-fleet-action';
import {beginTechnologyAction,type TechnologyActionMove} from './technology-actions';
import {updateControl} from './discovery-movement';
import {syncFleetPowers} from './discovery-economy';
import {beginLevelTwo,respondToDiscovery,applyAutomaticDiscovery,prepareDiscovery,prepareFleetPower,type DiscoveryMove} from './discovery-resolution';
import {availableClaims,claimAchievement} from './achievements';
import {publicDiscovery,type DiscoveryState} from './discovery';
import { foodColumns, levelOne, oreYields, supplyCapacity } from './manifest';
import type { PlayerState, PublicSetup } from './setup';

/** Durable public turn state; unrevealed decks never enter this projection. */
export type TurnPlayer = Omit<PlayerState, 'position' | 'name' | 'faction'>;
export type PlayState = { turn:number; activePosition:string; phase:PublicSetup['phase']; players:Record<string,TurnPlayer>; discovery?:DiscoveryState };
export type TurnMove = ColonizeMove | DiscoveryMove | TechnologyActionMove | BasicFleetMove
  | { kind:'research-I'; space:number; card:typeof levelOne[number]; ship?:string; supplyFallback?:'population'|'skip' }
  | { kind:'grow'|'ore'|'trade'|'buy-population'|'sell-population'|'finish-trading' }
  | {kind:'end-turn'}
  | {kind:'claim-achievement';card:string}
  | {kind:'black-market';track:'food'|'ore'}
  | { kind:'gather'; supplyFallback?:'population'|'skip' }
  | { kind:'decommission'; ship:string };
export const initialPlay = (game:PublicSetup):PlayState => ({turn:0,activePosition:game.players[0].position,phase:'action',players:{}});
export function economy(p:PlayerState):TurnPlayer {
  const {position:_, name:__, faction:___,...result}=p;
  return structuredClone(result);
}
export function projectGame(initial:PublicSetup, play?:PlayState):PublicSetup {
  if(!play)return initial;
  return {...initial,phase:play.phase,turn:play.turn,achievementClaims:play.discovery?.claims?.length??0,activePosition:play.activePosition,players:initial.players.map(p=>({...p,...play.players[p.position]})),...(play.discovery?{discovery:publicDiscovery(play.discovery,initial.count),technologies:[...initial.technologies,...play.discovery.technologies],eventCovers:initial.eventCovers.filter(c=>!play.discovery!.events.some(e=>e.slot===c.slot)),systems:currentSystems(initial,play.discovery),deckCounts:{...initial.deckCounts,II:play.discovery.deckII.length,A:play.discovery.systemDecks.A.length,B:play.discovery.systemDecks.B.length}}:{})};
}
export function growthColumns(p:TurnPlayer) {
  return foodColumns.slice(0,9-p.foodDiscs).flatMap((letter)=>letter?[{letter,index:letter.charCodeAt(0)-65,available:p.supply[letter.charCodeAt(0)-65]>0}]:[]);
}
export function oreProduction(p:TurnPlayer) { return oreYields.slice(0,9-p.oreDiscs).reduce((a,b)=>a+b,0); }
export function researchBlocker(game:PublicSetup,space:number,card?:string):string {
  const actor=game.players.find(p=>p.position===game.activePosition)!;
  if(game.phase!=='action')return 'Finish the current phase first';
  if(!Number.isInteger(space)||space<0||space>=game.count)return 'Choose a printed Level I action space';
  const location=`research-I:${space}`, occupant=game.players.find(p=>p.actionLocation===location);
  if(occupant)return occupant.position===actor.position?'Move to another action space':`Occupied by ${occupant.name}`;
  if(actor.population<1)return 'Need 1 more Population';
  if(card&&!levelOne.includes(card as typeof levelOne[number]))return 'Choose a revealed Level I technology';
  if(card&&actor.research.includes(card))return 'Already researched by your faction';
  if(!card&&levelOne.every(id=>actor.research.includes(id)))return 'All Level I technologies already researched';
  return '';
}
function takeSupply(p:TurnPlayer) {
  const column=p.supply.findIndex(n=>n>0);
  if(column<0)return false;
  p.supply[column]--;return true;
}
function returnSupply(p:TurnPlayer) {
  let column=p.supply.findLastIndex((n,i)=>n<supplyCapacity[i]);
  if(column<0)column=0;
  p.supply[column]++;
}
function validPayload(move:TurnMove) {
  if(!move || typeof move!=='object')throw new Error('Choose a supported turn command.');
  const keys=move.kind==='colonize'?['kind','source','slot','ships']:move.kind==='build-jump'?['kind','space','build','destination']:move.kind==='technology-action'?['kind','card','action','space','destination']:move.kind==='prepare-fleet-power'?['kind','position']:move.kind==='black-market'?['kind','track']:move.kind==='claim-achievement'?['kind','card']:move.kind==='research-II'?['kind','space','slot']:move.kind==='discovery-advance'?['kind','at']:move.kind==='discovery-choice'?['kind','at','option','target','ships','track','destination','usePopulation','legs']:move.kind==='gather'?['kind','supplyFallback']:move.kind==='research-I'?['kind','space','card','ship','supplyFallback']:move.kind==='decommission'?['kind','ship']:['kind'];
  if(Object.keys(move).some(key=>!keys.includes(key)))throw new Error('Unsupported turn payload.');
}
export function applyTurn(initial:PublicSetup,before:PlayState|undefined,position:string,move:TurnMove,seed?:string):PlayState {
  validPayload(move);
  if(move.kind==='colonize'||move.kind==='build-jump'||move.kind==='technology-action'||move.kind==='prepare-discovery'||move.kind==='prepare-fleet-power'||move.kind==='research-II'||move.kind==='discovery-choice'||move.kind==='discovery-advance'){
    const state=structuredClone(before??initialPlay(initial));
    if(move.kind==='colonize')return syncFleetPowers(initial,beginColonization(initial,projectGame(initial,state),state,position,move));
    if(move.kind==='build-jump')return syncFleetPowers(initial,beginBasicFleet(initial,projectGame(initial,state),state,position,move));
    if(move.kind==='technology-action')return syncFleetPowers(initial,beginTechnologyAction(initial,projectGame(initial,state),state,position,move));
    if(move.kind==='discovery-advance')return syncFleetPowers(initial,applyAutomaticDiscovery(initial,state,projectGame(initial,state),position,move.at));
    if(move.kind==='discovery-choice')return syncFleetPowers(initial,respondToDiscovery(initial,state,position,move));
    if(!seed)throw new Error('The retained setup random input is required for discovery.');
    if(move.kind==='prepare-fleet-power')return prepareFleetPower(initial,state,position,move.position);
    if(move.kind==='prepare-discovery')return syncFleetPowers(initial,prepareDiscovery(initial,state,position,seed));
    return syncFleetPowers(initial,beginLevelTwo(initial,projectGame(initial,state),state,position,move,seed));
  }
  const state=structuredClone(before??initialPlay(initial)),game=projectGame(initial,state), actor=game.players.find(p=>p.position===game.activePosition)!;
  if(position!==actor.position)throw new Error(`It is ${actor.name}’s turn.`);
  const p=economy(actor);
  if(move.kind==='claim-achievement')return claimAchievement(game,state,position,move.card);
  if(move.kind==='black-market') {
    const d=state.discovery;
    if(!d?.events.some(e=>e.id==='black-market-industries'&&e.resolved)||d.industry.includes(position))throw new Error('Black Market Industries is unavailable or already used by your faction.');
    if(move.track!=='food'&&move.track!=='ore')throw new Error('Choose Food or Ore.');
    const key=move.track==='food'?'foodDiscs':'oreDiscs';
    if(p[key]===0)throw new Error('No matching production disc remains.');
    p[key]--;d.industry.push(position);
  } else if(move.kind==='gather') {
    if(state.phase!=='action')throw new Error('Finish the current phase first.');
    const occupied=game.players.find(other=>other.actionLocation==='supply-population:0');
    if(occupied&&occupied.position!==position)throw new Error(`Occupied by ${occupied.name}.`);
    if(p.supply.some(n=>n>0)){if(move.supplyFallback)throw new Error('Use the leftmost Supply cube.');takeSupply(p);p.population++;}
    else if(!['population','skip'].includes(move.supplyFallback??''))throw new Error('Choose the exhausted Supply exception.');
    else if(move.supplyFallback==='population'&&p.population<1)throw new Error('No Population is available.');
    p.ore++;p.actionLocation='supply-population:0';state.phase='production';
  } else if(move.kind==='research-I') {
    const blocker=researchBlocker(game,move.space,move.card);if(blocker)throw new Error(blocker);
    if(move.card!=='narrow-beam-lasers'&&move.ship)throw new Error('This bonus does not upgrade a ship.');
    if(move.card!=='terraforming'&&move.supplyFallback)throw new Error('This bonus has no Supply fallback.');
    p.population--;p.research.push(move.card);p.actionLocation=`research-I:${move.space}`;
    if(move.card==='terraforming') {
      const exhausted=!p.supply.some(n=>n>0);
      if(!exhausted&&move.supplyFallback)throw new Error('Use the leftmost Supply cube.');
      if(exhausted&&!['population','skip'].includes(move.supplyFallback??''))throw new Error('Choose whether to use Population for the exhausted Supply bonus.');
      if(!exhausted||move.supplyFallback==='population') {
        if(exhausted) {if(p.population<1)throw new Error('No Population is available for this bonus.');p.population--;}
        else takeSupply(p);
        p.ships.push({id:`${position}-terraforming`,level:1,location:'deep-space'});
      }
    } else if(move.card==='advanced-genetics') {
      p.foodDiscs=Math.max(0,p.foodDiscs-1);p.automation++;
      if(takeSupply(p))p.population++;
    } else if(move.card==='advanced-robotics') {
      p.oreDiscs=Math.max(0,p.oreDiscs-1);p.automation++;p.ore++;
    } else if(move.card==='narrow-beam-lasers') {
      p.ore++;
      const eligible=p.ships.filter(s=>s.level<4),ship=p.ships.find(s=>s.id===move.ship);
      if(eligible.length) {if(!ship||ship.level===4)throw new Error('Choose one of your ships below level 4.');ship.level=(ship.level+1) as 2|3|4;}
      else if(move.ship)throw new Error('No ship can be upgraded.');
    }
    state.phase='production';
  } else if(move.kind==='grow'||move.kind==='ore'||move.kind==='trade') {
    if(state.phase!=='production')throw new Error('Choose exactly one production branch.');
    if(move.kind==='grow')for(const column of growthColumns(p))if(column.available){p.supply[column.index]--;p.population++;}
    if(move.kind==='ore')p.ore+=oreProduction(p);
    state.phase=move.kind==='trade'?'trade':'achievement';
  } else if(['buy-population','sell-population','decommission','finish-trading'].includes(move.kind)) {
    if(state.phase!=='trade')throw new Error('Choose Trade resources before making exchanges.');
    if(move.kind==='buy-population') {if(p.ore<3||!p.supply.some(n=>n>0))throw new Error('Need 3 Ore and an available Supply cube.');p.ore-=3;takeSupply(p);p.population++;}
    else if(move.kind==='sell-population') {if(p.population<1)throw new Error('Need 1 available Population.');p.population--;returnSupply(p);p.ore++;}
    else if(move.kind==='decommission') {const index=p.ships.findIndex(s=>s.id===move.ship);if(p.ore<1||index<0)throw new Error('Choose your ship and pay 1 Ore.');p.ore--;p.ships.splice(index,1);p.population++;}
    else state.phase='achievement';
  } else if(move.kind==='end-turn') {
    if(state.phase!=='achievement')throw new Error('Finish production before passing the turn.');
    if(availableClaims(game).length)throw new Error('Claim one eligible achievement before passing.');
    // The UI schedules empty or already-claimed achievement phases automatically, including on reload.
    state.turn++;state.activePosition=initial.players[state.turn%initial.count].position;state.phase='action';
  } else throw new Error('Choose a supported turn command.');
  const total=p.supply.reduce((a,b)=>a+b,0)+p.population+p.ships.length+p.research.length+(p.reservedResearch?.length??0);
  if(total!==20||p.population<0||p.ore<0)throw new Error('Resource accounting is inconsistent.');
  state.players[position]=p;
  if(state.discovery&&['research-I','decommission'].includes(move.kind)){
    const same=(a:TurnPlayer['ships'][number],b:TurnPlayer['ships'][number])=>a.id===b.id&&a.level===b.level&&a.location===b.location;
    const changed=[...actor.ships.filter(s=>!p.ships.some(t=>same(s,t))),...p.ships.filter(s=>!actor.ships.some(t=>same(s,t)))];
    if(changed.length){const phase=state.phase as 'production'|'trade';updateControl(initial,state,move.kind==='research-I'?move.card:'Decommission',changed.map(s=>s.location),position);
      if(state.discovery.queue.length){state.discovery.queue.push({kind:'resume',responder:position,returnTo:phase,...(move.kind==='research-I'?{card:move.card}:{})});state.phase='discovery';}
    }
  }
  return syncFleetPowers(initial,state);
}
