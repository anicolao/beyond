import {canonicalCard} from '../cards/catalog';
import {guilds} from './manifest';
import {setupDecks,type PublicSetup} from './setup';
import type {PlayState,TurnPlayer} from './turn';
import {chooseFromRevealed,initialDiscovery,levelTwoBlocker,levelTwoCost,permittedTypes,revealTwo,type DiscoveryChoice} from './discovery';
import {levelTwoBonuses,levelOneBonuses,type BonusEffect} from './discovery-effects';
import {player,take,convert,spawn,automate,validEconomies,returnSupply} from './discovery-economy';
import {prepend,effects,eventRecord,completeEvent} from './discovery-queue';
import {advanceEvent,respondEvent} from './discovery-events';
import {specialty,placeOutpost,performJump,validateJump,updateControl,resolveControlCheck,returnOutpost,type JumpLeg} from './discovery-movement';
export type DiscoveryMove=
 | {kind:'prepare-discovery'}
 | {kind:'prepare-fleet-power';position:string}
 | {kind:'research-II';space:number;slot:string}
 | {kind:'discovery-advance';at:number}
 | {kind:'discovery-choice';at:number;option:string;target?:string;ships?:string[];track?:'food'|'ore';destination?:string;usePopulation?:boolean;legs?:JumpLeg[]};
