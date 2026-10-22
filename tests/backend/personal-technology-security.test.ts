import {supplyCapacity} from '../../src/lib/game/manifest';
import {levelThreeBonuses} from '../../src/lib/game/personal-level-three';
import {initializeBackendTestEnvironment} from '../../scripts/backend-rules-environment.mjs';
import {beforeAll,afterAll,test,expect} from 'bun:test';
import {assertFails,assertSucceeds,type RulesTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,getDoc,writeBatch,updateDoc,setDoc} from 'firebase/firestore';
import {readFileSync} from 'node:fs';
import {applyRemote,defaultSettings,type RemoteEvent,type RemoteRoom} from '../../src/lib/remote/model';
import {canAdvanceDiscovery} from '../../src/lib/game/discovery-resolution';
import {projectGame,initialPlay,economy,type PlayState,type TurnMove} from '../../src/lib/game/turn';
import {syncFleetPowers} from '../../src/lib/game/discovery-economy';
import {initialDiscovery} from '../../src/lib/game/discovery';
import type {JumpLeg} from '../../src/lib/game/discovery-movement';
import {startingSetup} from '../../src/lib/game/setup';
const start={version:'basic-2020-v1' as const,seed:'11111111-1111-4111-8111-000000000007'};
let env:RulesTestEnvironment;
beforeAll(async()=>{env=await initializeBackendTestEnvironment({projectId:'demo-beyond',firestore:{host:'127.0.0.1',port:Number(process.env.DISCOVERY_RULES_TEST_PORT??process.env.RULES_TEST_PORT??8197),rules:readFileSync(process.env.RULES_SOURCE_PATH??'firestore.rules','utf8')}});});
afterAll(async()=>{await env?.cleanup();});
async function fixture(seed=start.seed,settings=defaultSettings){
 const gameStart={...start,seed};
 const id=crypto.randomUUID(),host=`discovery-host-${id}`,guest=`discovery-guest-${id}`,code=Array.from(crypto.getRandomValues(new Uint8Array(5)),n=>String.fromCharCode(65+n%26)).join('');let current:RemoteRoom|undefined;
 const make=(extra:Partial<RemoteEvent>):RemoteEvent=>({schema:1,type:'remote-created',actorUid:host,revision:current?current.revision+1:0,commandId:crypto.randomUUID(),position:'p1',name:'Ada',ready:false,code,settings,configVersion:current?current.configVersion+1:0,...extra});
 // Reuse the real SDK connection for each distinct controller in this room.
 // Every command still executes the same atomic batch and authorization checks.
 const clients=new Map<string,ReturnType<ReturnType<RulesTestEnvironment['authenticatedContext']>['firestore']>>();
 const database=(uid:string)=>{let db=clients.get(uid);if(!db){db=env.authenticatedContext(uid).firestore();clients.set(uid,db);}return db;};
 const write=async(e:RemoteEvent,after:RemoteRoom,uid=e.actorUid)=>{const db=database(uid),batch=writeBatch(db);batch.set(doc(db,`games/${id}`),after);batch.set(doc(db,`games/${id}/events/${e.commandId}`),e);if(!current)batch.set(doc(db,`invites/${code}`),{gameId:id,ownerUid:host});return batch.commit();};
 const append=async(extra:Partial<RemoteEvent>)=>{const e=make(extra),after=applyRemote(current,e);try{await assertSucceeds(write(e,after));}catch(error){throw new Error(`Rejected fixture setup ${e.type} revision${e.revision}`,{cause:error});}current=after;};
 const positions=['p1','p2','p3','p4'].slice(0,settings.capacity),controllers:Record<string,string>={p1:host,p2:guest,p3:`discovery-third-${id}`,p4:`discovery-fourth-${id}`},names=['Ada','Bora','Cleo','Dara'],factions=['nishida','zheng','disciples','united-nations'];
 await append({});for(let i=1;i<positions.length;i++)await append({type:'remote-seat-claimed',actorUid:controllers[positions[i]],position:positions[i] as 'p2',name:names[i]});
 for(let i=0;i<positions.length;i++)await append({type:'remote-faction-selected',actorUid:controllers[positions[i]],position:positions[i] as 'p1',name:'',faction:factions[i] as 'nishida'});
 for(const position of positions)await append({type:'remote-ready-changed',actorUid:controllers[position],position:position as 'p1',name:'',ready:true,configVersion:current!.configVersion});
 await append({type:'remote-begun',position:'',name:'',start:gameStart,configVersion:current!.configVersion});
 const setup=startingSetup(gameStart,positions.map((position,i)=>({position,name:names[i],faction:factions[i] as 'nishida'})),settings);
 const f={id,host,guest,write,setup,async integrationSnapshot(play:PlayState,legacyPower=false){if(play.discovery){play.discovery.powers=Object.fromEntries(setup.players.map(p=>[p.position,{sol:0,'deep-space':0,...(!legacyPower?{'*':0}:{})}]));syncFleetPowers(setup,play);}const after={...current!,play};await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),`games/${id}`),after));current=after;},get current(){return current!;},move(move:TurnMove,position='p1'){return make({type:'game-move',actorUid:controllers[position],position:position as 'p1'|'p2',name:'',move,configVersion:current!.configVersion});},async commit(e:RemoteEvent){const after=applyRemote(current,e);try{await assertSucceeds(write(e,after));}catch(error){throw new Error('Rejected discovery command '+JSON.stringify({move:e.move,queue:current?.play?.discovery?.queue[0]}),{cause:error});}current=after;},async command(move:TurnMove,position='p1'){await this.commit(this.move(move,position));},async preparePowers(){for(const actor of setup.players)await this.command({kind:'prepare-fleet-power',position:actor.position});},async automatic(){for(let i=0;i<100&&canAdvanceDiscovery(projectGame(setup,current!.play));i++)await this.command({kind:'discovery-advance',at:current!.play!.discovery!.cursor},current!.play!.discovery!.queue[0].responder);}};
 return f;
}


