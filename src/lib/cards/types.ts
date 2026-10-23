export type CardSymbolKind = 'ore' | 'population' | 'food' | 'research' | 'ship' | 'star' | 'action' | 'immediate' | 'supply';
import type { OriginalCardArt } from './original-art';
export type CardFamily = 'Technology' | 'Event' | 'System' | 'Achievement';
export type TechnologyType = 'Scientific' | 'Economic' | 'Military' | 'Commercial';
export type TechnologyLevel = 'I' | 'II' | 'III' | 'IIII';
export interface CardSection { label: string; text: string; symbol?: 'ore' | 'population' | 'food' | 'research' | 'ship' | 'star'; secondarySymbol?: 'ore' | 'food'; cost?: string; spaces?: number }
export interface CardDefinition {
  id: string; family: CardFamily; title: string; subtitle: string; badge: string; copies: number;
  art: 'robotics' | 'technology' | 'event' | 'system' | 'achievement' | 'astronomy' | 'terraforming-v1' | 'genetics-v1' | 'lasers-v1' | 'technologist-v1' | OriginalCardArt | null;
  artPosition?: string;
  technology?: {level:TechnologyLevel;incoming:readonly TechnologyType[];outgoing:readonly TechnologyType[]};
  event?: {level:'II'|'III';fixed:boolean};
  deck?: 'A'|'B'|'Basic';
  sections: readonly CardSection[];
  points?: number | '?'; rewards?: readonly number[]; secondSlotFourPlayersOnly?: boolean;
  source: { page: number; note: string; location: string };
}
// Public projection only: never pass a deck, future draw, or command to a renderer.
export interface CardPresentation {
  personalOwner?: string;
  researchers?: readonly string[]; researcherTones?: readonly number[]; actionOccupant?: string;
  colonyOwner?: string; colonySpecialty?: 'food'|'ore'; claimants?: readonly string[]; claimantTones?: readonly number[]; players?: 2 | 3 | 4;
}
