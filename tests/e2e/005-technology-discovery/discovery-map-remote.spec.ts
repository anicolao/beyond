import {test,expect} from '../helpers/fixtures';
import {TestStepHelper} from '../helpers/test-step-helper';
import {discoveryJourney,assertDiscoveryReady,assertDiscoveryBoard,scenarios,type Photo} from './journey';
for(const count of [3,4] as const)test(`Inspect a real attached Rift System in ${count}-player remote Exploration`,async({page,context,browser},info)=>{
 const scenario='rift' as const;

 info.annotations.push({type:'viewports',description:'phone,desktop'},{type:'setup',description:`Ordinary UI setup and legal preparatory turns; ${count} independent remote identities, no state injection. Fixed initial entropy selects documented base-game seed ${scenarios[scenario].seed}. Every visible decision/input/result uses TestStepHelper. Revealed Events, candidates and mandatory bonuses remain on the canonical persisted queue. The saved Dimensional Rift attachment is exercised through the existing printed Basic build/jump Action, Exploration navigation and reload; no future gameplay is introduced.`});
 const steps=new TestStepHelper(page,info,info.title);const photo:Photo=(id,caption,actor,player,check,documentView)=>steps.step(id,caption,[{spec:caption,check},{spec:'The saved automatic consequences settle before the public decision is photographed.',check:()=>assertDiscoveryReady(actor)},{spec:'Public compact Technology objects retain physical separation.',check:()=>assertDiscoveryBoard(actor)},{spec:'The gameplay shell stays inside the actual viewport.',check:async()=>expect(await actor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight&&!scrollX&&!scrollY)).toBe(true)}],{page:actor,player,document:documentView});
 await discoveryJourney({page,context,browser,info,photo,scenario,remote:true,count,narrowMapProof:true});
});
