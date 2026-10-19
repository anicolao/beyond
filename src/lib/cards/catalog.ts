import { technologyCards } from './technology-cards';
import { eventCards } from './event-cards';
import { systemCards } from './system-cards';
import { achievementCards } from './achievement-cards';
import type { CardFamily } from './types';
export const rulebookURL='https://www.riograndegames.com/wp-content/uploads/2020/08/Beyond-the-Sun-2nd-Print-Rules-Combined.pdf';
/** Exact base inventory, not a live game's deck or revealed projection. */
export const baseCards=Object.freeze([...technologyCards,...eventCards,...systemCards,...achievementCards]);
export const physicalCardCount=baseCards.reduce((n,c)=>n+c.copies,0);
export const cardFamilies:readonly CardFamily[]=['Technology','Event','System','Achievement'];
export const inventoryCounts=cardFamilies.map(family=>({family,designs:baseCards.filter(c=>c.family===family).length,copies:baseCards.filter(c=>c.family===family).reduce((n,c)=>n+c.copies,0)}));
export const originalArtGaps=baseCards.filter(c=>c.art===null).map(c=>c.id);
const byId=new Map(baseCards.map(c=>[c.id,c]));
if(byId.size!==baseCards.length)throw new Error('Duplicate canonical card ID');
export function canonicalCard(id:string){const card=byId.get(id);if(!card)throw new Error(`Unsupported public card: ${id}`);return card;}
export {technologyCards,eventCards,systemCards,achievementCards};
