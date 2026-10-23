import {test,expect} from '../helpers/fixtures';
import {TestStepHelper} from '../helpers/test-step-helper';
import {assertDiscoveryReady,assertDiscoveryBoard,type Photo} from '../005-technology-discovery/journey';
import {personalJourney} from './journey';
for(const card of ['transdimensional-ai','android-armada','android-rights-movement']as const)test('Retain '+card+' personal choices with separate controllers',async({page,context,browser},info)=>{
 info.annotations.push({type:'viewports',description:'phone,desktop'},{type:'setup',description:'Ordinary distinct controllers, unique Basic factions, Ready and Begin. Predeclared seeds AI000923, Armada000887, Rights000292 only at Begin. Real preparatory research/build/movement and WISE actual-top acquisition. Resolve the named immediate choice, isolate its owner and retain it across reload; no unsupported exclusive Action is claimed. No injected state/future deck read. Android Destroyers unresolved higher-personal-level ruling remains blocked.'});
 const steps=new TestStepHelper(page,info,info.title);const photo:Photo=(id,caption,actor,player,check,documentView)=>steps.step(id,caption,[{spec:caption,check},{spec:'Actual canonical effects and acknowledgement settle.',check:()=>assertDiscoveryReady(actor)},{spec:'Public topology retains physical separation.',check:()=>assertDiscoveryBoard(actor)},{spec:'The viewport fits without page scrolling.',check:async()=>expect(await actor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight&&!scrollX&&!scrollY)).toBe(true)}],{page:actor,player,document:documentView});
 await personalJourney({page,context,browser,info,photo,remote:true,card});
});