// Retained integration fixtures isolate atomic personal-card authorization.
// Ordinary acquisition and controller isolation are reviewed through real UI separately.
async function pendingPersonal(card='hypercomputing'){
 const source=card in levelThreeBonuses?'wise-1541-2250':'procyon';
 const f=await fixture(),state=initialPlay(f.setup);state.discovery=initialDiscovery(start.seed,2,0);state.phase='discovery';
 for(const p of f.setup.players)state.players[p.position]=economy(p);
 state.players.p1.ore=6;state.players.p2.ore=5;
 if(source==='procyon')state.discovery.deckII=[card,...state.discovery.deckII.filter(id=>id!==card)];else state.discovery.deckIII=[card,...state.discovery.deckIII!.filter(id=>id!==card)];
 state.discovery.colonies=[{owner:'p1',card:source,origin:'a-1',discs:[{track:'food'},{track:'ore'}],turn:0,settledPower:4}];
 state.discovery.queue=[{kind:'colony',responder:'p1',source:'terraforming',slot:'a-1',card:source,settlers:[],power:4,actors:['p1','p2'],stage:'bonus',index:0},{kind:'resume',responder:'p1',returnTo:'production'}];
 await f.integrationSnapshot(state);return f;
}
test('personal acquisition binds top deck, owner, exact bonus and attribution atomically; no cube or forged future draw',async()=>{
 const f=await pendingPersonal(),e=f.move({kind:'discovery-advance',at:0}),after=applyRemote(f.current,e),db=env.authenticatedContext(f.host).firestore();
 await assertFails(f.write(e,after,f.guest));
 await assertFails(setDoc(doc(db,`games/${f.id}`),after));await assertFails(setDoc(doc(db,`games/${f.id}/events/${e.commandId}`),e));
 for(const kind of ['owner','card','deck','bonus','cube','boundary']as const){const bad=structuredClone(after),d=bad.play!.discovery!;
  if(kind==='owner')d.personalTechnologies![0].owner='p2';
  if(kind==='card')d.personalTechnologies![0].card='plasma-cannon';
  if(kind==='deck')d.deckII=d.deckII.slice(1);
  if(kind==='bonus')(d.queue[0]as any).effect={kind:'ore',amount:99};
  if(kind==='cube'){bad.play!.players.p1.population--;bad.play!.players.p1.research.push('hypercomputing');}
  if(kind==='boundary')delete d.revealBoundary;
  await assertFails(f.write(e,bad));
 }
 const before=structuredClone(f.current.play!.players);await f.commit(e);expect(f.current.play!.players).toEqual(before);expect(f.current.play!.discovery!.personalTechnologies).toEqual([{owner:'p1',source:'procyon',card:'hypercomputing',turn:0}]);
 const stored=await getDoc(doc(db,`games/${f.id}`));expect(stored.data()!.play.discovery.personalTechnologies).toEqual(f.current.play!.discovery!.personalTechnologies);
 await f.automatic();expect(f.current.play!.phase).toBe('production');expect(f.current.play!.players.p1.automation).toBe(1);expect(f.current.play!.players.p1.research).not.toContain('hypercomputing');
 await assertFails(f.write(e,after));
});
test('owner personal Action preserves actual cost and occupied-space rules; rival controller and forged rival Action denied',async()=>{
 const f=await pendingPersonal('plasma-cannon');await f.command({kind:'discovery-advance',at:0});await f.automatic();
 expect(f.current.play!.discovery!.queue[0]).toMatchObject({kind:'effect',effect:{kind:'jump'}});
 await f.command({kind:'discovery-choice',at:f.current.play!.discovery!.cursor,option:'jump',legs:[]});await f.automatic();
 const state=structuredClone(f.current.play!);state.phase='action';state.players.p1.actionLocation='gather';await f.integrationSnapshot(state);
 const move={kind:'technology-action' as const,card:'plasma-cannon',action:0,space:0,destination:'sol'},e=f.move(move),after=applyRemote(f.current,e);
 await assertFails(f.write(e,after,f.guest));const free=structuredClone(after);free.play!.players.p1.ore++;await assertFails(f.write(e,free));
 await f.commit(e);expect(f.current.play!.players.p1.ore).toBe(state.players.p1.ore-2);expect(f.current.play!.discovery!.queue[0]).toMatchObject({kind:'effect',source:'plasma-cannon',effect:{kind:'ship',level:3,cube:'population',location:'sol'}});
 const rival=structuredClone(state);rival.activePosition='p2';await f.integrationSnapshot(rival);expect(()=>applyRemote(f.current,f.move(move,'p2'))).toThrow('personal technology');
 const re=f.move(move,'p2'),forged=structuredClone(f.current);forged.revision=re.revision;forged.lastCommand=re.commandId;forged.play!.phase='discovery';forged.play!.players.p2.ore-=2;forged.play!.players.p2.actionLocation='technology:plasma-cannon:0:0';forged.play!.discovery!.queue=[{kind:'effect',responder:'p2',source:'plasma-cannon',effect:{kind:'ship',level:3,cube:'population',location:'sol'}},{kind:'effect',responder:'p2',source:'plasma-cannon',effect:{kind:'jump',amount:3}},{kind:'resume',responder:'p2',returnTo:'production'}];await assertFails(f.write(re,forged));
});

