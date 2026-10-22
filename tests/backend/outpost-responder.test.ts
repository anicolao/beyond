import {test,expect} from 'bun:test';
import {startingSetup} from '../../src/lib/game/setup';
import {initialDiscovery} from '../../src/lib/game/discovery';
import {initialPlay,economy,applyTurn,projectGame} from '../../src/lib/game/turn';
import {canAdvanceDiscovery,gainBonusChoices} from '../../src/lib/game/discovery-resolution';
const seed='55555555-5555-4555-8555-000000000002';
function pending(){
 const setup=startingSetup({version:'basic-2020-v1',seed},[{position:'p1',name:'Ada',faction:'nishida'},{position:'p2',name:'Bora',faction:'zheng'}],{factions:'basic',achievements:'introductory'});
 const state=initialPlay(setup);state.phase='discovery';state.discovery=initialDiscovery(seed,2,0);
 for(const p of setup.players)state.players[p.position]=economy(p);
 return {setup,state};
}
// Canonical saved-continuation fixtures, not claims of ordinary UI reachability.
test('an off-turn specialty choice belongs to the gaining faction and survives JSON without advancing the active turn',()=>{
 const {setup,state}=pending();state.discovery!.queue=[{kind:'control',responder:'p2',location:'shipyard-north',source:'Decommission'}];
 const command={kind:'discovery-choice' as const,at:state.discovery!.cursor,option:'food'},before=structuredClone(state),disc=state.players.p2.foodDiscs;
 expect(state.activePosition).toBe('p1');expect(canAdvanceDiscovery(projectGame(setup,state))).toBe(false);
 expect(()=>applyTurn(setup,state,'p1',command,seed)).toThrow('another responding faction');expect(state).toEqual(before);
 const saved=applyTurn(setup,JSON.parse(JSON.stringify(state)),'p2',command,seed);
 expect(saved.discovery!.outposts['shipyard-north']).toEqual({owner:'p2',track:'food'});expect(saved.players.p2.foodDiscs).toBe(disc-1);expect(saved.activePosition).toBe('p1');
 expect(()=>applyTurn(setup,saved,'p2',command,seed)).toThrow();expect(state).toEqual(before);
});
test('multiple gained bonuses remain an explicit owner-only ordering choice and the chosen bonus cannot replay',()=>{
 const {setup,state}=pending();expect(setup.systems.find(s=>s.slot==='a-1')?.card).toBe('sirius');expect(setup.systems.find(s=>s.slot==='b-1')?.card).toBe('ad-leonis');
 state.discovery!.queue=[{kind:'gain-bonus',responder:'p2',location:'a-1',source:'sirius'},{kind:'gain-bonus',responder:'p2',location:'b-1',source:'ad-leonis'}];
 const before=structuredClone(state),ore=state.players.p2.ore,choice={kind:'discovery-choice' as const,at:0,option:'a-1'};
 expect(canAdvanceDiscovery(projectGame(setup,state))).toBe(false);expect(gainBonusChoices(state.discovery!,'p2').map(c=>c.location)).toEqual(['a-1','b-1']);expect(gainBonusChoices(state.discovery!,'p1')).toEqual([]);
 expect(()=>applyTurn(setup,state,'p1',choice,seed)).toThrow('another responding faction');expect(()=>applyTurn(setup,state,'p2',{...choice,option:'shipyard-north'},seed)).toThrow('pending gain-control bonuses');expect(state).toEqual(before);
 const chosen=applyTurn(setup,JSON.parse(JSON.stringify(state)),'p2',choice,seed);
 expect(chosen.discovery!.queue[0]).toMatchObject({kind:'effect',responder:'p2',source:'sirius',effect:{kind:'ore',amount:1}});
 expect(chosen.discovery!.queue.filter(q=>q.kind==='gain-bonus').map(q=>q.location)).toEqual(['b-1']);
 const paid=applyTurn(setup,JSON.parse(JSON.stringify(chosen)),'p2',{kind:'discovery-advance',at:chosen.discovery!.cursor},seed);
 expect(paid.players.p2.ore).toBe(ore+1);expect(paid.activePosition).toBe('p1');expect(()=>applyTurn(setup,paid,'p2',choice,seed)).toThrow('already changed');expect(paid.players.p2.ore).toBe(ore+1);expect(state).toEqual(before);
});
