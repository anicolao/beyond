import {test,expect} from 'bun:test';
import {startingSetup,setupDecks} from '../../src/lib/game/setup';
import {initialDiscovery,publicDiscovery} from '../../src/lib/game/discovery';
import {initialPlay,projectGame} from '../../src/lib/game/turn';
import {acquirePersonalTechnology,personalTechnologies,personalTechnologyPoints,personalTechnologyTargetBlocker} from '../../src/lib/game/personal-technologies';
function fixture(source:'procyon'|'wise-1541-2250'='procyon'){
 const seed='55555555-5555-4555-8555-000000000002';
 const initial=startingSetup({version:'basic-2020-v1',seed},[{position:'p1',name:'Ada',faction:'nishida'},{position:'p2',name:'Bora',faction:'zheng'}],{factions:'basic',achievements:'introductory'});
 const state=initialPlay(initial);state.discovery=initialDiscovery(seed,2,0);state.phase='discovery';state.discovery.colonies=[{owner:'p1',card:source,origin:'a-1',discs:[{track:'food'},{track:'food'}],turn:0,settledPower:4}];state.discovery.queue=[{kind:'colony',responder:'p1',source:'terraforming',slot:'a-1',card:source,settlers:[],power:4,actors:['p1','p2'],stage:'bonus',index:0}];return {initial,state};
}
test('personal acquisition consumes the retained top card without a research cube or another player economy change',()=>{
 const {initial,state}=fixture();state.discovery!.deckII=['plasma-cannon','hypercomputing'];const before=structuredClone(state.players),research=structuredClone(initial.players.map(p=>p.research));
 expect(acquirePersonalTechnology(initial,state,'p1','procyon')).toEqual({owner:'p1',card:'plasma-cannon',source:'procyon',turn:0});
 expect(state.discovery!.deckII).toEqual(['hypercomputing']);expect(state.players).toEqual(before);expect(initial.players.map(p=>p.research)).toEqual(research);
 const game=projectGame(initial,state);expect(personalTechnologies(game,'p1').map(t=>t.card)).toEqual(['plasma-cannon']);expect(personalTechnologies(game,'p2')).toEqual([]);expect(personalTechnologyPoints(game,'p1')).toBe(2);expect(game.technologies.some(t=>t.card==='plasma-cannon')).toBe(false);
 expect(()=>acquirePersonalTechnology(initial,state,'p1','procyon')).toThrow('already acquired');
});
test('Level III draw uses the canonical seeded deck, remains public personal ownership and conceals future cards',()=>{
 const {initial,state}=fixture('wise-1541-2250'),deck=setupDecks(state.discovery!.seed,2).technologies.III;
 const record=acquirePersonalTechnology(initial,state,'p1','wise-1541-2250');expect(record.card).toBe(deck[0]);expect(state.discovery!.deckIII).toEqual(deck.slice(1));
 const game=projectGame(initial,JSON.parse(JSON.stringify(state)));expect(personalTechnologyPoints(game,'p1')).toBe(3);expect(game.discovery).not.toHaveProperty('deckIII');expect(game.discovery).not.toHaveProperty('deckII');expect(publicDiscovery(state.discovery!).personalTechnologies).toEqual([record]);
 expect(personalTechnologyTargetBlocker(game,'p2',record.card)).toContain('cannot be researched, copied or targeted');expect(personalTechnologyTargetBlocker(game,'p1',record.card)).toBe('');
});
test('foreign responder, wrong continuation, wrong deck level and duplicate in-play card reject without any mutation',()=>{
 const {initial,state}=fixture();const original=structuredClone(state);
 expect(()=>acquirePersonalTechnology(initial,state,'p2','procyon')).toThrow('saved owner');expect(state).toEqual(original);
 state.discovery!.queue=[];const absent=structuredClone(state);expect(()=>acquirePersonalTechnology(initial,state,'p1','procyon')).toThrow('saved owner');expect(state).toEqual(absent);
 state.discovery=structuredClone(original.discovery!);state.discovery.deckII=['capital-ship'];const wrongLevel=structuredClone(state);expect(()=>acquirePersonalTechnology(initial,state,'p1','procyon')).toThrow('canonical');expect(state).toEqual(wrongLevel);
 state.discovery.deckII=['plasma-cannon'];state.discovery.technologies=[{slot:'II-1',card:'plasma-cannon'}];const duplicate=structuredClone(state);expect(()=>acquirePersonalTechnology(initial,state,'p1','procyon')).toThrow('already in play');expect(state).toEqual(duplicate);
});

