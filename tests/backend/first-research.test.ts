import {initializeBackendTestEnvironment} from '../../scripts/backend-rules-environment.mjs';
import {sameCommandValue} from '../../src/lib/command-value';
import {beforeAll,afterAll,test,expect} from 'bun:test';
import {assertFails,assertSucceeds,type RulesTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,writeBatch,updateDoc} from 'firebase/firestore';
import {readFileSync} from 'node:fs';
import {applyRemote,defaultSettings,type RemoteEvent,type RemoteRoom} from '../../src/lib/remote/model';
import {applyTurn,projectGame,growthColumns,oreProduction,type TurnMove} from '../../src/lib/game/turn';
import {startingSetup,type BasicStart} from '../../src/lib/game/setup';
import {levelOne} from '../../src/lib/game/manifest';
const start:BasicStart={version:'basic-2020-v1',seed:'12345678-1234-4567-89ab-123456789abc'};
const initial=()=>startingSetup(start,[{position:'p1',name:'Ada',faction:'nishida'},{position:'p2',name:'Bora',faction:'zheng'}],defaultSettings);
test('Level I research pays a permanent cube and resolves each printed immediate bonus exactly',()=>{
 for(const card of levelOne){
  const game=initial(),play=applyTurn(game,undefined,'p1',{kind:'research-I',space:0,card,...(card==='narrow-beam-lasers'?{ship:'p1-ship-1'}:{})}),p=projectGame(game,play).players[0];
  expect(p.research).toEqual([card]);expect(p.actionLocation).toBe('research-I:0');expect(play.phase).toBe('production');
  expect(p.supply.reduce((a,b)=>a+b,0)+p.population+p.ships.length+p.research.length).toBe(20);
  if(card==='terraforming'){expect(p.population).toBe(1);expect(p.supply[0]).toBe(4);expect(p.ships.at(-1)?.location).toBe('deep-space');}
  if(card==='advanced-genetics'){expect(p.population).toBe(2);expect(p.supply[0]).toBe(4);expect(p.foodDiscs).toBe(7);expect(p.automation).toBe(1);}
  if(card==='advanced-robotics'){expect(p.population).toBe(1);expect(p.ore).toBe(4);expect(p.oreDiscs).toBe(7);expect(oreProduction(p)).toBe(2);}
  if(card==='narrow-beam-lasers'){expect(p.population).toBe(1);expect(p.ore).toBe(4);expect(p.ships[0].level).toBe(2);}
 }
 expect(()=>applyTurn(initial(),undefined,'p1',{kind:'research-I',space:0,card:'narrow-beam-lasers'})).toThrow('Choose');
});
test('production is exclusive, grows only matching exposed columns and passes clockwise after achievement review',()=>{
 const game=initial();let play=applyTurn(game,undefined,'p1',{kind:'research-I',space:0,card:'advanced-robotics'});
 expect(()=>applyTurn(game,play,'p2',{kind:'ore'})).toThrow('Ada');
 play=applyTurn(game,play,'p1',{kind:'ore'});expect(play.players.p1.ore).toBe(6);expect(play.phase).toBe('achievement');
 expect(()=>applyTurn(game,play,'p1',{kind:'grow'})).toThrow('exactly one');
 play=applyTurn(game,play,'p1',{kind:'end-turn'});expect(projectGame(game,play).activePosition).toBe('p2');
 expect(()=>applyTurn(game,play,'p2',{kind:'research-I',space:0,card:'advanced-robotics'})).toThrow('Occupied by Ada');
 play=applyTurn(game,play,'p2',{kind:'research-I',space:1,card:'advanced-robotics'});expect(play.players.p2.research).toEqual(['advanced-robotics']);
 // Labelled integration state: exhausted A with exposed B must not substitute.
 const p={...play.players.p2,foodDiscs:6,supply:[0,4,3,3,2]};expect(growthColumns(p).filter(c=>c.available).map(c=>c.letter)).toEqual(['B']);
});
test('trade uses the same cube cycle and never adds ordinary production',()=>{
 const game=initial();let play=applyTurn(game,undefined,'p1',{kind:'research-I',space:0,card:'advanced-robotics'});
 play=applyTurn(game,play,'p1',{kind:'trade'});play=applyTurn(game,play,'p1',{kind:'buy-population'});
 expect([play.players.p1.ore,play.players.p1.population,play.players.p1.supply[0]]).toEqual([1,2,4]);
 play=applyTurn(game,play,'p1',{kind:'sell-population'});expect([play.players.p1.ore,play.players.p1.population,play.players.p1.supply[0]]).toEqual([2,1,5]);
 play=applyTurn(game,play,'p1',{kind:'decommission',ship:'p1-ship-1'});expect([play.players.p1.ore,play.players.p1.population,play.players.p1.ships.length]).toEqual([1,2,0]);
 play=applyTurn(game,play,'p1',{kind:'finish-trading'});expect(play.players.p1.ore).toBe(1);expect(play.phase).toBe('achievement');
});
let env:RulesTestEnvironment;
beforeAll(async()=>{env=await initializeBackendTestEnvironment({projectId:'demo-beyond',firestore:{host:'127.0.0.1',port:Number(process.env.RULES_TEST_PORT??8197),rules:readFileSync('firestore.rules','utf8')}});});
afterAll(async()=>env?.cleanup());
// Integration fixtures replay real commands; ordinary browser stories separately
// prove a person can reach the same setup and turn through visible controls.
async function fixture(){
 const id=crypto.randomUUID(),host=`research-host-${id}`,guest=`research-guest-${id}`,code=Array.from(crypto.getRandomValues(new Uint8Array(5)),n=>String.fromCharCode(65+n%26)).join('');
 let current:RemoteRoom|undefined;
 const make=(extra:Partial<RemoteEvent>):RemoteEvent=>({schema:1,type:'remote-created',actorUid:host,revision:current?current.revision+1:0,commandId:crypto.randomUUID(),position:'p1',name:'Ada',ready:false,code,settings:defaultSettings,configVersion:current?current.configVersion+1:0,...extra});
 const write=async(e:RemoteEvent,after:RemoteRoom,uid=e.actorUid)=>{const db=env.authenticatedContext(uid).firestore(),batch=writeBatch(db);batch.set(doc(db,`games/${id}`),after);batch.set(doc(db,`games/${id}/events/${e.commandId}`),e);if(!current)batch.set(doc(db,`invites/${code}`),{gameId:id,ownerUid:host});return batch.commit();};
 const append=async(extra:Partial<RemoteEvent>)=>{const e=make(extra),after=applyRemote(current,e);await assertSucceeds(write(e,after));current=after;};
 await append({});await append({type:'remote-seat-claimed',actorUid:guest,position:'p2',name:'Bora'});
 await append({type:'remote-faction-selected',name:'',faction:'nishida'});await append({type:'remote-faction-selected',actorUid:guest,position:'p2',name:'',faction:'zheng'});
 await append({type:'remote-ready-changed',name:'',ready:true,configVersion:current!.configVersion});await append({type:'remote-ready-changed',actorUid:guest,position:'p2',name:'',ready:true,configVersion:current!.configVersion});
 await append({type:'remote-begun',position:'',name:'',start,configVersion:current!.configVersion});
 return {id,host,guest,write,get current(){return current!;},move(move:TurnMove,position:'p1'|'p2'='p1'){return make({type:'game-move',actorUid:position==='p1'?host:guest,position,name:'',move,configVersion:current!.configVersion});},async commit(e:RemoteEvent){const after=applyRemote(current,e);await assertSucceeds(write(e,after));current=after;}};
}
for(const card of levelOne)test(`security: ${card} exact consequences, actor authority and immutable setup`,async()=>{
 const f=await fixture(),move:TurnMove={kind:'research-I',space:0,card,...(card==='narrow-beam-lasers'?{ship:'p1-ship-1'}:{})},e=f.move(move),after=applyRemote(f.current,e);
 await assertFails(f.write({...e,actorUid:f.guest},after,f.guest));
 const forged=structuredClone(after);forged.play!.players.p1.ore++;
 await assertFails(f.write(e,forged));
 await assertFails(f.write(e,{...after,start:{...start,seed:crypto.randomUUID()}}));
 await f.commit(e);
 await assertFails(updateDoc(doc(env.authenticatedContext(f.host).firestore(),`games/${f.id}`),{'play.players.p1.population':99}));
 await f.commit(f.move({kind:'ore'}));await f.commit(f.move({kind:'end-turn'}));
 expect(f.current.play!.turn).toBe(1);
 const second=f.move({kind:'research-I',space:1,card,...(card==='narrow-beam-lasers'?{ship:'p2-ship-2'}:{})},'p2');await f.commit(second);
 await f.commit(f.move({kind:'trade'},'p2'));
 await f.commit(f.move({kind:'sell-population'},'p2'));
 if(f.current.play!.players.p2.ore>=4)await f.commit(f.move({kind:'buy-population'},'p2'));
 await f.commit(f.move({kind:'decommission',ship:'p2-ship-1'},'p2'));
 await f.commit(f.move({kind:'finish-trading'},'p2'));await f.commit(f.move({kind:'end-turn'},'p2'));
});
test('shared-table turn authority follows physical clockwise order with one controller',async()=>{
 const {apply,clockwise}=await import('../../src/lib/table');
 const id=crypto.randomUUID(),uid=`research-table-${id}`,db=env.authenticatedContext(uid).firestore();let table:import('../../src/lib/table').Table|undefined;
 const append=async(extra:Partial<import('../../src/lib/table').TableEvent>)=>{const e:import('../../src/lib/table').TableEvent={schema:1,actorUid:uid,revision:table?table.revision+1:0,commandId:crypto.randomUUID(),type:'table-created',position:'',name:'',...extra},after=apply(table,e),batch=writeBatch(db);batch.set(doc(db,`games/${id}`),{...after,schema:1,mode:'tabletop',ownerUid:uid,lastCommand:e.commandId});batch.set(doc(db,`games/${id}/events/${e.commandId}`),e);await assertSucceeds(batch.commit());table=after;};
 await append({});await append({type:'seat-joined',position:'south-west',name:'Ada'});await append({type:'seat-joined',position:'north-east',name:'Bora'});await append({type:'table-faction-selected',position:'south-west',faction:'nishida'});await append({type:'table-faction-selected',position:'north-east',faction:'zheng'});await append({type:'game-begun',start});
 expect(clockwise(table!)).toEqual(['south-west','north-east']);
 await append({type:'game-move',position:'south-west',move:{kind:'research-I',space:0,card:'advanced-genetics'}});
 await append({type:'game-move',position:'south-west',move:{kind:'grow'}});await append({type:'game-move',position:'south-west',move:{kind:'end-turn'}});
 await append({type:'game-move',position:'north-east',move:{kind:'research-I',space:1,card:'narrow-beam-lasers',ship:'north-east-ship-2'}});
});

