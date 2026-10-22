import {test,expect} from '../helpers/fixtures';
import {TestStepHelper} from '../helpers/test-step-helper';
import {assertDiscoveryReady,assertDiscoveryBoard,type Photo} from '../005-technology-discovery/journey';
import {personalJourney} from './journey';
test('Acquire WISE personal Hyperdrive and retain its exclusive Action with separate controllers',async({page,context,browser},info)=>{
 info.annotations.push({type:'viewports',description:'phone,desktop'},{type:'setup',description:'Ordinary distinct controllers, unique Basic factions, Ready and Begin. Predeclared seed000020 at Begin. Real preparatory research, build, movement, WISE settlement, three Hyperdrive allocations, exclusive Action and reload. No injected state/future deck read. Android Destroyers unresolved higher-personal-level ruling remains blocked.'});
 const steps=new TestStepHelper(page,info,info.title);const photo:Photo=(id,caption,actor,player,check,documentView)=>steps.step(id,caption,[{spec:caption,check},{spec:'Actual canonical effects and acknowledgement settle.',check:()=>assertDiscoveryReady(actor)},{spec:'Public topology retains physical separation.',check:()=>assertDiscoveryBoard(actor)},{spec:'The viewport fits without page scrolling.',check:async()=>expect(await actor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight&&!scrollX&&!scrollY)).toBe(true)}],{page:actor,player,document:documentView});
 await personalJourney({page,context,browser,info,photo,remote:true,card:'hyperdrive-boosters'});
});
