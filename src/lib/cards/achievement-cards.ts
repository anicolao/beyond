import { originalCardArt } from './original-art';
import type { CardDefinition } from './types';
const source={page:11,note:'Individually inspected base Achievement face and ordered rewards; second-print setup restricts the second A slot to four players. Publisher p.23 clarifies Specialization.'};
const achievementFaces:[string,string,'Basic'|'A'|'B',string][]=[
  ['transcendence','Transcendence','Basic','Research your first Level IIII technology.'],
  ['empire','Empire','Basic','Colonize 4 Systems.'],
  ['technologist','Technologist','A','Research all 6 Level II technologies. Personal technologies do not count.'],
  ['efficiency','Efficiency','A','Reach the last level of either production track at the end of your turn.'],
  ['prosperity','Prosperity','A','Colonize 2 Systems, automate 4 discs and research 2 Level III technologies. Personal technologies do not count.'],
  ['agility','Agility','A','Have at least 7 action spaces on your researched Level II and III technologies. Personal technologies do not count.'],
  ['posthumanist','Posthumanist','B','Have at most 2 cubes left in Supply at the end of your turn.'],
  ['strategist','Strategist','B','At the end of your turn, have at least 8 Ore, 4 ships and 4 available Population.'],
  ['warlord','Warlord','B','At the end of your turn, have at least 4 military power in each of 3 locations.'],
  ['specialization','Specialization','B','At the end of your turn, control or have colonized at least 6 Systems sharing one specialty. Hybrid Systems count toward either specialty; shipyards also count.']
];
const artPositions:Record<string,string>={technologist:'center 25%',strategist:'center 15%',posthumanist:'center 20%'};
export const achievementCards:CardDefinition[]=achievementFaces.map(([id,title,kind,text])=>({id,title,family:'Achievement',copies:1,deck:kind,subtitle:kind==='Basic'?'Basic achievement':`Achievement ${kind}`,badge:kind==='Basic'?'★':kind,art:originalCardArt[id]??(id==='technologist'?'technologist-v1':id==='empire'?'achievement':null),...(artPositions[id]?{artPosition:artPositions[id]}:{}),rewards:kind==='Basic'?[4,3,2,1]:kind==='A'?[3,2]:[3],secondSlotFourPlayersOnly:kind==='A',sections:[{label:'Requirement',symbol:'star',text}],source:{...source,location:`eventsAchievements.jpg · row ${Math.floor((achievementFaces.findIndex(x=>x[0]===id)+3)/10)+1}, column ${(achievementFaces.findIndex(x=>x[0]===id)+3)%10+1}`}}));
