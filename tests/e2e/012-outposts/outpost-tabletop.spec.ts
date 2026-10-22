import {test,expect} from '../helpers/fixtures';
import {TestStepHelper} from '../helpers/test-step-helper';
import {assertDiscoveryReady,assertDiscoveryBoard,type Photo} from '../005-technology-discovery/journey';
import {outpostJourney} from './journey';
for(const corners of [false,true])for(const scenario of ['contest','bonuses','specialty','empty','offturn']as const){if(corners&&scenario==='offturn')continue;test(({contest:'Contest an Ore outpost at two',bonuses:'Choose two System bonus rewards at four',specialty:'Choose a multi-specialty outpost at four',empty:'Retain an empty outpost without ships at two',offturn:'Return an outpost during rival trade and retain automation at two'})[scenario]+' shared '+(corners?'corner':'cardinal')+' seats',async({page,context,browser},info)=>{
 info.annotations.push({type:'viewports',description:'desktop,tabletop-4k'},{type:'setup',description:'Exactly one shared controller; all local seats/factions/Begin through the actual table. Two players for incoming tie/later exceed, four for simultaneous two-System bonuses or Food/Ore specialty. Setup seed002 or004; command identities disjoint. No companion devices, state injection or future deck read.'});
 const steps=new TestStepHelper(page,info,info.title);const photo:Photo=(id,caption,actor,player,check,documentView)=>steps.step(id,caption,[{spec:caption,check},{spec:'Actual canonical effects and acknowledgement settle.',check:()=>assertDiscoveryReady(actor)},{spec:'Public topology retains physical separation.',check:()=>assertDiscoveryBoard(actor)},{spec:'The viewport fits without page scrolling.',check:async()=>expect(await actor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight&&!scrollX&&!scrollY)).toBe(true)}],{page:actor,player,document:documentView});
 await outpostJourney({page,context,browser,info,photo,remote:false,scenario,corners});
});
}
