// Setup and gameplay inspect the same source-reviewed definitions as the gallery.
import { initialTechnologies } from '../cards/technology-cards';
import {systemCards,achievementCards,canonicalCard} from '../cards/catalog';
export { initialTechnologies,systemCards,achievementCards };
export const setupCards=[...initialTechnologies,...systemCards,...achievementCards];
export const cardById=canonicalCard;