test('a rival cannot copy a personal immediate bonus; its real Bio-Synaptic alternative remains writable',async()=>{
 const f=await pendingPersonal('plasma-cannon');await f.command({kind:'discovery-advance',at:0});
 const state=structuredClone(f.current.play!);state.activePosition='p2';state.discovery!.queue=[{kind:'effect',responder:'p2',source:'bio-synaptic-network',effect:{kind:'choice',id:'bio-synaptic'}}];await f.integrationSnapshot(state);
 const move={kind:'discovery-choice' as const,at:state.discovery!.cursor,option:'copy',target:'plasma-cannon'},e=f.move(move,'p2');expect(()=>applyRemote(f.current,e)).toThrow('discovered Level II');
 const forged=structuredClone(f.current);forged.revision=e.revision;forged.lastCommand=e.commandId;forged.play!.discovery!.cursor++;forged.play!.discovery!.queue=[{kind:'effect',responder:'p2',source:'plasma-cannon',effect:{kind:'ship',level:3}},{kind:'effect',responder:'p2',source:'plasma-cannon',effect:{kind:'jump',amount:1}}];await assertFails(f.write(e,forged));
 await f.command({kind:'discovery-choice',at:state.discovery!.cursor,option:'automate',track:'ore'},'p2');await f.automatic();expect(f.current.play!.players.p2.automation).toBe(1);expect(f.current.play!.players.p2.ore).toBe(state.players.p2.ore+2);expect(f.current.play!.discovery!.personalTechnologies![0].owner).toBe('p1');
});

