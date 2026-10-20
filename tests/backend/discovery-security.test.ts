import {initializeBackendTestEnvironment} from '../../scripts/backend-rules-environment.mjs';
import {beforeAll,afterAll,test,expect} from 'bun:test';
import {assertFails,assertSucceeds,type RulesTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,writeBatch,updateDoc,setDoc} from 'firebase/firestore';
import {readFileSync} from 'node:fs';
import {applyRemote,defaultSettings,type RemoteEvent,type RemoteRoom} from '../../src/lib/remote/model';
import {canAdvanceDiscovery} from '../../src/lib/game/discovery-resolution';
import {projectGame,initialPlay,economy,type PlayState,type TurnMove} from '../../src/lib/game/turn';
import {syncFleetPowers} from '../../src/lib/game/discovery-economy';
import {initialDiscovery} from '../../src/lib/game/discovery';
import {startingSetup} from '../../src/lib/game/setup';
const start={version:'basic-2020-v1' as const,seed:'11111111-1111-4111-8111-000000000007'};
let env:RulesTestEnvironment;
beforeAll(async()=>{env=await initializeBackendTestEnvironment({projectId:'demo-beyond',firestore:{host:'127.0.0.1',port:Number(process.env.DISCOVERY_RULES_TEST_PORT??process.env.RULES_TEST_PORT??8197),rules:readFileSync(process.env.RULES_SOURCE_PATH??'firestore.rules','utf8')}});});
afterAll(async()=>{await env?.cleanup();});
async function fixture(seed=start.seed,settings=defaultSettings){
 const gameStart={...start,seed};
 const id=crypto.randomUUID(),host=`discovery-host-${id}`,guest=`discovery-guest-${id}`,code=Array.from(crypto.getRandomValues(new Uint8Array(5)),n=>String.fromCharCode(65+n%26)).join('');let current:RemoteRoom|undefined;
 const make=(extra:Partial<RemoteEvent>):RemoteEvent=>({schema:1,type:'remote-created',actorUid:host,revision:current?current.revision+1:0,commandId:crypto.randomUUID(),position:'p1',name:'Ada',ready:false,code,settings,configVersion:current?current.configVersion+1:0,...extra});
 const write=async(e:RemoteEvent,after:RemoteRoom,uid=e.actorUid)=>{const db=env.authenticatedContext(uid).firestore(),batch=writeBatch(db);batch.set(doc(db,`games/${id}`),after);batch.set(doc(db,`games/${id}/events/${e.commandId}`),e);if(!current)batch.set(doc(db,`invites/${code}`),{gameId:id,ownerUid:host});return batch.commit();};
 const append=async(extra:Partial<RemoteEvent>)=>{const e=make(extra),after=applyRemote(current,e);await assertSucceeds(write(e,after));current=after;};
 const positions=['p1','p2','p3','p4'].slice(0,settings.capacity),controllers:Record<string,string>={p1:host,p2:guest,p3:`discovery-third-${id}`,p4:`discovery-fourth-${id}`},names=['Ada','Bora','Cleo','Dara'],factions=['nishida','zheng','disciples','united-nations'];
 await append({});for(let i=1;i<positions.length;i++)await append({type:'remote-seat-claimed',actorUid:controllers[positions[i]],position:positions[i] as 'p2',name:names[i]});
 for(let i=0;i<positions.length;i++)await append({type:'remote-faction-selected',actorUid:controllers[positions[i]],position:positions[i] as 'p1',name:'',faction:factions[i] as 'nishida'});
 for(const position of positions)await append({type:'remote-ready-changed',actorUid:controllers[position],position:position as 'p1',name:'',ready:true,configVersion:current!.configVersion});
 await append({type:'remote-begun',position:'',name:'',start:gameStart,configVersion:current!.configVersion});
 const setup=startingSetup(gameStart,positions.map((position,i)=>({position,name:names[i],faction:factions[i] as 'nishida'})),settings);
 const f={id,host,guest,write,setup,async integrationSnapshot(play:PlayState,legacyPower=false){if(play.discovery){play.discovery.powers=Object.fromEntries(setup.players.map(p=>[p.position,{sol:0,'deep-space':0,...(!legacyPower?{'*':0}:{})}]));syncFleetPowers(setup,play);}const after={...current!,play};await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),`games/${id}`),after));current=after;},get current(){return current!;},move(move:TurnMove,position='p1'){return make({type:'game-move',actorUid:controllers[position],position:position as 'p1'|'p2',name:'',move,configVersion:current!.configVersion});},async commit(e:RemoteEvent){const after=applyRemote(current,e);try{await assertSucceeds(write(e,after));}catch(error){throw new Error('Rejected discovery command '+JSON.stringify({move:e.move,queue:current?.play?.discovery?.queue[0]}),{cause:error});}current=after;},async command(move:TurnMove,position='p1'){await this.commit(this.move(move,position));},async preparePowers(){for(const actor of setup.players)await this.command({kind:'prepare-fleet-power',position:actor.position});},async automatic(){for(let i=0;i<100&&canAdvanceDiscovery(projectGame(setup,current!.play));i++)await this.command({kind:'discovery-advance',at:current!.play!.discovery!.cursor},current!.play!.discovery!.queue[0].responder);}};
 return f;
}
test('security: ordinary legal preparation, atomic reveal/payment, candidate equality and once-only continuation survive retained state',async()=>{
 const f=await fixture();
 await f.command({kind:'research-I',space:0,card:'advanced-robotics'});await f.command({kind:'ore'});await f.command({kind:'end-turn'});
 await f.command({kind:'research-I',space:1,card:'advanced-genetics'},'p2');await f.command({kind:'grow'},'p2');await f.command({kind:'end-turn'},'p2');
 const prepare=f.move({kind:'prepare-discovery'}),prepared=applyRemote(f.current,prepare);
 const missing=structuredClone(prepared);missing.play!.discovery!.systemDecks.A.pop();await assertFails(f.write(prepare,missing));
 const extra=structuredClone(prepared);extra.play!.discovery!.systemDecks.B[0]='invented-system';await assertFails(f.write(prepare,extra));
 await f.commit(prepare);await f.preparePowers();
 const begin=f.move({kind:'research-II',space:0,slot:'II-3'}),after=applyRemote(f.current,begin),forged=structuredClone(after);forged.play!.players.p1.ore++;
 await assertFails(f.write(begin,forged));await assertFails(f.write({...begin,actorUid:f.guest},after,f.guest));
 await f.commit(begin);await f.automatic();
 expect(f.current.play!.discovery!.queue[0]).toMatchObject({kind:'event',stage:'guild'});
 const guild=f.move({kind:'discovery-choice',at:f.current.play!.discovery!.cursor,option:'professors-guild'});await f.commit(guild);await f.automatic();
 const choice=f.current.play!.discovery!.queue[0];expect(choice).toMatchObject({kind:'candidate',cards:['hypercomputing','multi-colony-symposium']});
 const choose=f.move({kind:'discovery-choice',at:f.current.play!.discovery!.cursor,option:'hypercomputing'});const chosen=applyRemote(f.current,choose),poison=structuredClone(chosen);poison.play!.discovery!.deckII.reverse();await assertFails(f.write(choose,poison));
 await f.commit(choose);await f.automatic();expect(f.current.play!.phase).toBe('production');expect(f.current.play!.players.p1.oreDiscs).toBe(6);
 await assertFails(f.write(choose,chosen));await assertFails(updateDoc(doc(env.authenticatedContext(f.host).firestore(),`games/${f.id}`),{'play.players.p1.ore':999}));
 await f.command({kind:'ore'});await f.command({kind:'end-turn'});expect(f.current.play!.activePosition).toBe('p2');
});

