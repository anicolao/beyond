import {test,expect} from '../helpers/fixtures';
import {TestStepHelper} from '../helpers/test-step-helper';
import {assertDiscoveryReady,assertDiscoveryBoard,type Photo} from '../005-technology-discovery/journey';
import {jumpJourney} from './journey';
for(const count of [2,4] as const)for(const corners of [false,true])test('Plan split simultaneous jumps at '+count+' shared '+(corners?'corner':'cardinal')+' seats',async({page,context,browser},info)=>{
 const scenario='split' as const;
 info.annotations.push({type:'viewports',description:'desktop,tabletop-4k'},{type:'setup',description:'Ordinary named legal Basic setup and real preparatory turns. Fixed initial setup entropy55555555-5555-4555-8555-000000000002; command identities separate stories, no state injection or future-deck reads. Remote players have separate identities; tabletop has one shared controller. Source inspection, unpaid recovery, simultaneous endpoints and handoff use production UI.'});
 const steps=new TestStepHelper(page,info,info.title);const photo:Photo=(id,caption,actor,player,check,documentView)=>steps.step(id,caption,[{spec:caption,check},{spec:'Actual canonical effects and acknowledgement settle.',check:()=>assertDiscoveryReady(actor)},{spec:'Public topology retains physical separation.',check:()=>assertDiscoveryBoard(actor)},{spec:'The viewport fits without page scrolling.',check:async()=>expect(await actor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight&&!scrollX&&!scrollY)).toBe(true)}],{page:actor,player,document:documentView});
 await jumpJourney({page,context,browser,info,photo,remote:false,scenario,count,corners});
});
