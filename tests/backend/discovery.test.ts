import {test,expect} from 'bun:test';
import {initialDiscovery,publicDiscovery,revealTwo,chooseFromRevealed,permittedTypes,levelTwoBlocker,levelTwoCost} from '../../src/lib/game/discovery';
import {canAdvanceDiscovery} from '../../src/lib/game/discovery-resolution';
import {startingSetup} from '../../src/lib/game/setup';
const seed='12345678-1234-4567-89ab-123456789abc';
const initial=()=>startingSetup({version:'basic-2020-v1',seed},[{position:'p1',name:'Ada',faction:'nishida'},{position:'p2',name:'Bora',faction:'zheng'}],{factions:'basic',achievements:'introductory'});
test('discovery reveals two incoming matches and leaves the untouched deck suffix in order',()=>{
 const deck=['intersystem-diplomacy','hypercomputing','plasma-cannon','psionics-research','android-surveyors','mass-cloning'];
 const drawn=revealTwo(deck,'Scientific');
 expect(drawn).toEqual({candidates:['hypercomputing','psionics-research'],revealed:deck.slice(0,4),remaining:deck.slice(4)});
 expect(deck).toEqual(['intersystem-diplomacy','hypercomputing','plasma-cannon','psionics-research','android-surveyors','mass-cloning']);
 const state=initialDiscovery(seed,2,2);state.deckII=[...drawn.remaining];state.records.push({slot:'II-2',event:'tyler-lee',type:'Scientific',revealed:drawn.revealed,candidates:drawn.candidates});
 const choice={kind:'candidate' as const,responder:'p1',slot:'II-2',cards:drawn.candidates,revealed:drawn.revealed,type:'Scientific' as const};
 chooseFromRevealed(state,choice,'hypercomputing');
 expect(state.deckII.slice(0,2)).toEqual(drawn.remaining);
 expect(new Set(state.deckII.slice(2))).toEqual(new Set(['intersystem-diplomacy','plasma-cannon','psionics-research']));
 expect(state.technologies).toEqual([{slot:'II-2',card:'hypercomputing'}]);
 expect(()=>chooseFromRevealed(state,choice,'mass-cloning')).toThrow('public candidates');
});
test('public continuation survives JSON replay without disclosing the future deck or random input',()=>{
 const state=initialDiscovery(seed,2,2);state.queue=[{kind:'event',event:'tyler-lee',responder:'p1',slot:'II-1'}];state.reservations=[{position:'p1',slot:'II-1'}];
 const visible=publicDiscovery({...JSON.parse(JSON.stringify(state)),futureDeck:['hidden-card']});
 expect(visible.queue).toEqual(state.queue);expect(visible.reservations).toEqual(state.reservations);
 expect('deckII' in visible).toBe(false);expect('seed' in visible).toBe(false);expect('futureDeck' in visible).toBe(false);
 expect(JSON.stringify(visible)).not.toContain('hypercomputing');
});
test('real prerequisite ownership, printed action surcharges and occupied spaces govern Level II planning',()=>{
 const game=initial(),actor=game.players[0];const slot='II-2';
 expect(levelTwoBlocker(game,0,slot)).toContain('first');
 actor.research=game.technologies.filter(t=>['I-1','I-2'].includes(t.slot)).map(t=>t.card);
 expect(permittedTypes(game,slot)).toHaveLength(2);
 expect(levelTwoBlocker(game,0,slot)).toBe('');expect(levelTwoCost(2,1,slot)).toBe(3);
 actor.actionLocation='research-II:0';expect(levelTwoBlocker(game,0,slot)).toContain('another action space');
 actor.actionLocation=null;actor.ore=2;expect(levelTwoBlocker(game,1,slot)).toContain('3 Ore');
 const state=initialDiscovery(seed,2,2);state.events.push({id:'research-tariffs',slot:'II-1',resolved:true,target:slot});expect(levelTwoCost(2,1,slot,state)).toBe(4);
});