// Integration coverage replays legal setup and preparatory commands against
// Firestore. These predeclared seeds select rare printed Events; no UI state is
// injected and no future Technology is consulted to choose an action.
const eventSeeds={
 'economic-boom':'000000000001','experimental-prototypes':'000000000002','dimensional-rift':'000000000003','erratic-solar-activity':'000000000005','tyler-lee':'000000000006','covert-arms-deal':'00000000000a','black-market-industries':'00000000000b','march-of-progress':'00000000000d','research-tariffs':'000000000010','maya-chaturvedi':'000000000013'
};
for(const count of [2,3,4] as const)for(const [event,suffix] of Object.entries(eventSeeds))test(`integration security: ${count}-player ${event} resolves before public candidates under actual responder identities`,async()=>{
 const f=await fixture('55555555-5555-4555-8555-'+suffix,{...defaultSettings,capacity:count}),card=f.setup.technologies.find(t=>t.slot==='I-2')!.card;
 const first={kind:'research-I' as const,space:0,card:card as 'advanced-robotics',...(card==='narrow-beam-lasers'?{ship:'p1-ship-1'}:{})};
 await f.command(first);await f.command({kind:'grow'});await f.command({kind:'end-turn'});
 const other=card==='advanced-robotics'?'advanced-genetics':'advanced-robotics';for(let i=1;i<count;i++){const pos='p'+(i+1);await f.command({kind:'research-I',space:i,card:other},pos);await f.command({kind:'grow'},pos);await f.command({kind:'end-turn'},pos);}
 await f.command({kind:'prepare-discovery'});await f.preparePowers();await f.command({kind:'research-II',space:0,slot:'II-3'});await f.automatic();
 expect(f.current.play!.discovery!.records[0].event).toBe(event);
 for(let i=0;i<20;i++){
  const d=f.current.play!.discovery!,q=d.queue[0];if(q.kind==='candidate')break;
  let option='',extra:Record<string,unknown>={};
  if(q.kind==='event'){
   if(q.stage==='guild')option='professors-guild';
   else if(event==='economic-boom')option=q.stage==='choose'?'exchange':'exchange';
   else if(event==='research-tariffs')option='II-1';
   else if(event==='erratic-solar-activity')option='a-1';
   else if(event==='dimensional-rift')option=q.stage==='deck'?'A':'a-1';
   else if(event==='covert-arms-deal')option=q.stage==='choose'?'2':'build';
   else if(event==='march-of-progress')option=q.stage==='choose'?card:q.responder==='p1'?'ore':'pass';
   else if(event==='experimental-prototypes')option='keep';
  }else if(q.kind==='effect'&&q.effect.kind==='upgrade'){option='upgrade';extra.ships=[];}
  if(!option)throw new Error('Unresolved source continuation: '+JSON.stringify(q));
  const response=f.move({kind:'discovery-choice',at:d.cursor,option,...extra},q.responder),after=applyRemote(f.current,response);
  const intruder=q.responder==='p1'?f.guest:f.host;await assertFails(f.write({...response,actorUid:intruder},after,intruder));
  await f.commit(response);await f.automatic();
 }
 expect(f.current.play!.discovery!.queue[0].kind).toBe('candidate');expect(f.current.play!.discovery!.events[0].resolved).toBe(true);expect(f.current.play!.activePosition).toBe('p1');
 if(event==='black-market-industries'){
  const before=f.current.play!.players.p1,choice=f.move({kind:'black-market',track:'food'}),after=applyRemote(f.current,choice),forged=structuredClone(after);
  forged.play!.players.p1.automation++;
  await assertFails(f.write(choice,forged));await assertFails(f.write({...choice,actorUid:f.guest},after,f.guest));
  await f.commit(choice);expect(f.current.play!.players.p1.foodDiscs).toBe(before.foodDiscs-1);expect(f.current.play!.players.p1.automation).toBe(before.automation);
  expect(f.current.play!.discovery!.industry).toEqual(['p1']);expect(()=>applyRemote(f.current,f.move({kind:'black-market',track:'ore'}))).toThrow('already used');
 }

});