test('canonical Procyon settlement queues its actual immediate bonus once, resumes Production and preserves no-cube ownership across reload',async()=>{
 const {applyTurn,economy}=await import('../../src/lib/game/turn');const {syncFleetPowers,validEconomies}=await import('../../src/lib/game/discovery-economy');const {canAdvanceDiscovery}=await import('../../src/lib/game/discovery-resolution');
 const {initial,state:base}=fixture();base.phase='action';base.discovery!.queue=[];base.discovery!.colonies=[];base.discovery!.systemBasis['a-1']='procyon';base.discovery!.deckII=['hypercomputing','plasma-cannon'];
 for(const p of initial.players)base.players[p.position]=economy(p);
 const p=base.players.p1;p.research=['terraforming'];p.supply[0]-=2;p.ore=6;p.ships=[{id:'settler',level:4,location:'a-1'},{id:'retained',level:1,location:'deep-space'}];p.foodDiscs--;
 base.discovery!.outposts['a-1']={owner:'p1',track:'food'};base.discovery!.powers={p1:{sol:0,'deep-space':0,'*':0},p2:{sol:0,'deep-space':0,'*':0}};syncFleetPowers(initial,base);validEconomies(initial,base);
 let state=applyTurn(initial,base,'p1',{kind:'colonize',source:'terraforming',slot:'a-1',ships:[p.ships[0]]},base.discovery!.seed);
 for(let n=0;n<16&&canAdvanceDiscovery(projectGame(initial,state));n++){state=applyTurn(initial,state,'p1',{kind:'discovery-advance',at:state.discovery!.cursor},state.discovery!.seed);validEconomies(initial,state);}
 expect(state.discovery!.queue[0]).toMatchObject({kind:'colony',stage:'disc'});
 state=applyTurn(initial,state,'p1',{kind:'discovery-choice',at:state.discovery!.cursor,option:'food'},state.discovery!.seed);
 state=applyTurn(initial,state,'p1',{kind:'discovery-advance',at:state.discovery!.cursor},state.discovery!.seed);
 expect(state.discovery!.queue[0]).toMatchObject({kind:'effect',source:'hypercomputing',effect:{kind:'automate',track:'ore'}});expect(state.players.p1.research).toEqual(['terraforming']);expect(state.discovery!.deckII).toEqual(['plasma-cannon']);
 state=JSON.parse(JSON.stringify(state));const cursor=state.discovery!.cursor;const beforeOreDiscs=state.players.p1.oreDiscs;
 for(let n=0;n<8&&canAdvanceDiscovery(projectGame(initial,state));n++)state=applyTurn(initial,state,'p1',{kind:'discovery-advance',at:state.discovery!.cursor},state.discovery!.seed);
 expect(state.phase).toBe('production');expect(state.players.p1.oreDiscs).toBe(beforeOreDiscs-1);expect(state.players.p1.automation).toBe(1);expect(state.discovery!.personalTechnologies).toHaveLength(1);expect(personalTechnologyPoints(projectGame(initial,state),'p1')).toBe(2);validEconomies(initial,state);
 expect(()=>applyTurn(initial,state,'p1',{kind:'discovery-advance',at:cursor},state.discovery!.seed)).toThrow();
});

test('personal Plasma Cannon permits only its owner’s paid action without making the card a shared research slot',async()=>{
 const {technologyActionBlocker,beginTechnologyAction}=await import('../../src/lib/game/technology-actions');const {economy}=await import('../../src/lib/game/turn');const {syncFleetPowers}=await import('../../src/lib/game/discovery-economy');
 const {initial,state}=fixture();state.discovery!.deckII=['plasma-cannon'];acquirePersonalTechnology(initial,state,'p1','procyon');state.discovery!.queue=[];state.phase='action';for(const p of initial.players)state.players[p.position]=economy(p);state.players.p1.ore=4;state.discovery!.powers={p1:{sol:0,'deep-space':0,'*':0},p2:{sol:0,'deep-space':0,'*':0}};syncFleetPowers(initial,state);
 const game=projectGame(initial,state);expect(technologyActionBlocker(game,'plasma-cannon',0)).toBe('');beginTechnologyAction(initial,game,state,'p1',{kind:'technology-action',card:'plasma-cannon',action:0,space:0,destination:'sol'});expect(state.players.p1.ore).toBe(2);expect(state.discovery!.queue[0]).toMatchObject({kind:'effect',source:'plasma-cannon',effect:{kind:'ship',level:3,cube:'population'}});expect(state.players.p1.research).not.toContain('plasma-cannon');
 const rival=JSON.parse(JSON.stringify(state));rival.phase='action';rival.activePosition='p2';rival.discovery.queue=[];expect(technologyActionBlocker(projectGame(initial,rival),'plasma-cannon',0)).toContain('cannot be researched, copied or targeted');
});