test('discovery immediate/event manifests cover exactly all base Level II identities',async()=>{
 const {levelTwoBonuses,levelTwoEventKinds}=await import('../../src/lib/game/discovery-effects');
 const {technologyDecks,events}=await import('../../src/lib/game/manifest');
 expect(Object.keys(levelTwoBonuses).sort()).toEqual([...technologyDecks.II].sort());
 expect(Object.keys(levelTwoEventKinds).sort()).toEqual([...events.II.fixed,...events.II.random].sort());
 // These cards have Action boxes but no IMMEDIATE box; discovery grants no free action.
 expect(levelTwoBonuses['multi-colony-symposium']).toEqual([]);
 expect(levelTwoBonuses['modular-fleet']).toEqual([]);
 expect(levelTwoBonuses['terranova-cruisers']).toEqual([]);
 expect(levelTwoBonuses['android-destroyers']).toEqual([{kind:'ship',level:3,side:'right'}]);
});

test('ordinary preparatory turns commit Population before the Event, retain candidates on reload and resume production exactly once',async()=>{
 const {applyTurn,projectGame}=await import('../../src/lib/game/turn');
 const setup=startingSetup({version:'basic-2020-v1',seed:'11111111-1111-4111-8111-000000000007'},[{position:'p1',name:'Ada',faction:'nishida'},{position:'p2',name:'Bora',faction:'zheng'}],{factions:'basic',achievements:'introductory'});
 const input='11111111-1111-4111-8111-000000000007';let state:import('../../src/lib/game/turn').PlayState|undefined;
 const move=(position:string,command:any)=>{state=applyTurn(setup,state,position,{...command,...(command.kind==='discovery-choice'?{at:state?.discovery?.cursor}: {})},input);for(let i=0;i<100&&canAdvanceDiscovery(projectGame(setup,state));i++)state=applyTurn(setup,state,state.discovery!.queue[0].responder,{kind:'discovery-advance',at:state.discovery!.cursor},input);return state;};
 move('p1',{kind:'research-I',space:0,card:'advanced-robotics'});move('p1',{kind:'ore'});move('p1',{kind:'end-turn'});
 move('p2',{kind:'research-I',space:1,card:'advanced-genetics'});move('p2',{kind:'grow'});move('p2',{kind:'end-turn'});
 move('p1',{kind:'prepare-discovery'});move('p1',{kind:'prepare-fleet-power',position:'p1'});move('p1',{kind:'prepare-fleet-power',position:'p2'});move('p1',{kind:'research-II',space:0,slot:'II-3'});
 expect(state!.phase).toBe('discovery');expect(state!.players.p1.ore).toBe(4);expect(state!.players.p1.research).toEqual(['advanced-robotics']);
 expect(state!.players.p1.reservedResearch).toEqual(['II-3']);expect(state!.players.p1.population).toBe(1); // Maya has already converted its Supply.
 expect(state!.discovery!.queue[0]).toMatchObject({kind:'event',event:'maya-chaturvedi',stage:'guild'});
 expect(()=>move('p2',{kind:'discovery-choice',option:'professors-guild'})).toThrow('another responding faction');
 state=JSON.parse(JSON.stringify(state));move('p1',{kind:'discovery-choice',option:'professors-guild'});
 expect(state!.discovery!.queue[0]).toMatchObject({kind:'candidate',cards:['hypercomputing','multi-colony-symposium']});
 const publicState=projectGame(setup,state);expect(publicState.discovery!.events[0].resolved).toBe(true);expect('deckII' in publicState.discovery!).toBe(false);
 state=JSON.parse(JSON.stringify(state));move('p1',{kind:'discovery-choice',option:'hypercomputing'});
 expect(state!.phase).toBe('production');expect(state!.players.p1.reservedResearch).toBeUndefined();expect(state!.players.p1.research).toEqual(['advanced-robotics','hypercomputing']);
 expect(state!.players.p1.ore).toBe(4);expect(state!.players.p1.oreDiscs).toBe(6);expect(state!.discovery!.deckII).toHaveLength(15);
 expect(()=>move('p1',{kind:'discovery-choice',option:'hypercomputing'})).toThrow('no pending');
 expect(()=>move('p1',{kind:'research-II',space:1,slot:'II-3'})).toThrow('mandatory choice');
});

