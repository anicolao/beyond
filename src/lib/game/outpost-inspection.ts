import {canonicalCard} from '../cards/catalog';
import {discoveryMap} from './discovery-movement';
import {fleetPowerPreview} from './fleet-preview';
import {productionPreview} from './production-preview';
import type {PublicSetup} from './setup';

/** Read-only public explanation. Saved control commands remain authoritative. */
export function outpostInspection(game:PublicSetup,location:string){
 const place=discoveryMap(game).locations.find(p=>p.id===location);
 if(!place)throw new Error('Choose a public exploration location.');
 const power=fleetPowerPreview(game,game.players[0].position,location,game.players[0].ships);
 const outpost=game.discovery?.outposts[location];
 const owner=game.players.find(p=>p.position===outpost?.owner);
 const rows=power.powers.map(row=>({...row,ships:game.players.find(p=>p.position===row.position)!.ships.filter(s=>s.location===location)}));
 const maximum=Math.max(0,...rows.map(p=>p.before)),leaders=rows.filter(p=>p.before===maximum);
 const next=game.players.find(p=>p.position===power.afterOwner);
 const system=[...game.systems,...(game.discovery?.systems??[])].find(s=>s.slot===location);
 const card=system?canonicalCard(system.card):undefined;
 const pending=game.discovery?.queue.filter(q=>'location' in q&&q.location===location&&['control-check','control-loss','control'].includes(q.kind))??[];
 let reason:'uncontrollable'|'empty-retained'|'incumbent-tie'|'incumbent-leads'|'rival-tie'|'transfer'|'claim'|'unclaimed';
 let explanation:string;
 if(!power.controllable){reason='uncontrollable';explanation='Sol and Deep Space cannot have an outpost.';}
 else if(maximum===0&&owner){reason='empty-retained';explanation=`${owner.name} retains the outpost even though no ships remain here.`;}
 else if(maximum===0){reason='unclaimed';explanation='No ships or outpost are at this location.';}
 else if(owner&&leaders.some(p=>p.position===owner.position)){
  reason=leaders.length>1?'incumbent-tie':'incumbent-leads';
  explanation=leaders.length>1?`${owner.name} retains control on a tie at ${maximum} power. An incoming fleet must exceed the incumbent.`:`${owner.name} leads with ${maximum} power. An incoming fleet must exceed that power to take control.`;
 }else if(leaders.length>1){reason='rival-tie';explanation='The strongest remaining fleets tie. Without an incumbent among them, the location becomes uncontrolled after its control check.';}
 else{reason=owner?'transfer':'claim';explanation=`${next!.name} is uniquely strongest at ${maximum} power${owner?`, exceeding ${owner.name}’s ${rows.find(p=>p.position===owner.position)!.before}`:''}. The saved control resolution places the outpost.`;}
 let headline=explanation;
 if(reason==='incumbent-tie')headline=owner!.name+' retains tied control.';
 else if(reason==='incumbent-leads')headline=owner!.name+' controls this location.';
 else if(reason==='empty-retained')headline=owner!.name+' retains the empty outpost.';
 else if(reason==='rival-tie')headline='Tied rivals; no unique controller.';
 else if(reason==='transfer')headline=next!.name+' has power to take control.';
 else if(reason==='claim')headline=next!.name+' can gain control.';
 else if(reason==='unclaimed')headline='Uncontrolled · no ships.';
 return {headline,location,title:place.title,card:system?.card,rows,outpost,owner,reason,explanation,comparisonOwner:power.afterOwner,pendingResolution:pending.length>0||power.beforeOwner!==power.afterOwner,production:owner?productionPreview(owner):undefined,gainBonus:card?.sections.find(s=>s.label==='Gain control')?.text};
}