test('all sixteen WISE immediate queues resolve without a personal research cube, Event or public slot',async()=>{
 const {levelThreeBonuses}=await import('../../src/lib/game/personal-level-three');const {applyTurn,economy}=await import('../../src/lib/game/turn');const {canAdvanceDiscovery}=await import('../../src/lib/game/discovery-resolution');const {syncFleetPowers,validEconomies}=await import('../../src/lib/game/discovery-economy');const {supplyCapacity}=await import('../../src/lib/game/manifest');
 for(const card of Object.keys(levelThreeBonuses)){
  const {initial,state:base}=fixture('wise-1541-2250');for(const actor of initial.players)base.players[actor.position]=economy(actor);base.discovery!.deckIII=[card,...base.discovery!.deckIII!.filter(id=>id!==card)];base.discovery!.queue.push({kind:'resume',responder:'p1',returnTo:'production'});base.discovery!.powers={p1:{sol:0,'deep-space':0,'*':0},p2:{sol:0,'deep-space':0,'*':0}};syncFleetPowers(initial,base);
  let state=base;
  for(let i=0;i<60&&state.phase!=='production';i++){
   const game=projectGame(initial,state),q=state.discovery!.queue[0];
   if(canAdvanceDiscovery(game)){state=applyTurn(initial,state,'p1',{kind:'discovery-advance',at:state.discovery!.cursor},state.discovery!.seed);continue;}
   if(q.kind!=='effect')throw new Error(`Unexpected ${card} ${q.kind}`);
   const e=q.effect,p=state.players.p1;let option='pass',extra:Record<string,unknown>={};
   if(e.kind==='automate')option='food';else if(e.kind==='jump'){option='jump';extra={legs:[]};}
   else if(e.kind==='upgrade'){option='upgrade';extra={ships:p.ships.filter(s=>s.level<4).slice(0,e.ships).map(s=>s.id)};}
   else if(e.kind==='choice'&&e.id==='android-armada')option='population';
   else if(e.kind==='redistribute-supply'){option='redistribute';const supply=[...p.supply],columns:number[]=[];const n=Math.min(2,supply.reduce((a,b)=>a+b,0));for(let j=0;j<n;j++)supply[supply.findLastIndex(v=>v>0)]--;for(let j=0;j<n;j++){const i=supply.findIndex((v,i)=>v<supplyCapacity[i]);columns.push(i);supply[i]++;}extra={columns};}
   else if(e.kind==='ship'){option='build';extra={destination:'sol'};}
   state=applyTurn(initial,state,'p1',{kind:'discovery-choice',at:state.discovery!.cursor,option,...extra},state.discovery!.seed);state=JSON.parse(JSON.stringify(state));validEconomies(initial,state);
  }
  expect(state.phase).toBe('production');expect(state.discovery!.personalTechnologies![0].card).toBe(card);expect(state.discovery!.events).toEqual([]);expect(state.discovery!.technologies).toEqual([]);expect(state.players.p1.research).not.toContain(card);expect(personalTechnologyPoints(projectGame(initial,state),'p1')).toBe(3);validEconomies(initial,state);
 }
});

test('Android Destroyers blocks precisely when personal technology could change X, including the public Action',async()=>{
 const {technologyActionBlocker,technologyActionTerms}=await import('../../src/lib/game/technology-actions');const {economy}=await import('../../src/lib/game/turn');const {initial,state}=fixture('wise-1541-2250');for(const p of initial.players)state.players[p.position]=economy(p);state.players.p1.ore=6;state.players.p1.research=['android-destroyers'];state.phase='action';state.discovery!.queue=[];state.discovery!.technologies=[{slot:'II-1',card:'android-destroyers'}];state.discovery!.personalTechnologies=[{owner:'p1',card:'hyperdrive-boosters',source:'wise-1541-2250',turn:0}];
 expect(technologyActionBlocker(projectGame(initial,state),'android-destroyers',0)).toContain('higher-level personal');state.players.p1.research.push('hivemind-computing');expect(technologyActionBlocker(projectGame(initial,state),'android-destroyers',0)).toBe('');expect(technologyActionTerms(projectGame(initial,state),'android-destroyers',0).level).toBe(3);
 state.discovery!.personalTechnologies=[{owner:'p1',card:'android-destroyers',source:'procyon',turn:0}];state.players.p1.research=['hypercomputing'];expect(technologyActionBlocker(projectGame(initial,state),'android-destroyers',0)).toBe('');expect(technologyActionTerms(projectGame(initial,state),'android-destroyers',0).ore).toBe(2);
});