test('repeatable Gather is real preparation and frees the previous pawn space without creating a pass action',async()=>{
 const {applyTurn}=await import('../../src/lib/game/turn');const setup=initial();
 let state=applyTurn(setup,undefined,'p1',{kind:'gather'});expect(state.players.p1.population).toBe(3);expect(state.players.p1.ore).toBe(4);
 expect(state.players.p1.actionLocation).toBe('supply-population:0');expect(state.phase).toBe('production');
 state=applyTurn(setup,state,'p1',{kind:'ore'});state=applyTurn(setup,state,'p1',{kind:'end-turn'});
 expect(()=>applyTurn(setup,state,'p2',{kind:'gather'})).toThrow('Occupied by Ada');
 state=applyTurn(setup,state,'p2',{kind:'research-I',space:0,card:'advanced-genetics'});state=applyTurn(setup,state,'p2',{kind:'ore'});state=applyTurn(setup,state,'p2',{kind:'end-turn'});
 state=applyTurn(setup,state,'p1',{kind:'gather'});expect(state.players.p1.population).toBe(4);expect(state.players.p1.ore).toBe(6);
});

// Deliberately constructed integration states cover rare immediate/Event effects;
// ordinary setup/preparatory user journeys remain separate browser evidence.
import {initialPlay,economy,applyTurn,projectGame,type PlayState} from '../../src/lib/game/turn';
import type {DiscoveryChoice} from '../../src/lib/game/discovery';
import {syncFleetPowers} from '../../src/lib/game/discovery-economy';
function pending(choice:DiscoveryChoice){const setup=initial(),state=initialPlay(setup);state.phase='discovery';state.players=Object.fromEntries(setup.players.map(p=>[p.position,economy(p)]));state.discovery=initialDiscovery(seed,2,0);state.discovery.queue=[choice];state.discovery.powers=Object.fromEntries(setup.players.map(p=>[p.position,{sol:0,'deep-space':0,'*':0}]));syncFleetPowers(setup,state);return {setup,state};}
function drain(setup:ReturnType<typeof initial>,before:PlayState){let state=before;for(let i=0;i<100&&canAdvanceDiscovery(projectGame(setup,state));i++)state=applyTurn(setup,state,state.discovery!.queue[0].responder,{kind:'discovery-advance',at:state.discovery!.cursor},seed);return state;}
function reply(setup:ReturnType<typeof initial>,state:PlayState,option:string,extra:Record<string,unknown>={}){return drain(setup,applyTurn(setup,state,state.discovery!.queue[0].responder,{kind:'discovery-choice',at:state.discovery!.cursor,option,...extra},seed));}

