import {guilds,levelOne,technologySlots} from './manifest';
import type {PublicSetup} from './setup';
import type {PlayState} from './turn';
import type {DiscoveryChoice} from './discovery';
import type {DiscoveryMove} from './discovery-resolution';
import {player,take,returnSupply,spawn,convert} from './discovery-economy';
import {prepend,effects,eventRecord,completeEvent} from './discovery-queue';
import {levelOneBonuses} from './discovery-effects';
type EventStep=Extract<DiscoveryChoice,{kind:'event'}>;
type Choice=Extract<DiscoveryMove,{kind:'discovery-choice'}>;
function clockwise(initial:PublicSetup,position:string){const i=initial.players.findIndex(p=>p.position===position);return [...initial.players.slice(i),...initial.players.slice(0,i)].map(p=>p.position);}
function eachFaction(initial:PublicSetup,state:PlayState,step:EventStep,stage:string,value:string,after:DiscoveryChoice[]=[]){
 state.discovery!.queue.shift();prepend(state,...clockwise(initial,step.responder).map(responder=>({...step,responder,stage,value})),...after,{kind:'event-complete',event:step.event,responder:step.responder});
}
/** A persisted roll is a six-sided resource cube, not an ordinary numeric die. */
function roll(state:PlayState,step:EventStep){let h=2166136261;const d=state.discovery!,index=d.rollIndex??0;d.rollIndex=index+1;for(const c of `${d.seed}/resource-cube/v1/${index}/${step.responder}`)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;step.face=h%6;step.rolls=(step.rolls??0)+1;}
export function advanceEvent(initial:PublicSetup,state:PlayState,step:EventStep):boolean{
 const d=state.discovery!,p=player(initial,state,step.responder);
 if(!step.stage){
  if(step.event==='maya-chaturvedi'||step.event==='tyler-lee'){
   if(step.event==='maya-chaturvedi'){if(take(p))p.population++;}else p.ore++;
   step.stage='guild';
   return false;
  }
  if(step.event==='black-market-industries'){p.ore++;d.queue.shift();completeEvent(state,step.event);return true;}
  if(step.event==='experimental-prototypes'){eachFaction(initial,state,step,'roll','');return true;}
  step.stage=step.event==='dimensional-rift'?'deck':'choose';return false;
 }
 if(step.stage==='dispatch'){
  if(step.event==='economic-boom')eachFaction(initial,state,step,'economy',step.value!);
  else if(step.event==='march-of-progress')eachFaction(initial,state,step,'march',step.value!);
  else if(step.event==='covert-arms-deal')eachFaction(initial,state,step,'arms',step.value!,[{kind:'effect',responder:step.responder,source:step.event,effect:{kind:'upgrade',levels:1,ships:1,optional:true}}]);
  else throw new Error('This Event has no shared dispatch.');return true;
 }
 if(step.event==='economic-boom'&&step.stage==='economy'&&step.value==='ore'){p.ore++;d.queue.shift();return true;}
 if(step.event==='experimental-prototypes'&&step.stage==='roll'){
  if(!p.supply.some(n=>n>0)&&step.value!=='population'){step.stage='empty-supply';return false;}
  roll(state,step);step.stage='result';return false;
 }
 return false;
}
export function respondEvent(initial:PublicSetup,state:PlayState,step:EventStep,move:Choice){
 const d=state.discovery!,p=player(initial,state,step.responder),event=eventRecord(state,step.event);
 if(step.stage==='dispatch'||!step.stage||step.stage==='roll')throw new Error('The saved Event continuation is still resolving.');
 const finish=()=>{d.queue.shift();completeEvent(state,step.event);};
 if(step.stage==='guild'){
  if(!guilds.some(g=>g.id===move.option&&g.tier===1)||d.guilds.includes(move.option))throw new Error('Choose a covered Tier 1 Guild.');
  d.guilds.push(move.option);event.choice=move.option;finish();return;
 }
 if(step.event==='research-tariffs'){
  if(!technologySlots.some(s=>s.level==='II'&&s.id===move.option&&s.id!==step.slot))throw new Error('Attach the tariff to another Level II slot.');
  event.target=move.option;finish();return;
 }
 if(step.event==='erratic-solar-activity'){
  if(![...initial.systems,...d.systems].some(s=>s.slot===move.option))throw new Error('Choose an uncolonized System.');
  event.target=move.option;finish();return;
 }
 if(step.event==='dimensional-rift'){
  if(step.stage==='deck'){
   if(move.option!=='A'&&move.option!=='B')throw new Error('Choose System deck A or B before revealing a card.');
   const card=d.systemDecks[move.option].shift();if(!card)throw new Error('That System deck is empty.');
   event.choice=card;step.value=card;step.stage='attach';return;
  }
  if(!initial.systems.some(s=>s.slot===move.option))throw new Error('Attach the revealed System to a printed System-card slot.');
  d.systems.push({slot:`rift-${step.slot}`,card:step.value!,parent:move.option});event.target=`rift-${step.slot}`;finish();return;
 }
 if(step.event==='economic-boom'){
  if(step.stage==='choose'){
   if(!['population','ore','exchange'].includes(move.option))throw new Error('Choose one printed shared result.');
   event.choice=move.option;
   step.stage='dispatch';step.value=move.option;return;
  }
  if(step.value==='population'){
   if(move.option!=='convert'&&move.option!=='pass')throw new Error('Resolve the Supply conversion.');
   if(p.supply.some(n=>n>0)){if(move.option!=='convert')throw new Error('Available Supply must be converted.');take(p);p.population++;}
   else if(move.option==='convert'){if(!move.usePopulation||!p.population)throw new Error('Choose the exhausted Supply exception.');}
  }else{
   if(move.option==='exchange'){if(!p.population)throw new Error('Need 1 Population.');p.population--;returnSupply(p);p.ore+=2;}
   else if(move.option!=='pass')throw new Error('Choose exchange or pass.');
  }
  d.queue.shift();return;
 }
 if(step.event==='covert-arms-deal'){
  if(step.stage==='choose'){
   if(!['1','2'].includes(move.option))throw new Error('Choose ship level 1 or 2.');event.choice=move.option;
   step.stage='dispatch';step.value=move.option;return;
  }
  if(move.option==='build'){if(!convert(p,move.usePopulation))throw new Error('Choose Population or pass with exhausted Supply.');spawn(state,step.responder,p,Number(step.value) as 1|2,'deep-space');}
  else if(move.option!=='pass')throw new Error('Build the offered ship or pass.');d.queue.shift();return;
 }
 if(step.event==='march-of-progress'){
  if(step.stage==='choose'){
   if(!levelOne.some(id=>id===move.option))throw new Error('Name one public Level I technology.');event.choice=move.option;step.stage='dispatch';step.value=move.option;return;
  }
  const card=step.value!;
  if(p.research.includes(card)){
   if(move.option==='ore')p.ore+=2;
   else if(move.option==='ship'){
    const location=move.destination??'sol';
    if(location!=='sol'&&!Object.entries(d.outposts).some(([id,post])=>id===location&&id.startsWith('shipyard-')&&post.owner===step.responder))throw new Error('Choose a permitted shipyard.');
    if(!convert(p,move.usePopulation))throw new Error('No cube was offered.');spawn(state,step.responder,p,2,location);
   }else if(move.option!=='pass')throw new Error('Choose Ore, ship or pass.');
   d.queue.shift();return;
  }
  if(move.option==='research'){
   if(!convert(p,move.usePopulation))throw new Error('Choose a cube for permanent research.');p.research.push(card);d.queue.shift();effects(state,step.responder,card,levelOneBonuses[card]);return;
  }
  if(move.option!=='pass')throw new Error('Choose research or pass.');d.queue.shift();return;
 }
 if(step.event==='experimental-prototypes'){
  if(step.stage==='empty-supply'){
   if(move.option==='population'){if(!p.population)throw new Error('No Population cube is available.');step.value='population';step.stage='roll';return;}
   if(move.option!=='pass')throw new Error('Use available Population for the exhausted Supply exception, or pass.');d.queue.shift();return;
  }
  if(move.option==='reroll'){
   if(step.responder!==state.activePosition||(step.rolls??0)>=3)throw new Error('Only the revealing faction may reroll, at most twice.');roll(state,step);return;
  }
  if(move.option!=='keep'||step.face===undefined)throw new Error('Keep the resource cube result or take a permitted reroll.');
  const bonus:import('./discovery-effects').BonusEffect[]=step.face===0
   ? [...(step.value==='population'?[{kind:'return-population' as const,amount:1}]:[]),{kind:'ore',amount:2}]
   : step.face<=2 ? (step.value==='population'?[]:[{kind:'population',amount:1}])
   : [{kind:'ship',level:2,location:'sol',...(step.value==='population'?{cube:'population' as const}:{})}];
  event.rolls=[...(event.rolls??[]),{position:step.responder,face:step.face,attempts:step.rolls??1}];d.queue.shift();effects(state,step.responder,step.event,bonus);return;
 }
 throw new Error('This Event has no such response.');
}
