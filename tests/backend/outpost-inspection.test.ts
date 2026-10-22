import {test,expect} from 'bun:test';
import {startingSetup} from '../../src/lib/game/setup';
import {initialDiscovery,publicDiscovery} from '../../src/lib/game/discovery';
import {outpostInspection} from '../../src/lib/game/outpost-inspection';
const seed='55555555-5555-4555-8555-000000000002';
function setup(count:2|3=2){
 const game=startingSetup({version:'basic-2020-v1',seed},[{position:'p1',name:'Ada',faction:'nishida' as const},{position:'p2',name:'Bora',faction:'zheng' as const},{position:'p3',name:'Cleo',faction:'united-nations' as const}].slice(0,count),{factions:'basic',achievements:'introductory'});
 game.discovery=publicDiscovery(initialDiscovery(seed,count,0));return game;
}
test('a tied incoming fleet retains the actual incumbent and inspection changes nothing',()=>{
 const game=setup();game.players[0].ships=[{id:'ada',level:2,location:'a-1'}];game.players[1].ships=[{id:'bora',level:2,location:'a-1'}];game.discovery!.outposts['a-1']={owner:'p1',track:'food'};game.players[0].foodDiscs--;
 const before=structuredClone(game),view=outpostInspection(game,'a-1');expect(view.reason).toBe('incumbent-tie');expect(view.comparisonOwner).toBe('p1');expect(view.rows.map(p=>p.before)).toEqual([2,2]);expect(view.explanation).toContain('retains control on a tie');expect(game).toEqual(before);
});
test('a stronger rival is a pending comparison, never a fabricated disc or production payout',()=>{
 const game=setup();game.players[0].ships=[{id:'ada',level:2,location:'a-1'}];game.players[1].ships=[{id:'bora',level:3,location:'a-1'}];game.discovery!.outposts['a-1']={owner:'p1',track:'ore'};game.discovery!.queue=[{kind:'control-check',responder:'p2',location:'a-1',source:'Jump'}];
 const before=structuredClone(game),view=outpostInspection(game,'a-1');expect(view.reason).toBe('transfer');expect(view.pendingResolution).toBe(true);expect(view.owner?.position).toBe('p1');expect(view.comparisonOwner).toBe('p2');expect(view.outpost?.track).toBe('ore');expect(game).toEqual(before);
});
test('empty retained outposts and withdrawal ties remain inspectable without owned ships',()=>{
 const game=setup(3);for(const p of game.players)p.ships=[];game.discovery!.outposts['a-1']={owner:'p1',track:'food',placeholder:true};game.players[0].foodDiscs=0;
 expect(outpostInspection(game,'a-1')).toMatchObject({reason:'empty-retained',comparisonOwner:'p1',outpost:{placeholder:true}});
 game.players[1].ships=[{id:'bora',level:2,location:'a-1'}];game.players[2].ships=[{id:'cleo',level:2,location:'a-1'}];const before=structuredClone(game),view=outpostInspection(game,'a-1');expect(view.reason).toBe('rival-tie');expect(view.comparisonOwner).toBeUndefined();expect(view.owner?.name).toBe('Ada');expect(game).toEqual(before);
});
test('only already public locations are accepted; Sol has no control disc',()=>{
 const game=setup();expect(outpostInspection(game,'sol').reason).toBe('uncontrollable');expect(()=>outpostInspection(game,'future-deck-card')).toThrow('public exploration');
});
