import type {PublicSetup} from './setup';
import type {PlayState,TurnPlayer} from './turn';
import {supplyCapacity} from './manifest';
export function player(initial:PublicSetup,state:PlayState,position:string):TurnPlayer{
 if(!state.players[position]){const {position:_,name:__,faction:___,...economy}=initial.players.find(p=>p.position===position)!;state.players[position]=structuredClone(economy);}
 return state.players[position];
}
export function take(p:TurnPlayer,right=false){const i=right?p.supply.findLastIndex(n=>n>0):p.supply.findIndex(n=>n>0);if(i<0)return false;p.supply[i]--;return true;}
export function returnSupply(p:TurnPlayer){let i=p.supply.findLastIndex((n,i)=>n<supplyCapacity[i]);if(i<0)i=0;p.supply[i]++;}
export function convert(p:TurnPlayer,usePopulation=false,right=false){if(p.supply.some(n=>n>0)){if(usePopulation)throw new Error('Use Supply while it is available.');take(p,right);return true;}if(usePopulation){if(!p.population)throw new Error('No Population is available.');p.population--;return true;}return false;}
export function validEconomies(initial:PublicSetup,state:PlayState){for(const actor of initial.players){const p=player(initial,state,actor.position);if(!Number.isInteger(p.population)||!Number.isInteger(p.ore)||p.population<0||p.ore<0||p.supply.some(n=>!Number.isInteger(n)||n<0)||p.supply.reduce((a,b)=>a+b,0)+p.population+p.ships.length+p.research.length+(p.reservedResearch?.length??0)!==20)throw new Error('Resource accounting is inconsistent.');}}
export function automate(p:TurnPlayer,track:'food'|'ore'){const field=track==='food'?'foodDiscs':'oreDiscs';if(p[field]>0)p[field]--;p.automation++;}
export function spawn(state:PlayState,position:string,p:TurnPlayer,level:1|2|3|4,location:string){p.ships.push({id:`${position}-discovery-${state.turn}-${state.discovery!.sequence++}`,level,location});}

/** A derived public-power index makes per-location rule checks independent of fleet size. */
export function syncFleetPowers(initial:PublicSetup,state:PlayState){
 // Jump movement is atomic; its queued index updates settle one endpoint
 // per cursor before control checks, keeping each authorization bounded.
 const d=state.discovery;if(!d||!('powers' in d)||d.queue[0]?.kind==='jump-power')return state;
 for(const actor of initial.players){
  if(!(actor.position in d.powers))continue;
  const ships=state.players[actor.position]?.ships??actor.ships;
  const power=Object.fromEntries(Object.keys(d.powers[actor.position]??{sol:0,'deep-space':0}).map(location=>[location,0]));
  for(const ship of ships)power[ship.location]=(power[ship.location]??0)+ship.level;
  // Older retained games acquire this field only through prepare-fleet-power.
  if('*' in d.powers[actor.position])power['*']=ships.reduce((n,s)=>n+s.level,0);
  d.powers[actor.position]=power;
 }
 return state;
}