test('a personal colonization Action pays its exact printed cost without a research cube or public-slot duplicate',async()=>{
 const f=await fixture(),state=initialPlay(f.setup);state.discovery=initialDiscovery(start.seed,2,0);for(const p of f.setup.players)state.players[p.position]=economy(p);
 const p=state.players.p1;p.research=['terraforming'];p.supply[0]-=2;p.ore=6;p.foodDiscs=6;p.oreDiscs=7;p.ships=[{id:'settle-one',level:2,location:'a-1'},{id:'settle-two',level:2,location:'a-1'}];state.discovery.systemBasis['a-1']='sirius';state.discovery.outposts['a-1']={owner:'p1',track:'ore'};state.discovery.deckII=state.discovery.deckII.filter(id=>id!=='android-surveyors');state.discovery.personalTechnologies=[{owner:'p1',card:'android-surveyors',source:'procyon',turn:0}];state.discovery.colonies=[{owner:'p1',card:'procyon',origin:'a-1',discs:[{track:'food'},{track:'food'}],turn:0,settledPower:4}];await f.integrationSnapshot(state);
 await f.command({kind:'colonize',source:'android-surveyors',slot:'a-1',ships:p.ships});expect(f.current.play!.players.p1.ore).toBe(2);expect(f.current.play!.players.p1.population).toBe(p.population);expect(f.current.play!.players.p1.research).toEqual(['terraforming']);await f.automatic();expect(f.current.play!.players.p1.population).toBe(p.population+1);expect(f.current.play!.discovery!.colonies).toHaveLength(2);expect(f.current.play!.discovery!.technologies.some(t=>t.card==='android-surveyors')).toBe(false);
});

// Retained integration fixtures exercise every possible *actual* top Level II
// draw; the browser replays above acquire Procyon through ordinary paid turns.
// Prove the canonical root/event queue for each face remains writable while a
// forged extra benefit is rejected, including faces with no immediate effect.
for(const card of ['hypercomputing','human-experiments','psionics-research','multi-colony-symposium','exo-alloy-refinement','plasma-cannon','android-destroyers','modular-fleet','bio-synaptic-network','outer-sector-militia','mass-cloning','android-surveyors','spacetime-anomaly-studies','terranova-cruisers','supply-outpost','intersystem-diplomacy'])test(`personal top draw ${card} binds its exact printed immediate queue and never another draw`,async()=>{
 const f=await pendingPersonal(card),e=f.move({kind:'discovery-advance',at:0}),after=applyRemote(f.current,e),before=structuredClone(f.current.play!.players),deck=f.current.play!.discovery!.deckII;
 const forged=structuredClone(after);forged.play!.discovery!.queue.unshift({kind:'effect',responder:'p1',source:card,effect:{kind:'ore',amount:99}});await assertFails(f.write(e,forged));
 await f.commit(e);expect(f.current.play!.players).toEqual(before);expect(f.current.play!.discovery!.deckII).toEqual(deck.slice(1));expect(f.current.play!.discovery!.personalTechnologies).toEqual([{owner:'p1',card,source:'procyon',turn:0}]);expect(f.current.play!.discovery!.records).toEqual([]);expect(f.current.play!.discovery!.events).toEqual([]);
 await assertFails(f.write(e,after));
});

for(const card of Object.keys(levelThreeBonuses))test(`WISE actual top ${card} binds exclusive owner and exact printed immediate queue`,async()=>{
 const f=await pendingPersonal(card),e=f.move({kind:'discovery-advance',at:0}),after=applyRemote(f.current,e),before=structuredClone(f.current.play!.players);
 await assertFails(f.write(e,after,f.guest));
 const forged=structuredClone(after);forged.play!.discovery!.queue.unshift({kind:'effect',responder:'p1',source:card,effect:{kind:'ore',amount:10}});await assertFails(f.write(e,forged));
 await f.commit(e);expect(f.current.play!.players).toEqual(before);expect(f.current.play!.discovery!.personalTechnologies![0]).toEqual({owner:'p1',card,source:'wise-1541-2250',turn:0});expect(f.current.play!.discovery!.deckIII).not.toContain(card);expect(f.current.play!.players.p1.research).not.toContain(card);
 await f.automatic();
 for(let i=0;i<60&&f.current.play!.phase!=='production';i++){
  const state=f.current.play!,q=state.discovery!.queue[0],p=state.players.p1;if(q.kind!=='effect')throw new Error('Expected a printed WISE effect');const effect=q.effect;let option='pass',extra:Record<string,unknown>={};
  if(effect.kind==='automate')option='food';else if(effect.kind==='jump'){option='jump';extra={legs:[]};}else if(effect.kind==='upgrade'){option='upgrade';extra={ships:p.ships.filter(s=>s.level<4).slice(0,effect.ships).map(s=>s.id)};}else if(effect.kind==='choice'&&effect.id==='android-armada')option='population';else if(effect.kind==='ship'){option='build';extra={destination:'sol'};}else if(effect.kind==='redistribute-supply'){option='redistribute';const supply=[...p.supply],columns:number[]=[];const n=Math.min(2,supply.reduce((a,b)=>a+b,0));for(let j=0;j<n;j++)supply[supply.findLastIndex(v=>v>0)]--;for(let j=0;j<n;j++){const index=supply.findIndex((v,i)=>v<supplyCapacity[i]);columns.push(index);supply[index]++;}extra={columns};}
  const e=f.move({kind:'discovery-choice',at:state.discovery!.cursor,option,...extra}),next=applyRemote(f.current,e);await assertFails(f.write(e,next,f.guest));await f.commit(e);await f.automatic();
 }
 expect(f.current.play!.phase).toBe('production');expect(f.current.play!.players.p1.research).not.toContain(card);expect(f.current.play!.discovery!.personalTechnologies).toHaveLength(1);
});