// Deliberately constructed backend-only rare end-of-turn states. These do not
// substitute for ordinary illustrated setup/preparation/discovery browser stories.
function claimSnapshot(f:Awaited<ReturnType<typeof fixture>>,seed:string){
 const state=initialPlay(f.setup);state.turn=2;state.phase='achievement';
 state.players=Object.fromEntries(f.setup.players.map(p=>[p.position,economy(p)]));
 state.discovery=initialDiscovery(seed,2,2,f.setup.achievements);
 state.players.p1.research=[f.setup.technologies[0].card];
 return state;
}
test('integration security: an exhausted-Supply achievement is mandatory, exact, once-only and identity-bound',async()=>{
 const seed='66666666-6666-4666-8666-000000000002',f=await fixture(seed,{...defaultSettings,achievements:'randomized'}),state=claimSnapshot(f,seed);
 state.players.p1.supply=[2,0,0,0,0];state.players.p1.population=16;
 await f.integrationSnapshot(state);
 const end=f.move({kind:'end-turn'}),bypassed={...f.current,revision:end.revision,lastCommand:end.commandId,play:{...state,turn:3,activePosition:'p2',phase:'action' as const}};
 await assertFails(f.write(end,bypassed));
 const claim=f.move({kind:'claim-achievement',card:'posthumanist'}),after=applyRemote(f.current,claim),forged=structuredClone(after);forged.play!.players.p1.ore++;
 await assertFails(f.write(claim,forged));await assertFails(f.write({...claim,actorUid:f.guest},after,f.guest));await f.commit(claim);
 expect(f.current.play!.discovery!.claims).toEqual([{card:'posthumanist',position:'p1',turn:2,reward:3}]);
 expect(()=>applyRemote(f.current,f.move({kind:'claim-achievement',card:'posthumanist'}))).toThrow('eligible');
 await f.command({kind:'end-turn'});expect(f.current.play!.activePosition).toBe('p2');
});
test('integration security: a full fleet uses actual cached power and cannot skip a mandatory claim or forge its index',async()=>{
 const f=await fixture(),state=claimSnapshot(f,start.seed),p=state.players.p1;
 p.supply=[0,0,0,0,0];p.population=0;p.ships=Array.from({length:19},(_,i)=>({id:'p1-integration-'+i,level:4 as const,location:['sol','deep-space','shipyard-north','shipyard-east'][i%4]}));
 await f.integrationSnapshot(state);
 const end=f.move({kind:'end-turn'}),bypassed={...f.current,revision:end.revision,lastCommand:end.commandId,play:{...f.current.play!,turn:3,activePosition:'p2',phase:'action' as const}};await assertFails(f.write(end,bypassed));
 const forged=structuredClone(bypassed);forged.play!.discovery!.powers.p1={'sol':76,'deep-space':0,'*':76};await assertFails(f.write(end,forged));
 await f.command({kind:'claim-achievement',card:'warlord'});expect(f.current.play!.discovery!.claims[0].card).toBe('warlord');
 await f.command({kind:'end-turn'});expect(f.current.play!.turn).toBe(3);
});
test('integration security: aggregate fleet power is not an additional location and one strong location cannot claim Warlord',async()=>{
 const f=await fixture(),state=claimSnapshot(f,start.seed),p=state.players.p1;
 p.supply=[0,0,0,0,0];p.population=0;p.ships=Array.from({length:19},(_,i)=>({id:'p1-integration-'+i,level:4 as const,location:'sol'}));
 await f.integrationSnapshot(state);const claim=f.move({kind:'claim-achievement',card:'warlord'});
 const forged={...f.current,revision:claim.revision,lastCommand:claim.commandId,play:structuredClone(state)};forged.play.discovery!.claims.push({card:'warlord',position:'p1',turn:2,reward:3});await assertFails(f.write(claim,forged));
 await f.command({kind:'end-turn'});expect(f.current.play!.activePosition).toBe('p2');
});


test('integration security: simultaneous Jump uses actual topology and power, then resolves outpost and printed gain bonus',async()=>{
 const f=await fixture(),state=claimSnapshot(f,start.seed);state.phase='discovery';state.players.p1.population--;
 state.discovery!.queue=[{kind:'effect',responder:'p1',source:'spacetime-anomaly-studies',effect:{kind:'jump',amount:2}},{kind:'resume',responder:'p1',returnTo:'production'}];
 await f.integrationSnapshot(state);
 const command=f.move({kind:'discovery-choice',at:0,option:'jump',legs:[{ship:'p1-ship-1',index:0,path:['sol','a-1']}]});
 const after=applyRemote(f.current,command),forged=structuredClone(after);forged.play!.discovery!.powers.p1['a-1']=999;
 await assertFails(f.write(command,forged));await assertFails(f.write({...command,actorUid:f.guest},after,f.guest));
 await f.commit(command);await f.automatic();
 if(f.current.play!.discovery!.queue[0]?.kind==='control')await f.command({kind:'discovery-choice',at:f.current.play!.discovery!.cursor,option:'food'});
 await f.automatic();
 expect(f.current.play!.discovery!.outposts['a-1'].owner).toBe('p1');expect(f.current.play!.players.p1.foodDiscs).toBe(7);
 expect(f.current.play!.phase).toBe('production');
});


