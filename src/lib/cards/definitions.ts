import type { CardDefinition } from './types';
export const rulebookURL = 'https://www.riograndegames.com/wp-content/uploads/2020/08/Beyond-the-Sun-2nd-Print-Rules-Combined.pdf';
// Reviewed subset, NOT a deck manifest. Mechanical paraphrases of printed faces.
export const representativeCards: readonly CardDefinition[] = [
  { id: 'hypercomputing', family: 'Technology', title: 'Hypercomputing', subtitle: 'Scientific · Level II', badge: 'II', category: 'Scientific', art: 'technology', points: 2,
    sections: [ { label: 'Immediate', symbol: 'ore', text: 'Automate 1 Ore production.' }, { label: 'Action', symbol: 'research', cost: '4 Ore + 1 Population', text: 'Research a Level III technology.' } ], source: { page: 3, note: 'Complete face; level confirmed by the discovery example on p. 16. Research and automation: pp. 14–17.' } },
  { id: 'advanced-robotics', family: 'Technology', title: 'Advanced Robotics', subtitle: 'Scientific · Level I', badge: 'I', category: 'Scientific', art: 'robotics', points: 1,
    sections: [ { label: 'Immediate', symbol: 'ore', text: 'Automate 1 Ore production. Gain 1 Ore.' } ], source: { page: 16, note: 'Complete face in the technology-tree example. This card has no action space.' } },
  { id: 'kc-24x', family: 'Event', title: 'KC-24X', subtitle: 'First Android Governor', badge: 'III', art: 'event', points: 1,
    sections: [ { label: 'When revealed', symbol: 'research', text: 'Remove a Tier 2 Guild cover below Basic Spacefaring. All factions can use the uncovered action.' }, { label: 'Keep', symbol: 'star', text: 'Retain this event in front of you; it scores 1 point.' } ], source: { page: 3, note: 'Complete visible face; Level III and fixed-event membership confirmed by the setup sheet.' } },
  { id: 'barnards-star', family: 'System', title: 'Barnard’s Star', subtitle: 'Starting System · Deck A', badge: 'A', art: 'system', points: 5,
    sections: [ { label: 'Specialty', symbol: 'food', text: 'Food production.' }, { label: 'Gain control', symbol: 'population', text: 'Convert 1 Supply to Population.' }, { label: 'Colonize', symbol: 'ship', cost: '3 military power', text: 'Convert 1 Supply to Population. Gain 2 Ore.' } ], source: { page: 4, note: 'Complete face; repeated in the colonization example on p. 22. Supply conversion follows p. 13.' } },
  { id: 'empire', family: 'Achievement', title: 'Empire', subtitle: 'Basic achievement', badge: '★', art: 'achievement', rewards: [4,3,2,1],
    sections: [ { label: 'Requirement', symbol: 'star', text: 'Colonize 4 Systems.' } ], source: { page: 4, note: 'Complete face; claims fill left to right and remain permanently (p. 10).' } },
  { id: 'technologist', family: 'Achievement', title: 'Technologist', subtitle: 'Achievement A', badge: 'A', art: 'achievement', rewards: [3,2], secondSlotFourPlayersOnly: true,
    sections: [ { label: 'Requirement', symbol: 'research', text: 'Research all 6 Level II technologies. Personal technologies do not count.' } ], source: { page: 11, note: 'Face and first reward also visible on p. 4. Second A slot is unavailable with 2–3 players (setup sheet).' } }
];