test('Supply redistribution couples every column and its owner event; split/forged A–E writes cannot mint cubes',async()=>{
 const f=await pendingPersonal('android-rights-movement');await f.command({kind:'discovery-advance',at:0});await f.automatic();
 const e=f.move({kind:'discovery-choice',at:f.current.play!.discovery!.cursor,option:'redistribute',columns:[4,4]}),after=applyRemote(f.current,e),db=env.authenticatedContext(f.host).firestore();
 await assertFails(setDoc(doc(db,`games/${f.id}`),after));await assertFails(setDoc(doc(db,`games/${f.id}/events/${e.commandId}`),e));
 for(let i=0;i<5;i++){const bad=structuredClone(after);bad.play!.players.p1.supply[i]++;await assertFails(f.write(e,bad));}
 await f.commit(e);await f.automatic();expect(f.current.play!.phase).toBe('production');
});
for(const card of ['hyperdrive-boosters','android-armada','manufacturing-orbitals','mercenary-fleet','capital-ship'])test(`personal ${card} uses only its owner's actual printed Action and exact cost`,async()=>{
 const f=await pendingPersonal(card);await f.command({kind:'discovery-advance',at:0});const retained=structuredClone(f.current.play!);retained.discovery!.queue=[];retained.phase='action';retained.players.p1.actionLocation='gather';await f.integrationSnapshot(retained);
 const action=card==='mercenary-fleet'?1:0,build=['android-armada','mercenary-fleet','capital-ship'].includes(card),e=f.move({kind:'technology-action',card,action,space:0,...(build?{destination:'sol'}:{})}),after=applyRemote(f.current,e);
 await assertFails(f.write(e,after,f.guest));const free=structuredClone(after);free.play!.players.p1.ore++;await assertFails(f.write(e,free));await f.commit(e);
 expect(f.current.play!.players.p1.ore).toBe(retained.players.p1.ore-({'android-armada':4,'mercenary-fleet':1,'capital-ship':3}[card]??0));expect(f.current.play!.players.p1.research).not.toContain(card);
});

test('Transdimensional AI places one cube on a discovered technology without prerequisites or replaying its bonus',async()=>{
 const f=await pendingPersonal('transdimensional-ai');await f.command({kind:'discovery-advance',at:0});await f.automatic();const state=structuredClone(f.current.play!);state.discovery!.technologies=[{slot:'II-2',card:'hypercomputing'}];await f.integrationSnapshot(state);
 const before=structuredClone(state.players.p1),e=f.move({kind:'discovery-choice',at:state.discovery!.cursor,option:'hypercomputing'}),after=applyRemote(f.current,e);const bad=structuredClone(after);bad.play!.players.p1.automation++;await assertFails(f.write(e,bad));await f.commit(e);await f.automatic();
 expect(f.current.play!.players.p1.population).toBe(before.population-1);expect(f.current.play!.players.p1.automation).toBe(before.automation);expect(f.current.play!.players.p1.research).toContain('hypercomputing');expect(f.current.play!.phase).toBe('production');
});

