export type CardFamily = 'Technology' | 'Event' | 'System' | 'Achievement';
export interface CardSection { label: string; text: string; symbol?: 'ore' | 'population' | 'food' | 'research' | 'ship' | 'star'; cost?: string }
export interface CardDefinition {
  id: string; family: CardFamily; title: string; subtitle: string; badge: string;
  art: 'robotics' | 'technology' | 'event' | 'system' | 'achievement';
  category?: 'Scientific'; sections: readonly CardSection[];
  points?: number; rewards?: readonly number[]; secondSlotFourPlayersOnly?: boolean;
  source: { page: number; note: string };
}
// Public projection only: never pass a deck, future draw, or command to a renderer.
export interface CardPresentation {
  researchers?: readonly string[]; actionOccupant?: string;
  colonyOwner?: string; claimants?: readonly string[]; players?: 2 | 3 | 4;
}