test('integration security: two ships move simultaneously, each solar arrival pays and only one gain bonus resolves',async()=>{
 const f=await fixture(),state=claimSnapshot(f,start.seed);state.phase='discovery';const p=state.players.p1;
 p.population--;p.supply[0]--;p.ships.push({id:'p1-extra',level:1,location:'sol'});
 state.discovery!.events=[{id:'maya-chaturvedi',slot:'II-1',resolved:true,choice:'professors-guild'},{id:'erratic-solar-activity',slot:'II-2',resolved:true,target:'a-1'}];
 state.discovery!.queue=[{kind:'effect',responder:'p1',source:'spacetime-anomaly-studies',effect:{kind:'jump',amount:2}},{kind:'resume',responder:'p1',returnTo:'production'}];
 await f.integrationSnapshot(state);const before=p.ore;
 await f.command({kind:'discovery-choice',at:0,option:'jump',legs:[{ship:'p1-ship-1',index:0,path:['sol','a-1']},{ship:'p1-extra',index:1,path:['sol','a-1']}]});
 const movement=f.move({kind:'discovery-advance',at:1}),moved=applyRemote(f.current,movement);
 const unpaid=structuredClone(moved);unpaid.play!.players.p1.ore=before;await assertFails(f.write(movement,unpaid));
 const earlyPower=structuredClone(moved);earlyPower.play!.discovery!.powers.p1['a-1']=999;await assertFails(f.write(movement,earlyPower));
 const changedPlan=structuredClone(moved);const queued=changedPlan.play!.discovery!.queue[0];if(queued.kind==='jump-power')queued.legs[1].path=['sol','b-1'];await assertFails(f.write(movement,changedPlan));
 await f.commit(movement);expect(f.current.play!.players.p1.ships.every(s=>s.location==='a-1')).toBe(true);expect(f.current.play!.players.p1.ore).toBe(before-2);
 expect(f.current.play!.discovery!.queue[0].kind).toBe('jump-power');
 const power=f.move({kind:'discovery-advance',at:2}),settled=applyRemote(f.current,power),wrongPower=structuredClone(settled);wrongPower.play!.discovery!.powers.p1['a-1']=999;await assertFails(f.write(power,wrongPower));await assertFails(f.write({...power,actorUid:f.guest},settled,f.guest));await f.commit(power);
 await f.automatic();if(f.current.play!.discovery!.queue[0]?.kind==='control')await f.command({kind:'discovery-choice',at:f.current.play!.discovery!.cursor,option:'food'});
 await f.automatic();expect(f.current.play!.players.p1.ore).toBe(before-2);expect(f.current.play!.players.p1.ships.every(s=>s.location==='a-1')).toBe(true);
 expect(f.current.play!.discovery!.powers.p1['a-1']).toBe(2);expect(f.current.play!.players.p1.foodDiscs).toBe(7);expect(f.current.play!.phase).toBe('production');
});
test('integration security: control transfer returns the former owner disc under its separate identity before new placement',async()=>{
 const f=await fixture(),state=claimSnapshot(f,start.seed);state.phase='discovery';state.players.p1.population--;state.players.p1.ships[0].level=3;
 state.players.p2.ships[0].location='a-1';state.players.p2.ships[0].level=2;state.players.p2.foodDiscs=7;
 state.discovery!.outposts['a-1']={owner:'p2',track:'food'};
 state.discovery!.queue=[{kind:'effect',responder:'p1',source:'plasma-cannon',effect:{kind:'jump',amount:1}},{kind:'resume',responder:'p1',returnTo:'production'}];
 await f.integrationSnapshot(state);await f.command({kind:'discovery-choice',at:0,option:'jump',legs:[{ship:'p1-ship-1',index:0,path:['sol','a-1']}]});
 await f.command({kind:'discovery-advance',at:1});await f.command({kind:'discovery-advance',at:2});await f.command({kind:'discovery-advance',at:3});await f.command({kind:'discovery-advance',at:4});
 expect(f.current.play!.discovery!.queue[0]).toMatchObject({kind:'control-loss',responder:'p2'});
 const loss=f.move({kind:'discovery-advance',at:5},'p2'),after=applyRemote(f.current,loss),forged=structuredClone(after);forged.play!.players.p2.automation++;
 await assertFails(f.write(loss,forged));await assertFails(f.write({...loss,actorUid:f.host},after,f.host));await f.commit(loss);
 expect(f.current.play!.players.p2.foodDiscs).toBe(8);await f.automatic();if(f.current.play!.discovery!.queue[0]?.kind==='control')await f.command({kind:'discovery-choice',at:f.current.play!.discovery!.cursor,option:'food'});await f.automatic();
 expect(f.current.play!.discovery!.outposts['a-1']).toEqual({owner:'p1',track:'food'});expect(f.current.play!.players.p1.foodDiscs).toBe(7);
});

for(const scenario of ['free','split'] as const)test('integration security: bounded two-ship '+scenario+' Jump preserves exact endpoint power',async()=>{
 const f=await fixture(),state=claimSnapshot(f,start.seed);state.phase='discovery';const p=state.players.p1;p.population--;p.supply[0]--;p.ships.push({id:'p1-extra',level:1,location:scenario==='split'?'deep-space':'sol'});p.ore=scenario==='split'?1:0;
 state.discovery!.events=[{id:'erratic-solar-activity',slot:'II-2',resolved:true,target:scenario==='split'?'a-1':'b-2'}];state.discovery!.queue=[{kind:'effect',responder:'p1',source:'spacetime-anomaly-studies',effect:{kind:'jump',amount:2}},{kind:'resume',responder:'p1',returnTo:'production'}];await f.integrationSnapshot(state);
 await f.command({kind:'discovery-choice',at:0,option:'jump',legs:[{ship:'p1-ship-1',index:0,path:['sol','a-1']},{ship:'p1-extra',index:1,path:scenario==='split'?['deep-space','b-1']:['sol','a-1']}]});await f.command({kind:'discovery-advance',at:1});for(let i=2;i<=5;i++)await f.command({kind:'discovery-advance',at:i});
 expect(f.current.play!.players.p1.ore).toBe(0);expect(f.current.play!.discovery!.powers.p1['a-1']).toBe(scenario==='split'?1:2);if(scenario==='split')expect(f.current.play!.discovery!.powers.p1['b-1']).toBe(1);
});

