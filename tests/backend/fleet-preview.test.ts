import {test,expect} from 'bun:test';
import {startingSetup} from '../../src/lib/game/setup';
import {fleetBuildPreview,fleetUpgradePreview} from '../../src/lib/game/fleet-preview';
import {initialDiscovery} from '../../src/lib/game/discovery';
import {applyTurn,projectGame} from '../../src/lib/game/turn';
import {basicFleetBlocker} from '../../src/lib/game/basic-fleet-action';
const seed='11111111-1111-4111-8111-000000000007';
function setup(){return startingSetup({version:'basic-2020-v1',seed},[{position:'p1',name:'Ada',faction:'nishida'},{position:'p2',name:'Bora',faction:'zheng'}],{factions:'basic',achievements:'introductory'});}
test('fleet preview respects the printed cube source and controlled shipyards without altering public state',()=>{
 const game=setup();game.discovery={...initialDiscovery(seed,2,0),powerReady:false,powerPositions:[]} as any;game.discovery!.outposts['shipyard-north']={owner:'p2',track:'ore'};
 const before=structuredClone(game),supply=fleetBuildPreview(game,'p1',{kind:'ship',level:3},'sol');
 expect(supply.source.label).toBe('Supply A');expect(supply.source.before-supply.source.after).toBe(1);expect(supply.locations).toEqual(['sol']);expect(supply.power.powers[0]).toMatchObject({before:1,after:4});
 expect(fleetBuildPreview(game,'p1',{kind:'ship',level:3},'shipyard-north').reason).toContain('controlled shipyard');
 const population=fleetBuildPreview(game,'p1',{kind:'ship',level:2,cube:'population'},'sol');expect(population.source.kind).toBe('population');expect(population.source.before).toBe(2);expect(game).toEqual(before);
});
test('exhausted Supply requires an explicit available-Population substitution; Population cannot replace available Supply',()=>{
 const game=setup(),p=game.players[0];expect(fleetBuildPreview(game,'p1',{kind:'ship',level:1},'sol',true).reason).toContain('required Supply');p.supply=[0,0,0,0,0];
 expect(fleetBuildPreview(game,'p1',{kind:'ship',level:1},'sol').reason).toContain('explicitly choose');const chosen=fleetBuildPreview(game,'p1',{kind:'ship',level:1},'sol',true);expect(chosen.reason).toBe('');expect(chosen.source.kind).toBe('population');p.population=0;expect(fleetBuildPreview(game,'p1',{kind:'ship',level:1},'sol',true).reason).toContain('No available Population');
});
test('upgrade inspection caps at4, selects each owned ship once and previews a control-changing power increase',()=>{
 const game=setup();game.discovery={...initialDiscovery(seed,2,0),powerReady:false,powerPositions:[]} as any;game.players[0].ships[0]={id:'ada',level:2,location:'a-1'};game.players[1].ships=[{id:'bora',level:2,location:'a-1'}];game.discovery!.outposts['a-1']={owner:'p2',track:'food'};
 const before=structuredClone(game),result=fleetUpgradePreview(game,'p1',{kind:'upgrade',levels:3,ships:1},['ada']);expect(result.reason).toBe('');expect(result.ships[0].after).toBe(4);expect(result.locations[0]).toMatchObject({beforeOwner:'p2',afterOwner:'p1',controlChanges:true});expect(game).toEqual(before);
 expect(fleetUpgradePreview(game,'p1',{kind:'upgrade',levels:1,ships:2},['ada','ada']).reason).toContain('only once');expect(fleetUpgradePreview(game,'p1',{kind:'upgrade',levels:1,ships:1},['bora']).reason).toContain('owned');
 game.players[0].ships[0].level=4;expect(fleetUpgradePreview(game,'p1',{kind:'upgrade',levels:1,ships:1},[]).required).toBe(0);
});
test('a tied upgraded fleet does not displace an incumbent and location-restricted upgrades reject a remote ship',()=>{
 const game=setup();game.discovery={...initialDiscovery(seed,2,0),powerReady:false,powerPositions:[]} as any;game.players[0].ships[0]={id:'ada',level:1,location:'a-1'};game.players[1].ships=[{id:'bora',level:2,location:'a-1'}];game.discovery!.outposts['a-1']={owner:'p2',track:'food'};
 expect(fleetUpgradePreview(game,'p1',{kind:'upgrade',levels:1,ships:1},['ada']).locations[0]).toMatchObject({afterOwner:'p2',controlChanges:false});expect(fleetUpgradePreview(game,'p1',{kind:'upgrade',levels:1,ships:1,location:'b-1'},['ada']).reason).toContain('eligible');
});
test('Basic build is legal on the actual first turn, uses Population and persists before the existing optional jump',()=>{
 const game=setup();let state=applyTurn(game,undefined,'p1',{kind:'prepare-discovery'},seed);
 expect(state.players).toEqual({});for(const p of game.players)state=applyTurn(game,state,'p1',{kind:'prepare-fleet-power',position:p.position},seed);expect(state.players).toEqual({});
 state=applyTurn(game,state,'p1',{kind:'build-jump',space:1,build:true,destination:'sol'},seed);expect(state.players.p1.population).toBe(2);expect(state.players.p1.ore).toBe(2);expect(state.phase).toBe('discovery');
 state=applyTurn(game,state,'p1',{kind:'discovery-advance',at:state.discovery!.cursor},seed);expect(state.players.p1.population).toBe(1);expect(state.players.p1.ships).toHaveLength(2);expect(state.players.p1.ships[1]).toMatchObject({level:1,location:'sol'});expect(state.discovery!.queue[0]).toMatchObject({kind:'effect',effect:{kind:'jump',amount:2}});
 expect(()=>applyTurn(game,state,'p1',{kind:'discovery-advance',at:0},seed)).toThrow();state=JSON.parse(JSON.stringify(state));state=applyTurn(game,state,'p1',{kind:'discovery-choice',at:state.discovery!.cursor,option:'jump',legs:[]},seed);while(state.phase==='discovery')state=applyTurn(game,state,'p1',{kind:'discovery-advance',at:state.discovery!.cursor},seed);expect(state.phase).toBe('production');expect(state.players.p1.population).toBe(1);
 expect(basicFleetBlocker({...projectGame(game,state),phase:'action'},1,true,'sol')).toContain('different Action space');
});