test('integration: persistent cursor rejects stale or foreign automatic responses without mutating the original',()=>{
 const {setup,state}=pending({kind:'effect',responder:'p2',source:'hypercomputing',effect:{kind:'automate',track:'ore'}}),before=JSON.stringify(state);
 expect(()=>applyTurn(setup,state,'p1',{kind:'discovery-advance',at:0},seed)).toThrow('another faction');
 expect(()=>applyTurn(setup,state,'p2',{kind:'discovery-advance',at:1},seed)).toThrow('already changed');
 const after=applyTurn(setup,state,'p2',{kind:'discovery-advance',at:0},seed);expect(after.players.p2.oreDiscs).toBe(7);expect(after.discovery!.cursor).toBe(1);
 expect(JSON.stringify(state)).toBe(before);
});
test('integration: Human Experiments supports zero, one or two distinct upgrades and preserves explicit choice',()=>{
 const {setup,state}=pending({kind:'effect',responder:'p2',source:'human-experiments',effect:{kind:'upgrade',levels:1,ships:2,optional:true}});
 expect(canAdvanceDiscovery(projectGame(setup,state))).toBe(false);
 expect(reply(setup,state,'upgrade',{ships:[]}).players.p2.ships.map(s=>s.level)).toEqual([1,1]);
 expect(reply(setup,state,'upgrade',{ships:['p2-ship-2']}).players.p2.ships.map(s=>s.level)).toEqual([1,2]);
 expect(reply(setup,state,'upgrade',{ships:['p2-ship-1','p2-ship-2']}).players.p2.ships.map(s=>s.level)).toEqual([2,2]);
 expect(()=>reply(setup,state,'upgrade',{ships:['p2-ship-1','p2-ship-1']})).toThrow('distinct ships');
});
test('integration: Android Destroyers draws rightmost Supply and ship choice survives a serialized queue',()=>{
 const {setup,state}=pending({kind:'effect',responder:'p1',source:'android-destroyers',effect:{kind:'ship',level:3,side:'right'}});
 const after=reply(setup,JSON.parse(JSON.stringify(state)),'build',{destination:'sol'});
 expect(after.players.p1.supply).toEqual([5,4,3,3,1]);expect(after.players.p1.ships.at(-1)).toMatchObject({level:3,location:'sol'});
 expect(()=>reply(setup,state,'build',{destination:'shipyard-north'})).toThrow('permitted shipyard');
});
test('integration: Economic Boom persists separate faction responses and cannot be answered by the revealer for another identity',()=>{
 const {setup,state}=pending({kind:'event',responder:'p1',event:'economic-boom',slot:'II-1'});state.discovery!.events.push({id:'economic-boom',slot:'II-1',resolved:false});
 let after=drain(setup,state);after=reply(setup,after,'exchange');expect(after.discovery!.queue[0]).toMatchObject({kind:'event',responder:'p1',value:'exchange'});
 after=reply(setup,after,'exchange');expect(after.players.p1.population).toBe(1);expect(after.players.p1.ore).toBe(5);expect(after.discovery!.queue[0].responder).toBe('p2');
 expect(()=>applyTurn(setup,after,'p1',{kind:'discovery-choice',at:after.discovery!.cursor,option:'exchange'},seed)).toThrow('another responding faction');
 after=reply(setup,JSON.parse(JSON.stringify(after)),'pass');expect(after.phase).toBe('production');expect(after.discovery!.events[0].resolved).toBe(true);expect(after.players.p2.population).toBe(2);
});
test('integration: Dimensional Rift chooses a concealed deck before its public System and retains a single attached edge',()=>{
 const {setup,state}=pending({kind:'event',responder:'p1',event:'dimensional-rift',slot:'II-1'});state.discovery!.events.push({id:'dimensional-rift',slot:'II-1',resolved:false});
 let after=drain(setup,state);const top=after.discovery!.systemDecks.A[0];expect(JSON.stringify(publicDiscovery(after.discovery!))).not.toContain(top);
 after=reply(setup,after,'A');expect(after.discovery!.queue[0]).toMatchObject({stage:'attach',value:top});expect(after.discovery!.systems).toHaveLength(0);
 after=reply(setup,JSON.parse(JSON.stringify(after)),'a-1');expect(after.discovery!.systems).toEqual([{slot:'rift-II-1',parent:'a-1',card:top}]);expect(projectGame(setup,after).systems.at(-1)?.card).toBe(top);
 expect('systemDecks' in projectGame(setup,after).discovery!).toBe(false);
});
test('integration: simultaneous jumps gain outposts after complete movement and charge Solar only for arrivals',()=>{
 const {setup,state}=pending({kind:'effect',responder:'p1',source:'spacetime-anomaly-studies',effect:{kind:'jump',amount:2}});state.discovery!.events.push({id:'erratic-solar-activity',slot:'II-2',resolved:true,target:'a-1'});
 const after=reply(setup,state,'jump',{legs:[{ship:'p1-ship-1',index:0,path:['sol','a-1']}]});
 expect(after.players.p1.ore).toBe(2);expect(after.discovery!.outposts['a-1']?.owner).toBe('p1');
 expect(after.players.p1.automation).toBe(0);
 const skip=pending({kind:'effect',responder:'p1',source:'spacetime-anomaly-studies',effect:{kind:'jump',amount:2}});skip.state.players.p1.ships[0].location='a-1';skip.state.discovery!.events.push({id:'erratic-solar-activity',slot:'II-2',resolved:true,target:'a-1'});
 expect(reply(skip.setup,skip.state,'jump',{legs:[]}).players.p1.ore).toBeGreaterThanOrEqual(3);
});