for(const branch of ['ore','grow','trade'] as const)test('compatibility: retained discovery Production '+branch+' preserves its old index and permits handoff',async()=>{
 const f=await fixture(),state=claimSnapshot(f,start.seed),p=state.players.p1;state.phase='production';
 Object.assign(p,{ore:2,population:1,supply:[3,4,3,3,2],oreDiscs:6,automation:2,research:['advanced-robotics','hypercomputing'],ships:[{id:'p1-ship-1',level:1,location:'sol'},{id:'p1-retained-level2',level:2,location:'sol'}]});
 state.discovery!.technologies=[{slot:'II-3',card:'hypercomputing'}];state.discovery!.completed={turn:2,card:'hypercomputing'};
 await f.integrationSnapshot(state,true);const saved=structuredClone(f.current.play!.discovery),move=f.move({kind:branch}),after=applyRemote(f.current,move);
 expect(after.play!.discovery).toEqual(saved);const forged=structuredClone(after);forged.play!.discovery!.powers.p1['*']=999;await assertFails(f.write(move,forged));await assertFails(f.write({...move,actorUid:f.guest},after,f.guest));await f.commit(move);
 if(branch==='ore')expect(f.current.play!.players.p1.ore).toBe(5);
 if(branch==='trade'){await f.command({kind:'sell-population'});await f.command({kind:'finish-trading'});}
 await f.command({kind:'end-turn'});expect(f.current.play!.activePosition).toBe('p2');expect(f.current.play!.discovery).toEqual(saved);
 await f.command({kind:'prepare-fleet-power',position:'p1'},'p2');expect(f.current.play!.discovery!.powers.p1['*']).toBe(3);
});

for(const kind of ['laser','terraforming','decommission'] as const)test('integration security: post-discovery '+kind+' preserves control topology and supports owned ships beyond index two',async()=>{
 const f=await fixture(),state=claimSnapshot(f,start.seed),p=state.players.p1;state.phase=kind==='decommission'?'trade':'action';
 p.population--;p.research=['advanced-robotics'];p.supply[0]-=3;p.ships.push(...[1,2,3].map(i=>({id:'p1-extra-'+i,level:1 as const,location:i===3?'a-1':'sol'})));
 state.discovery!.outposts['a-1']={owner:'p1',track:'food'};p.foodDiscs=7;
 await f.integrationSnapshot(state);
 const move=f.move(kind==='decommission'?{kind:'decommission',ship:'p1-extra-3'}:kind==='laser'?{kind:'research-I',space:0,card:'narrow-beam-lasers',ship:'p1-extra-3'}:{kind:'research-I',space:0,card:'terraforming'});
 const after=applyRemote(f.current,move),forged=structuredClone(after);forged.play!.discovery!.powers.p1['a-1']=999;
 await assertFails(f.write(move,forged));await assertFails(f.write({...move,actorUid:f.guest},after,f.guest));await f.commit(move);
 if(kind==='laser')expect(f.current.play!.players.p1.ships[3].level).toBe(2);
 if(kind==='terraforming')expect(f.current.play!.players.p1.ships.at(-1)?.location).toBe('deep-space');
 await f.automatic();expect(f.current.play!.phase).toBe(kind==='decommission'?'trade':'production');
 if(kind==='decommission'){expect(f.current.play!.discovery!.outposts['a-1']).toEqual({owner:'p1',track:'food'});expect(f.current.play!.players.p1.foodDiscs).toBe(7);}
});

for(const kind of ['upgrade','jump'] as const)test('integration security: exhausted '+kind+' has no invented choice and cannot skip an eligible fleet',async()=>{
 const f=await fixture(),state=claimSnapshot(f,start.seed),p=state.players.p1;state.phase='discovery';
 p.population--;if(kind==='upgrade')p.ships[0].level=4;else{p.population+=p.ships.length;p.ships=[];}
 state.discovery!.queue=[{kind:'effect',responder:'p1',source:kind==='upgrade'?'supply-outpost':'spacetime-anomaly-studies',effect:kind==='upgrade'?{kind:'upgrade',levels:1,ships:1}:{kind:'jump',amount:2}},{kind:'resume',responder:'p1',returnTo:'production'}];
 await f.integrationSnapshot(state);const advance=f.move({kind:'discovery-advance',at:0}),after=applyRemote(f.current,advance),forged=structuredClone(after);forged.play!.players.p1.ore++;
 await assertFails(f.write(advance,forged));await assertFails(f.write({...advance,actorUid:f.guest},after,f.guest));await f.commit(advance);await f.automatic();expect(f.current.play!.phase).toBe('production');
 const eligible=structuredClone(state);if(kind==='upgrade')eligible.players.p1.ships[0].level=1;else{eligible.players.p1.population--;eligible.players.p1.ships=[{id:'p1-ship-1',level:1,location:'sol'}];}
 await f.integrationSnapshot(eligible);const illegal=f.move({kind:'discovery-advance',at:0});const injected=structuredClone(f.current);injected.revision=illegal.revision;injected.lastCommand=illegal.commandId;injected.play!.discovery!.cursor++;injected.play!.discovery!.queue.shift();
 await assertFails(f.write(illegal,injected));
});

for(const source of ['alpha-centauri','gj-1061','epsilon-indi','groombridge-34','ad-leonis','dx-cancri','ross-154','tau-ceti'])for(const option of ['accept','pass'] as const)test('integration security: optional '+source+' '+option+' is paid once and responder-bound',async()=>{
 const f=await fixture(),state=claimSnapshot(f,start.seed),p=state.players.p1;state.phase='discovery';p.population--;p.research=['advanced-robotics'];
 if(source==='dx-cancri'){p.ships[0].location='b-1';state.discovery!.outposts['b-1']={owner:'p1',track:'food'};p.foodDiscs=7;}
 state.discovery!.queue=[{kind:'effect',responder:'p1',source,effect:{kind:'system-bonus',id:source,location:'b-1'}},{kind:'resume',responder:'p1',returnTo:'production'}];
 await f.integrationSnapshot(state);const before=structuredClone(f.current.play!.players.p1),move=f.move({kind:'discovery-choice',at:0,option,destination:'sol'}),after=applyRemote(f.current,move),forged=structuredClone(after);forged.play!.players.p1.ore++;
 await assertFails(f.write(move,forged));await assertFails(f.write({...move,actorUid:f.guest},after,f.guest));await f.commit(move);await assertFails(f.write(move,after));await f.automatic();
 if(option==='accept'&&source==='ad-leonis'){await f.command({kind:'discovery-choice',at:f.current.play!.discovery!.cursor,option:'advanced-genetics'});await f.automatic();}
 if(option==='accept'&&source==='dx-cancri'){await f.command({kind:'discovery-choice',at:f.current.play!.discovery!.cursor,option:'upgrade',ships:['p1-ship-1']});await f.automatic();}
 expect(f.current.play!.phase).toBe('production');const actor=f.current.play!.players.p1;
 if(option==='pass')expect(actor).toEqual(before);
 else if(source==='epsilon-indi'){expect(actor.ore).toBe(before.ore+3);expect(actor.population).toBe(before.population-1);}
 else if(source==='groombridge-34'){expect(actor.ore).toBe(before.ore-2);expect(actor.population).toBe(before.population-1);expect(actor.ships.at(-1)).toMatchObject({level:2,location:'sol'});}
 else if(source==='dx-cancri'){expect(actor.ore).toBe(before.ore-1);expect(actor.ships[0].level).toBe(2);}
 else if(source==='ad-leonis'){expect(actor.ore).toBe(before.ore-2);expect(actor.research).toContain('advanced-genetics');}
 else if(source==='ross-154'||source==='tau-ceti'){expect(actor.supply).toEqual([6,4,3,3,1]);}
 else expect(actor.ships.at(-1)).toMatchObject({level:1,location:source==='gj-1061'?'deep-space':'sol'});
});

