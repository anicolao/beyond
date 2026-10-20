import {canonicalCard} from '../cards/catalog';
import {player,validEconomies} from './discovery-economy';
import type {BonusEffect} from './discovery-effects';
import type {PlayState} from './turn';
import type {PublicSetup} from './setup';

/** Printed action indices count Action boxes, not Immediate/Ongoing sections.
 * Research III, colonization and copied actions keep their printed inspection
 * until their own complete rules increments extend this same manifest. */
export const supportedTechnologyActions:Record<string,readonly number[]>={
 'terraforming':[0],'narrow-beam-lasers':[0],'human-experiments':[1],
 'plasma-cannon':[0],'android-destroyers':[0],'supply-outpost':[0]
};
export type TechnologyActionMove={kind:'technology-action';card:string;action:number;space:number;destination?:string};
export function technologyActionLocation(card:string,action:number,space:number){return `technology:${card}:${action}:${space}`;}
export function technologyActionTerms(game:PublicSetup,card:string,action:number){
 const actor=game.players.find(p=>p.position===game.activePosition)!;
 const level=Math.max(1,...actor.research.map(id=>canonicalCard(id).technology?.level.length??0)) as 1|2|3|4;
 const ore=card==='narrow-beam-lasers'?1:card==='plasma-cannon'?2:card==='android-destroyers'?level:0;
 const population=card==='human-experiments'?2:['narrow-beam-lasers','plasma-cannon'].includes(card)?1:0;
 const section=canonicalCard(card).sections.filter(s=>s.label==='Action')[action];
 return {ore,population,level,section};
}
export function permittedActionShipyards(game:PublicSetup){return ['sol',...Object.entries(game.discovery?.outposts??{}).filter(([id,p])=>id.startsWith('shipyard-')&&p.owner===game.activePosition).map(([id])=>id)];}
export function technologyActionBlocker(game:PublicSetup,card:string,action:number,space=0){
 const actor=game.players.find(p=>p.position===game.activePosition)!;
 if(!game.technologies.some(t=>t.card===card))return 'This technology has not been discovered.';
 if(!actor.research.includes(card))return `Research ${canonicalCard(card).title} with your faction first.`;
 const {section,ore,population}=technologyActionTerms(game,card,action);
 if(!section||!supportedTechnologyActions[card]?.includes(action))return 'Inspect this printed action; it is not available in this increment.';
 if(game.phase!=='action')return 'Finish the current phase first.';
 if(!Number.isInteger(space)||space<0||space>=(section.spaces??1))return 'Choose a printed Action space.';
 const occupant=game.players.find(p=>p.actionLocation===technologyActionLocation(card,action,space));
 if(occupant)return occupant.position===actor.position?'Move to another Action space.':`Occupied by ${occupant.name}.`;
 if(card==='terraforming'&&!actor.ships.length)return 'Need a ship to make a real jump.';
 if(card==='supply-outpost'&&!actor.supply.some(n=>n>0)&&!actor.ships.length)return 'This Action would change nothing.';
 if(actor.ore<ore)return `Need ${ore} Ore (${ore-actor.ore} more).`;
 if(actor.population<population)return `Need ${population} available Population.`;
 return '';
}
export function technologyActionEffects(game:PublicSetup,card:string,action:number,destination='sol'):BonusEffect[]{
 const level=technologyActionTerms(game,card,action).level;
 if(card==='terraforming')return [{kind:'jump',amount:4,required:true}];
 if(card==='supply-outpost')return [{kind:'population',amount:1},{kind:'upgrade',levels:1,ships:1},{kind:'jump',amount:1,required:!game.players.find(p=>p.position===game.activePosition)!.supply.some(n=>n>0)&&!game.players.find(p=>p.position===game.activePosition)!.ships.some(s=>s.level<4)}];
 if(card==='human-experiments')return [{kind:'return-population',amount:1},{kind:'ship',level:3,cube:'population',location:destination},{kind:'jump',amount:2}];
 if(card==='narrow-beam-lasers'||card==='plasma-cannon')return [{kind:'ship',level:card==='narrow-beam-lasers'?2:3,cube:'population',location:destination},{kind:'jump',amount:3}];
 if(card==='android-destroyers')return [{kind:'ship',level,location:destination},{kind:'jump',amount:3}];
 throw new Error('Choose a supported printed Action.');
}
export function beginTechnologyAction(initial:PublicSetup,game:PublicSetup,state:PlayState,position:string,move:TechnologyActionMove){
 if(position!==game.activePosition)throw new Error('Only the active faction may move its Action pawn.');
 const reason=technologyActionBlocker(game,move.card,move.action,move.space);if(reason)throw new Error(reason);
 if(!state.discovery||!game.discovery?.powerReady||state.discovery.queue.length)throw new Error('The public board is still preparing.');
 const build=['narrow-beam-lasers','plasma-cannon','human-experiments','android-destroyers'].includes(move.card);
 if(build&&!permittedActionShipyards(game).includes(move.destination??''))throw new Error('Choose Sol or your controlled shipyard.');
 if(!build&&move.destination!==undefined)throw new Error('This printed Action does not build a ship.');
 const p=player(initial,state,position);p.ore-=technologyActionTerms(game,move.card,move.action).ore;
 p.actionLocation=technologyActionLocation(move.card,move.action,move.space);
 state.discovery.queue=[...technologyActionEffects(game,move.card,move.action,move.destination).map(effect=>({kind:'effect' as const,responder:position,source:move.card,effect})),{kind:'resume',responder:position,returnTo:'production'}];
 state.phase='discovery';validEconomies(initial,state);return state;
}
