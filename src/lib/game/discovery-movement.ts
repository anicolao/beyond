import {canonicalCard} from '../cards/catalog';
import {explorationBoard,type Location} from './manifest';
import type {PublicSetup} from './setup';
import type {PlayState} from './turn';
import {player} from './discovery-economy';
import {prepend} from './discovery-queue';
export type JumpLeg={ship:string;index:number;path:string[]};
export function discoveryMap(game:PublicSetup){
 const printed=explorationBoard(game.count),extra=game.discovery?.systems??[],map={...printed,locations:printed.locations.map(location=>{const system=game.systems.find(s=>s.slot===location.id);return system?{...location,title:canonicalCard(system.card).title}:location;})};
 const locations:Location[]=[...map.locations,...extra.map(s=>{return {id:s.slot,title:canonicalCard(s.card).title,x:game.count===2?18:50,y:game.count===2?58:70,kind:'system' as const};})];
 return {locations,edges:[...map.edges,...extra.map(s=>[s.parent,s.slot] as const)]};
}
export function specialty(initial:PublicSetup,state:PlayState,location:string){
 const printed=explorationBoard(initial.count).locations.find(l=>l.id===location);
 if(printed?.specialty)return printed.specialty;
 const system=[...initial.systems,...state.discovery!.systems].find(s=>s.slot===location);
 const section=system&&canonicalCard(system.card).sections.find(s=>s.label==='Specialty');
 return section?.secondarySymbol?'either':section?.symbol==='food'?'food':section?.symbol==='ore'?'ore':undefined;
}
/** Queue checks only after the complete simultaneous move, never a path prefix. */
export function updateControl(initial:PublicSetup,state:PlayState,source:string,locations?:string[],responder=state.activePosition){
 const d=state.discovery!;
 const affected=locations??[...explorationBoard(initial.count).locations.map(l=>l.id),...d.systems.map(s=>s.slot)];
 prepend(state,...[...new Set(affected)].filter(location=>!!specialty(initial,state,location)).map(location=>({kind:'control-check' as const,responder,location,source})));
}
export function resolveControlCheck(initial:PublicSetup,state:PlayState,location:string,source:string){
 const d=state.discovery!,powers=initial.players.map(actor=>({position:actor.position,power:player(initial,state,actor.position).ships.filter(s=>s.location===location).reduce((n,s)=>n+s.level,0)}));
 const max=Math.max(...powers.map(p=>p.power)),leaders=powers.filter(p=>p.power===max),old=d.outposts[location];
 const owner=!max?old?.owner:leaders.some(p=>p.position===old?.owner)?old!.owner:leaders.length===1?leaders[0].position:undefined;
 d.queue.shift();if(owner===old?.owner)return;
 const tasks:import('./discovery').DiscoveryChoice[]=[];
 if(old)tasks.push({kind:'control-loss',responder:old.owner,location,source});
 if(owner)tasks.push({kind:'control',responder:owner,location,source});
 prepend(state,...tasks);
}
export function returnOutpost(initial:PublicSetup,state:PlayState,position:string,location:string){
 const d=state.discovery!,old=d.outposts[location];if(old?.owner!==position)throw new Error('This outpost belongs to another faction.');
 if(!old.placeholder)player(initial,state,position)[old.track==='food'?'foodDiscs':'oreDiscs']++;
 delete d.outposts[location];d.queue.shift();
}
export function placeOutpost(initial:PublicSetup,state:PlayState,position:string,location:string,track:'food'|'ore'){
 const kind=specialty(initial,state,location);if(!kind||(kind!=='either'&&kind!==track))throw new Error('Choose a matching production disc.');
 const p=player(initial,state,position),key=track==='food'?'foodDiscs':'oreDiscs',placeholder=p[key]===0;
 if(!placeholder)p[key]--;state.discovery!.outposts[location]={owner:position,track,...(placeholder?{placeholder:true}:{})};
}
export function validateJump(initial:PublicSetup,state:PlayState,position:string,amount:number,legs:JumpLeg[]){
 const d=state.discovery!,p=player(initial,state,position),map=discoveryMap({...initial,discovery:d}),used=new Set<string>();let spent=0;
 if(!Array.isArray(legs)||legs.length>2)throw new Error('Choose a finite jump plan.');
 for(const leg of legs){
  const ship=Number.isInteger(leg.index)?p.ships[leg.index]:undefined;
  if(!ship||ship.id!==leg.ship||used.has(ship.id)||!Array.isArray(leg.path)||leg.path.length<2||leg.path[0]!==ship.location)throw new Error('Choose each owned ship once, starting at its current location.');used.add(ship.id);
  for(let i=1;i<leg.path.length;i++){
   if(!map.edges.some(([a,b])=>a===leg.path[i-1]&&b===leg.path[i]||b===leg.path[i-1]&&a===leg.path[i]))throw new Error('Follow actual adjacent jump connections.');
   const system=[...initial.systems,...d.systems].find(s=>s.slot===leg.path[i]);
   if(system?.card==='luytens-star'&&p.research.filter(id=>canonicalCard(id).technology?.level==='III').length<2)throw new Error('Luyten’s Star requires two Level III technologies.');
  }
  spent+=leg.path.length-1;
 }
 if(spent>amount)throw new Error('The simultaneous jump exceeds the available movement points.');
 const solar=d.events.find(e=>e.id==='erratic-solar-activity')?.target;
 // The printed Event excludes ships already there and direct placements.
 if(solar){const cost=legs.filter(leg=>leg.path.length>1&&leg.path.at(-1)===solar&&leg.path[0]!==solar).length;if(p.ore<cost)throw new Error('Need Ore for every ship ending this jump at the solar Event.');return cost;}
 return 0;
}
export function performJump(initial:PublicSetup,state:PlayState,position:string,amount:number,legs:JumpLeg[]){
 const p=player(initial,state,position),cost=validateJump(initial,state,position,amount,legs);
 for(const leg of legs)p.ships[leg.index].location=leg.path.at(-1)!;
 p.ore-=cost;
 updateControl(initial,state,'Jump',legs.flatMap(leg=>[leg.path[0],leg.path.at(-1)!]),position);
}
