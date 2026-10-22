import {test,expect} from '../helpers/fixtures';
import {TestStepHelper} from '../helpers/test-step-helper';
import {assertDiscoveryReady,assertDiscoveryBoard,type Photo} from '../005-technology-discovery/journey';
import {colonyJourney} from './journey';
for(const mixed of [false,true])test((mixed?'Establish a mixed-disc Wolf359 colony and retain the owner choice':'Overpay a Sirius colony with a legally upgraded settling fleet')+' with separate remote controllers',async({page,context,browser},info)=>{
 info.annotations.push({type:'viewports',description:'phone,desktop'},{type:'setup',description:'Ordinary invitation, distinct Auth controllers, unique Basic factions, Ready and Begin. Predeclared setup seed002 Sirius or006 Wolf359 only at Begin. Every research, movement, control, settlement and response uses production UI. No injected game state or future deck read; unsupported benefits remain blocked.'});
 const steps=new TestStepHelper(page,info,info.title);const photo:Photo=(id,caption,actor,player,check,documentView)=>steps.step(id,caption,[{spec:caption,check},{spec:'Actual canonical effects and acknowledgement settle.',check:()=>assertDiscoveryReady(actor)},{spec:'Public topology retains physical separation.',check:()=>assertDiscoveryBoard(actor)},{spec:'The viewport fits without page scrolling.',check:async()=>expect(await actor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight&&!scrollX&&!scrollY)).toBe(true)}],{page:actor,player,document:documentView});
 await colonyJourney({page,context,browser,info,photo,remote:true,mixed});
});
