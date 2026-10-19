/** Base game, second-print setup v1. Sources and transcription audit: SOURCES.md. */
export const setupVersion = 'basic-2020-v1' as const;
export type PlayerCount = 2 | 3 | 4;
export type FactionId = 'nishida' | 'disciples' | 'zheng' | 'united-nations';
export const factions = [
  { id: 'nishida', emblem: '◎', name: 'Nishida-Østergaard Corporation', short: 'Nishida-Østergaard', bonus: 'Gain 2 additional Ore.', ore: 2, column: -1, extra: 'none', shipLocation: 'sol' },
  { id: 'disciples', emblem: '✧', name: 'Disciples of the Cosmic Tabernacle', short: 'Cosmic Tabernacle', bonus: 'Gain 1 additional Ore. Your starting ship is in Deep Space instead of Sol.', ore: 1, column: -1, extra: 'none', shipLocation: 'deep-space' },
  { id: 'zheng', emblem: '⋈', name: 'The Zheng-Yi Brotherhood', short: 'Zheng-Yi Brotherhood', bonus: 'Convert 1 Supply from column A into an additional level-1 ship at Sol.', ore: 0, column: 0, extra: 'ship', shipLocation: 'sol' },
  { id: 'united-nations', emblem: '✺', name: 'United Nations of Sol', short: 'United Nations of Sol', bonus: 'Convert 1 Supply from column C into an additional Population.', ore: 0, column: 2, extra: 'population', shipLocation: 'sol' }
] as const;
export function legalFaction(id: string, count: PlayerCount): id is FactionId { return factions.some(f => f.id === id && (count !== 2 || id !== 'disciples')); }
export const supplyCapacity = [5, 4, 3, 3, 2] as const;
export const foodColumns = ['A', null, 'B', null, 'C', null, 'D', null, 'E'] as const;
export const oreYields = [1, 1, 1, 1, 1, 1, 1, 1, 1] as const;
export const levelOne = ['terraforming', 'advanced-genetics', 'narrow-beam-lasers', 'advanced-robotics'] as const;
export const technologyDecks = {
  II: ['hypercomputing','human-experiments','psionics-research','multi-colony-symposium','exo-alloy-refinement','plasma-cannon','android-destroyers','modular-fleet','bio-synaptic-network','outer-sector-militia','mass-cloning','android-surveyors','spacetime-anomaly-studies','terranova-cruisers','supply-outpost','intersystem-diplomacy'],
  III: ['transdimensional-ai','planetary-scale-research','metahuman-chambers','hivemind-computing','deep-space-megastructures','capital-ship','android-armada','mercenary-fleet','cerebral-implants','manufacturing-orbitals','android-rights-movement','subatomic-fabrication','quantum-data-exchange','hyperdrive-boosters','wormhole-technology','stealth-terraformers'],
  IIII: ['technological-singularity','giga-corporations','parallel-universe-generator','neo-industrial-revolution','megafleet-construction','mind-machine-assimilation','new-golden-age','galactic-empire','android-independence','ministry-of-colonies']
} as const;
export const events = {
  II: { fixed: ['maya-chaturvedi','tyler-lee'], random: ['experimental-prototypes','march-of-progress','economic-boom','covert-arms-deal','dimensional-rift','research-tariffs','black-market-industries','erratic-solar-activity'] },
  III: { fixed: ['kc-24x','onu'], random: ['monolith-construction','galactic-census','interstellar-arms-race','research-grant','museum-of-retired-spacecraft','mass-enlightenment','galactic-hq','dyson-sphere-mk-i'] }
} as const;
export const systemDecks = {
  A: ['alpha-centauri','barnards-star','61-cygni','epsilon-indi','gj-1061','groombridge-34','lalande-21185','procyon','sirius','struve-2398','teegardens-star','wolf-359'],
  B: ['ad-leonis','den-0255-4700','dx-cancri','ez-aquarii','kapteyns-star','kruger-60','lacaille-9352','luytens-star','ross-154','tau-ceti','tz-arietis','wise-1541-2250']
} as const;
export const startingSystems = ['barnards-star','lalande-21185','sirius','wolf-359'] as const;
export const achievementDecks = { A: ['technologist','efficiency','prosperity','agility'], B: ['posthumanist','strategist','warlord','specialization'] } as const;
export type TechnologySlot = { id: string; level: 'I' | 'II' | 'III' | 'IIII'; row: number; prerequisites: string[]; required: number };
export const technologySlots: readonly TechnologySlot[] = [
  ...[0,2,4,6].map((row,i) => ({ id:`I-${i+1}`, level:'I' as const, row, prerequisites:[], required:0 })),
  ...[['I-1'],['I-1','I-2'],['I-2'],['I-3'],['I-3','I-4'],['I-4']].map((prerequisites,i) => ({ id:`II-${i+1}`, level:'II' as const, row:[0,1,2,3,5,6][i], prerequisites, required:prerequisites.length })),
  ...[['II-1'],['II-2'],['II-2','II-3'],['II-3','II-4'],['I-3'],['II-5','II-6']].map((prerequisites,i) => ({ id:`III-${i+1}`, level:'III' as const, row:[0,1,2,3,4,6][i], prerequisites, required:prerequisites.length })),
  ...[['III-1','III-2','III-3'],['III-3','III-4','III-5'],['III-5','III-6']].map((prerequisites,i) => ({ id:`IIII-${i+1}`, level:'IIII' as const, row:[1,3,5][i], prerequisites, required:2 }))
];
export const basicActions = [
  { id:'research-I', title:'Research Level I', text:'Spend 1 Population to research a Level I technology.', spaces: {2:[0,0],3:[0,0,0],4:[0,0,0,0]} },
  { id:'research-II', title:'Research Level II', text:'Pay 2 Ore and spend 1 Population to research a Level II technology.', spaces: {2:[0,1],3:[0,0,1],4:[0,0,1,1]} },
  { id:'build-jump', title:'Build, then jump', text:'You may spend 1 Population to build a level-1 ship. Then jump up to 2.', spaces: {2:[0,1],3:[0,0],4:[0,0]} },
  { id:'supply-population', title:'Gather resources', text:'Convert 1 Supply to Population. Gain 1 Ore. This action may be repeated.', spaces: {2:[0],3:[0],4:[0]} }
] as const;
export const guilds = [
  { id:'terraforming-guild', name:'Terraforming Guild', tier:1, spaces:1, text:'Pay 4 Ore and return 1 Population to Supply to colonize a System.' },
  { id:'professors-guild', name:'Professors’ Guild', tier:1, spaces:2, text:'Pay 4 Ore and return 1 Population to Supply, then research a Level III technology (spending its research Population separately).' },
  { id:'technocrats-guild', name:'Technocrats’ Guild', tier:2, spaces:1, text:'Spend 1 Population to research Level I, then take a Basic Spacefaring action without moving your pawn. Pay its usual cost.' },
  { id:'meta-science-guild', name:'Meta-Science Guild', tier:2, spaces:2, text:'Pay 6 Ore and return 2 Population to Supply, then research a Level IIII technology (spending its research Population separately).' }
] as const;
export type Location = { id:string; title:string; x:number; y:number; specialty?:'food'|'ore'|'either'; kind:'system'|'shipyard'|'sol'|'deep-space'; deck?:'A'|'B' };
export function explorationBoard(count: PlayerCount): { locations: Location[]; edges: readonly (readonly [string,string])[] } {
  const locations:Location[] = [
    {id:'sol',title:'Sol',x:50,y:91,kind:'sol'}, {id:'deep-space',title:'Deep Space',x:50,y:50,kind:'deep-space'},
    {id:'a-1',title:'System A · 1',x:count===2?74:23,y:70,kind:'system',deck:'A'},
    {id:'b-1',title:'System B · 1',x:23,y:17,kind:'system',deck:'B'}, {id:'b-2',title:'System B · 2',x:77,y:25,kind:'system',deck:'B'},
    {id:'shipyard-north',title:'Northern shipyard',x:54,y:6,kind:'shipyard',specialty:'either'}
  ];
  if (count>2) locations.push({id:'a-2',title:'System A · 2',x:77,y:77,kind:'system',deck:'A'}, {id:'shipyard-west',title:'Western shipyard',x:15,y:42,kind:'shipyard',specialty:'food'}, {id:'shipyard-east',title:'Eastern shipyard',x:85,y:52,kind:'shipyard',specialty:'ore'});
  const edges: [string,string][] = [['sol','a-1'],['a-1','deep-space'],['deep-space','b-1'],['deep-space','b-2'],['deep-space','shipyard-north'],['b-1','shipyard-north'],['b-2','shipyard-north']];
  if(count>2) edges.push(['sol','a-2'],['a-1','a-2'],['a-2','deep-space'],['a-1','shipyard-west'],['shipyard-west','b-1'],['a-2','shipyard-east'],['shipyard-east','b-2']);
  return {locations,edges};
}

export const seatAngles:Record<string,number>={north:180,'north-east':225,east:270,'south-east':315,south:0,'south-west':45,west:90,'north-west':135};
