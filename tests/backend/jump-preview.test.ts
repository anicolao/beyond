import {test,expect} from 'bun:test';
import {startingSetup} from '../../src/lib/game/setup';
import {initialDiscovery} from '../../src/lib/game/discovery';
import {jumpPreview,cycleRouteShipId} from '../../src/lib/game/jump-preview';
const seed='11111111-1111-4111-8111-000000000007';
function setup(){const game=startingSetup({version:'basic-2020-v1',seed},[{position:'p1',name:'Ada',faction:'nishida'},{position:'p2',name:'Bora',faction:'zheng'}],{factions:'basic',achievements:'introductory'});game.discovery={...initialDiscovery(seed,2,0),powerReady:false,powerPositions:[]} as any;return game;}
test('split routes share one allowance and preview final endpoints only without changing game state',()=>{
 const game=setup();game.players[0].ships=[{id:'one',level:2,location:'sol'},{id:'two',level:1,location:'sol'}];const before=structuredClone(game);
 const p=jumpPreview(game,'p1',3,[{ship:'one',index:0,path:['sol','a-1','deep-space']},{ship:'two',index:1,path:['sol','a-1']}]);
 expect(p.reason).toBe('');expect(p.spent).toBe(3);expect(p.remaining).toBe(0);expect(p.locations.map(l=>l.location)).toEqual(['sol','deep-space','a-1']);expect(p.ships.map(s=>s.location)).toEqual(['deep-space','a-1']);expect(game).toEqual(before);
 const through=jumpPreview(game,'p1',3,[{ship:'one',index:0,path:['sol','a-1','deep-space']}]);expect(through.locations.map(l=>l.location)).not.toContain('a-1');expect(through.remaining).toBe(1);
});
test('final power retains incumbent ties and an empty outpost, with no transient route control',()=>{
 const game=setup();game.players[0].ships=[{id:'one',level:2,location:'a-1'}];game.players[1].ships=[{id:'rival',level:2,location:'b-1'}];game.discovery!.outposts['a-1']={owner:'p1',track:'food'};game.discovery!.outposts['b-1']={owner:'p2',track:'ore'};
 const p=jumpPreview(game,'p1',2,[{ship:'one',index:0,path:['a-1','deep-space','b-1']}]);expect(p.locations.find(l=>l.location==='a-1')).toMatchObject({afterOwner:'p1',controlChanges:false});expect(p.locations.find(l=>l.location==='b-1')).toMatchObject({afterOwner:'p2',controlChanges:false});expect(p.locations.some(l=>l.location==='deep-space')).toBe(false);
});
test('read-only projections reject duplicate, foreign, disconnected and over-budget routes',()=>{
 const game=setup(),s=game.players[0].ships[0],leg={ship:s.id,index:0,path:['sol','a-1']};
 expect(jumpPreview(game,'p1',2,[leg,leg]).reason).toContain('once');expect(jumpPreview(game,'p1',2,[{...leg,ship:'foreign'}]).reason).toContain('owned');expect(jumpPreview(game,'p1',2,[{...leg,path:['sol','b-1']}]).reason).toContain('connected');expect(jumpPreview(game,'p1',0,[leg]).reason).toContain('allowance');
});
test('solar payment counts final incoming ships and never charges for a pass-through',()=>{
 const game=setup(),s=game.players[0].ships[0];game.discovery!.events.push({id:'erratic-solar-activity',slot:'II-1',target:'a-1',resolved:true});game.players[0].ore=0;
 expect(jumpPreview(game,'p1',2,[{ship:s.id,index:0,path:['sol','a-1']}])).toMatchObject({ore:1,reason:'Need Ore for each ship ending at the solar Event.'});expect(jumpPreview(game,'p1',2,[{ship:s.id,index:0,path:['sol','a-1','deep-space']}])).toMatchObject({ore:0,reason:''});
});
test('withdrawal preview returns control to no faction when remaining rivals tie, without applying disc effects',()=>{
 const game=startingSetup({version:'basic-2020-v1',seed},[{position:'p1',name:'Ada',faction:'nishida'},{position:'p2',name:'Bora',faction:'zheng'},{position:'p3',name:'Cleo',faction:'disciples'}],{factions:'basic',achievements:'introductory'});game.discovery={...initialDiscovery(seed,3,0),powerReady:false,powerPositions:[]} as any;
 game.players[0].ships=[{id:'one',level:3,location:'a-1'}];game.players[1].ships=[{id:'two',level:2,location:'a-1'}];game.players[2].ships=[{id:'three',level:2,location:'a-1'}];game.discovery!.outposts['a-1']={owner:'p1',track:'food'};const before=structuredClone(game);
 const p=jumpPreview(game,'p1',1,[{ship:'one',index:0,path:['a-1','deep-space']}]);expect(p.locations.find(l=>l.location==='a-1')).toMatchObject({beforeOwner:'p1',afterOwner:undefined,controlChanges:true,beforeTrack:'food'});expect(game).toEqual(before);
});
test('only already public Rift attachments add routes; printed Luyten entry restriction is retained',()=>{
 const game=setup(),s=game.players[0].ships[0];s.location='deep-space';game.discovery!.systems.push({slot:'rift-1',card:'luytens-star',parent:'deep-space'});
 const route=[{ship:s.id,index:0,path:['deep-space','rift-1']}];expect(jumpPreview(game,'p1',1,route).reason).toContain('Level III');game.discovery!.systems[0].card='barnards-star';const p=jumpPreview(game,'p1',1,route);expect(p.reason).toBe('');expect(p.locations.find(l=>l.location==='rift-1')?.title).toBe('Barnard’s Star');expect(p.locations.find(l=>l.location==='rift-1')?.gainBonus).toBe('Convert 1 Supply to Population.');
});