test('Android Rights Movement replaces exactly one printed Population return with one paid Ore during colonization',async()=>{
 const f=await pendingPersonal('android-rights-movement');await f.command({kind:'discovery-advance',at:0});const state=structuredClone(f.current.play!);state.phase='action';state.discovery!.queue=[];state.discovery!.systemBasis['a-1']='barnards-star';state.players.p1.research=['terraforming'];state.players.p1.supply[0]--;state.players.p1.ships[0]={...state.players.p1.ships[0],level:3,location:'a-1'};state.discovery!.outposts['a-1']={owner:'p1',track:'food'};state.players.p1.foodDiscs--;await f.integrationSnapshot(state);
 const e=f.move({kind:'colonize',source:'terraforming',slot:'a-1',ships:state.players.p1.ships,substitutePopulation:true}),after=applyRemote(f.current,e),free=structuredClone(after);free.play!.players.p1.ore++;await assertFails(f.write(e,free));await f.commit(e);expect(f.current.play!.players.p1.ore).toBe(state.players.p1.ore-4);expect(f.current.play!.players.p1.population).toBe(state.players.p1.population);expect(f.current.play!.players.p1.supply).toEqual(state.players.p1.supply);
});
test('Subatomic Fabrication permits its owner to take the other track for a printed automation bonus',async()=>{
 const f=await pendingPersonal('subatomic-fabrication');await f.command({kind:'discovery-advance',at:0});const state=structuredClone(f.current.play!);state.discovery!.queue=[{kind:'effect',responder:'p1',source:'hypercomputing',effect:{kind:'automate',track:'ore'}},{kind:'resume',responder:'p1',returnTo:'production'}];await f.integrationSnapshot(state);
 const before=structuredClone(state.players.p1);await f.command({kind:'discovery-choice',at:state.discovery!.cursor,option:'food'});expect(f.current.play!.players.p1.foodDiscs).toBe(before.foodDiscs-1);expect(f.current.play!.players.p1.oreDiscs).toBe(before.oreDiscs);expect(f.current.play!.players.p1.automation).toBe(before.automation+1);
});

test('ordinary Level I research honors Subatomic Fabrication track choice without altering its Population or Ore bonus',async()=>{
 const f=await pendingPersonal('subatomic-fabrication');await f.command({kind:'discovery-advance',at:0});const state=structuredClone(f.current.play!);state.phase='action';state.discovery!.queue=[];state.players.p1.actionLocation='gather';await f.integrationSnapshot(state);
 const before=structuredClone(state.players.p1),e=f.move({kind:'research-I',space:0,card:'advanced-genetics',automationTrack:'ore'}),after=applyRemote(f.current,e);const both=structuredClone(after);both.play!.players.p1.foodDiscs--;await assertFails(f.write(e,both));await assertFails(f.write(e,after,f.guest));await f.commit(e);
 expect(f.current.play!.players.p1.foodDiscs).toBe(before.foodDiscs);expect(f.current.play!.players.p1.oreDiscs).toBe(before.oreDiscs-1);expect(f.current.play!.players.p1.population).toBe(before.population);expect(f.current.play!.players.p1.ore).toBe(before.ore);expect(f.current.play!.players.p1.research).toEqual(['advanced-genetics']);
 const other=structuredClone(f.current.play!);other.phase='action';other.activePosition='p2';await f.integrationSnapshot(other);expect(()=>applyRemote(f.current,f.move({kind:'research-I',space:1,card:'advanced-robotics',automationTrack:'food'},'p2'))).toThrow('Only Subatomic');
});

test('Wormhole immediate jumps are unrestricted, later Sol jumps are adjacent, and topology cannot be forged',async()=>{
 const f=await pendingPersonal('wormhole-technology');await f.command({kind:'discovery-advance',at:0});await f.automatic();const start=structuredClone(f.current.play!);start.discovery!.systemBasis['b-2']='kruger-60';await f.integrationSnapshot(start);
 const ships=start.players.p1.ships,index=ships.length-1,legs=[{ship:ships[index].id,index,path:['sol','b-2']}];const e=f.move({kind:'discovery-choice',at:start.discovery!.cursor,option:'jump',legs}),after=applyRemote(f.current,e),lost=structuredClone(after);delete(lost.play!.discovery!.queue[0] as any).topology;await assertFails(f.write(e,lost));await f.commit(e);await f.automatic();expect(f.current.play!.phase).toBe('production');expect(f.current.play!.players.p1.ships[index].location).toBe('b-2');
 const later=structuredClone(f.current.play!);later.phase='discovery';later.discovery!.queue=[{kind:'effect',responder:'p1',source:'terraforming',effect:{kind:'jump',amount:2}},{kind:'resume',responder:'p1',returnTo:'production'}];await f.integrationSnapshot(later);
 expect(()=>applyRemote(f.current,f.move({kind:'discovery-choice',at:later.discovery!.cursor,option:'jump',legs:[{ship:ships[0].id,index:0,path:['sol','b-2']}]}))).toThrow('adjacent');
 const next=f.move({kind:'discovery-choice',at:later.discovery!.cursor,option:'jump',legs:[{ship:ships[index].id,index,path:['b-2','sol']}]}),valid=applyRemote(f.current,next),forged=structuredClone(valid);(forged.play!.discovery!.queue[0]as any).topology='any';await assertFails(f.write(next,forged));await f.commit(next);await f.automatic();expect(f.current.play!.players.p1.ships[index].location).toBe('sol');
});