/** Advances only deterministic consequences. Actual player decisions stay persisted. */
export function advanceDiscovery(initial:PublicSetup,state:PlayState,limit=1){
 const d=state.discovery!;
 for(let guard=0;d.queue.length&&guard<limit;guard++){
  const step=d.queue[0],p=player(initial,state,step.responder);
  if(step.kind==='event-complete'){completeEvent(state,step.event);d.queue.shift();continue;}
  if(step.kind==='resume'){d.queue.shift();state.phase=step.returnTo??'production';const card=step.card??(step.slot?d.records.find(r=>r.slot===step.slot)?.chosen:undefined);if(card)d.completed={turn:state.turn,card};continue;}
  if(step.kind==='type'){
   if(step.types.length!==1)return;
   const draw=revealTwo(d.deckII,step.types[0]);d.deckII=draw.remaining;d.queue.shift();const record=d.records.find(r=>r.slot===step.slot)!;Object.assign(record,{type:step.types[0],revealed:draw.revealed,candidates:draw.candidates});
   d.revealBoundary={turn:state.turn,reason:'Technology reveal'};prepend(state,{kind:'candidate',responder:step.responder,slot:step.slot,cards:draw.candidates,revealed:draw.revealed,type:step.types[0]});return;
  }
  if(step.kind==='event'){if(advanceEvent(initial,state,step))continue;return;}
  if(step.kind==='jump-apply'){
   d.queue.shift();const remaining=[...d.queue];performJump(initial,state,step.responder,step.amount,step.legs);
   // Both ships and all payment move together. The hidden power index is
   // settled in its own persisted continuation before any control check.
   d.queue=[{...step,kind:'jump-power',index:0},...remaining];continue;
  }
  if(step.kind==='jump-power'){
   const locations=step.legs.flatMap(leg=>[leg.path[0],leg.path.at(-1)!]),location=locations[step.index];
   if(step.amount>2){if(step.index===0)d.jumpControlChecks=[];if(!locations.slice(0,step.index).includes(location)&&specialty(initial,state,location))d.jumpControlChecks!.push({kind:'control-check',responder:step.responder,location,source:'Jump'});}
   d.powers[step.responder][location]=p.ships.filter(ship=>ship.location===location).reduce((n,ship)=>n+ship.level,0);
   if(++step.index===locations.length){d.queue.shift();updateControl(initial,state,'Jump',locations,step.responder);}continue;
  }
  if(step.kind==='control-check'){resolveControlCheck(initial,state,step.location,step.source);continue;}
  if(step.kind==='control-loss'){returnOutpost(initial,state,step.responder,step.location);continue;}
  if(step.kind==='gain-bonus'){if(gainBonusChoices(state.discovery!,step.responder).length>1)return;d.queue.shift();resolveSystemBonus(initial,state,step.responder,step.location);continue;}
  if(step.kind==='control'){const track=specialty(initial,state,step.location);if(track==='either')return;d.queue.shift();placeOutpost(initial,state,step.responder,step.location,track!);queueSystemBonus(initial,state,step.responder,step.location);continue;}
  if(step.kind==='effect'){
   const e=step.effect;
   if(e.kind==='return-population'){if(p.population<e.amount)throw new Error('The committed Population cube is unavailable.');for(let i=0;i<e.amount;i++){p.population--;returnSupply(p);}d.queue.shift();continue;}
   if(e.kind==='ship'&&automaticShipAvailable(d,p,step.responder,e)){if(e.cube==='population')p.population--;else take(p,e.side==='right');spawn(state,step.responder,p,e.level,e.location??'sol');d.queue.shift();updateControl(initial,state,step.source,[e.location??'sol'],step.responder);continue;}
   if(e.kind==='ore'){p.ore+=e.amount;d.queue.shift();continue;}
   if(e.kind==='population'&&p.supply.reduce((a,b)=>a+b,0)>=e.amount){for(let i=0;i<e.amount;i++){take(p,e.side==='right');p.population++;}d.queue.shift();continue;}
   if(e.kind==='automate'&&e.track!=='either'){automate(p,e.track);d.queue.shift();continue;}
   if(e.kind==='upgrade'&&!p.ships.some(s=>s.level<4&&(!e.location||s.location===e.location))){d.queue.shift();continue;}
   if(e.kind==='jump'&&!e.required&&!p.ships.length){d.queue.shift();continue;}
   return;
  }
  return;
 }
 if(!d.queue.length&&state.phase==='discovery')state.phase='production';
}
export function beginLevelTwo(initial:PublicSetup,game:PublicSetup,state:PlayState,position:string,move:Extract<DiscoveryMove,{kind:'research-II'}>,seed:string){
 if(position!==game.activePosition)throw new Error('Only the active faction may begin research.');
 const block=levelTwoBlocker(game,move.space,move.slot,state.discovery);if(block)throw new Error(block);
 if(!state.discovery)throw new Error('The retained discovery decks are still preparing.');
 const d=state.discovery,p=player(initial,state,position);
 if(!initial.players.every(actor=>actor.position in (d.powers??{})))throw new Error('The retained board is still preparing.');
 p.ore-=levelTwoCost(initial.count,move.space,move.slot,d);p.population--;p.actionLocation=`research-II:${move.space}`;
 const existing=d.technologies.find(t=>t.slot===move.slot);
 if(existing){p.research.push(existing.card);effects(state,position,existing.card,levelTwoBonuses[existing.card]);d.queue.push({kind:'resume',responder:position,card:existing.card});}
 else{
  p.reservedResearch=[...(p.reservedResearch??[]),move.slot];d.reservations.push({position,slot:move.slot});
  const event=setupDecks(seed,initial.count).events.II[Number(move.slot.slice(3))-1];d.records.push({slot:move.slot,event});d.events.push({id:event,slot:move.slot,resolved:false});
  d.revealBoundary={turn:state.turn,reason:'Event reveal'};
  d.queue.push({kind:'event',event,responder:position,slot:move.slot},{kind:'type',responder:position,slot:move.slot,types:permittedTypes(initial,move.slot,d)},{kind:'resume',responder:position,slot:move.slot,event});
 }
 state.phase='discovery';validEconomies(initial,state);return state;
}
export function respondToDiscovery(initial:PublicSetup,state:PlayState,position:string,move:Extract<DiscoveryMove,{kind:'discovery-choice'}>){
 const d=state.discovery,step=d?.queue[0];if(state.phase!=='discovery'||!d||!step)throw new Error('There is no pending discovery choice.');
 if(step.responder!==position)throw new Error('This choice belongs to another responding faction.');
 if(move.at!==d.cursor)throw new Error('This continuation has already changed.');
 d.cursor++;
 const p=player(initial,state,position);
 if(step.kind==='candidate'){
  const card=chooseFromRevealed(d,step,move.option);d.queue.shift();p.reservedResearch=p.reservedResearch?.filter(s=>s!==step.slot);if(!p.reservedResearch?.length)delete p.reservedResearch;
  d.reservations=d.reservations.filter(r=>!(r.position===position&&r.slot===step.slot));p.research.push(card);effects(state,position,card,levelTwoBonuses[card]);
 }else if(step.kind==='type'){
  const chosen=step.types.find(type=>type===move.option);if(!chosen)throw new Error('Choose one of the permitted prerequisite types.');
  const draw=revealTwo(d.deckII,chosen);d.deckII=draw.remaining;const record=d.records.find(r=>r.slot===step.slot)!;Object.assign(record,{type:chosen,revealed:draw.revealed,candidates:draw.candidates});d.queue.shift();d.revealBoundary={turn:state.turn,reason:'Technology reveal'};
  prepend(state,{kind:'candidate',responder:position,slot:step.slot,cards:draw.candidates,revealed:draw.revealed,type:chosen});
 }else if(step.kind==='event')respondEvent(initial,state,step,move);
 else if(step.kind==='gain-bonus'){const chosen=gainBonusChoices(d,position).find(q=>q.location===move.option);if(!chosen)throw new Error('Choose one of your pending gain-control bonuses.');d.queue.splice(d.queue.indexOf(chosen),1);resolveSystemBonus(initial,state,position,chosen.location);}
 else if(step.kind==='control'){if(move.option!=='food'&&move.option!=='ore')throw new Error('Choose Food or Ore for this outpost.');d.queue.shift();placeOutpost(initial,state,position,step.location,move.option);queueSystemBonus(initial,state,position,step.location);}
 else if(step.kind==='effect')respondEffect(initial,state,position,step,move);
 else throw new Error('This pending effect requires its printed response.');
 validEconomies(initial,state);return state;
}
function queueSystemBonus(initial:PublicSetup,state:PlayState,position:string,location:string){
 const system=[...initial.systems,...state.discovery!.systems].find(s=>s.slot===location);if(!system)return;
 const id=system.card;
 if(!canonicalCard(id).sections.some(s=>s.label==='Gain control'))return;
 const next=state.discovery!.queue.findIndex(q=>!['control-check','control-loss','control'].includes(q.kind));
 state.discovery!.queue.splice(next<0?state.discovery!.queue.length:next,0,{kind:'gain-bonus',responder:position,location,source:id});
}
export function gainBonusChoices(d:import('./discovery').PublicDiscovery,position:string){
 const boundary=d.queue.findIndex(q=>q.kind!=='gain-bonus');
 return d.queue.slice(0,boundary<0?undefined:boundary).filter((q):q is Extract<DiscoveryChoice,{kind:'gain-bonus'}>=>q.kind==='gain-bonus'&&q.responder===position);
}
function resolveSystemBonus(initial:PublicSetup,state:PlayState,position:string,location:string){
 const system=[...initial.systems,...state.discovery!.systems].find(s=>s.slot===location)!;
 const id=system.card;
 const fixed:Record<string,readonly BonusEffect[]>={
  'barnards-star':[{kind:'population',amount:1}],'teegardens-star':[{kind:'population',amount:1}],
  'sirius':[{kind:'ore',amount:1}],'kruger-60':[{kind:'ore',amount:1}]
 };
 if(id==='61-cygni'){const p=player(initial,state,position);effects(state,position,id,[{kind:'ore',amount:Math.max(0,3-p.ore)}]);}
 else if(fixed[id])effects(state,position,id,fixed[id]);
 else if(canonicalCard(id).sections.some(s=>s.label==='Gain control'))effects(state,position,id,[{kind:'system-bonus',id,location}]);
}
function respondEffect(initial:PublicSetup,state:PlayState,position:string,step:Extract<DiscoveryChoice,{kind:'effect'}>,move:Extract<DiscoveryMove,{kind:'discovery-choice'}>){
 const d=state.discovery!,p=player(initial,state,position),e=step.effect;
 const done=()=>{d.queue.shift();};
 if(e.kind==='automate'){
  if(move.option!=='food'&&move.option!=='ore'||e.track!=='either'&&e.track!==move.option)throw new Error('Choose a matching production track.');automate(p,move.option);done();return;
 }
 if(e.kind==='population'){
  if(move.option==='pass'&&!p.supply.some(n=>n>0)){done();return;}
  if(move.option!=='convert'||!move.usePopulation||!p.population)throw new Error('Resolve the exhausted Supply exception.');done();return;
 }
 if(e.kind==='upgrade'){
  const ships=move.ships??[];
  if(move.option!=='upgrade'||new Set(ships).size!==ships.length||ships.length>e.ships||(!e.optional&&p.ships.some(s=>s.level<4)&&!ships.length))throw new Error('Choose the required number of distinct ships.');
  for(const id of ships){const ship=p.ships.find(s=>s.id===id&&s.level<4&&(!e.location||s.location===e.location));if(!ship)throw new Error('Choose an eligible owned ship.');ship.level=Math.min(4,ship.level+e.levels) as 2|3|4;}
  done();updateControl(initial,state,step.source,ships.map(id=>p.ships.find(s=>s.id===id)!.location),position);return;
 }
 if(e.kind==='ship'){
  if(move.option==='pass'&&!p.supply.some(n=>n>0)){done();return;}
  const location=e.location??move.destination;
  if(!location||(!e.location&&location!=='sol'&&!Object.entries(d.outposts).some(([id,post])=>id===location&&post.owner===position&&id.startsWith('shipyard-'))))throw new Error('Choose a permitted shipyard.');
  if(move.option!=='build'||!convert(p,move.usePopulation,e.side==='right'))throw new Error('Choose Supply, or the explicit exhausted Supply exception.');spawn(state,position,p,e.level,location);done();return;
 }
 if(e.kind==='jump'){
  if(move.option!=='jump')throw new Error('Commit a simultaneous jump plan, or an empty plan to pass.');const legs=move.legs??[];if(e.required&&!legs.some(leg=>leg.path.at(-1)!==leg.path[0]))throw new Error('This Action must move a ship to a different location.');validateJump(initial,state,position,e.amount,legs);done();if(legs.length)prepend(state,{kind:'jump-apply',responder:position,amount:e.amount,legs});return;
 }
 if(e.kind==='research-I'){
  const card=initial.technologies.find(t=>t.card===move.option);
  if(!card||p.research.includes(card.card)||p.ore<e.cost||(!e.fromSupply&&p.population<1))throw new Error('Choose an unresearched Level I technology and pay its full cost.');
  if(e.fromSupply){if(!convert(p,move.usePopulation))throw new Error('Choose the research cube.');}else p.population--;
  p.ore-=e.cost;p.research.push(card.card);done();effects(state,position,card.card,levelOneBonuses[card.card]);return;
 }
 if(e.kind==='choice'&&e.id==='exo-alloy'){
  if(move.option==='automate'){done();effects(state,position,step.source,[{kind:'automate',track:'ore'}]);return;}
  if(move.option==='research'){if(p.ore<1||p.population<1||initial.technologies.every(t=>p.research.includes(t.card)))throw new Error('Need1 Ore,1 Population and an unresearched Level I.');done();effects(state,position,step.source,[{kind:'research-I',cost:1}]);return;}
  throw new Error('Choose Ore automation or paid Level I research.');
 }
 if(e.kind==='choice'&&e.id==='bio-synaptic'){
  if(move.option==='automate'){if(move.track!=='food'&&move.track!=='ore')throw new Error('Choose Food or Ore.');done();effects(state,position,step.source,[{kind:'automate',track:move.track},{kind:'ore',amount:2}]);return;}
  if(move.option==='copy'){
   const target=d.technologies.find(t=>t.card===move.target),bonus=target&&levelTwoBonuses[target.card];
   if(!target||!bonus?.length)throw new Error('Choose a discovered Level II technology with an immediate bonus.');done();effects(state,position,target.card,bonus);return;
  }
  throw new Error('Choose copying an immediate bonus, or automation and2 Ore.');
 }
 if(e.kind==='system-bonus'){
  if(move.option==='pass'){done();return;}
  if(e.id==='61-cygni'){p.ore=Math.max(3,p.ore);done();return;}
  if(e.id==='epsilon-indi'){if(!p.population)throw new Error('Need1 Population.');p.population--;returnSupply(p);p.ore+=3;done();return;}
  if(e.id==='ross-154'||e.id==='tau-ceti'){if(!take(p,true))throw new Error('No Supply cube is available to move.');p.supply[0]++;done();return;}
  if(e.id==='alpha-centauri'||e.id==='gj-1061'){done();effects(state,position,e.id,[{kind:'ship',level:1,...(e.id==='gj-1061'?{location:'deep-space' as const}:{})}]);return;}
  if(e.id==='groombridge-34'){
   if(p.ore<2||p.population<1)throw new Error('Need2 Ore and1 Population.');p.ore-=2;p.population--;const location=move.destination??'sol';
   if(location!=='sol'&&!Object.entries(d.outposts).some(([id,post])=>id===location&&post.owner===position&&id.startsWith('shipyard-')))throw new Error('Choose a permitted shipyard.');spawn(state,position,p,2,location);done();return;
  }
  if(e.id==='ad-leonis'){if(p.ore<2||!p.population||initial.technologies.every(t=>p.research.includes(t.card)))throw new Error('Need2 Ore,1 Population and an unresearched Level I.');done();effects(state,position,e.id,[{kind:'research-I',cost:2}]);return;}
  if(e.id==='dx-cancri'){if(p.ore<1||!p.ships.some(s=>s.location===e.location&&s.level<4))throw new Error('Need1 Ore and an eligible ship here.');p.ore--;done();effects(state,position,e.id,[{kind:'upgrade',levels:1,ships:1,location:e.location}]);return;}
 }
 throw new Error('Choose a printed immediate effect.');
}

