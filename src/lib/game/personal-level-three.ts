import type {BonusEffect} from './discovery-effects';

/** All sixteen source-reviewed base Level III immediate boxes. These queues
 * never execute an Action box, reveal an Event or insert a research cube. */
export const levelThreeBonuses:Record<string,readonly BonusEffect[]>={
 'transdimensional-ai':[{kind:'population',amount:1},{kind:'personal-research'}],
 'planetary-scale-research':[{kind:'ship',level:2},{kind:'jump',amount:2}],
 'metahuman-chambers':[{kind:'automate',track:'food'},{kind:'population',amount:1}],
 'hivemind-computing':[{kind:'automate',track:'ore'},{kind:'jump',amount:1}],
 'deep-space-megastructures':[{kind:'ship',level:3,location:'deep-space'},{kind:'jump',amount:1}],
 'capital-ship':[{kind:'ship',level:4},{kind:'jump',amount:1}],
 'android-armada':[{kind:'choice',id:'android-armada',ordinal:1},{kind:'choice',id:'android-armada',ordinal:2}],
 'mercenary-fleet':[],
 'cerebral-implants':[],
 'manufacturing-orbitals':[{kind:'manufacturing'}],
 'android-rights-movement':[{kind:'automate',track:'food'},{kind:'redistribute-supply'}],
 'subatomic-fabrication':[{kind:'automate',track:'either'},{kind:'population',amount:1},{kind:'ore',amount:1},{kind:'jump',amount:1}],
 'quantum-data-exchange':[{kind:'automate',track:'ore'},{kind:'ore',amount:2}],
 'hyperdrive-boosters':[{kind:'upgrade',levels:1,ships:1,ordinal:1},{kind:'upgrade',levels:1,ships:1,ordinal:2},{kind:'upgrade',levels:1,ships:1,ordinal:3}],
 'wormhole-technology':[{kind:'ship',level:2},{kind:'ore',amount:1},{kind:'jump',amount:2,topology:'any'}],
 'stealth-terraformers':[]
};
