import {test,expect} from '../helpers/fixtures';
import {TestStepHelper} from '../helpers/test-step-helper';
import {assertDiscoveryReady,assertDiscoveryBoard,type Photo} from '../005-technology-discovery/journey';
import {personalJourney} from './journey';
for(const count of [2]as const)for(const corners of [false,true])test('Acquire Procyon personal Plasma Cannon at '+count+' shared '+(corners?'corner':'cardinal')+' seats',async({page,context,browser},info)=>{
 info.annotations.push({type:'viewports',description:'desktop,tabletop-4k'},{type:'setup',description:'One shared controller joins physical seats/unique Basic factions. Predeclared seed001658 at Begin; ordinary Sirius/Procyon settlement, immediate bonus and exclusive Action. No companion, injected state or future deck read. Unsupported effects remain blocked.'});
 const steps=new TestStepHelper(page,info,info.title);const photo:Photo=(id,caption,actor,player,check,documentView)=>steps.step(id,caption,[{spec:caption,check},{spec:'Actual canonical effects and acknowledgement settle.',check:()=>assertDiscoveryReady(actor)},{spec:'Public topology retains physical separation.',check:()=>assertDiscoveryBoard(actor)},{spec:'The viewport fits without page scrolling.',check:async()=>expect(await actor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight&&!scrollX&&!scrollY)).toBe(true)}],{page:actor,player,document:documentView});
 await personalJourney({page,context,browser,info,photo,remote:false,card:'plasma-cannon',count,corners});
});