test('Manufacturing Orbitals pays capped control Ore, Population per two colonies and an optional Population ship in order',async()=>{
 const f=await pendingPersonal('manufacturing-orbitals');await f.command({kind:'discovery-advance',at:0});const state=structuredClone(f.current.play!);state.discovery!.colonies=['barnards-star','sirius','wolf-359','wise-1541-2250'].map(card=>({owner:'p1',card,origin:'a-1',discs:[{track:'food' as const},{track:'food' as const}],turn:0,settledPower:5}));state.discovery!.outposts={'a-1':{owner:'p1',track:'food'},'b-1':{owner:'p1',track:'ore'},'shipyard-north':{owner:'p1',track:'food'}};state.players.p1.foodDiscs-=2;state.players.p1.oreDiscs--;await f.integrationSnapshot(state);
 const before=structuredClone(state.players.p1);await f.automatic();expect(f.current.play!.players.p1.ore).toBe(before.ore+3);expect(f.current.play!.players.p1.population).toBe(before.population+2);
 await f.command({kind:'discovery-choice',at:f.current.play!.discovery!.cursor,option:'build'});await f.automatic();const q=f.current.play!.discovery!.queue[0];expect(q).toMatchObject({kind:'effect',effect:{kind:'ship',level:2,cube:'population'}});
 await f.command({kind:'discovery-choice',at:f.current.play!.discovery!.cursor,option:'build',destination:'sol'});await f.automatic();expect(f.current.play!.players.p1.population).toBe(before.population+1);expect(f.current.play!.players.p1.ships.at(-1)?.level).toBe(2);expect(f.current.play!.discovery!.queue[0]).toMatchObject({kind:'effect',effect:{kind:'jump',amount:2}});
});
test('WISE coexists with a retained Procyon card and preserves its exact owner without another cube',async()=>{
 const f=await pendingPersonal('quantum-data-exchange');const state=structuredClone(f.current.play!);state.discovery!.personalTechnologies=[{owner:'p2',card:'plasma-cannon',source:'procyon',turn:0}];state.discovery!.deckII=state.discovery!.deckII.filter(id=>id!=='plasma-cannon');state.discovery!.colonies!.unshift({owner:'p2',card:'procyon',origin:'a-2',discs:[{track:'food'},{track:'ore'}],turn:0,settledPower:4});state.players.p2.foodDiscs--;state.players.p2.oreDiscs--;await f.integrationSnapshot(state);await f.command({kind:'discovery-advance',at:state.discovery!.cursor});await f.automatic();expect(f.current.play!.discovery!.personalTechnologies).toEqual([{owner:'p2',card:'plasma-cannon',source:'procyon',turn:0},{owner:'p1',card:'quantum-data-exchange',source:'wise-1541-2250',turn:0}]);expect(f.current.play!.players.p1.research).not.toContain('quantum-data-exchange');expect(f.current.play!.players.p2.research).not.toContain('plasma-cannon');
});
test('retained Level III deck preparation is one-way and cannot change payment, queues, ownership or deck quantities',async()=>{
 const f=await fixture();await f.command({kind:'prepare-discovery'});const state=structuredClone(f.current.play!);delete state.discovery!.deckIII;await f.integrationSnapshot(state);const e=f.move({kind:'prepare-personal-deck'}),after=applyRemote(f.current,e);
 await assertFails(f.write(e,after,f.guest));for(const kind of ['quantity','payment','queue']as const){const forged=structuredClone(after);if(kind==='quantity')forged.play!.discovery!.deckIII!.pop();if(kind==='payment'){forged.play!.players.p1=economy(f.setup.players[0]);forged.play!.players.p1.ore++;}if(kind==='queue')forged.play!.discovery!.queue=[{kind:'resume',responder:'p1',returnTo:'production'}];await assertFails(f.write(e,forged));}await f.commit(e);expect(f.current.play!.discovery!.deckIII).toHaveLength(16);expect(()=>applyRemote(f.current,f.move({kind:'prepare-personal-deck'}))).toThrow('already prepared');
});

