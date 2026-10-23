import {canonicalCard} from '../cards/catalog';
import {discoveryMap,permittedJumpDestinations,type JumpLeg} from './discovery-movement';
import {fleetPowerPreview} from './fleet-preview';
import type {PublicSetup} from './setup';
/** Public read-only plan. Canonical jump validation/atomic commands remain the authority. */
export function jumpPreview(game:PublicSetup,position:string,amount:number,legs:readonly JumpLeg[]){
 const actor=game.players.find(p=>p.position===position)!,map=discoveryMap(game),used=new Set<string>();let reason='',spent=0;
 for(const leg of legs){
  const ship=actor.ships[leg.index];
  if(!ship||ship.id!==leg.ship||used.has(leg.ship)||leg.path.length<2||leg.path[0]!==ship.location){reason='Choose each owned ship once, starting at its current location.';break;}
  used.add(leg.ship);spent+=leg.path.length-1;
  for(let i=1;i<leg.path.length;i++){
   if(!permittedJumpDestinations(game,position,leg.path[i-1]).includes(leg.path[i]))reason='Follow the printed connected routes.';
   const system=[...game.systems,...(game.discovery?.systems??[])].find(s=>s.slot===leg.path[i]);
   if(system?.card==='luytens-star'&&actor.research.filter(id=>canonicalCard(id).technology?.level==='III').length<2)reason='Luyten’s Star requires two researched Level III technologies.';
  }
 }
 if(spent>amount)reason='The plan exceeds the shared jump allowance.';
 const solar=game.discovery?.events.find(e=>e.id==='erratic-solar-activity')?.target;
 const ore=solar?legs.filter(l=>l.path.at(-1)===solar&&l.path[0]!==solar).length:0;
 if(ore>actor.ore)reason='Need Ore for each ship ending at the solar Event.';
 const ships=actor.ships.map((ship,index)=>({...ship,location:legs.find(l=>l.index===index&&l.ship===ship.id)?.path.at(-1)??ship.location}));
 const endpoints=[...new Set(legs.flatMap(l=>[l.path[0],l.path.at(-1)!]))];
 const locations=endpoints.map(id=>{
  const power=fleetPowerPreview(game,position,id,ships),system=[...game.systems,...(game.discovery?.systems??[])].find(s=>s.slot===id),card=system?canonicalCard(system.card):undefined;
  const specialty=map.locations.find(l=>l.id===id)?.specialty??(card?.sections.find(s=>s.label==='Specialty')?.secondarySymbol?'either':card?.sections.find(s=>s.label==='Specialty')?.symbol);
  return {...power,card:system?.card,specialty,gainBonus:card?.sections.find(s=>s.label==='Gain control')?.text};
 });
 return {reason,spent,remaining:Math.max(0,amount-spent),ore,ships,locations,moved:legs.some(l=>l.path[0]!==l.path.at(-1))};
}


/** Defensive route-reader selection, including fleets with no owned ships. */
export function cycleRouteShipId(ships:readonly {id:string}[],selected:string,direction:1|-1):string{
 if(ships.length<2)return ships[0]?.id??'';
 const index=Math.max(0,ships.findIndex(ship=>ship.id===selected));
 return ships[(index+direction+ships.length)%ships.length].id;
}
