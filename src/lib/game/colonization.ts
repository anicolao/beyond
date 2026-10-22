import {canonicalCard} from '../cards/catalog';
import {colonizationPreview,colonySources,type ColonySource} from './colonization-preview';
import {player,returnSupply} from './discovery-economy';
import {effects} from './discovery-queue';
import type {BonusEffect} from './discovery-effects';
import type {DiscoveryState} from './discovery';
import type {PublicSetup,PlayerState} from './setup';
import type {PlayState} from './turn';
export type ColonyDisc={track:'food'|'ore';placeholder?:boolean};
export type Colony={owner:string;card:string;origin:string;discs:ColonyDisc[];turn:number;settledPower:number;solar?:boolean};
export type ColonyStep={kind:'colony';responder:string;source:ColonySource;slot:string;card:string;settlers:PlayerState['ships'];power:number;actors:string[];stage:'settle'|'exile'|'acquire'|'disc'|'bonus';index:number};
export type ColonizeMove={kind:'colonize';source:ColonySource;slot:string;ships:PlayerState['ships']};
/** Existing retained states need no migration; seeded slot identity changes only at a legal refill. */
export function currentSystems(initial:PublicSetup,d?:Pick<DiscoveryState,'systemBasis'|'systems'>){
 return d?[...initial.systems.flatMap(system=>{const card=d.systemBasis[system.slot];return card?[{slot:system.slot,card}]:[];}),...d.systems.map(({slot,card})=>({slot,card}))]:initial.systems;
}
const benefits:Record<string,readonly BonusEffect[]>={
 'barnards-star':[{kind:'population',amount:1},{kind:'ore',amount:2}],
 'sirius':[{kind:'upgrade',levels:1,ships:2,optional:true}],
 'gj-1061':[{kind:'ship',level:3,location:'deep-space'}],
 'kapteyns-star':[{kind:'ship',level:4,location:'deep-space'}],
 'struve-2398':[{kind:'automate',track:'either'}],
 'wolf-359':[{kind:'ship',level:2,side:'right'}],
 'ad-leonis':[], 'alpha-centauri':[],'kruger-60':[],'tau-ceti':[],'tz-arietis':[],'luytens-star':[]
};
export function colonyBenefitBlocker(card:string){return card in benefits?'':'This printed colony benefit is not yet available; inspect its full rules.';}
export function beginColonization(initial:PublicSetup,game:PublicSetup,state:PlayState,position:string,move:ColonizeMove){
 if(!Array.isArray(move.ships)||move.ships.some(ship=>!ship||typeof ship!=='object'||!game.players.find(p=>p.position===position)?.ships.some(s=>Object.keys(ship).length===3&&s.id===ship.id&&s.level===ship.level&&s.location===ship.location)))throw new Error('Choose each settling ship once.');
 const view=colonizationPreview(game,position,move.slot,move.ships.map(s=>s.id),move.source);if(view.reason)throw new Error(view.reason);
 const block=colonyBenefitBlocker(view.card!.id);if(block)throw new Error(block);
 if(!state.discovery||!game.discovery?.powerReady||state.discovery.queue.length)throw new Error('Finish preparing the public board first.');
 const p=player(initial,state,position);p.ore-=view.terms.ore;p.population-=view.terms.population;
 for(let i=0;i<view.terms.population;i++)returnSupply(p);
 p.actionLocation=view.actionLocation;
 state.discovery.queue=[{kind:'colony',responder:position,source:move.source,slot:move.slot,card:view.card!.id,settlers:move.ships.map(({id,level,location})=>({id,level,location})),power:view.selectedPower,actors:initial.players.map(p=>p.position),stage:'settle',index:0},{kind:'resume',responder:position,returnTo:'production'}];
 state.phase='discovery';return state;
}
export function colonyTracks(card:string):('food'|'ore')[]{const specialty=canonicalCard(card).sections.find(s=>s.label==='Specialty');return specialty?.secondarySymbol?['food','ore']:specialty?.symbol==='food'?['food']:['ore'];}
export function addColonyDisc(initial:PublicSetup,state:PlayState,q:ColonyStep,track:'food'|'ore'){
 if(q.stage!=='disc'||!colonyTracks(q.card).includes(track))throw new Error('Choose a matching colony production disc.');
 const colony=state.discovery!.colonies!.find(c=>c.card===q.card&&c.owner===q.responder);if(!colony||colony.discs.length!==1)throw new Error('This colony disc has already resolved.');
 const p=player(initial,state,q.responder),field=track==='food'?'foodDiscs':'oreDiscs',placeholder=p[field]===0;
 if(!placeholder)p[field]--;colony.discs.push({track,...(placeholder?{placeholder:true}:{})});q.stage='bonus';
}
/** Each deterministic stage is one persisted cursor, never an intermediate gain-control grant. */
export function advanceColony(initial:PublicSetup,state:PlayState,q:ColonyStep){
 const d=state.discovery!,p=player(initial,state,q.responder);
 if(q.stage==='settle'){
  const chosen=q.settlers[q.index],ship=p.ships.find(s=>s.id===chosen.id&&s.level===chosen.level&&s.location===q.slot);if(!ship)throw new Error('The selected settler is unavailable.');
  p.ships=p.ships.filter(s=>s.id!==ship.id);
  const requirement=Number(canonicalCard(q.card).sections.find(s=>s.label==='Colonize')!.cost!.match(/^\d+/)![0]);
  if(q.source==='android-surveyors'&&q.power>requirement&&q.index===0)p.population++;else returnSupply(p);
  if(++q.index===q.settlers.length){q.stage='exile';q.index=0;}return;
 }
 if(q.stage==='exile'){
  const owner=q.actors[q.index],other=player(initial,state,owner);other.ships=other.ships.map(s=>s.location===q.slot?{...s,location:'deep-space'}:s);
  if(++q.index===initial.count){q.stage='acquire';q.index=0;}return;
 }
 if(q.stage==='acquire'){
  const outpost=d.outposts[q.slot];if(outpost?.owner!==q.responder)throw new Error('The committed outpost is unavailable.');
  const solar=d.events.find(e=>e.id==='erratic-solar-activity'&&e.target===q.slot);
  d.colonies??=[];if(d.colonies.some(c=>c.card===q.card))throw new Error('This System is already a colony.');
  d.colonies.push({owner:q.responder,card:q.card,origin:q.slot,discs:[{track:outpost.track,...(outpost.placeholder?{placeholder:true}:{})}],turn:state.turn,settledPower:q.power,...(solar?{solar:true}:{})});delete d.outposts[q.slot];
  if(solar)solar.target=`colony:${q.card}`;
  if(d.systems.some(s=>s.slot===q.slot))d.systems=d.systems.filter(s=>s.slot!==q.slot);
  else{const deck=canonicalCard(q.card).deck as 'A'|'B',other=deck==='A'?'B':'A',selected=d.systemDecks[deck].length?deck:other;d.systemBasis[q.slot]=d.systemDecks[selected].shift()??'';if(d.systemBasis[q.slot])d.revealBoundary={turn:state.turn,reason:'System reveal'};}
  q.stage='disc';return;
 }
 if(q.stage==='disc'){const tracks=colonyTracks(q.card);if(tracks.length!==1)throw new Error('The owner must choose the additional colony disc.');addColonyDisc(initial,state,q,tracks[0]);return;}
 d.queue.shift();const bonus=q.card==='ad-leonis'?[{kind:'ore' as const,amount:p.research.filter(id=>canonicalCard(id).technology?.level==='I').length}]:benefits[q.card];if(!bonus)throw new Error('Resolve the actual colony benefit.');effects(state,q.responder,q.card,bonus);
}
