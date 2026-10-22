import {test,expect} from '../helpers/fixtures';
import {TestStepHelper} from '../helpers/test-step-helper';
import {assertDiscoveryReady,assertDiscoveryBoard,type Photo} from '../005-technology-discovery/journey';
import {colonyJourney} from './journey';
for(const count of [2,4]as const)for(const corners of [false,true])for(const mixed of [false,true])test((mixed?'Establish a mixed-disc colony':'Settle and exile a rival fleet')+' at '+count+' shared '+(corners?'corner':'cardinal')+' seats',async({page,context,browser},info)=>{
 info.annotations.push({type:'viewports',description:'desktop,tabletop-4k'},{type:'setup',description:'One normal shared controller joins every physical seat with legal unique Basic factions. Predeclared setup seed002 Sirius or006 Wolf359 only at Begin. Real preparatory turns; no companion device, identity injection, seeded game state or future deck read. Two-player Sirius includes legal upgrade/overpay; four-player retains exact settlement.'});
 const steps=new TestStepHelper(page,info,info.title);const photo:Photo=(id,caption,actor,player,check,documentView)=>steps.step(id,caption,[{spec:caption,check},{spec:'Actual canonical effects and acknowledgement settle.',check:()=>assertDiscoveryReady(actor)},{spec:'Public topology retains physical separation.',check:()=>assertDiscoveryBoard(actor)},{spec:'The viewport fits without page scrolling.',check:async()=>expect(await actor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight&&!scrollX&&!scrollY)).toBe(true)}],{page:actor,player,document:documentView});
 await colonyJourney({page,context,browser,info,photo,remote:false,mixed,count,corners});
});