for(const count of [1,18])test('integration security: Level I Lasers with '+count+' capped ships pays research without inventing an upgrade',async()=>{
 const f=await fixture(),state=claimSnapshot(f,start.seed),p=state.players.p1;state.phase='action';p.research=['advanced-robotics'];p.population=1;p.ships=Array.from({length:count},(_,i)=>({id:'p1-cap-'+i,level:4 as const,location:'sol'}));p.supply=count===18?[0,0,0,0,0]:[5,4,3,3,2];
 await f.integrationSnapshot(state);const old=structuredClone(f.current.play!.discovery),move=f.move({kind:'research-I',space:0,card:'narrow-beam-lasers'}),after=applyRemote(f.current,move),forged=structuredClone(after);forged.play!.players.p1.ships[0].level=3;
 await assertFails(f.write(move,forged));await assertFails(f.write({...move,move:{kind:'research-I',space:0,card:'narrow-beam-lasers',ship:'p1-cap-0'}},after));await f.commit(move);expect(f.current.play!.players.p1.ships).toEqual(p.ships);expect(f.current.play!.discovery).toEqual(old);expect(f.current.play!.phase).toBe('production');
});

for(const slot of ['II-1','II-2','II-3','II-4','II-5','II-6'])test('integration security: every printed discovery position '+slot+' authorizes exact payment and reveal',async()=>{
 const f=await fixture(),state=claimSnapshot(f,start.seed),p=state.players.p1;state.phase='action';state.turn=8;p.research=[...state.discovery!.basis];p.population=2;p.supply=[1,4,3,3,2];p.ore=10;
 await f.integrationSnapshot(state);const move=f.move({kind:'research-II',space:0,slot}),after=applyRemote(f.current,move),unpaid=structuredClone(after);unpaid.play!.players.p1.ore++;
 await assertFails(f.write(move,unpaid));await assertFails(f.write({...move,actorUid:f.guest},after,f.guest));await f.commit(move);
 expect(f.current.play!.phase).toBe('discovery');expect(f.current.play!.players.p1.ore).toBe(8);expect(f.current.play!.players.p1.population).toBe(1);expect(f.current.play!.discovery!.records[0].slot).toBe(slot);
});

for(const card of ['terraforming','narrow-beam-lasers'] as const)test('compatibility: cancel discovery preparation before fleet indexing then legally research '+card,async()=>{
 const f=await fixture();await f.command({kind:'research-I',space:0,card:'advanced-robotics'});await f.command({kind:'ore'});await f.command({kind:'end-turn'});
 await f.command({kind:'gather'},'p2');await f.command({kind:'ore'},'p2');await f.command({kind:'end-turn'},'p2');
 await f.command({kind:'prepare-discovery'});expect(f.current.play!.discovery!.powers).toEqual({});
 const saved=structuredClone(f.current.play!.discovery),move=f.move({kind:'research-I',space:1,card,...(card==='narrow-beam-lasers'?{ship:'p1-ship-1'}:{})}),after=applyRemote(f.current,move);
 expect(after.play!.discovery).toEqual(saved);const forged=structuredClone(after);forged.play!.discovery!.deckII.reverse();await assertFails(f.write(move,forged));
 const indexed=structuredClone(after);indexed.play!.discovery!.powers.p1={sol:999,'deep-space':0,'*':999};await assertFails(f.write(move,indexed));await assertFails(f.write({...move,actorUid:f.guest},after,f.guest));
 await f.commit(move);expect(f.current.play!.phase).toBe('production');await f.command({kind:'grow'});await f.command({kind:'end-turn'});await f.command({kind:'prepare-fleet-power',position:'p1'},'p2');
 expect(f.current.play!.discovery!.powers.p1['*']).toBe(2);
});