test('Android Destroyers cannot silently ignore a higher personal Level III, even on the public Action',async()=>{
 const f=await pendingPersonal('quantum-data-exchange');await f.command({kind:'discovery-advance',at:0});await f.automatic();const state=structuredClone(f.current.play!);state.phase='action';state.discovery!.queue=[];state.players.p1.research=['android-destroyers'];state.players.p1.supply[0]--;state.discovery!.technologies=[{slot:'II-1',card:'android-destroyers'}];state.discovery!.deckII=state.discovery!.deckII.filter(id=>id!=='android-destroyers');await f.integrationSnapshot(state);
 const e=f.move({kind:'technology-action',card:'android-destroyers',action:0,space:0,destination:'sol'});expect(()=>applyRemote(f.current,e)).toThrow('higher-level personal');const bad=structuredClone(f.current);bad.revision=e.revision;bad.lastCommand=e.commandId;bad.play!.phase='discovery';bad.play!.players.p1.ore-=2;bad.play!.players.p1.actionLocation='technology:android-destroyers:0:0';bad.play!.discovery!.queue=[{kind:'effect',responder:'p1',source:'android-destroyers',effect:{kind:'ship',level:2,location:'sol'}},{kind:'effect',responder:'p1',source:'android-destroyers',effect:{kind:'jump',amount:3}},{kind:'resume',responder:'p1',returnTo:'production'}];await assertFails(f.write(e,bad));
});
test('personal Android Destroyers is usable when researched Level II already fixes X identically under either interpretation',async()=>{
 const f=await pendingPersonal('android-destroyers');await f.command({kind:'discovery-advance',at:0});await f.automatic();const state=structuredClone(f.current.play!);state.phase='action';state.discovery!.queue=[];state.players.p1.research=['hypercomputing'];state.players.p1.supply[0]--;state.discovery!.technologies=[{slot:'II-1',card:'hypercomputing'}];state.discovery!.deckII=state.discovery!.deckII.filter(id=>id!=='hypercomputing');await f.integrationSnapshot(state);
 const before=state.players.p1.ore;await f.command({kind:'technology-action',card:'android-destroyers',action:0,space:0,destination:'sol'});expect(f.current.play!.players.p1.ore).toBe(before-2);expect(f.current.play!.discovery!.queue[0]).toMatchObject({kind:'effect',effect:{kind:'ship',level:2}});
});

test('accepted Population-to-ship effect cannot skip payment through the exhausted Supply exception',async()=>{
 const f=await pendingPersonal('manufacturing-orbitals');await f.command({kind:'discovery-advance',at:0});const state=structuredClone(f.current.play!);
 state.players.p1.population=2;state.players.p1.supply=[0,0,0,0,0];state.players.p1.ships=Array.from({length:18},(_,i)=>({id:'paid-pop-ship-'+i,level:1 as const,location:'sol'}));state.discovery!.outposts['shipyard-north']={owner:'p1',track:'food'};state.players.p1.foodDiscs--;
 state.discovery!.queue=[{kind:'effect',responder:'p1',source:'manufacturing-orbitals',effect:{kind:'ship',level:2,cube:'population'}},{kind:'resume',responder:'p1',returnTo:'production'}];await f.integrationSnapshot(state);
 const e=f.move({kind:'discovery-choice',at:state.discovery!.cursor,option:'pass'});expect(()=>applyRemote(f.current,e)).toThrow();const skipped=structuredClone(f.current);skipped.revision=e.revision;skipped.lastCommand=e.commandId;skipped.play!.discovery!.cursor++;skipped.play!.discovery!.queue.shift();await assertFails(f.write(e,skipped));
 await f.command({kind:'discovery-choice',at:state.discovery!.cursor,option:'build',destination:'sol'});expect(f.current.play!.players.p1.population).toBe(1);expect(f.current.play!.players.p1.ships).toHaveLength(19);
});
