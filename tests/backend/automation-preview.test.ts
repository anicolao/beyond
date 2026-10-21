import {test,expect} from 'bun:test';
import {automationScore} from '../../src/lib/game/automation-scoring';
import {automationPreview} from '../../src/lib/game/automation-preview';
import {automate} from '../../src/lib/game/discovery-economy';
import type {TurnPlayer} from '../../src/lib/game/turn';
const economy=():TurnPlayer=>({ore:1,population:2,supply:[5,4,3,3,2],foodDiscs:8,oreDiscs:8,automation:0,ships:[{id:'ship',level:1,location:'sol'}],actionLocation:null,research:[]});
test('automation exposes the next printed slot without paying production immediately',()=>{
 const p=economy(),copy=structuredClone(p);const preview=automationPreview(p,'food');
 expect(p).toEqual(copy);expect(preview.marker).toBe('production-disc');
 expect(preview.newlyExposed).toEqual([{position:1,letter:null}]);
 expect([preview.populationBefore,preview.populationAfter]).toEqual([1,1]);
 automate(p,'food');const second=automationPreview(p,'food');
 expect(second.newlyExposed).toEqual([{position:2,letter:'B'}]);
 expect([second.populationBefore,second.populationAfter]).toEqual([1,2]);
 expect(p.population).toBe(2);expect(p.ore).toBe(1);
 expect([preview.pointsBefore,preview.pointsAfter,second.pointsAfter]).toEqual([0,0,1]);
});
test('exposing an empty matching Supply column creates capacity without a cube',()=>{
 const p=economy();p.foodDiscs=7;p.supply[1]=0;
 const result=automationPreview(p,'food');expect(result.newlyExposed[0].letter).toBe('B');
 expect(result.populationAfter).toBe(1);expect(p.supply[1]).toBe(0);
});
test('exhausted track automation continues permanently with placeholders beyond seven',()=>{
 const p=economy();p.oreDiscs=0;p.automation=7;
 const result=automationPreview(p,'ore');expect(result.marker).toBe('placeholder');
 expect([result.oreBefore,result.oreAfter,result.additionalOverflowPoint]).toEqual([9,9,1]);
 for(let i=0;i<5;i++)automate(p,'ore');
 expect(p.automation).toBe(12);expect(p.oreDiscs).toBe(0);
 expect(automationScore(p.automation)).toBe(12);
 expect(automationPreview(p,'ore').beyondPrintedTrack).toBe(5);
 // Returning an outpost disc never removes a permanent automation level.
 p.oreDiscs++;expect(p.automation).toBe(12);
 expect(automationPreview(p,'ore').marker).toBe('production-disc');
 automate(p,'ore');expect(p.automation).toBe(13);expect(p.oreDiscs).toBe(0);
});

test('persisted mandatory automation advances once with an exhausted track and keeps production separate',async()=>{
 const {startingSetup}=await import('../../src/lib/game/setup');
 const {initialDiscovery}=await import('../../src/lib/game/discovery');
 const {applyTurn,economy:projectEconomy}=await import('../../src/lib/game/turn');
 const seed='11111111-1111-4111-8111-000000000007';
 const setup=startingSetup({version:'basic-2020-v1',seed},[{position:'p1',name:'Ada',faction:'nishida'},{position:'p2',name:'Bora',faction:'zheng'}],{factions:'basic',achievements:'introductory'});
 // Backend-only retained-state fixture, never a UI shortcut or live-state edit.
 const d=initialDiscovery(seed,2,4),p=projectEconomy(setup.players[0]);p.automation=7;p.foodDiscs=0;
 d.queue=[{kind:'effect',responder:'p1',source:'psionics-research',effect:{kind:'automate',track:'food'}},{kind:'resume',responder:'p1',returnTo:'production'}];
 const state:import('../../src/lib/game/turn').PlayState={turn:4,activePosition:'p1',phase:'discovery',players:{p1:p},discovery:d};
 const before=structuredClone(state),after=applyTurn(setup,state,'p1',{kind:'discovery-advance',at:0});
 expect(state).toEqual(before);expect(after.players.p1.automation).toBe(8);expect(after.players.p1.foodDiscs).toBe(0);
 expect(after.players.p1.population).toBe(p.population);expect(after.players.p1.ore).toBe(p.ore);expect(after.players.p1.supply).toEqual(p.supply);
 expect(()=>applyTurn(setup,after,'p1',{kind:'discovery-advance',at:0})).toThrow();
 expect(()=>applyTurn(setup,state,'p2',{kind:'discovery-advance',at:0})).toThrow();
 const retained=JSON.parse(JSON.stringify(after));
 const production=applyTurn(setup,retained,'p1',{kind:'discovery-advance',at:after.discovery!.cursor});
 expect(production.phase).toBe('production');expect(production.players.p1.automation).toBe(8);
 expect(production.players.p1.population).toBe(p.population);
});

test('automation scoring sums reached awards rather than scoring only the current position',()=>{
 // Printed positions award0,1,1,1,1,1,2; level7 therefore contributes7, not2.
 expect(Array.from({length:9},(_,level)=>automationScore(level))).toEqual([0,0,1,2,3,4,5,7,8]);
 const p=economy();p.automation=6;
 const next=automationPreview(p,'ore');expect([next.pointsBefore,next.pointsAfter]).toEqual([5,7]);
 expect(p.automation).toBe(6);expect(p.ore).toBe(1);
 // Losing an outpost can restore a production disc; it cannot lower this contribution.
 p.oreDiscs=3;const points=automationScore(p.automation);p.oreDiscs++;
 expect(automationScore(p.automation)).toBe(points);
});