for(const eventKind of ['covert-arms-deal','experimental-prototypes'] as const)for(const layout of ['cardinal','corner'] as const)test('integration security: four physical '+layout+' responders dispatch '+eventKind+' atomically',async()=>{
 const {apply,clockwise}=await import('../../src/lib/table');
 const id=crypto.randomUUID(),uid=`discovery-table-${id}`,db=env.authenticatedContext(uid).firestore(),gameStart={...start,seed:eventKind==='covert-arms-deal'?'55555555-5555-4555-8555-00000000000a':'55555555-5555-4555-8555-000000000002'};let table:import('../../src/lib/table').Table|undefined;
 const append=async(extra:Partial<import('../../src/lib/table').TableEvent>)=>{const e:import('../../src/lib/table').TableEvent={schema:1,actorUid:uid,revision:table?table.revision+1:0,commandId:crypto.randomUUID(),type:'table-created',position:'',name:'',...extra},after=apply(table,e),batch=writeBatch(db);batch.set(doc(db,`games/${id}`),{...after,schema:1,mode:'tabletop',ownerUid:uid,lastCommand:e.commandId});batch.set(doc(db,`games/${id}/events/${e.commandId}`),e);if(e.move?.kind==='discovery-advance'&&table?.play?.discovery?.queue[0]?.kind==='event'&&(table.play.discovery.queue[0].stage==='dispatch'||table.play.discovery.queue[0].event==='experimental-prototypes'&&!('stage' in table.play.discovery.queue[0]))){
 const wrongOrder=structuredClone(after);[wrongOrder.play!.discovery!.queue[0],wrongOrder.play!.discovery!.queue[1]]=[wrongOrder.play!.discovery!.queue[1],wrongOrder.play!.discovery!.queue[0]];
 const duplicate=structuredClone(after);duplicate.play!.discovery!.queue[1]=structuredClone(duplicate.play!.discovery!.queue[0]);
 for(const forged of [wrongOrder,duplicate]){const invalid=writeBatch(db);invalid.set(doc(db,`games/${id}`),{...forged,schema:1,mode:'tabletop',ownerUid:uid,lastCommand:e.commandId});invalid.set(doc(db,`games/${id}/events/${e.commandId}`),e);await assertFails(invalid.commit());}
 }try{await assertSucceeds(batch.commit());}catch(cause){throw new Error('Shared '+layout+' rejected '+JSON.stringify({move:e.move,queue:table?.play?.discovery?.queue[0]}),{cause});}table=after;};
 const positions=(layout==='cardinal'?['west','north','east','south']:['north-west','north-east','south-east','south-west']) as import('../../src/lib/table').Position[],factions=['nishida','zheng','disciples','united-nations'] as const;
 await append({});for(const [i,position] of positions.entries())await append({type:'seat-joined',position,name:['Ada','Bora','Cleo','Dara'][i]});for(const [i,position] of positions.entries())await append({type:'table-faction-selected',position,faction:factions[i]});await append({type:'game-begun',start:gameStart});
 const order=clockwise(table!),initial=startingSetup(gameStart,order.map(position=>({position,name:table!.seats[position]!,faction:table!.factions![position]!})),{factions:'basic',achievements:'introductory'}),card=initial.technologies.find(t=>t.slot==='I-2')!.card as 'advanced-robotics'|'advanced-genetics'|'terraforming'|'narrow-beam-lasers';
 for(const [i,position] of order.entries()){const chosen=i===0?card:card==='advanced-robotics'?'advanced-genetics':'advanced-robotics';await append({type:'game-move',position,move:{kind:'research-I',space:i,card:chosen,...(chosen==='narrow-beam-lasers'?{ship:position+'-ship-1'}:{})}});await append({type:'game-move',position,move:{kind:'grow'}});await append({type:'game-move',position,move:{kind:'end-turn'}});}
 const move=async(command:TurnMove,position=order[0])=>append({type:'game-move',position,move:command});await move({kind:'prepare-discovery'});for(const position of order)await move({kind:'prepare-fleet-power',position});await move({kind:'research-II',space:0,slot:'II-3'});
 for(let i=0;i<35;i++){const d=table!.play!.discovery!,q=d.queue[0];if(q.kind==='candidate')break;if(canAdvanceDiscovery(projectGame(initial,table!.play!))){await move({kind:'discovery-advance',at:d.cursor},q.responder as typeof order[0]);continue;}if(q.kind==='event')await move({kind:'discovery-choice',at:d.cursor,option:q.event==='experimental-prototypes'?'keep':q.stage==='choose'?'1':'build'},q.responder as typeof order[0]);else if(q.kind==='effect'&&q.effect.kind==='upgrade')await move({kind:'discovery-choice',at:d.cursor,option:'upgrade',ships:[]},q.responder as typeof order[0]);else throw Error('Unhandled public queue '+JSON.stringify(q));}
 expect(table!.play!.discovery!.records[0].event).toBe(eventKind);expect(table!.play!.discovery!.queue[0].kind).toBe('candidate');expect(table!.play!.activePosition).toBe(order[0]);
});

test('integration security: another remote faction pays the surcharge for an already discovered Level II without a repeated Event',async()=>{
 const seed='55555555-5555-4555-8555-00000000000d',f=await fixture(seed),state=claimSnapshot(f,seed),d=state.discovery!,prerequisite=f.setup.technologies.find(t=>t.slot==='I-2')!.card;
 state.phase='action';state.turn=3;state.activePosition='p2';Object.assign(state.players.p1,{research:[prerequisite,'modular-fleet'],population:0,actionLocation:'research-II:0'});Object.assign(state.players.p2,{research:[prerequisite],population:1,ore:3,actionLocation:'research-I:1'});
 d.technologies=[{slot:'II-3',card:'modular-fleet'}];d.deckII=d.deckII.filter(card=>card!=='modular-fleet');d.records=[{slot:'II-3',event:'march-of-progress',chosen:'modular-fleet'}];d.events=[{id:'march-of-progress',slot:'II-3',resolved:true,choice:prerequisite}];d.completed={turn:2,card:'modular-fleet'};await f.integrationSnapshot(state);
 const move=f.move({kind:'research-II',space:1,slot:'II-3'},'p2'),after=applyRemote(f.current,move),free=structuredClone(after);free.play!.players.p2.ore++;const wrongSlot={...move,move:{kind:'research-II' as const,space:1,slot:'II-4'}};await assertFails(f.write(wrongSlot,after));await assertFails(f.write(move,free));await assertFails(f.write({...move,actorUid:f.host},after,f.host));await f.commit(move);await f.automatic();expect(f.current.play!.phase).toBe('production');expect(f.current.play!.players.p2.ore).toBe(0);expect(f.current.play!.players.p2.research).toEqual([prerequisite,'modular-fleet']);expect(f.current.play!.discovery!.events).toEqual(d.events);expect(f.current.play!.discovery!.records).toEqual(d.records);
});

