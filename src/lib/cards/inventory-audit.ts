import type { CardDefinition } from './types';
import checklist from '../../../docs/content/second-printing-card-inventory.json';
// The pinned source-face checklist is independent of the production definitions.
export const expectedBaseIds=Object.freeze(checklist.cards.map(card=>card.id));
export const expectedFamilyCopies={Technology:46,Event:20,System:24,Achievement:10} as const;
export function auditCardInventory(cards:readonly CardDefinition[]){
 const problems:string[]=[];const seen=new Set<string>();const expected=new Set<string>(expectedBaseIds);
 for(const card of cards){if(seen.has(card.id))problems.push(`Duplicate ID: ${card.id}`);seen.add(card.id);if(!expected.has(card.id))problems.push(`Extra ID: ${card.id}`);if(card.copies!==1)problems.push(`Wrong physical quantity: ${card.id}`);if(!card.title.trim()||!card.sections.length||card.sections.some(s=>!s.text.trim()))problems.push(`Incomplete rules: ${card.id}`);if(!card.source.location)problems.push(`Missing face reference: ${card.id}`);}
 for(const id of expected)if(!seen.has(id))problems.push(`Missing ID: ${id}`);
 for(const [family,total]of Object.entries(expectedFamilyCopies)){const familyCards=cards.filter(c=>c.family===family);if(familyCards.length!==total||familyCards.reduce((n,c)=>n+c.copies,0)!==total)problems.push(`Wrong family inventory: ${family}`);}
 return problems;
}
