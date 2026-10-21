import {discoveryMap} from './discovery-movement';
import type {BonusEffect} from './discovery-effects';
import type {PlayerState,PublicSetup} from './setup';
export type FleetBuildEffect=Extract<BonusEffect,{kind:'ship'}>;
export type FleetUpgradeEffect=Extract<BonusEffect,{kind:'upgrade'}>;
/** Read-only projections. Canonical commands still own payment, fleet changes,
 * queued control checks and outpost bonuses; inspecting never applies them. */
export function fleetLocation(game:PublicSetup,id:string){return discoveryMap(game).locations.find(l=>l.id===id)?.title??id;}
export function permittedBuildLocations(game:PublicSetup,position:string,effect:FleetBuildEffect){
 return effect.location?[effect.location]:['sol',...Object.entries(game.discovery?.outposts??{}).filter(([id,p])=>id.startsWith('shipyard-')&&p.owner===position).map(([id])=>id)];
}
export function fleetPowerPreview(game:PublicSetup,position:string,location:string,ships:PlayerState['ships']){
 const powers=game.players.map(p=>({position:p.position,name:p.name,before:p.ships.filter(s=>s.location===location).reduce((n,s)=>n+s.level,0),after:(p.position===position?ships:p.ships).filter(s=>s.location===location).reduce((n,s)=>n+s.level,0)}));
 const incumbent=game.discovery?.outposts[location]?.owner;
 const maximum=Math.max(0,...powers.map(p=>p.after)),leaders=powers.filter(p=>p.after===maximum);
 const owner=maximum===0?incumbent:leaders.some(p=>p.position===incumbent)?incumbent:leaders.length===1?leaders[0].position:undefined;
 const controllable=location!=='sol'&&location!=='deep-space';
 return {location,title:fleetLocation(game,location),powers,controllable,beforeOwner:incumbent,beforeTrack:game.discovery?.outposts[location]?.track,beforePlaceholder:game.discovery?.outposts[location]?.placeholder??false,afterOwner:controllable?owner:undefined,controlChanges:controllable&&owner!==incumbent};
}
export function fleetBuildPreview(game:PublicSetup,position:string,effect:FleetBuildEffect,destination:string,usePopulation=false){
 const actor=game.players.find(p=>p.position===position)!;
 const locations=permittedBuildLocations(game,position,effect),index=effect.side==='right'?actor.supply.findLastIndex(n=>n>0):actor.supply.findIndex(n=>n>0);
 const population=effect.cube==='population'||index<0&&usePopulation;
 const source=population?{kind:'population' as const,label:'Available Population',before:actor.population,after:actor.population-1}:{kind:'supply' as const,label:index<0?'Supply exhausted':`Supply ${String.fromCharCode(65+index)}`,before:index<0?0:actor.supply[index],after:index<0?0:actor.supply[index]-1};
 const reason=!locations.includes(destination)?'Choose Sol or a controlled shipyard.':usePopulation&&index>=0&&effect.cube!=='population'?'Use the required Supply cube while it is available.':source.before<1?population?'No available Population cube.':'Supply is exhausted; explicitly choose available Population or pass.':'';
 const ships=[...actor.ships,{id:'preview-only',location:destination,level:effect.level}];
 return {locations,source,reason,level:effect.level,destination,power:fleetPowerPreview(game,position,destination,ships),canUsePopulation:effect.cube!=='population'&&index<0&&actor.population>0};
}
export function fleetUpgradePreview(game:PublicSetup,position:string,effect:FleetUpgradeEffect,selected:readonly string[]){
 const actor=game.players.find(p=>p.position===position)!;
 const eligible=actor.ships.filter(s=>s.level<4&&(!effect.location||s.location===effect.location));
 const required=effect.optional?0:Math.min(effect.ships,eligible.length);
 const reason=new Set(selected).size!==selected.length?'Choose each ship only once.':selected.some(id=>!eligible.some(s=>s.id===id))?'Choose an eligible owned ship below level 4.':!eligible.length?'No eligible owned ship; this effect continues automatically.':selected.length>effect.ships?`Choose at most ${effect.ships} ships.`:selected.length<required?`Choose ${required} distinct ship${required===1?'':'s'}.`:'';
 const ships=actor.ships.map(s=>({...s,level:(selected.includes(s.id)?Math.min(4,s.level+effect.levels):s.level) as 1|2|3|4}));
 const locations=[...new Set(actor.ships.filter(s=>selected.includes(s.id)).map(s=>s.location))];
 return {reason,required,ships:actor.ships.map((s,index)=>({...s,label:index===0?'Ship':index===1?'Second ship':`Ship ${index+1}`,title:fleetLocation(game,s.location),eligible:eligible.some(e=>e.id===s.id),selected:selected.includes(s.id),after:ships[index].level})),locations:locations.map(l=>fleetPowerPreview(game,position,l,ships))};
}