for(const card of ['hypercomputing','human-experiments','psionics-research','multi-colony-symposium','exo-alloy-refinement','plasma-cannon','android-destroyers','modular-fleet','bio-synaptic-network','outer-sector-militia','mass-cloning','android-surveyors','spacetime-anomaly-studies','terranova-cruisers','supply-outpost','intersystem-diplomacy'])test('integration security: repeat research preserves the exact printed bonus queue for '+card,async()=>{
 const f=await fixture(),state=claimSnapshot(f,start.seed),d=state.discovery!;state.phase='action';state.turn=3;state.activePosition='p2';
 Object.assign(state.players.p1,{research:[...d.basis,card],population:0,supply:[3,3,3,3,2],actionLocation:'research-II:0'});Object.assign(state.players.p2,{research:[...d.basis],population:1,ore:4,supply:[2,3,3,3,2],actionLocation:'research-I:1'});
 d.technologies=[{slot:'II-3',card}];d.records=[{slot:'II-3',event:'march-of-progress',chosen:card}];d.events=[{id:'march-of-progress',slot:'II-3',resolved:true,choice:d.basis[1]}];await f.integrationSnapshot(state);
 const move=f.move({kind:'research-II',space:1,slot:'II-3'},'p2'),after=applyRemote(f.current,move),forged=structuredClone(after);forged.play!.discovery!.queue=[];
 await assertFails(f.write(move,forged));await f.commit(move);expect(f.current.play!.players.p2.ore).toBe(1);expect(f.current.play!.discovery!.queue.at(-1)).toEqual({kind:'resume',responder:'p2',card});expect(f.current.play!.discovery!.events).toEqual(d.events);
});

for(const tariffIndex of [0,5])test('integration security: resolved Research Tariffs at Event index '+tariffIndex+' adds its Ore to repeat-research surcharge',async()=>{
 const seed='55555555-5555-4555-8555-00000000000d',f=await fixture(seed),state=claimSnapshot(f,seed),d=state.discovery!,prerequisite=f.setup.technologies.find(t=>t.slot==='I-2')!.card;
 state.phase='action';state.turn=3;state.activePosition='p2';Object.assign(state.players.p1,{research:[prerequisite,'modular-fleet'],population:0,actionLocation:'research-II:0'});Object.assign(state.players.p2,{research:[prerequisite],population:1,ore:4,actionLocation:'research-I:1'});
 d.technologies=[{slot:'II-3',card:'modular-fleet'}];d.records=[{slot:'II-3',event:'march-of-progress',chosen:'modular-fleet'}];
 d.events=Array.from({length:tariffIndex},(_,i)=>({id:'march-of-progress',slot:'II-'+(i+1),resolved:true,choice:prerequisite}));d.events.push({id:'research-tariffs',slot:'II-6',resolved:true,target:'II-3'});await f.integrationSnapshot(state);
 const move=f.move({kind:'research-II',space:1,slot:'II-3'},'p2'),after=applyRemote(f.current,move),underpaid=structuredClone(after);underpaid.play!.players.p2.ore++;
 await assertFails(f.write(move,underpaid));await f.commit(move);expect(f.current.play!.players.p2.ore).toBe(0);expect(f.current.play!.discovery!.events).toEqual(d.events);
});

test('integration security: the final undiscovered two-prerequisite slot remains legal with five existing public discoveries',async()=>{
 const f=await fixture(),state=claimSnapshot(f,start.seed),d=state.discovery!,p=state.players.p1;state.phase='action';state.turn=12;p.supply[0]-=4;p.research=[...d.basis];p.ore=10;
 const slots=['II-1','II-2','II-3','II-4','II-6'],cards=['hypercomputing','human-experiments','psionics-research','modular-fleet','mass-cloning'];d.technologies=slots.map((slot,i)=>({slot,card:cards[i]}));d.records=slots.map((slot,i)=>({slot,event:d.eventDeck[Number(slot.slice(-1))-1],chosen:cards[i]}));d.events=d.records.map(r=>({id:r.event,slot:r.slot,resolved:true,...(r.event==='research-tariffs'?{target:'II-1'}:{})}));d.deckII=d.deckII.filter(card=>!cards.includes(card));await f.integrationSnapshot(state);
 const move=f.move({kind:'research-II',space:0,slot:'II-5'}),after=applyRemote(f.current,move),forged=structuredClone(after);forged.play!.discovery!.records[0].slot='II-5';await assertFails(f.write(move,forged));await f.commit(move);expect(f.current.play!.discovery!.records).toHaveLength(6);expect(f.current.play!.players.p1.ore).toBe(8);
});

test('security: split Level II proofs require both linked atomic documents and preserve every root/player field',async()=>{
 const f=await fixture(),state=claimSnapshot(f,start.seed),p=state.players.p1;state.phase='action';p.supply[0]-=4;p.research=[...state.discovery!.basis];p.ore=10;await f.integrationSnapshot(state);
 const move=f.move({kind:'research-II',space:0,slot:'II-3'}),after=applyRemote(f.current,move),db=env.authenticatedContext(f.host).firestore();
 await assertFails(setDoc(doc(db,`games/${f.id}`),after));await assertFails(setDoc(doc(db,`games/${f.id}/events/${move.commandId}`),move));
 for(const corrupt of [(a:RemoteRoom)=>{a.play!.turn++;},(a:RemoteRoom)=>{a.play!.activePosition='p2';},(a:RemoteRoom)=>{a.play!.players.p2.ore++;},(a:RemoteRoom)=>{a.play!.players.p1.ore++;},(a:RemoteRoom)=>{a.play!.players.p1.research.reverse();},(a:RemoteRoom)=>{a.play!.discovery!.deckII.reverse();}]){const forged=structuredClone(after);corrupt(forged);await assertFails(f.write(move,forged));}
 await f.commit(move);expect(f.current.play!.discovery!.records).toHaveLength(1);expect(f.current.play!.players.p1.ore).toBe(8);
});
