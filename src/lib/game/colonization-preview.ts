import {hasTechnologyAccess,ownsTechnology} from './personal-technologies';
import {canonicalCard} from '../cards/catalog';
import {supplyCapacity} from './manifest';
import type {PublicSetup} from './setup';
export const colonySources={
 'mercenary-fleet':{title:'Mercenary Fleet · Action 1',ore:3,population:0,action:0},
 'terraforming':{title:'Terraforming · Action 2',ore:3,population:1,action:1},
 'android-surveyors':{title:'Android Surveyors · Action 1',ore:4,population:0,action:0},
 'terranova-cruisers':{title:'Terranova Cruisers · Action 1',ore:4,population:1,action:0},
 'terraforming-guild':{title:'Terraforming Guild',ore:4,population:1,action:0}
} as const;
export type ColonySource=keyof typeof colonySources;
/** Read-only public consequence projection. No deck identity or draw order is read. */
export function colonizationPreview(game:PublicSetup,position:string,slot:string,ids:readonly string[],source:ColonySource='terraforming',substitutePopulation=false){
 const actor=game.players.find(p=>p.position===position);if(!actor)throw new Error('Choose an existing faction.');
 const printedTerms=colonySources[source];if(!printedTerms)throw new Error('Choose a printed colonization Action.');
 if(substitutePopulation&&(!printedTerms.population||!ownsTechnology(game,position,'android-rights-movement')))throw new Error('This cost cannot substitute a Population return.');
 const terms={...printedTerms,ore:printedTerms.ore+(substitutePopulation?1:0),population:printedTerms.population-(substitutePopulation?1:0)};
 const system=game.systems.find(s=>s.slot===slot),card=system?canonicalCard(system.card):undefined;
 const printedRequirement=Number(card?.sections.find(s=>s.label==='Colonize')?.cost?.match(/^\d+/)?.[0]??0);
 const requirement=printedRequirement?Math.max(1,printedRequirement-(source==='terranova-cruisers'?1:0)):0;
 const here=actor.ships.filter(s=>s.location===slot),settlers=here.filter(s=>ids.includes(s.id));
 const selectedPower=settlers.reduce((n,s)=>n+s.level,0),localPower=here.reduce((n,s)=>n+s.level,0);
 const available=source==='terraforming-guild'?!!game.discovery?.guilds.includes(source):hasTechnologyAccess(game,position,source);
 const location=source==='terraforming-guild'?`guild:${source}:0`:`technology:${source}:${terms.action}:0`;
 const occupant=game.players.find(p=>p.actionLocation===location);
 const invalidSelection=new Set(ids).size!==ids.length||ids.some(id=>!here.some(s=>s.id===id));
 const reason=game.phase!=='action'?'Finish the current phase first.':game.activePosition!==position?'Only the active faction may colonize.':!available?'Research the printed technology or uncover the Guild first.':occupant?(occupant.position===position?'Move to another Action space.':`Occupied by ${occupant.name}.`):!card||!requirement?'Choose a colonizable public System.':game.discovery?.outposts[slot]?.owner!==position?'Your faction must control this System.':localPower<requirement?`Need ${requirement} local military power; you have ${localPower}.`:actor.ore<terms.ore?`Need ${terms.ore} Ore.`:actor.population<terms.population?`Need ${terms.population} available Population to return to Supply.`:invalidSelection?'Select each of your local ships once.':selectedPower<requirement?`Select settling ships with at least ${requirement} power.`:'';
 const populationReturn=source==='android-surveyors'&&selectedPower>requirement&&settlers.length?1:0;
 const supply=[...actor.supply],returnedToColumns:number[]=[];
 for(let n=0;n<terms.population+settlers.length-populationReturn;n++){let i=supply.findLastIndex((value,i)=>value<supplyCapacity[i]);if(i<0)i=0;supply[i]++;returnedToColumns.push(i);}
 const exiled=game.players.flatMap(p=>p.ships.filter(s=>s.location===slot&&!(p.position===position&&ids.includes(s.id))).map(ship=>({owner:p.position,name:p.name,ship})));
 const specialty=card?.sections.find(s=>s.label==='Specialty');
 const tracks:('food'|'ore')[]=specialty?.secondarySymbol?['food','ore']:specialty?.symbol==='food'?['food']:specialty?.symbol==='ore'?['ore']:[];
 return {slot,card,source,terms,actionLocation:location,requirement,printedRequirement,selectedPower,localPower,overpayment:Math.max(0,selectedPower-requirement),settlers,exiled,tracks,supply,returnedToColumns,populationAfter:actor.population-terms.population+populationReturn,populationReturn,oreAfter:actor.ore-terms.ore,reason,canCommit:!reason,bonus:card?.sections.find(s=>s.label==='Colonize')?.text??'',replacement:'Reveal after commitment; use the matching deck, then the other deck if exhausted.'};
}