/** Read-only readiness for one persisted deterministic continuation, shared with UI. */
export function canAdvanceDiscovery(game:PublicSetup):boolean{
 const step=game.discovery?.queue[0];if(game.phase!=='discovery'||!step)return false;
 const p=game.players.find(p=>p.position===step.responder)!;
 if(['event-complete','resume','jump-apply','jump-power','control-check','control-loss'].includes(step.kind))return true;
 if(step.kind==='gain-bonus')return gainBonusChoices(game.discovery!,step.responder).length===1;
 if(step.kind==='type')return step.types.length===1;
 if(step.kind==='event')return !step.stage||step.event==='experimental-prototypes'&&step.stage==='roll'||step.stage==='dispatch'||step.event==='economic-boom'&&step.stage==='economy'&&step.value==='ore';
 if(step.kind==='control'){const system=game.systems.find(s=>s.slot===step.location);const section=system&&canonicalCard(system.card).sections.find(s=>s.label==='Specialty');return step.location.startsWith('shipyard-')?step.location!=='shipyard-north':!!section&&!section.secondarySymbol;}
 if(step.kind==='effect'){
  const e=step.effect;
  return e.kind==='return-population'||e.kind==='ship'&&automaticShipAvailable(game.discovery!,p,step.responder,e)||e.kind==='ore'||e.kind==='population'&&p.supply.reduce((a,b)=>a+b,0)>=e.amount||e.kind==='automate'&&e.track!=='either'||e.kind==='upgrade'&&!p.ships.some(s=>s.level<4&&(!e.location||s.location===e.location))||e.kind==='jump'&&!e.required&&!p.ships.length;
 }
 return false;
}
export function applyAutomaticDiscovery(initial:PublicSetup,state:PlayState,game:PublicSetup,position:string,at:number){
 if(!state.discovery||state.discovery.cursor!==at)throw new Error('This continuation has already changed.');
 if(state.discovery.queue[0]?.responder!==position)throw new Error('This continuation belongs to another faction.');
 if(!canAdvanceDiscovery(game))throw new Error('A real player choice is required.');
 state.discovery.cursor++;advanceDiscovery(initial,state);validEconomies(initial,state);return state;
}

