import type { CardDefinition, CardPresentation } from '$lib/cards/types';
// Deliberate visual fixtures. Never imported by live game projection or persistence.
export function examplePresentation(card: CardDefinition, players: 2 | 3 | 4, full = false): CardPresentation {
  if (card.family === 'Technology') return { researchers: full?['Ada','Bora','Cleo','Dara'].slice(0,players):['Ada','Bora'], ...(full?{researcherTones:[170,38,8,275].slice(0,players)}:{}), ...((full?card.sections.some(s=>s.spaces):card.id === 'hypercomputing') ? { actionOccupant: 'Ada' } : {}) };
  if (card.family === 'System') return { colonyOwner: 'Ada', colonySpecialty:card.sections.find(s=>s.label==='Specialty')?.symbol==='ore'?'ore':'food' };
  if (card.family === 'Achievement') return { ...(full?{claimantTones:[170,38,8,275]}:{}), claimants: full?['Ada','Bora','Cleo','Dara'].slice(0,Math.min(players,card.secondSlotFourPlayersOnly&&players<4?1:card.rewards?.length??0)):['Ada'], players };
  return {};
}
