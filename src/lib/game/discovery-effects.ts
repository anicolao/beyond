/** Structured printed immediate effects; never execute Action boxes as bonuses. */
export type BonusEffect=
 | {kind:'ore';amount:number}
 | {kind:'population';amount:number;side?:'left'|'right'}
 | {kind:'automate';track:'food'|'ore'|'either'}
 | {kind:'upgrade';levels:number;ships:number;optional?:boolean;location?:string}
 | {kind:'ship';level:1|2|3|4;side?:'left'|'right';location?:'sol'|'deep-space';cube?:'population'}
 | {kind:'jump';amount:number}
 | {kind:'return-population';amount:number}
 | {kind:'research-I';cost:number;fromSupply?:boolean}
 | {kind:'system-bonus';id:string;location:string}
 | {kind:'choice';id:'exo-alloy'|'bio-synaptic'};
export const levelTwoBonuses:Record<string,readonly BonusEffect[]>={
 'hypercomputing':[{kind:'automate',track:'ore'}],
 'human-experiments':[{kind:'upgrade',levels:1,ships:2,optional:true}],
 'psionics-research':[{kind:'automate',track:'food'}],
 'multi-colony-symposium':[],
 'exo-alloy-refinement':[{kind:'upgrade',levels:2,ships:1},{kind:'choice',id:'exo-alloy'}],
 'plasma-cannon':[{kind:'ship',level:3},{kind:'jump',amount:1}],
 'android-destroyers':[{kind:'ship',level:3,side:'right'}],
 'modular-fleet':[],
 'bio-synaptic-network':[{kind:'choice',id:'bio-synaptic'}],
 'outer-sector-militia':[{kind:'ship',level:2},{kind:'jump',amount:1}],
 'mass-cloning':[{kind:'automate',track:'food'},{kind:'population',amount:1}],
 'android-surveyors':[{kind:'automate',track:'food'},{kind:'jump',amount:1}],
 'spacetime-anomaly-studies':[{kind:'jump',amount:2}],
 'terranova-cruisers':[],
 'supply-outpost':[{kind:'upgrade',levels:1,ships:1},{kind:'jump',amount:2}],
 'intersystem-diplomacy':[{kind:'population',amount:1},{kind:'ore',amount:1}]
};
export const levelOneBonuses:Record<string,readonly BonusEffect[]>={
 'terraforming':[{kind:'ship',level:1,location:'deep-space'}],
 'advanced-genetics':[{kind:'automate',track:'food'},{kind:'population',amount:1}],
 'narrow-beam-lasers':[{kind:'ore',amount:1},{kind:'upgrade',levels:1,ships:1}],
 'advanced-robotics':[{kind:'automate',track:'ore'},{kind:'ore',amount:1}]
};
export const levelTwoEventKinds={
 'maya-chaturvedi':'guild', 'tyler-lee':'guild',
 'experimental-prototypes':'prototypes','march-of-progress':'march','economic-boom':'economy',
 'covert-arms-deal':'arms','dimensional-rift':'rift','research-tariffs':'tariff',
 'black-market-industries':'industry','erratic-solar-activity':'solar'
} as const;