test('integration: Gather exhaustion can require a real mandatory achievement; one claim ends that turn’s claim choice',async()=>{
 const {availableClaims}=await import('../../src/lib/game/achievements');
 const setup=initial();setup.achievements=['transcendence','empire','technologist','posthumanist'];
 const state=initialPlay(setup);state.phase='achievement';state.players={p1:economy(setup.players[0])};state.players.p1.supply=[2,0,0,0,0];state.players.p1.population=17;state.discovery=initialDiscovery(seed,2,0,setup.achievements);
 expect(availableClaims(projectGame(setup,state))).toEqual(['posthumanist']);
 expect(()=>applyTurn(setup,state,'p1',{kind:'end-turn'},seed)).toThrow('Claim one eligible achievement');
 const claimed=applyTurn(setup,state,'p1',{kind:'claim-achievement',card:'posthumanist'},seed);
 expect(claimed.discovery!.claims).toEqual([{card:'posthumanist',position:'p1',turn:0,reward:3}]);
 expect(availableClaims(projectGame(setup,claimed))).toEqual([]);
 expect(()=>applyTurn(setup,claimed,'p1',{kind:'claim-achievement',card:'posthumanist'},seed)).toThrow('eligible');
 expect(applyTurn(setup,claimed,'p1',{kind:'end-turn'},seed).activePosition).toBe('p2');
});
test('integration: Warlord uses military power at three separate locations, never merely a four-ship count',async()=>{
 const {meetsAchievement}=await import('../../src/lib/game/achievements');const setup=initial(),p=setup.players[0];
 p.ships=Array.from({length:4},(_,i)=>({id:'test-'+i,level:1,location:'sol'}));
 expect(meetsAchievement(setup,'p1','warlord')).toBe(false);
 p.ships=[{id:'one',level:4,location:'sol'},{id:'two',level:4,location:'deep-space'},{id:'three',level:4,location:'a-1'}];
 expect(meetsAchievement(setup,'p1','warlord')).toBe(true);
});


test('integration: all outposts precede simultaneous gain bonuses, whose owner chooses an order that matters',()=>{
 const {setup,state}=pending({kind:'control',responder:'p1',location:'a-1',source:'Jump'});
 setup.systems.find(s=>s.slot==='a-1')!.card='61-cygni';
 setup.systems.find(s=>s.slot==='b-1')!.card='kruger-60';
 state.discovery!.queue.splice(1,0,{kind:'control',responder:'p1',location:'b-1',source:'Jump'});
 state.players.p1.ore=0;
 const ready=drain(setup,state);
 expect(Object.keys(ready.discovery!.outposts).sort()).toEqual(['a-1','b-1']);
 expect(ready.players.p1.ore).toBe(0);
 expect(ready.discovery!.queue[0].kind).toBe('gain-bonus');
 expect(reply(setup,ready,'a-1').players.p1.ore).toBe(4);
 expect(reply(setup,JSON.parse(JSON.stringify(ready)),'b-1').players.p1.ore).toBe(3);
});

test('integration: resource cube stream is independent of ship identifiers and replay retains the roll',()=>{
 const {setup,state}=pending({kind:'event',event:'experimental-prototypes',responder:'p1',slot:'II-1',stage:'roll',value:''});
 const other=structuredClone(state);other.discovery!.sequence=37;
 const a=drain(setup,state),b=drain(setup,other);
 expect(a.discovery!.queue[0]).toEqual(b.discovery!.queue[0]);
 expect(a.discovery!.rollIndex).toBe(1);expect(b.discovery!.sequence).toBe(37);
 const replay=JSON.parse(JSON.stringify(a));
 expect(canAdvanceDiscovery(projectGame(setup,replay))).toBe(false);
 expect(replay.discovery.queue[0]).toEqual(a.discovery!.queue[0]);
});
