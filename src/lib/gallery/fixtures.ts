import type { CardDefinition, CardPresentation } from '$lib/cards/types';
// Deliberate visual fixtures. Never imported by live game projection or persistence.
export function examplePresentation(card: CardDefinition, players: 2 | 3 | 4): CardPresentation {
  if (card.family === 'Technology') return { researchers: ['Ada', 'Bora'], ...(card.id === 'hypercomputing' ? { actionOccupant: 'Ada' } : {}) };
  if (card.family === 'System') return { colonyOwner: 'Ada' };
  if (card.family === 'Achievement') return { claimants: ['Ada'], players };
  return {};
}
