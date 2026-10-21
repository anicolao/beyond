import {initializeBackendTestEnvironment} from '../../scripts/backend-rules-environment.mjs';
import {afterAll,beforeAll,expect,test} from 'bun:test';
import {assertFails,assertSucceeds,type RulesTestEnvironment} from '@firebase/rules-unit-testing';
import {collection,doc,getDoc,getDocs,writeBatch,updateDoc,deleteDoc} from 'firebase/firestore';
import * as rest from 'firebase/firestore/lite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import protocol from './fixtures/deployed-protocol-34d7cc9.json';
// Frozen wire-protocol samples from the already deployed PR5 revision.
// No later application model, setup implementation or UI is backported here.
type Command={event:Record<string,any>;after:Record<string,any>};
type CompatibilityTiming={fixture:string;started:number;phase:string;at:number;revision:number;history:{phase:string;revision:number;ms:number}[]};
const compatibilityTimings:CompatibilityTiming[]=[];
let environment:RulesTestEnvironment;
beforeAll(async()=>{environment=await initializeBackendTestEnvironment({projectId:'demo-beyond',firestore:{host:'127.0.0.1',port:Number(process.env.RULES_TEST_PORT??8197),rules:readFileSync('firestore.rules','utf8')}});});
afterAll(async()=>{
 // Sanitized diagnostics only; all requests, assertions and5s test limits stay intact.
 console.info('compatibility-timing',JSON.stringify(compatibilityTimings.map(t=>({fixture:t.fixture,phase:t.phase,revision:t.revision,pendingMs:t.phase==='complete'?0:performance.now()-t.at,completedMs:t.at-t.started,recent:t.history.slice(-8),slowest:[...t.history].sort((a,b)=>b.ms-a.ms).slice(0,5)}))));
 await environment?.cleanup();
});
const clients=new Map<string,ReturnType<RulesTestEnvironment['authenticatedContext']>>();
const database=(uid:string)=>{if(!clients.has(uid))clients.set(uid,environment.authenticatedContext(uid));return clients.get(uid)!.firestore();};
// Denial probes use the server-only REST transport with the exact same mock
// identity. Legal commits, reads and revision races retain the production SDK.
const denialClients=new Map<string,rest.Firestore>();
function denialDatabase(uid:string){
 if(!denialClients.has(uid)){
  const db=rest.getFirestore(database(uid).app);
  rest.connectFirestoreEmulator(db,'127.0.0.1',Number(process.env.RULES_TEST_PORT??8197),{mockUserToken:{sub:uid,user_id:uid}});
  denialClients.set(uid,db);
 }
 return denialClients.get(uid)!;
}
function newCommands(commands:Command[]){
 const code=Array.from(crypto.getRandomValues(new Uint8Array(5)),n=>String.fromCharCode(65+n%26)).join('');
 return commands.map(command=>{const copy=structuredClone(command);if(copy.event.code){copy.event.code=code;copy.after.code=code;}return copy;});
}
async function write(id:string,command:Command,uid=command.event.actorUid){
 const db=database(uid),batch=writeBatch(db);batch.set(doc(db,`games/${id}`),command.after);batch.set(doc(db,`games/${id}/events/${command.event.commandId}`),command.event);
 if(command.event.type==='remote-created')batch.set(doc(db,`invites/${command.event.code}`),{gameId:id,ownerUid:command.event.actorUid});
 return batch.commit();
}
async function restWrite(id:string,command:Command,uid=command.event.actorUid){
 const db=denialDatabase(uid),batch=rest.writeBatch(db);batch.set(rest.doc(db,`games/${id}`),command.after);batch.set(rest.doc(db,`games/${id}/events/${command.event.commandId}`),command.event);
 if(command.event.type==='remote-created')batch.set(rest.doc(db,`invites/${command.event.code}`),{gameId:id,ownerUid:command.event.actorUid});
 return batch.commit();
}
test('compatibility reference pins the reviewed policy and six protocol histories',()=>{
 expect(createHash('sha256').update(readFileSync('tests/backend/fixtures/deployed-policy-34d7cc9.rules')).digest('hex')).toBe('f1911de08b3aeb8c71fce919d41518f340bb9f7ccc704e43fa449092172bcde7');
 expect(protocol.sourceRevision).toBe('34d7cc973bbc9af355f589c146ef30b0f890a13d');
 expect(protocol.fixtures.map(f=>f.name).sort()).toEqual(['remote-2','remote-3','remote-4','tabletop-2','tabletop-3','tabletop-4']);
});
test('denial transport preserves each principal identity and enforces owner-only access',async()=>{
 const template=protocol.fixtures.find(f=>f.name==='tabletop-2')!.commands[0];
 const principals=new Set(protocol.fixtures.flatMap(f=>f.commands.map(c=>c.event.actorUid)).concat(['compat-intruder','compat-competitor']));
 for(const uid of principals){
  const command=structuredClone(template),id=crypto.randomUUID();
  command.event.actorUid=uid;command.after.ownerUid=uid;
  // An attributed legal write cannot pass with missing, shared or admin auth.
  await assertSucceeds(restWrite(id,command,uid));
  expect((await getDoc(doc(database(uid),`games/${id}`))).data()).toEqual(command.after);
  await assertFails(rest.getDoc(rest.doc(denialDatabase('compat-proof-other'),`games/${id}`)));
 }
});
for(const fixture of protocol.fixtures)test(`deployed ${fixture.name} remains writable with immutable attributed events and Begin`,async()=>{
 const id=crypto.randomUUID(),commands=newCommands(fixture.commands),owner=commands[0].event.actorUid;
 const clock=performance.now(),timing:CompatibilityTiming={fixture:fixture.name,started:clock,phase:'starting',at:clock,revision:-1,history:[]};compatibilityTimings.push(timing);
 const mark=(phase:string,revision=timing.revision)=>{const now=performance.now();timing.history.push({phase:timing.phase,revision:timing.revision,ms:now-timing.at});timing.phase=phase;timing.revision=revision;timing.at=now;};
 for(const command of commands){
  mark('foreign identity denial',command.event.revision as number);
  await assertFails(restWrite(id,command,'compat-intruder'));
  if(fixture.mode==='remote' && command.event.type!=='remote-faction-selected' && Object.keys(command.after.factions??{}).length && command.event.type!=='remote-seat-left'){
   mark('forged faction denial');
   const forged=structuredClone(command);delete forged.after.factions[Object.keys(forged.after.factions)[0]];
   await assertFails(restWrite(id,forged));
  }
  mark('legal SDK commit');
  try{await assertSucceeds(write(id,command));}catch(error){throw new Error(`${fixture.name} revision${command.event.revision} ${command.event.type}`,{cause:error});}
  mark('projection read and immutable event denial');
  await Promise.all([
   getDoc(doc(database(owner),`games/${id}`)).then(snapshot=>expect(snapshot.data()).toEqual(command.after)),
   assertFails(updateDoc(doc(database(owner),`games/${id}/events/${command.event.commandId}`),{name:'Forged'}))
  ]);
  mark('replay denial');
  await assertFails(restWrite(id,command));
 }
 const db=database(owner),last=commands.at(-1)!;
 mark('collection access denials');
 await assertFails(getDocs(collection(database('compat-intruder'),'games')));
 await assertFails(getDoc(doc(environment.unauthenticatedContext().firestore(),`games/${id}`)));
 await assertFails(getDocs(collection(database('compat-intruder'),`games/${id}/events`)));
 mark('immutable Begin denial');
 await assertFails(updateDoc(doc(db,`games/${id}`),{start:{...last.after.start,seed:crypto.randomUUID()}}));
 mark('root delete denial');
 await assertFails(deleteDoc(doc(db,`games/${id}`)));
 const forged=structuredClone(last);forged.event.commandId=crypto.randomUUID();forged.event.revision++;forged.after.revision++;forged.after.lastCommand=forged.event.commandId;
 mark('forged projection denial');
 await assertFails(restWrite(id,forged));
 mark('retained projection read');
 expect((await getDoc(doc(db,`games/${id}`))).data()).toEqual(last.after);
 mark('invitation and final identity probes');
 if(fixture.mode==='remote'){
  await assertSucceeds(getDoc(doc(database('compat-intruder'),`invites/${last.after.code}`)));
  await assertFails(getDocs(collection(database('compat-intruder'),'invites')));
  await assertFails(updateDoc(doc(db,`invites/${last.after.code}`),{gameId:'hijacked'}));
 }else await assertFails(getDoc(doc(database('compat-guest2'),`games/${id}`)));
 mark('complete');
});
test('deployed remote protocol still atomically rejects competing claims and forged projections',async()=>{
 const fixture=protocol.fixtures.find(f=>f.name==='remote-2')!,commands=newCommands(fixture.commands),id=crypto.randomUUID();
 await assertSucceeds(write(id,commands[0]));const claim=commands[1],other=structuredClone(claim);
 other.event.actorUid='compat-competitor';other.event.commandId=crypto.randomUUID();other.after.lastCommand=other.event.commandId;other.after.seats.p2.uid=other.event.actorUid;delete other.after.members['compat-guest2'];other.after.members[other.event.actorUid]='p2';
 await assertFails(updateDoc(doc(database('compat-host'),`games/${id}`),{revision:claim.after.revision,seats:claim.after.seats,members:claim.after.members}));
 const results=await Promise.allSettled([write(id,claim),write(id,other)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
 const db=database('compat-host');expect((await getDoc(doc(db,`games/${id}`))).data()?.revision).toBe(1);expect((await getDocs(collection(db,`games/${id}/events`))).size).toBe(2);
});