export function prepareDiscovery(initial:PublicSetup,state:PlayState,position:string,seed:string){
 if(!['action','achievement'].includes(state.phase)||state.activePosition!==position||state.discovery||state.turn<initial.count)throw new Error('Discovery is already prepared, or another faction is acting.');
 state.discovery=initialDiscovery(seed,initial.count,state.turn,initial.achievements);return state;
}

function automaticShipAvailable(d:import('./discovery').PublicDiscovery,p:TurnPlayer,position:string,e:Extract<BonusEffect,{kind:'ship'}>){
 const cube=e.cube==='population'?p.population>0:p.supply.some(n=>n>0);
 return cube&&(!!e.location||!Object.entries(d.outposts).some(([location,post])=>location.startsWith('shipyard-')&&post.owner===position));
}

export function prepareFleetPower(initial:PublicSetup,state:PlayState,position:string,target:string){
 if(state.activePosition!==position||!['action','achievement'].includes(state.phase)||!state.discovery||state.turn<initial.count)throw new Error('The retained board cannot be prepared now.');
 const p=player(initial,state,target);state.discovery.powers??={};
 if(target in state.discovery.powers&&'*' in state.discovery.powers[target])throw new Error('This faction power is already prepared.');
 if(p.ships.length>3||p.ships.some(s=>!['sol','deep-space'].includes(s.location)))throw new Error('This saved fleet needs its matching game version. Use Recovery options.');
 state.discovery.powers[target]={sol:p.ships.filter(s=>s.location==='sol').reduce((n,s)=>n+s.level,0),'deep-space':p.ships.filter(s=>s.location==='deep-space').reduce((n,s)=>n+s.level,0),'*':p.ships.reduce((n,s)=>n+s.level,0)};
 return state;
}
