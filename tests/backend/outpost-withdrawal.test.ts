import {test,expect} from 'bun:test';
import {startingSetup} from '../../src/lib/game/setup';
import {initialDiscovery} from '../../src/lib/game/discovery';
import {initialPlay,economy,applyTurn,projectGame,} from '../../src/lib/game/turn';
import {canAdvanceDiscovery} from '../../src/lib/game/discovery-resolution';
import {syncFleetPowers} from '../../src/lib/game/discovery-economy';
import {outpostInspection} from '../../src/lib/game/outpost-inspection';
const seed='55555555-5555-4555-8555-000000000002';
// Author clarification: Dennis K. Chan, Dec10,2020, BGG article36483484.
// Incumbent remains part of highest tie => retain; lower than tied opponents => neutral.
for(const scenario of [
 {name:'two-player3/2→2/2 retains incumbent',count:2 as const,departure:1,remaining:2,opponents:[2],owner:'p1'},
 {name:'three-player3/2/2→2/2/2 retains incumbent',count:3 as const,departure:1,remaining:2,opponents:[2,2],owner:'p1'},
 {name:'partial withdrawal3/2/2→1/2/2 becomes neutral',count:3 as const,departure:2,remaining:1,opponents:[2,2],owner:undefined},
 {name:'complete withdrawal3/2/2→0/2/2 becomes neutral',count:3 as const,departure:3,remaining:0,opponents:[2,2],owner:undefined},
 {name:'partial withdrawal3/2/1→1/2/1 transfers to unique rival',count:3 as const,departure:2,remaining:1,opponents:[2,1],owner:'p2'}
])test(scenario.name+' through saved jump and control queue',()=>{
 const setup=startingSetup({version:'basic-2020-v1',seed},[{position:'p1',name:'Ada',faction:'nishida' as const},{position:'p2',name:'Bora',faction:'zheng' as const},{position:'p3',name:'Cleo',faction:'united-nations' as const}].slice(0,scenario.count),{factions:'basic',achievements:'introductory'});
 let state=initialPlay(setup);state.phase='discovery';state.discovery=initialDiscovery(seed,scenario.count,0);
 for(const [i,p]of setup.players.entries()){
  state.players[p.position]=economy(p);const ships=state.players[p.position].ships;for(const ship of ships)ship.location='sol';
  if(i===0){ships[0].level=scenario.departure as 1|2|3;ships[0].location='a-1';if(scenario.remaining){state.players.p1.population--;ships.push({id:'p1-extra-ship',level:scenario.remaining as 1|2,location:'a-1'});}}
  else{ships[0].level=scenario.opponents[i-1] as 1|2;ships[0].location='a-1';}
 }
 state.players.p1.oreDiscs--;state.discovery.outposts['a-1']={owner:'p1',track:'ore'};state.discovery.queue=[{kind:'effect',responder:'p1',source:'spacetime-anomaly-studies',effect:{kind:'jump',amount:2}}];state.discovery.powers=Object.fromEntries(setup.players.map(p=>[p.position,{sol:0,'deep-space':0,'*':0}]));syncFleetPowers(setup,state);
 const before=structuredClone(state),discs=state.players.p1.oreDiscs,ore=state.players.p1.ore;
 expect(outpostInspection(projectGame(setup,state),'a-1').rows.map(r=>r.before)).toEqual([3,...scenario.opponents]);expect(state.discovery.outposts['a-1'].owner).toBe('p1');
 state=applyTurn(setup,JSON.parse(JSON.stringify(state)),'p1',{kind:'discovery-choice',at:state.discovery.cursor,option:'jump',legs:[{ship:state.players.p1.ships[0].id,index:0,path:['a-1','sol']}]},seed);
 // Persist/reload before every automatic continuation; complete endpoints first.
 for(let n=0;n<30&&canAdvanceDiscovery(projectGame(setup,state));n++){const step=state.discovery!.queue[0];state=applyTurn(setup,JSON.parse(JSON.stringify(state)),step.responder,{kind:'discovery-advance',at:state.discovery!.cursor},seed);}
 expect(outpostInspection(projectGame(setup,state),'a-1').rows.map(r=>r.before)).toEqual([scenario.remaining,...scenario.opponents]);
 if(scenario.owner)expect(state.discovery!.outposts['a-1']?.owner).toBe(scenario.owner);else expect(state.discovery!.outposts['a-1']).toBeUndefined();expect(state.players.p1.oreDiscs).toBe(discs+(scenario.owner==='p1'?0:1));expect(state.players.p1.ore).toBe(ore);expect(before.discovery!.outposts['a-1'].owner).toBe('p1');
 expect(state.players.p1.ships[0].location).toBe('sol');
 for(const p of Object.values(state.players))expect(p.supply.reduce((a,b)=>a+b,0)+p.population+p.ships.length+p.research.length).toBe(20);
});

test('incoming0→2 against incumbent2 remains distinct from incumbent withdrawal',()=>{
 const setup=startingSetup({version:'basic-2020-v1',seed},[{position:'p1',name:'Ada',faction:'nishida'},{position:'p2',name:'Bora',faction:'zheng'}],{factions:'basic',achievements:'introductory'});
 let state=initialPlay(setup);state.phase='discovery';state.discovery=initialDiscovery(seed,2,0);
 for(const p of setup.players){state.players[p.position]=economy(p);state.players[p.position].ships[0].level=2;state.players[p.position].ships[0].location=p.position==='p1'?'a-1':'sol';}
 state.players.p1.oreDiscs--;state.discovery.outposts['a-1']={owner:'p1',track:'ore'};state.discovery.queue=[{kind:'effect',responder:'p2',source:'spacetime-anomaly-studies',effect:{kind:'jump',amount:2}}];state.discovery.powers=Object.fromEntries(setup.players.map(p=>[p.position,{sol:0,'deep-space':0,'*':0}]));syncFleetPowers(setup,state);
 expect(outpostInspection(projectGame(setup,state),'a-1').rows.map(r=>r.before)).toEqual([2,0]);const ore=state.players.p1.ore,discs=state.players.p1.oreDiscs;
 state=applyTurn(setup,JSON.parse(JSON.stringify(state)),'p2',{kind:'discovery-choice',at:state.discovery.cursor,option:'jump',legs:[{ship:state.players.p2.ships[0].id,index:0,path:['sol','a-1']}]},seed);
 for(let n=0;n<30&&canAdvanceDiscovery(projectGame(setup,state));n++)state=applyTurn(setup,JSON.parse(JSON.stringify(state)),state.discovery!.queue[0].responder,{kind:'discovery-advance',at:state.discovery!.cursor},seed);
 expect(outpostInspection(projectGame(setup,state),'a-1')).toMatchObject({reason:'incumbent-tie',owner:{position:'p1'}});expect(state.players.p1.oreDiscs).toBe(discs);expect(state.players.p1.ore).toBe(ore);expect(state.discovery!.queue.some(q=>q.kind==='gain-bonus')).toBe(false);
});