test('idempotent command values survive Firestore map ordering without accepting changed choices',()=>{
 expect(sameCommandValue({kind:'research-I',space:0,card:'terraforming'},{card:'terraforming',kind:'research-I',space:0})).toBe(true);
 expect(sameCommandValue({version:start.version,seed:start.seed},{seed:start.seed,version:start.version})).toBe(true);
 expect(sameCommandValue({kind:'research-I',space:0,card:'terraforming'},{card:'terraforming',kind:'research-I',space:1})).toBe(false);
 expect(sameCommandValue(undefined,{})).toBe(false);
});

test('three/four-player first rounds preserve every faction economy and printed action-space occupancy',()=>{
 for(const count of [3,4] as const){
  const ids=['nishida','united-nations','zheng','disciples'] as const;
  const game=startingSetup(start,ids.slice(0,count).map((faction,i)=>({position:`p${i+1}`,name:`Player ${i+1}`,faction})),{factions:'basic',achievements:'introductory'});
  let play:import('../../src/lib/game/turn').PlayState|undefined;
  for(let i=0;i<count;i++){
   const position=`p${i+1}`,card=levelOne[i],ship=`${position}-ship-1`;
   play=applyTurn(game,play,position,{kind:'research-I',space:i,card,...(card==='narrow-beam-lasers'?{ship}:{})});
   const player=projectGame(game,play).players[i];expect(player.research).toEqual([card]);expect(player.actionLocation).toBe(`research-I:${i}`);
   play=applyTurn(game,play,position,{kind:i%2?'ore':'grow'});play=applyTurn(game,play,position,{kind:'end-turn'});
  }
  expect(play!.activePosition).toBe('p1');expect(play!.turn).toBe(count);
  for(const p of projectGame(game,play).players)expect(p.supply.reduce((a,b)=>a+b,0)+p.population+p.ships.length+p.research.length).toBe(20);
 }
});
