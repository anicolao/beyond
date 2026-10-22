import {test,expect} from 'bun:test';
import {startingSetup} from '../../src/lib/game/setup';
import {initialDiscovery,type DiscoveryChoice} from '../../src/lib/game/discovery';
import {resolveControlCheck} from '../../src/lib/game/discovery-movement';
import {initialPlay,economy,projectGame} from '../../src/lib/game/turn';
import {outpostInspection} from '../../src/lib/game/outpost-inspection';
import {supplyCapacity} from '../../src/lib/game/manifest';
const seed='55555555-5555-4555-8555-000000000002';
// Printed control decision table: expected outcomes are explicit, not computed
// by another maximum-power implementation in the test.
const cases=[
 {powers:[0,0],incumbent:0,winner:0},
 {powers:[2,2],incumbent:0,winner:0},
 {powers:[1,3],incumbent:0,winner:1},
 {powers:[2,2],incumbent:-1,winner:-1},
 {powers:[3,1],incumbent:-1,winner:0},
 {powers:[0,2,2],incumbent:0,winner:-1},
 {powers:[1,2,2],incumbent:0,winner:-1},
 {powers:[2,2,1],incumbent:0,winner:0},
 {powers:[0,2,2,2],incumbent:0,winner:-1},
 {powers:[1,2,3,3],incumbent:0,winner:-1},
 {powers:[2,2,2,2],incumbent:0,winner:0},
 {powers:[1,1,4,2],incumbent:0,winner:2},
 {powers:[0,0,0,0],incumbent:-1,winner:-1}
];
for(const row of cases)test('control table '+row.powers.join('/')+' incumbent '+row.incumbent+' → '+row.winner,()=>{
 const players=[{position:'p1',name:'Ada',faction:'nishida' as const},{position:'p2',name:'Bora',faction:'zheng' as const},{position:'p3',name:'Cleo',faction:'united-nations' as const},{position:'p4',name:'Dara',faction:'disciples' as const}].slice(0,row.powers.length);
 const game=startingSetup({version:'basic-2020-v1',seed},players,{factions:'basic',achievements:'introductory'});
 for(const [i,p] of game.players.entries()){
  const count=row.powers[i]>0?1:0,returned=p.ships.length-count;
  for(let n=0;n<returned;n++){const at=p.supply.findLastIndex((v,j)=>v<supplyCapacity[j]);p.supply[at<0?0:at]++;}
  p.ships=count?[{id:p.position+'-ship-1',level:row.powers[i] as 1|2|3|4,location:'a-1'}]:[];
  expect(p.supply.reduce((a,b)=>a+b,0)+p.population+p.ships.length+p.research.length).toBe(20);
 }
 const state=initialPlay(game);state.discovery=initialDiscovery(seed,game.count,0);state.phase='discovery';
 for(const p of game.players)state.players[p.position]=economy(p);
 if(row.incumbent>=0){const owner=players[row.incumbent].position;state.discovery.outposts['a-1']={owner,track:'ore'};state.players[owner].oreDiscs--;}
 state.discovery.queue=[{kind:'control-check',responder:'p1',location:'a-1',source:'Jump'}];
 const expected=row.winner<0?undefined:players[row.winner].position;
 const before=structuredClone(state),view=outpostInspection(projectGame(game,state),'a-1');
 expect(view.comparisonOwner).toBe(expected);expect(state).toEqual(before);
 resolveControlCheck(game,state,'a-1','Jump');
 const tasks:DiscoveryChoice[]=[];
 if(row.winner!==row.incumbent){
  if(row.incumbent>=0)tasks.push({kind:'control-loss',responder:players[row.incumbent].position,location:'a-1',source:'Jump'});
  if(row.winner>=0)tasks.push({kind:'control',responder:players[row.winner].position,location:'a-1',source:'Jump'});
 }
 expect(state.discovery.queue).toEqual(tasks);
 expect(state.players).toEqual(before.players);
 expect(state.discovery.outposts).toEqual(before.discovery!.outposts);
});
