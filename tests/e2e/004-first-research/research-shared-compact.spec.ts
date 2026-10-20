import {test,expect} from '../helpers/fixtures';
import {TestStepHelper} from '../helpers/test-step-helper';
import {researchJourney,assertResearchHeadings,type Photo} from './journey';
test.use({viewport:{width:1280,height:720}});
for(const [count,corners] of [[2,false],[4,true]] as const)test(`Finish a compact ${count}-player shared ${corners?'corner':'cardinal'} research round`,async({page,context,browser},info)=>{
 info.annotations.push({type:'viewports',description:'desktop'},{type:'setup',description:'Ordinary UI setup, legal unique Basic factions and real emulator persistence. Only UUID entropy is fixed before setup; no game-state injection. Every visible input/choice/result uses TestStepHelper. Complete first rounds exercise all Level I bonuses, real permanent cube payment, occupied Action blocking, explicit ship choice, exclusive production, all three printed trades, Supply overflow, pending-choice reload and automatic handoff. Full-card and planner Escape restore source focus.'});

 const steps=new TestStepHelper(page,info,info.title);
 const photo:Photo=(id,caption,actor,player,check,documentView)=>steps.step(id,caption,[{spec:caption,check},{spec:'Public Technology headings have physical clearance above their cards.',check:()=>assertResearchHeadings(actor)},{spec:'The game stays within its actual viewport without page scrolling.',check:async()=>expect(await actor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight&&!scrollX&&!scrollY)).toBe(true)}],{page:actor,player,document:documentView});
 await researchJourney({page,context,browser,info,photo,count,remote:false,corners,compact:true});
});
