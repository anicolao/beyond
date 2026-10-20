import {initializeBackendTestEnvironment} from '../../scripts/backend-rules-environment.mjs';
import {beforeAll,afterAll,test,expect} from 'bun:test';
import {assertFails,assertSucceeds,type RulesTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,writeBatch,getDoc,updateDoc} from 'firebase/firestore';
import{readFileSync}from'node:fs';
import{startingSetup,setupDecks,type BasicStart}from'../../src/lib/game/setup';
import{setupVersion,explorationBoard,technologySlots,type FactionId}from'../../src/lib/game/manifest';
import{applyRemote,projectRemote,defaultSettings,type RemoteEvent,type RemoteRoom}from'../../src/lib/remote/model';
import{apply,projectTable,clockwise,type TableEvent,type Table}from'../../src/lib/table';
const start:BasicStart={version:setupVersion,seed:'12345678-1234-4567-89ab-123456789abc'};
let env:RulesTestEnvironment;
beforeAll(async()=>{env=await initializeBackendTestEnvironment({projectId:'demo-beyond',firestore:{host:'127.0.0.1',port:Number(process.env.RULES_TEST_PORT??8197),rules:readFileSync('firestore.rules','utf8')}});});
afterAll(async()=>await env?.cleanup());
test('reviewed Basic mats conserve all twenty cubes and apply the exceptional columns and locations',()=>{
 const factions:FactionId[]=['nishida','zheng','united-nations','disciples'];
 const game=startingSetup(start,factions.map((faction,i)=>({position:`p${i+1}`,name:`Player ${i+1}`,faction})),defaultSettings);
 expect(game.players.map(p=>({ore:p.ore,population:p.population,supply:p.supply,ships:p.ships.map(s=>s.location)}))).toEqual([
  {ore:3,population:2,supply:[5,4,3,3,2],ships:['sol']},
  {ore:1,population:2,supply:[4,4,3,3,2],ships:['sol','sol']},
  {ore:2,population:3,supply:[5,4,2,3,2],ships:['sol']},
  {ore:3,population:2,supply:[5,4,3,3,2],ships:['deep-space']}
 ]);
 for(const p of game.players){expect(p.supply.reduce((a,b)=>a+b,0)+p.population+p.ships.length).toBe(20);expect([p.foodDiscs,p.oreDiscs,p.automation,p.actionLocation,p.research]).toEqual([8,8,0,null,[]]);}
});
test('exact two/three/four-player setup differences, independent decks and concealed public projection',()=>{
 for(const count of [2,3,4] as const){
  const ids:FactionId[]=['zheng','united-nations','nishida','disciples'];
  const players=ids.slice(0,count).map((faction,i)=>({position:`p${i+1}`,name:`P${i+1}`,faction}));
  const game=startingSetup(start,players,{factions:'basic',achievements:'randomized'}),decks=setupDecks(start.seed,count);
  expect(game.players.map(p=>p.ore)).toEqual(count===2?[1,1]:count===3?[1,1,4]:[1,1,4,3]);
  expect(game.systems.filter(s=>s.slot.startsWith('a-'))).toHaveLength(count===2?1:2);
  expect(game.systems.filter(s=>s.slot.startsWith('b-'))).toHaveLength(2);
  expect([game.overlay,game.endgameClaims,game.achievementSecondSlot]).toEqual([count,count===4?4:3,count===4]);
  expect(game.eventCovers).toHaveLength(12);expect(game.technologies).toHaveLength(4);
  expect(decks.events.II).toHaveLength(6);expect(decks.events.III).toHaveLength(6);
  expect(decks.events.II).toContain('maya-chaturvedi');expect(decks.events.II).toContain('tyler-lee');
  expect(decks.events.III).toContain('kc-24x');expect(decks.events.III).toContain('onu');
  expect(new Set([...decks.startingA,...decks.systemsA]).size).toBe(12);
  expect(new Set(decks.systemsB).size).toBe(12);
  expect(decks.technologies.II).toHaveLength(16);expect(decks.technologies.III).toHaveLength(16);expect(decks.technologies.IIII).toHaveLength(10);
  expect(JSON.stringify(game)).not.toContain('maya-chaturvedi');expect(JSON.stringify(game)).not.toContain('tyler-lee');expect(JSON.stringify(game)).not.toContain('hypercomputing');
  expect(startingSetup(start,players,{factions:'basic',achievements:'randomized'})).toEqual(game);
  expect(explorationBoard(count).edges).toHaveLength(count===2?7:14);
 }
 expect(technologySlots).toHaveLength(19);
 expect(technologySlots.find(s=>s.id==='III-5')?.prerequisites).toEqual(['I-3']);
 expect(technologySlots.find(s=>s.id==='IIII-1')?.required).toBe(2);
});
test('Begin rejects duplicate, excluded, incomplete and Advanced factions',()=>{
 for(const ids of [['nishida','nishida'],['disciples','zheng'],['zheng']] as FactionId[][])expect(()=>startingSetup(start,ids.map((faction,i)=>({position:`p${i}`,name:'Player',faction})),defaultSettings)).toThrow();
 expect(()=>startingSetup(start,[{position:'p1',name:'Ada',faction:'nishida'},{position:'p2',name:'Bora',faction:'zheng'}],{factions:'advanced',achievements:'introductory'})).toThrow();
 expect(()=>setupDecks('not-a-seed',2)).toThrow();
});
async function remoteWrite(id:string,e:RemoteEvent,after:RemoteRoom,create=false,uid=e.actorUid){const db=env.authenticatedContext(uid).firestore();const batch=writeBatch(db);batch.set(doc(db,`games/${id}`),after);batch.set(doc(db,`games/${id}/events/${e.commandId}`),e);if(create)batch.set(doc(db,`invites/${e.code}`),{gameId:id,ownerUid:uid});return batch.commit();}
function remoteEvent(before:RemoteRoom|undefined,extra:Partial<RemoteEvent>):RemoteEvent{return{schema:1,actorUid:'setup-host',commandId:crypto.randomUUID(),revision:before?before.revision+1:0,type:'remote-created',position:'p1',name:'Ada',ready:false,settings:before?.settings??defaultSettings,code:before?.code??Array.from(crypto.getRandomValues(new Uint8Array(5)),v=>String.fromCharCode(65+v%26)).join(''),configVersion:before?before.configVersion+1:0,...extra};}
test('remote factions are atomic, self-owned and unique; Begin requires everyone and permanently freezes setup',async()=>{
 const id=crypto.randomUUID(),history:RemoteEvent[]=[];
 let current:RemoteRoom|undefined;
 const append=async(extra:Partial<RemoteEvent>)=>{const e=remoteEvent(current,extra),after=applyRemote(current,e);await assertSucceeds(remoteWrite(id,e,after,!current));history.push(e);current=after;return e;};
 await append({});await append({type:'remote-seat-claimed',actorUid:'setup-guest',position:'p2',name:'Bora'});
 await append({type:'remote-faction-selected',position:'p1',name:'',faction:'nishida'});
 const duplicate=remoteEvent(current,{type:'remote-faction-selected',actorUid:'setup-guest',position:'p2',name:'',faction:'nishida'});
 expect(()=>applyRemote(current,duplicate)).toThrow();
 await assertFails(remoteWrite(id,duplicate,{...current!,factions:{p1:'nishida',p2:'nishida'},revision:duplicate.revision,lastCommand:duplicate.commandId,configVersion:duplicate.configVersion}));
 const illegal=remoteEvent(current,{type:'remote-faction-selected',actorUid:'setup-guest',position:'p2',name:'',faction:'disciples'});
 await assertFails(remoteWrite(id,illegal,{...current!,factions:{p1:'nishida',p2:'disciples'},revision:illegal.revision,lastCommand:illegal.commandId,configVersion:illegal.configVersion}));
 const stolen=remoteEvent(current,{type:'remote-faction-selected',actorUid:'setup-guest',position:'p1',name:'',faction:'zheng'});
 await assertFails(remoteWrite(id,stolen,{...current!,factions:{p1:'zheng'},revision:stolen.revision,lastCommand:stolen.commandId,configVersion:stolen.configVersion}));
 await append({type:'remote-faction-selected',actorUid:'setup-guest',position:'p2',name:'',faction:'united-nations'});
 let early=remoteEvent(current,{type:'remote-begun',position:'',name:'',start,configVersion:current!.configVersion});
 expect(()=>applyRemote(current,early)).toThrow();
 await assertFails(remoteWrite(id,early,{...current!,phase:'started',start,revision:early.revision,lastCommand:early.commandId}));
 await append({type:'remote-ready-changed',position:'p1',name:'',ready:true,configVersion:current!.configVersion});
 await append({type:'remote-ready-changed',actorUid:'setup-guest',position:'p2',name:'',ready:true,configVersion:current!.configVersion});
 const guestBegin=remoteEvent(current,{type:'remote-begun',actorUid:'setup-guest',position:'',name:'',start,configVersion:current!.configVersion});
 await assertFails(remoteWrite(id,guestBegin,{...current!,phase:'started',start,revision:guestBegin.revision,lastCommand:guestBegin.commandId}));
 await append({type:'remote-begun',position:'',name:'',start,configVersion:current!.configVersion});
 expect(projectRemote(history)).toEqual(current!);
 const db=env.authenticatedContext('setup-host').firestore();
 await assertFails(updateDoc(doc(db,`games/${id}`),{phase:'gathering',start:null}));
 const again=remoteEvent(current,{type:'remote-begun',position:'',name:'',start:{...start,seed:crypto.randomUUID()},configVersion:current!.configVersion});
 expect(()=>applyRemote(current,again)).toThrow();
 await assertFails(remoteWrite(id,again,{...current!,start:again.start,revision:again.revision,lastCommand:again.commandId}));
 expect((await getDoc(doc(db,`games/${id}`))).data()?.start).toEqual(start);
});
async function tableWrite(id:string,e:TableEvent,after:Table){const db=env.authenticatedContext('table-setup-owner').firestore();const batch=writeBatch(db);batch.set(doc(db,`games/${id}`),{...after,schema:1,mode:'tabletop',ownerUid:'table-setup-owner',lastCommand:e.commandId});batch.set(doc(db,`games/${id}/events/${e.commandId}`),e);return batch.commit();}
test('shared controller begins clockwise at chosen physical seats; remote identities cannot mutate it',async()=>{
 const id=crypto.randomUUID(),history:TableEvent[]=[];let current:Table|undefined;
 const append=async(extra:Partial<TableEvent>)=>{const e:TableEvent={schema:1,actorUid:'table-setup-owner',commandId:crypto.randomUUID(),revision:current?current.revision+1:0,type:'table-created',position:'',name:'',...extra};const after=apply(current,e);await assertSucceeds(tableWrite(id,e,after));history.push(e);current=after;};
 await append({});await append({type:'seat-joined',position:'south',name:'Ada'});await append({type:'seat-joined',position:'north',name:'Bora'});await append({type:'first-player-chosen',position:'north'});
 await append({type:'table-faction-selected',position:'south',faction:'zheng'});await append({type:'table-faction-selected',position:'north',faction:'united-nations'});
 await append({type:'table-settings-changed',settings:{factions:'basic',achievements:'randomized'}});
 await append({type:'game-begun',start});
 expect(clockwise(current!)).toEqual(['north','south']);expect(projectTable(history)).toEqual(current!);
 const db=env.authenticatedContext('table-setup-owner').firestore();await assertFails(updateDoc(doc(db,`games/${id}`),{start:null}));
 const stranger=env.authenticatedContext('setup-guest').firestore();await assertFails(getDoc(doc(stranger,`games/${id}`)));
 const e:TableEvent={...history.at(-1)!,commandId:crypto.randomUUID(),revision:current!.revision+1,start:{...start,seed:crypto.randomUUID()}};
 await assertFails(tableWrite(id,e,{...current!,start:e.start,revision:e.revision}));
});