import {applyTurn} from '../../src/lib/game/turn';
for(const count of [2,3,4] as const)test(`opening ${count}-player simultaneous jump control reads untouched rivals without persisting their economies`,()=>{
 const players=[{position:'p1',name:'Ada',faction:'nishida' as const},{position:'p2',name:'Bora',faction:'zheng' as const},{position:'p3',name:'Cleo',faction:'united-nations' as const},{position:'p4',name:'Dara',faction:'disciples' as const}].slice(0,count);
 const game=startingSetup({version:'basic-2020-v1',seed},players,{factions:'basic',achievements:'introductory'});
 let state=applyTurn(game,undefined,'p1',{kind:'prepare-discovery'},seed);
 for(const p of game.players)state=applyTurn(game,state,'p1',{kind:'prepare-fleet-power',position:p.position},seed);
 state=applyTurn(game,state,'p1',{kind:'build-jump',space:0,build:true,destination:'sol'},seed);
 state=applyTurn(game,state,'p1',{kind:'discovery-advance',at:state.discovery!.cursor},seed);
 state=applyTurn(game,state,'p1',{kind:'discovery-choice',at:state.discovery!.cursor,option:'jump',legs:state.players.p1.ships.map((ship,index)=>({ship:ship.id,index,path:['sol','a-1']}))},seed);
 for(let i=0;i<10&&state.discovery!.queue[0].kind!=='control-check';i++)state=applyTurn(game,state,'p1',{kind:'discovery-advance',at:state.discovery!.cursor},seed);
 expect(state.discovery!.queue[0].kind).toBe('control-check');
 const rivals=structuredClone(game.players.slice(1));state=applyTurn(game,state,'p1',{kind:'discovery-advance',at:state.discovery!.cursor},seed);
 expect(Object.keys(state.players)).toEqual(['p1']);expect(game.players.slice(1)).toEqual(rivals);
 expect(state.discovery!.queue[0]).toMatchObject({kind:'control',responder:'p1',location:'a-1'});
});

test('an empty fleet can preview optional no movement without inventing ships or endpoint effects',()=>{
 const game=setup();game.players[0].ships=[];const before=structuredClone(game);
 expect(jumpPreview(game,'p1',2,[])).toMatchObject({reason:'',spent:0,remaining:2,ore:0,moved:false,ships:[],locations:[]});
 expect(game).toEqual(before);
});

import {canAdvanceDiscovery,respondToDiscovery,applyAutomaticDiscovery} from '../../src/lib/game/discovery-resolution';
import {initialPlay} from '../../src/lib/game/turn';
import {economy} from '../../src/lib/game/turn';
import {projectGame} from '../../src/lib/game/turn';
test('empty optional jump keeps canonical automatic pass while required movement cannot pass',()=>{
 const game=setup(),state=initialPlay(game);state.players.p1=economy(game.players[0]);state.players.p1.ships=[];state.players.p1.population++;
 state.discovery=initialDiscovery(seed,2,0);state.phase='discovery';state.discovery.queue=[{kind:'effect',responder:'p1',source:'basic-spacefaring',effect:{kind:'jump',amount:2}},{kind:'resume',responder:'p1',returnTo:'production'}];
 const projected=projectGame(game,state);expect(canAdvanceDiscovery(projected)).toBe(true);
 const required=structuredClone(state);(required.discovery!.queue[0] as any).effect.required=true;
 expect(canAdvanceDiscovery(projectGame(game,required))).toBe(false);
 expect(()=>respondToDiscovery(game,required,'p1',{kind:'discovery-choice',at:0,option:'jump',legs:[]})).toThrow('different location');
 applyAutomaticDiscovery(game,state,projected,'p1',state.discovery!.cursor);expect(state.players.p1.ships).toEqual([]);expect(state.discovery!.queue[0].kind).toBe('resume');const completed=applyAutomaticDiscovery(game,state,projectGame(game,state),'p1',state.discovery!.cursor);expect(completed.phase).toBe('production');expect(state.discovery!.queue).toEqual([]);
});

test('route-reader navigation safely handles empty and single fleets and wraps real ship identities',()=>{
 for(const direction of [-1,1] as const){expect(cycleRouteShipId([],'',direction)).toBe('');expect(cycleRouteShipId([],'removed-ship',direction)).toBe('');expect(cycleRouteShipId([{id:'only'}],'only',direction)).toBe('only');}
 const ships=[{id:'one'},{id:'two'},{id:'three'}];expect(cycleRouteShipId(ships,'one',-1)).toBe('three');expect(cycleRouteShipId(ships,'three',1)).toBe('one');expect(cycleRouteShipId(ships,'one',1)).toBe('two');expect(ships).toEqual([{id:'one'},{id:'two'},{id:'three'}]);
});
