import { representativeCards } from '$lib/cards/definitions';
import type { CardDefinition, CardSection } from '$lib/cards/types';
const source = { page:4, note:'Printed component face, cross-checked against the publisher-authorized base-game component sheets. See game/SOURCES.md.' };
const tech = (id:string,title:string,category:string,art:CardDefinition['art'],sections:CardSection[]):CardDefinition => ({id,title,family:'Technology',subtitle:`${category} · Level I`,badge:'I',art,points:1,sections,source:{page:3,note:source.note}});
export const initialTechnologies:CardDefinition[] = [
  tech('terraforming','Terraforming','Commercial','terraforming-v1',[
    {label:'Immediate',symbol:'ship',text:'Convert 1 Supply into a level-1 ship in Deep Space.'},
    {label:'Action',symbol:'ship',text:'Jump up to 4.'},
    {label:'Action',symbol:'star',cost:'3 Ore + return 1 Population to Supply',text:'Colonize a System.'}
  ]),
  tech('advanced-genetics','Advanced Genetics','Economic','genetics-v1',[
    {label:'Immediate',symbol:'food',text:'Automate 1 Food production. Then convert 1 Supply to Population.'}
  ]),
  tech('narrow-beam-lasers','Narrow Beam Lasers','Military','lasers-v1',[
    {label:'Immediate',symbol:'ore',text:'Gain 1 Ore. Upgrade 1 ship by 1 level.'},
    {label:'Action',symbol:'ship',cost:'1 Ore + 1 Population',text:'Build a level-2 ship. Then jump up to 3.'}
  ]),
  representativeCards.find(card=>card.id==='advanced-robotics')!
];
type SystemFace = [string,string,'A'|'B',number,number|'?',string,string,string];
const systemFaces:SystemFace[] = [
  ['alpha-centauri','Alpha Centauri','A',3,5,'Ore','You may convert 1 Supply into a level-1 ship at a permitted shipyard.','Score 2 additional VP if you have colonized at least 2 Deck B Systems by game end.'],
  ['barnards-star','Barnard’s Star','A',3,5,'Food','Convert 1 Supply to Population.','Convert 1 Supply to Population. Gain 2 Ore.'],
  ['61-cygni','61 Cygni','A',3,5,'Ore','Refill your Ore to 3.','During your turn, you may pay 3 Ore to convert 1 Supply to Population.'],
  ['epsilon-indi','Epsilon Indi','A',3,5,'Food','You may return 1 Population to Supply to gain 3 Ore.','Move the 2 rightmost Supply cubes to any Supply columns.'],
  ['gj-1061','GJ 1061','A',4,5,'Ore','You may convert 1 Supply into a level-1 ship in Deep Space.','Convert 1 Supply into a level-3 ship in Deep Space.'],
  ['groombridge-34','Groombridge 34','A',4,5,'Ore','You may pay 2 Ore and spend 1 Population to build a level-2 ship.','Jump up to 3, without entering the newly drawn System.'],
  ['lalande-21185','Lalande 21185','A',3,5,'Food or Ore','None.','This turn’s regular production phase may include Population growth, then Ore production, then trade, in that order.'],
  ['procyon','Procyon','A',4,3,'Food or Ore','None.','Draw the top Level II technology as a personal technology.'],
  ['sirius','Sirius','A',3,5,'Ore','Gain 1 Ore.','Upgrade up to 2 ships by 1 level each.'],
  ['struve-2398','Struve 2398','A',3,4,'Food or Ore','None.','Automate 1 Food or Ore production.'],
  ['teegardens-star','Teegarden’s Star','A',3,5,'Food','Convert 1 Supply to Population.','Your research actions cost 1 fewer Ore.'],
  ['wolf-359','Wolf 359','A',3,5,'Food or Ore','None.','Convert your rightmost Supply into a level-2 ship at a permitted shipyard.'],
  ['ad-leonis','AD Leonis','B',4,6,'Food','You may pay 2 Ore to research Level I (spending the research Population).','Gain 1 Ore for each Level I technology you have researched.'],
  ['den-0255-4700','DEN 0255-4700','B',4,5,'Food','None.','Repeat a Level III immediate bonus, whether or not you have researched that technology.'],
  ['dx-cancri','DX Cancri','B',4,6,'Ore','You may pay 1 Ore to upgrade 1 ship here by 1 level.','All your jump effects and bonuses gain 1 additional jump.'],
  ['ez-aquarii','EZ Aquarii','B',5,4,'Ore','None.','Convert 1 Supply to Population, then research Level II without prerequisites, spending the research Population.'],
  ['kapteyns-star','Kapteyn’s Star','B',4,6,'Food or Ore','None.','Convert 1 Supply into a level-4 ship in Deep Space.'],
  ['kruger-60','Kruger 60','B',4,6,'Food','Gain 1 Ore.','Score 2 additional VP if you have colonized at least 2 Deck A Systems by game end.'],
  ['lacaille-9352','Lacaille 9352','B',5,4,'Food','None.','Move your Action pawn to take an additional Basic Spacefaring action.'],
  ['luytens-star','Luyten’s Star','B',5,7,'Food or Ore','You may enter only after researching at least 2 Level III technologies.','No colonization effect.'],
  ['ross-154','Ross 154','B',4,6,'Food or Ore','You may move your rightmost Supply cube to column A, extending it if needed.','You may pay 1 additional Ore to take an occupied action, moving the existing pawn aside.'],
  ['tau-ceti','Tau Ceti','B',3,'?','Food or Ore','You may move your rightmost Supply cube to column A, extending it if needed.','Score your number of colonized Systems + 3 VP, up to 7 VP.'],
  ['tz-arietis','TZ Arietis','B',3,'?','Ore','None.','Score your researched Level II + III technologies, up to 7 VP. Personal technologies do not count.'],
  ['wise-1541-2250','WISE 1541-2250','B',5,2,'Food','None.','Draw the top Level III technology as a personal technology.']
];
export const systemCards:CardDefinition[]=systemFaces.map(([id,title,deck,power,points,specialty,control,colonize])=>({id,title,family:'System',subtitle:`${['barnards-star','lalande-21185','sirius','wolf-359'].includes(id)?'Starting System · ':''}Deck ${deck}`,badge:deck,art:'astronomy',points,sections:[{label:'Specialty',symbol:specialty==='Ore'?'ore':'food',...(specialty==='Food or Ore'?{secondarySymbol:'ore' as const}:{}),text:`${specialty} production.`},{label:'Gain control',text:control},{label:'Colonize',symbol:'ship',cost:`${power} military power`,text:colonize}],source}));
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
  ['specialization','Specialization','B','At the end of your turn, control or have colonized at least 6 Systems sharing one specialty. Hybrid Systems count toward either specialty.']
];
export const achievementCards:CardDefinition[]=achievementFaces.map(([id,title,kind,text])=>({id,title,family:'Achievement',subtitle:kind==='Basic'?'Basic achievement':`Achievement ${kind}`,badge:kind==='Basic'?'★':kind,art:'achievement',rewards:kind==='Basic'?[4,3,2,1]:kind==='A'?[3,2]:[3],secondSlotFourPlayersOnly:kind==='A',sections:[{label:'Requirement',symbol:'star',text}],source}));
export const setupCards=[...initialTechnologies,...systemCards,...achievementCards];
export function cardById(id:string) { const card=setupCards.find(c=>c.id===id); if(!card) throw new Error(`Unsupported public card: ${id}`); return card; }
