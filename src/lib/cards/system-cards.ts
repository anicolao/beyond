import type { CardDefinition } from './types';
const source={page:4,note:'Individually inspected base System face; second-print publisher p.23 clarifications apply.'};
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
  ['den-0255-4700','DEN 0255-4700','B',4,5,'Food','None.','You may repeat the immediate bonus of an already discovered Level II technology, even if you have not researched it.'],
  ['dx-cancri','DX Cancri','B',4,6,'Ore','You may pay 1 Ore to upgrade 1 ship here by 1 level.','All your jump effects and bonuses gain 1 additional jump.'],
  ['ez-aquarii','EZ Aquarii','B',5,4,'Ore','None.','Convert 1 Supply to Population, then you may research an already discovered Level II without prerequisites, spending the research Population.'],
  ['kapteyns-star','Kapteyn’s Star','B',4,6,'Food or Ore','None.','Convert 1 Supply into a level-4 ship in Deep Space.'],
  ['kruger-60','Kruger 60','B',4,6,'Food','Gain 1 Ore.','Score 2 additional VP if you have colonized at least 2 Deck A Systems by game end.'],
  ['lacaille-9352','Lacaille 9352','B',5,4,'Food','None.','Move your Action pawn to take an additional Basic Spacefaring action.'],
  ['luytens-star','Luyten’s Star','B',5,7,'Food or Ore','None.','No colonization effect.'],
  ['ross-154','Ross 154','B',4,6,'Food or Ore','You may move your rightmost Supply cube to column A, extending it if needed.','You may pay 1 additional Ore to take an occupied action, moving the existing pawn aside.'],
  ['tau-ceti','Tau Ceti','B',3,'?','Food or Ore','You may move your rightmost Supply cube to column A, extending it if needed.','Score your number of colonized Systems + 3 VP, up to 7 VP.'],
  ['tz-arietis','TZ Arietis','B',3,'?','Ore','None.','Score your researched Level II + III technologies, up to 7 VP. Personal technologies do not count.'],
  ['wise-1541-2250','WISE 1541-2250','B',5,2,'Food','None.','Draw the top Level III technology as a personal technology.']
];
export const systemCards:CardDefinition[]=systemFaces.map(([id,title,deck,power,points,specialty,control,colonize])=>({id,title,family:'System',copies:1,deck,subtitle:`${['barnards-star','lalande-21185','sirius','wolf-359'].includes(id)?'Starting System · ':''}Deck ${deck}`,badge:deck,art:id==='barnards-star'?'system':'astronomy',points,sections:[...(id==='luytens-star'?[{label:'Entry restriction',text:'You may enter only after researching at least 2 Level III technologies.'}]:[]),{label:'Specialty',symbol:specialty==='Ore'?'ore':'food',...(specialty==='Food or Ore'?{secondarySymbol:'ore' as const}:{}),text:`${specialty} production.`},...(control==='None.'?[]:[{label:'Gain control',text:control}]),{label:'Colonize',symbol:'ship',cost:`${power} military power`,text:colonize}],source:{...source,note:source.note+(id==='wise-1541-2250'?' WISE 1541-2250 is the inspected face title; publisher p.23 instead names WISE 0855-0714. See the inventory source gap.':''),location:`planetCards.jpg · row ${deck==='A'?1:2}, column ${systemFaces.filter(x=>x[2]===deck).findIndex(x=>x[0]===id)+2}`}}));
