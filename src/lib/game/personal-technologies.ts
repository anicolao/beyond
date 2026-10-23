import {canonicalCard} from '../cards/catalog';
import {type PublicSetup} from './setup';
import type {PlayState} from './turn';

/** Public ownership, deliberately separate from permanent research cubes. */
export type PersonalTechnology={owner:string;card:string;source:'procyon'|'wise-1541-2250';turn:number};
export function personalTechnologyLevel(source:PersonalTechnology['source']):'II'|'III'{
 if(source==='procyon')return 'II';
 if(source==='wise-1541-2250')return 'III';
 throw new Error('Choose a printed personal-technology colony.');
}
export function personalTechnologies(game:PublicSetup,position:string){
 return (game.discovery?.personalTechnologies??[]).filter(t=>t.owner===position);
}
/** This score is a public projection, not an endgame scheduler. */
export function personalTechnologyPoints(game:PublicSetup,position:string){
 return personalTechnologies(game,position).reduce((total,t)=>total+canonicalCard(t.card).technology!.level.length,0);
}
export function personalTechnologyOwner(game:PublicSetup,card:string){
 return game.discovery?.personalTechnologies?.find(t=>t.card===card)?.owner;
}
export function hasTechnologyAccess(game:PublicSetup,position:string,card:string){
 const owner=personalTechnologyOwner(game,card);
 if(owner)return owner===position;
 return game.technologies.some(t=>t.card===card)&&!!game.players.find(p=>p.position===position)?.research.includes(card);
}
export function personalTechnologyTargetBlocker(game:PublicSetup,position:string,card:string){
 const owner=personalTechnologyOwner(game,card);
 return owner&&owner!==position?'Another faction’s personal technology cannot be researched, copied or targeted.':'';
}
/** Consume the actual top card only at the saved colony-benefit boundary.
 * Caller must queue its source-reviewed immediate bonus before completing the
 * continuation. No Action, Event, candidate choice or Population cost occurs here. */
export function acquirePersonalTechnology(initial:PublicSetup,state:PlayState,position:string,source:PersonalTechnology['source']){
 const d=state.discovery,q=d?.queue[0];
 if(!d||q?.kind!=='colony'||q.stage!=='bonus'||q.card!==source||q.responder!==position||!d.colonies?.some(c=>c.card===source&&c.owner===position))throw new Error('Resolve the saved owner’s colony benefit first.');
 if(d.personalTechnologies?.some(t=>t.source===source))throw new Error('This colony’s personal technology was already acquired.');
 const level=personalTechnologyLevel(source);
 const deck=level==='II'?d.deckII:d.deckIII;
 if(!deck)throw new Error('Prepare the retained Level III deck before colonizing WISE.');
 const card=deck[0];
 if(!card||canonicalCard(card).technology?.level!==level)throw new Error('The canonical personal-technology deck is unavailable.');
 if(d.personalTechnologies?.some(t=>t.card===card)||d.technologies.some(t=>t.card===card)||initial.players.some(p=>(state.players[p.position]??p).research.includes(card)))throw new Error('This technology is already in play.');
 const acquired:PersonalTechnology={owner:position,card,source,turn:state.turn};
 if(level==='II')d.deckII=deck.slice(1);else d.deckIII=deck.slice(1);
 (d.personalTechnologies??=[]).push(acquired);
 return acquired;
}

/** Permanent abilities belong only to the faction that researched/acquired it. */
export function ownsTechnology(game:PublicSetup,position:string,card:string){
 return !!game.players.find(p=>p.position===position)?.research.includes(card)||personalTechnologyOwner(game,card)===position;
}
