<script lang="ts">
 import {tick} from 'svelte';
 import CardFace from '$lib/cards/CardFace.svelte';
 import {base} from '$app/paths';
 import {gainBonusChoices,canAdvanceDiscovery} from './discovery-resolution';
 import {cardById} from './cards';
 import {guilds,levelOne,technologySlots} from './manifest';
 import {levelTwoBonuses} from './discovery-effects';
 import {discoveryMap} from './discovery-movement';
 import type {PublicSetup} from './setup';
 import type {TurnMove} from './turn';
 let {game,allowed,busy,send,inspect,compact=false,saveError=false}:{game:PublicSetup;compact?:boolean;saveError?:boolean;allowed:boolean;busy:boolean;send:(move:TurnMove)=>void;inspect:(id:string,collection?:string[])=>void}=$props();
 const automatic=$derived(canAdvanceDiscovery(game));
 const discovery=$derived(game.discovery!),step=$derived(discovery.queue[0]);
 const actor=$derived(game.players.find(p=>p.position===step.responder)!);
 const bonus=$derived(step.kind==='effect'?step.effect:undefined);
 const rootResume=$derived(discovery.queue.find((q):q is Extract<import('./discovery').DiscoveryChoice,{kind:'resume'}>=>q.kind==='resume'));
 const currentEvent=$derived(step.kind==='event'?step.event:rootResume?.event??(rootResume&&!rootResume.returnTo&&discovery.revealBoundary?.turn===game.turn?discovery.records.at(-1)?.event:undefined));
 let spread=$state<HTMLDivElement>(undefined!);
 let previewIndex=$state(0);
 let selected=$state(''),shipIds=$state<string[]>([]),track=$state<'food'|'ore'>('food'),destination=$state('sol'),usePopulation=$state(false),jumpShip=$state(''),paths=$state<{ship:string;path:string[]}[]>([]);
 const map=$derived(discoveryMap(game));
 const shipyards=$derived(['sol',...Object.entries(discovery.outposts).filter(([id,p])=>id.startsWith('shipyard-')&&p.owner===actor.position).map(([id])=>id)]);
 const source=$derived(step.kind==='effect'?step.source:currentEvent);
 const heading=$derived(step.kind==='candidate'?'Choose humanity’s discovery':step.kind==='type'?'Choose a technology type':step.kind==='gain-bonus'?'Choose your bonus order':step.kind==='control'?'Establish your outpost':step.kind==='effect'?'Resolve the immediate bonus':currentEvent?cardById(currentEvent).title:'Resolve the Event');
 const upgrades=$derived(shipIds.filter(Boolean));
 async function selectCandidate(id:string,event:MouseEvent){
  const control=event.currentTarget as HTMLElement;selected=id;await tick();
  const target=control.getBoundingClientRect(),window=spread.getBoundingClientRect();
  const delta=target.bottom>window.bottom-8?target.bottom-window.bottom+8:target.top<window.top+4?target.top-window.top-4:0;
  if(delta)spread.scrollBy({top:delta,behavior:'instant'});
 }

 const selectedShip=$derived(actor.ships.find(s=>s.id===jumpShip));
 const path=$derived(paths.find(p=>p.ship===jumpShip)?.path??(selectedShip?[selectedShip.location]:[]));
 const spent=$derived(paths.reduce((n,p)=>n+p.path.length-1,0));
 const jumpAmount=$derived(bonus?.kind==='jump'?bonus.amount:0);
 function respond(option:string,extra:Record<string,unknown>={}){send({kind:'discovery-choice',at:discovery.cursor,option,...extra} as TurnMove);}
 function addJump(to:string){if(!selectedShip)return;const next=[...path,to];paths=[...paths.filter(p=>p.ship!==jumpShip),{ship:jumpShip,path:next}];}
 $effect(()=>{const identity=JSON.stringify({step,cursor:discovery.cursor});if(identity){selected='';previewIndex=0;shipIds=[];destination='sol';usePopulation=false;paths=[];jumpShip='';void tick().then(()=>{if(!spread)return;spread.scrollTop=0;const top=[...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1);if(!automatic&&top?.contains(spread)&&(!top.contains(document.activeElement)||document.activeElement instanceof HTMLButtonElement&&document.activeElement.disabled))spread.focus({preventScroll:true});});}});
 const systemChoice=$derived.by(()=>{
  if(bonus?.kind!=='system-bonus')return undefined;
  const supply=actor.supply.some(n=>n>0),cube=supply||actor.population>0;
  const choices:Record<string,{label:string;available:boolean;reason:string}>={
   'alpha-centauri':{label:'Convert 1 Supply into a level-1 ship',available:cube,reason:'Supply is exhausted and no available Population can replace it.'},
   'gj-1061':{label:'Convert 1 Supply into a level-1 ship in Deep Space',available:cube,reason:'Supply is exhausted and no available Population can replace it.'},
   'epsilon-indi':{label:'Return 1 Population → gain 3 Ore',available:actor.population>0,reason:'Need 1 available Population.'},
   'groombridge-34':{label:'Pay 2 Ore + 1 Population → build level-2 ship',available:actor.ore>=2&&actor.population>0,reason:'Need 2 Ore and 1 available Population.'},
   'ad-leonis':{label:'Pay 2 Ore + 1 Population → research Level I',available:actor.ore>=2&&actor.population>0&&game.technologies.some(t=>cardById(t.card).technology?.level==='I'&&!actor.research.includes(t.card)),reason:'Need 2 Ore, 1 available Population and an unresearched Level I technology.'},
   'dx-cancri':{label:'Pay 1 Ore → upgrade 1 ship here',available:actor.ore>=1&&actor.ships.some(ship=>ship.location===bonus.location&&ship.level<4),reason:'Need 1 Ore and an owned ship here below level 4.'},
   'ross-154':{label:'Move rightmost Supply cube to column A',available:supply,reason:'No Supply cube is available to move.'},
   'tau-ceti':{label:'Move rightmost Supply cube to column A',available:supply,reason:'No Supply cube is available to move.'}
  };
  return choices[bonus.id];
 });
 const eventOptions=$derived.by(()=>{
  if(step.kind!=='event')return [];
  if(step.stage==='guild')return guilds.filter(g=>g.tier===1&&!discovery.guilds.includes(g.id)).map(g=>({value:g.id,label:g.name,note:g.text}));
  if(step.event==='research-tariffs')return technologySlots.filter(s=>s.level==='II'&&s.id!==step.slot).map(s=>({value:s.id,label:s.id,note:'+1 Ore on later research'}));
  if(step.event==='erratic-solar-activity')return game.systems.map(s=>({value:s.slot,label:cardById(s.card).title,note:'Uncolonized System'}));
  if(step.event==='dimensional-rift')return step.stage==='deck'?[{value:'A',label:'Reveal System deck A',note:'Choose before seeing the card'},{value:'B',label:'Reveal System deck B',note:'Choose before seeing the card'}]:game.systems.filter(s=>!s.slot.startsWith('rift-')).map(s=>({value:s.slot,label:'Attach to '+cardById(s.card).title,note:'One jump from this printed System-card slot'}));
  if(step.event==='march-of-progress'){
   if(step.stage==='choose')return levelOne.map(id=>({value:id,label:cardById(id).title,note:'Name this Level I technology for all factions'}));
   return actor.research.includes(step.value!)?[{value:'ore',label:'Gain2 Ore',note:'Already researched'},{value:'ship',label:'Build level2 ship',note:'Convert1 Supply at a permitted shipyard'},{value:'pass',label:'Pass',note:'No cube or Ore gained'}]:[{value:'research',label:'Research '+cardById(step.value!).title,note:'Use Supply permanently; receive the immediate bonus'},{value:'pass',label:'Pass',note:'Decline this optional research'}];
  }
  if(step.event==='economic-boom'){
   if(step.stage==='choose')return [{value:'population',label:'Population for every faction',note:'Each converts1 Supply'},{value:'ore',label:'Ore for every faction',note:'Each gains1 Ore'},{value:'exchange',label:'Offer an exchange to each faction',note:'Each may return1 Population for2 Ore'}];
   if(step.value==='population')return [{value:'convert',label:'Convert to Population',note:'Use the leftmost Supply cube'},...(!actor.supply.some(n=>n>0)?[{value:'pass',label:'Pass',note:'Supply exhausted'}]:[])];
   return [{value:'exchange',label:'Return1 Population →2 Ore',note:'Optional exchange'},{value:'pass',label:'Pass',note:'Keep your Population'}];
  }
  if(step.event==='covert-arms-deal')return step.stage==='choose'?[{value:'1',label:'Offer level1 ships',note:'Every faction may accept'},{value:'2',label:'Offer level2 ships',note:'Every faction may accept'}]:[{value:'build',label:'Build level'+step.value+' ship',note:'Convert1 Supply directly in Deep Space'},{value:'pass',label:'Pass',note:'Decline the offered ship'}];
  if(step.event==='experimental-prototypes')return step.stage==='empty-supply'?[...(actor.population?[{value:'population',label:'Roll1 available Population',note:'Exhausted Supply exception'}]:[]),{value:'pass',label:'Pass on the exhausted Supply effect',note:'No cube is rolled'}]:[{value:'keep',label:'Keep this result',note:['Return Supply and gain2 Ore','Convert to Population','Convert to Population','Level2 ship at Sol','Level2 ship at Sol','Level2 ship at Sol'][step.face??0]},...(step.responder===game.activePosition&&(step.rolls??0)<3?[{value:'reroll',label:'Reroll resource cube',note:`${3-(step.rolls??0)} reroll(s) remaining`}]:[])];
  return [];
 });
</script>
<section class="discovery-choices" class:compact class:saveError class:jumpDecision={bonus?.kind==='jump'} class:candidate-spread={step.kind==='candidate'} aria-label="Pending public discovery">
 <div class="discovery-note">{#if step.kind!=='candidate'}<h3>{heading}</h3>{/if}<p>{actor.name} · {allowed?'your public choice':'waiting for this faction'}</p><small>{compact?'Paid · revealed information cannot be undone.':'Payment saved · Revealed information cannot be undone.'}</small></div>
 <!-- svelte-ignore a11y_no_noninteractive_tabindex (Named bounded public spread supports keyboard scrolling.) -->
 <div class="discovery-composition" bind:this={spread} role="region" aria-label="Public discovery faces and choices" tabindex="0">
  {#if currentEvent}<aside class="event-object"><button class="face event-full" aria-label={`Read Event ${cardById(currentEvent).title}`} onclick={()=>inspect(currentEvent)}><CardFace card={cardById(currentEvent)}/></button><button class="event-thumbnail" onclick={()=>inspect(currentEvent!)} aria-label={`Inspect full Event ${cardById(currentEvent).title}`}><img src={`${base}/art/cards/${cardById(currentEvent).art}.png`} alt=""/></button><span>{#if !compact}<strong>{cardById(currentEvent).title}</strong><br/>{/if}{discovery.events.find(e=>e.id===currentEvent)?.resolved?'Event resolved':'Event resolves before discovery'}<br/><small>Inspect Event for full rules ↗</small></span>{#if currentEvent==='experimental-prototypes'&&discovery.events.find(e=>e.id===currentEvent)?.rolls?.length}<ul class="saved-rolls" aria-label="Saved resource cube results">{#each discovery.events.find(e=>e.id===currentEvent)?.rolls??[] as roll}<li>{game.players.find(p=>p.position===roll.position)?.name} · {['Supply','Population','Population','Level2 ship','Level2 ship','Level2 ship'][roll.face]}</li>{/each}</ul>{/if}{#if step.kind==='event'&&step.event==='dimensional-rift'&&step.stage==='attach'&&step.value}<button onclick={()=>inspect(step.value!)}>Inspect revealed {cardById(step.value).title}</button>{/if}</aside>{/if}
  <div class="response-object">
   {#if automatic}<p role="status">Resolving the saved effect…</p>{:else if step.kind==='candidate'}
    <p class="public-type">{step.type} ·2 public candidates<small class="portrait-scroll-cue">Scroll for the next candidate ↓</small></p>
    <div class="candidates">{#each (compact?[step.cards[previewIndex]]:step.cards) as id}{@const card=cardById(id)}<article class:selected={selected===id}><button class="face candidate-face" aria-pressed={allowed?selected===id:undefined} disabled={busy} onclick={event=>{if(allowed&&!compact)void selectCandidate(id,event);else inspect(id);}} aria-label={`${allowed&&!compact?'Choose':'Inspect'} candidate ${card.title}`}><CardFace {card}/></button><div class="candidate-details"><h4>{card.title}</h4><div class="immediate"><strong>Immediate bonus</strong><p>{card.sections.find(s=>s.label==='Immediate')?.text??'No immediate bonus. Its Action remains printed on the public card.'}</p></div><button aria-pressed={selected===id} disabled={!allowed||busy} onclick={event=>{void selectCandidate(id,event);}}>{selected===id?'Selected':'Select '+card.title}</button>{#if !compact}<button class="inspect-candidate" aria-label={`Inspect full ${card.title} card`} onclick={()=>inspect(id)}>Inspect full card ↗</button>{/if}</div></article>{/each}</div>

    {#if !compact}<details><summary>{step.revealed.length} cards publicly revealed</summary>{#each step.revealed as id}<button onclick={()=>inspect(id)}>{cardById(id).title}</button>{/each}</details>{/if}
   {:else if step.kind==='type'}<div class="response-list">{#each step.types as type}<button disabled={!allowed||busy} onclick={()=>respond(type)}>Reveal two {type} candidates</button>{/each}</div>
   {:else if step.kind==='event'}
    <div class="event-rules">{#each cardById(step.event).sections as section}<p><strong>{section.label}</strong> · {section.text}</p>{/each}</div>
    {#if step.event==='experimental-prototypes'&&step.face!==undefined}<div class="cube-result"><span aria-hidden="true">▣</span><strong>{['Supply','Population','Population','Level2 ship','Level2 ship','Level2 ship'][step.face]}</strong><p>Resource cube · saved roll {step.rolls}</p></div>{/if}
    {#if step.event==='march-of-progress'&&step.stage==='march'&&actor.research.includes(step.value!)}<label>Permitted shipyard<select bind:value={destination}>{#each shipyards as id}<option value={id}>{map.locations.find(l=>l.id===id)?.title??id}</option>{/each}</select></label>{/if}
    {#if !actor.supply.some(n=>n>0)&&step.event!=='experimental-prototypes'}<label class="check"><input type="checkbox" bind:checked={usePopulation}/>Use available Population when Supply is exhausted</label>{/if}
    <div class="response-list">{#each eventOptions as choice}<button disabled={!allowed||busy} onclick={()=>respond(choice.value,{destination,...(usePopulation?{usePopulation:true}:{})})}><strong>{choice.label}</strong><small>{choice.note}</small></button>{/each}</div>
   {:else if step.kind==='gain-bonus'}<h4>Choose your bonus order</h4><p>All outposts are placed. Resolve your gained System bonuses in the order you choose.</p><div class="response-list">{#each gainBonusChoices(discovery,actor.position) as choice}<button disabled={!allowed||busy} onclick={()=>respond(choice.location)}>{cardById(choice.source).title} · resolve gain-control bonus</button>{/each}</div>
   {:else if step.kind==='control'}<p>Place a production disc at {map.locations.find(l=>l.id===step.location)?.title??step.location}. This improves production without automation.</p><div class="response-list">{#each ['food','ore'] as id}<button disabled={!allowed||busy} onclick={()=>respond(id)}>Place {id} disc</button>{/each}</div>
   {:else if bonus}
    {#if source}<h4>{cardById(source).title}</h4><p class="source-rules">{cardById(source).sections.find(s=>s.label===(bonus.kind==='system-bonus'?'Gain control':'Immediate'))?.text}</p>{/if}
    {#if bonus.kind==='upgrade'}<fieldset><legend>Choose {bonus.optional?'up to ':''}{bonus.ships} distinct ship{bonus.ships===1?'':'s'} · +{bonus.levels} level{bonus.levels===1?'':'s'}</legend>{#each Array.from({length:bonus.ships}) as _,index}<label>Upgrade ship {index+1}<select value={shipIds[index]??''} onchange={event=>{const next=[...shipIds];next[index]=event.currentTarget.value;shipIds=next;}}><option value="">{bonus.optional?'No additional upgrade':'Choose your ship'}</option>{#each actor.ships.filter(s=>s.level<4&&(!bonus.location||s.location===bonus.location)) as ship}<option value={ship.id}>{ship.id} · {map.locations.find(l=>l.id===ship.location)?.title??ship.location} · {ship.level} → {Math.min(4,ship.level+bonus.levels)}</option>{/each}</select></label>{/each}</fieldset><button class="primary" disabled={!allowed||busy||new Set(upgrades).size!==upgrades.length||(!bonus.optional&&!upgrades.length)} onclick={()=>respond('upgrade',{ships:upgrades})}>Commit ship upgrade{upgrades.length?'':' · pass'}</button>
    {:else if bonus.kind==='ship'}
     {#if !bonus.location}<label>Permitted shipyard<select bind:value={destination}>{#each shipyards as id}<option value={id}>{map.locations.find(l=>l.id===id)?.title??id}</option>{/each}</select></label>{/if}<p>Level{bonus.level} ship · {bonus.location??destination} · {bonus.side==='right'?'rightmost':'leftmost'} Supply</p>
     {#if !actor.supply.some(n=>n>0)}<label class="check"><input type="checkbox" bind:checked={usePopulation}/>Use1 available Population instead</label><button disabled={!allowed||busy} onclick={()=>respond('pass')}>Pass on exhausted Supply bonus</button>{/if}
     <button class="primary" disabled={!allowed||busy||(!actor.supply.some(n=>n>0)&&!usePopulation)} onclick={()=>respond('build',{destination,...(usePopulation?{usePopulation:true}:{})})}>Build level{bonus.level} ship</button>
    {:else if bonus.kind==='jump'}
     <div class="jump-planner"><p>Allocate up to{bonus.amount} jumps. Control and bonuses resolve after the complete simultaneous move.</p><label>Your ship<select bind:value={jumpShip}><option value="">Choose a ship</option>{#each actor.ships as ship}<option value={ship.id}>{ship.id} · level{ship.level} · {map.locations.find(l=>l.id===ship.location)?.title??ship.location}</option>{/each}</select></label>{#if selectedShip}<p>{path.map(id=>map.locations.find(l=>l.id===id)?.title??id).join(' → ')}</p><div class="response-list">{#each map.edges.filter(([a,b])=>a===path.at(-1)||b===path.at(-1)).map(([a,b])=>a===path.at(-1)?b:a) as id}<button disabled={spent>=jumpAmount} onclick={()=>addJump(id)}>Jump to {map.locations.find(l=>l.id===id)?.title??id}</button>{/each}</div>{/if}<div class="jump-actions"><p>{spent} of{bonus.amount} points planned</p><button onclick={()=>{paths=[];jumpShip='';}}>Clear unpaid jump plan</button><button class="primary" disabled={!allowed||busy} onclick={()=>respond('jump',{legs:paths.map(leg=>({...leg,index:actor.ships.findIndex(ship=>ship.id===leg.ship)}))})}>Commit {spent?spent+' jumps':'no movement'}</button></div></div>
    {:else if bonus.kind==='automate'}<div class="response-list">{#each ['food','ore'] as id}<button disabled={!allowed||busy} onclick={()=>respond(id)}>Automate1 {id}</button>{/each}</div>
    {:else if bonus.kind==='population'}<button disabled={!allowed||busy} onclick={()=>respond('pass')}>Pass · Supply exhausted</button>
    {:else if bonus.kind==='research-I'}<div class="response-list">{#each game.technologies.filter(t=>cardById(t.card).technology?.level==='I'&&!actor.research.includes(t.card)) as t}<button disabled={!allowed||busy} onclick={()=>respond(t.card)}>Research {cardById(t.card).title} · {bonus.cost} Ore + permanent cube</button>{/each}</div>
    {:else if bonus.kind==='choice'}
     {#if bonus.id==='exo-alloy'}<div class="response-list"><button disabled={!allowed||busy} onclick={()=>respond('automate')}>Automate1 Ore</button><button disabled={!allowed||busy||actor.ore<1||actor.population<1} onclick={()=>respond('research')}>Pay1 Ore and research Level I</button></div>
     {:else}<label>Automation track<select bind:value={track}><option value="food">Food</option><option value="ore">Ore</option></select></label><button disabled={!allowed||busy} onclick={()=>respond('automate',{track})}>Automate1 {track} + gain2 Ore</button><div class="response-list">{#each discovery.technologies.filter(t=>levelTwoBonuses[t.card]?.length) as t}<button disabled={!allowed||busy} onclick={()=>respond('copy',{target:t.card})}>Copy {cardById(t.card).title} immediate bonus</button>{/each}</div>{/if}
    {:else if bonus.kind==='system-bonus'}
     {#if bonus.id==='groombridge-34'}<label>Permitted shipyard<select bind:value={destination}>{#each shipyards as id}<option value={id}>{map.locations.find(l=>l.id===id)?.title??id}</option>{/each}</select></label>{/if}{#if systemChoice&&!systemChoice.available}<p class="source-rules">{systemChoice.reason}</p>{/if}<div class="response-list"><button disabled={!allowed||busy||!systemChoice?.available} onclick={()=>respond('accept',bonus.id==='groombridge-34'?{destination}:{})}>{systemChoice?.label??'Take printed gain-control bonus'}</button><button disabled={!allowed||busy} onclick={()=>respond('pass')}>Pass on optional bonus</button></div>
    {/if}
   {/if}
  </div>
 </div>
 {#if step.kind==='candidate'}    <div class="candidate-commit">{#if compact}<nav class="candidate-navigation" aria-label="Public discovery candidates"><button aria-label="Previous candidate" onclick={()=>previewIndex=(previewIndex+step.cards.length-1)%step.cards.length}>‹</button><span>{previewIndex+1}/{step.cards.length}</span><button aria-label="Next candidate" onclick={()=>previewIndex=(previewIndex+1)%step.cards.length}>›</button><button class="reveal-register" aria-label={`Inspect all ${step.revealed.length} publicly revealed cards`} onclick={()=>inspect(step.revealed[0],step.revealed)}>{step.revealed.length} ↗</button></nav>{/if}<p>{selected?cardById(selected).title:'Choose one candidate'}{#if selected}<span class="selected-consequence">{cardById(selected).sections.find(s=>s.label==='Immediate')?.text??'No immediate bonus.'}</span>{/if}<small>Other revealed cards are shuffled to the deck bottom.</small></p><button class="primary" disabled={!selected||!allowed||busy} onclick={()=>respond(selected)}>Discover {selected?cardById(selected).title:'technology'}</button></div>{/if}
</section>
<style>
.selected-consequence{display:block;font-size:14px;line-height:1.35;margin-top:5px;color:#e8e1bf}.event-thumbnail{display:none}.inspect-candidate{margin-top:9px}.event-rules{font-size:14px;color:#2b4037;background:#e5d7b6;border:1px solid #b49b65;border-radius:7px;padding:12px;margin-bottom:14px}.event-rules p{margin:5px 0 10px}h3,h4{font:600 29px 'Cormorant Garamond',serif;margin:0 0 7px;color:#f3e5bf}p{line-height:1.45;margin:8px 0}small{font-size:12px;line-height:1.4}.discovery-note{padding-bottom:14px;border-bottom:1px solid #c3aa6255}.discovery-note p{font-size:14px}.discovery-note small{color:#d2c7a2}.discovery-composition{display:grid;grid-template-columns:190px minmax(0,1fr);gap:22px;padding-top:20px}.event-object{display:flex;flex-direction:column;gap:12px;align-items:center}.event-object>span{font-size:12px;text-align:center;color:#d3c294}.face{display:block;width:100%;padding:0!important;border:0!important;background:none!important;box-shadow:none!important;text-align:left;container-type:inline-size}.response-object{min-width:0}.candidates{display:grid;grid-template-columns:1fr 1fr;gap:16px}.candidates article{min-width:0;border:1px solid #b39d63;border-radius:10px;padding:8px;background:#10252c;box-shadow:0 5px #79603a,0 10px 15px #0007}.selected{outline:2px solid #7bf0d9}.immediate{padding:12px;margin:10px 0;color:#283f36;background:linear-gradient(130deg,#f0e2bd,#ccbc94);border:1px solid #b49b65;border-radius:6px}.immediate strong{font-size:12px}.immediate p{font-size:14px;margin:6px 0}.candidate-commit{display:flex;align-items:center;gap:12px;justify-content:space-between;position:sticky;bottom:-1px;background:#142e35;padding:14px;margin:16px 0;border:1px solid #b9a369;border-radius:7px;box-shadow:0 -8px 20px #0c202bb0}.candidate-commit p{font-size:16px;margin:0;flex:1}.candidate-commit small{display:block;margin-top:6px;color:#c5c6b4}.response-list{display:grid;gap:10px;margin:14px 0}.response-list strong,.response-list small{display:block}.response-list small{margin-top:5px;color:#cdd1be}.source-rules{padding:15px;color:#263c34;background:#e3d5b3;border:1px solid #ad955f;border-radius:6px;font-size:15px}button{min-height:44px;padding:10px 14px;border:1px solid #baa065;border-radius:7px;background:linear-gradient(130deg,#354c48,#152f37);color:#eee5cb;font:14px 'Atkinson Hyperlegible',sans-serif;box-shadow:0 2px #796137;cursor:pointer}button:disabled{opacity:.55;cursor:default}button:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #71eee7;outline-offset:3px}.primary{background:#15575a}.public-type{color:#c8dfc9;font-size:13px}label{display:grid;gap:8px;font-size:14px;margin:12px 0}select{min-height:44px;width:100%;padding:8px;background:#e9dfbf;color:#213b35;border:1px solid #ac9358;border-radius:5px;font:14px 'Atkinson Hyperlegible',sans-serif}.check{display:flex;align-items:center;gap:10px;padding:9px;border:1px solid #9b956855;border-radius:6px}.check input{width:44px;height:44px;flex-shrink:0;accent-color:#66d9cc}fieldset{border:1px solid #b7a36b;border-radius:7px;padding:12px}legend{padding:0 7px;font-size:14px}.cube-result{padding:20px;border:1px solid #b8a66a;border-radius:9px;background:#e0d1a9;color:#234237}.cube-result>span{font-size:52px;display:block}details{margin-top:16px}summary{min-height:44px;cursor:pointer;padding:12px;border:1px solid #b8a66a;border-radius:6px}details button{margin:5px}
@media(min-width:761px) and (max-height:850px){.discovery-composition{grid-template-columns:145px minmax(0,1fr);padding-top:12px;gap:16px}.discovery-note h3{font-size:26px}.discovery-note p{margin:4px 0}.candidates .face{max-width:205px;margin:auto}.immediate{padding:9px}.immediate p{font-size:13px}.candidate-commit{padding:10px}}
@media(max-width:760px){.discovery-composition{grid-template-columns:1fr;gap:16px}.event-object{max-width:180px;margin:auto}.candidates{grid-template-columns:1fr}.candidate-commit{flex-wrap:wrap}.candidate-commit p{flex-basis:100%}.candidate-commit .primary{width:100%}}

.discovery-choices{container-type:inline-size;height:100%;min-height:0;display:flex;flex-direction:column}.discovery-note{padding:0 0 10px;flex:none}.discovery-note p{margin:3px 0}.discovery-composition{min-height:0;overflow:auto;flex:1;padding:14px 4px 18px;scrollbar-color:#c5ab70 #112b31}.candidate-commit{position:static;flex:none;margin:10px 0 0}.candidates{align-items:start}.candidates article{display:grid;grid-template-columns:1fr;gap:12px;align-items:start}.candidate-face{aspect-ratio:5/8}.candidate-details{min-width:0}.candidate-details h4{font-size:23px}.candidate-details>button{width:100%}.candidates .face{max-width:none}.candidate-face :global(.card-face){height:100%}.immediate{margin:10px 0}.candidate-commit .primary{max-width:48%}
@media(min-width:761px) and (max-width:2199px){.candidates article{grid-template-columns:43% minmax(0,1fr);gap:12px}.candidate-details h4{font-size:24px}.immediate{padding:10px}.immediate p{font-size:14px}.candidate-commit{padding:10px 14px}.discovery-composition{grid-template-columns:150px minmax(0,1fr)}}
@media(min-width:2200px){.event-object{max-width:190px}.candidates article{padding:10px}.candidate-details h4{display:none}.candidates .face{max-width:280px;margin:auto}}
@media(max-width:760px){.discovery-note h3{font-size:25px}.discovery-note p{font-size:13px}.discovery-note small{font-size:11px}.discovery-composition{grid-template-columns:1fr;padding:10px 4px 14px;gap:12px}.event-object{max-width:none;display:grid;grid-template-columns:64px 1fr;align-items:center;gap:12px}.event-object>.event-full{display:none}.event-thumbnail{display:block;width:64px;height:64px;padding:3px;background:linear-gradient(135deg,#f4ddb0,#8c6737 45%,#e4c48b);border:1px solid #c8ac72}.event-thumbnail :global(img){display:block;width:100%;height:100%;object-fit:cover;border:1px solid #957f55}.event-object>span{text-align:left;font-size:13px}.candidates article{grid-template-columns:1fr}.candidates .candidate-face{max-width:260px;margin:auto}.candidate-details h4{font-size:24px}.candidate-commit{margin-top:8px;padding:10px}.candidate-commit p{font-size:14px}.candidate-commit small{font-size:11px}.candidate-commit .primary{max-width:none}}
@container(min-width:421px) and (max-width:620px){.discovery-note{padding-bottom:5px}.discovery-note h3{font-size:21px}.discovery-note p,.discovery-note small{font-size:11px}.discovery-composition{display:block;padding-top:8px}.event-object{max-width:none;display:flex;flex-direction:row;gap:9px;align-items:center;margin:0 0 8px}.event-object>.event-full{display:none}.event-thumbnail{display:block;width:56px;height:56px;padding:3px;background:linear-gradient(135deg,#f4ddb0,#8c6737 45%,#e4c48b)}.event-thumbnail img{width:100%;height:100%;object-fit:cover}.event-object>span{text-align:left;font-size:11px}.candidates{grid-template-columns:1fr}.candidates article{grid-template-columns:145px minmax(0,1fr);padding:8px;gap:12px}.candidate-details h4{display:block;font-size:23px}.immediate{padding:8px}.immediate p{font-size:13px}.candidate-details>button{font-size:12px}.candidate-commit{padding:8px;margin-top:6px}.candidate-commit p{font-size:13px}.candidate-commit small{font-size:10px}.candidate-commit button{font-size:12px}.public-type{font-size:12px;margin:6px 0}}
.compact .discovery-note{padding-bottom:5px}.compact .discovery-note p{font-size:11px;margin:0}.compact .discovery-note small{font-size:10px}.compact .discovery-note h3{font-size:21px}.compact .discovery-composition{display:grid;grid-template-columns:100px minmax(0,1fr);gap:12px;padding:8px 4px}.compact .event-object{display:flex;flex-direction:column;max-width:100px;margin:0;gap:5px;align-items:center}.compact .event-object>.event-full{display:block}.compact .event-thumbnail{display:none}.compact .event-object>span{font-size:10px;text-align:center}.compact .event-object small{font-size:10px}.compact .public-type{font-size:11px;margin:0 0 6px}.compact .public-type small{font-size:10px}.compact .candidates{display:block}.compact .candidates article{display:grid;grid-template-columns:clamp(86px,24cqw,135px) minmax(0,1fr);gap:10px;padding:6px}.compact .candidates .face{max-width:none;margin:0}.compact .candidate-details h4{display:none;font-size:21px;margin:0}.compact .immediate{padding:8px;margin:7px 0}.compact .immediate p{font-size:12px;line-height:1.3}.compact .immediate strong{font-size:10px}.compact .candidate-details>button{font-size:11px;padding:6px;min-height:44px}.compact .inspect-candidate{margin-top:6px}.compact .candidate-commit{display:flex;flex-wrap:nowrap;gap:8px;padding:7px;margin:5px 0 0}.compact .candidate-commit p{font-size:12px}.compact .candidate-commit small,.compact .selected-consequence{display:none}.compact .candidate-commit .primary{font-size:11px;padding:8px;max-width:42%;min-height:44px}.candidate-navigation{display:flex;align-items:center;gap:5px;flex:none}.candidate-navigation button{width:44px;height:44px;padding:5px;font-size:24px}.candidate-navigation span{font-size:10px}
.compact .discovery-composition{grid-template-rows:minmax(0,1fr);padding:5px 4px;gap:10px}.compact .event-object{align-self:start;min-height:0}.compact .response-object{min-height:0}.compact .candidates article{grid-template-columns:clamp(86px,22cqw,105px) minmax(0,1fr)}.compact .public-type{line-height:1.2}.compact .public-type small{line-height:1.2}@media(max-height:650px){.compact .candidates article{grid-template-columns:86px minmax(0,1fr)}.compact .event-object .event-full{width:80px}.compact .event-object>span{font-size:9px}}
.compact .event-rules{display:none}.candidate-navigation .reveal-register{font-size:12px}
.compact .discovery-note{display:flex;align-items:center;justify-content:space-between;gap:8px}.compact .discovery-note h3{display:none}.compact .discovery-note small{font-size:9px}.compact .discovery-note p{font-size:10px;flex-shrink:0}

.portrait-scroll-cue{display:none}
/* Personal portrait decisions keep the full production face as an inspectable
   miniature beside the readable consequence and actual selection control. */
@media(max-width:760px){
 .candidate-spread:not(.compact) .discovery-note{padding-bottom:6px}
 .candidate-spread:not(.compact) .discovery-note p{font-size:12px;margin:0 0 2px}
 .candidate-spread:not(.compact) .discovery-note small{font-size:11px}
 .candidate-spread:not(.compact) .discovery-composition{gap:7px;padding-top:7px}
 .candidate-spread:not(.compact) .event-object{grid-template-columns:44px minmax(0,1fr);gap:9px}
 .candidate-spread:not(.compact) .event-thumbnail{width:44px;height:44px;padding:2px}
 .candidate-spread:not(.compact) .event-object>span{font-size:12px;line-height:1.25}
 .candidate-spread:not(.compact) .event-object>span br:first-of-type{display:none}
 .candidate-spread:not(.compact) .event-object>span strong::after{content:' · '}
 .candidate-spread:not(.compact) .event-object small{font-size:11px}
 .candidate-spread:not(.compact) .public-type{font-size:12px;line-height:1.3;margin:4px 0 8px}
 .candidate-spread:not(.compact) .public-type small{display:block;font-size:11px}
 .candidate-spread:not(.compact) .candidates{gap:12px}
 .candidate-spread:not(.compact) .candidates article{grid-template-columns:110px minmax(0,1fr);gap:10px;padding:8px}
 .candidate-spread:not(.compact) .candidate-face{width:110px;margin:0;align-self:start}
 .candidate-spread:not(.compact) .candidate-details h4{font-size:22px;line-height:1.05;margin:0 0 7px}
 .candidate-spread:not(.compact) .immediate{padding:8px;margin:0 0 8px}
 .candidate-spread:not(.compact) .immediate p{font-size:14px;line-height:1.3;margin:4px 0 0}
 .candidate-spread:not(.compact) .immediate strong{font-size:11px}
 .candidate-spread:not(.compact) .candidate-details>button{font-size:13px;padding:8px 6px;min-height:44px}
 .candidate-spread:not(.compact) .inspect-candidate{margin-top:7px}
}
.compact.saveError .discovery-composition{grid-template-columns:80px minmax(0,1fr)}
.compact.saveError .event-object{max-width:80px}
.compact.saveError .event-object>.event-full{width:76px}
.compact.saveError .event-object>span,.compact.saveError .event-object small{font-size:9px;line-height:1.2}
.compact.saveError .candidates article{grid-template-columns:86px minmax(0,1fr)}

.jump-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.jump-actions p{margin-right:auto}
.compact.jumpDecision .discovery-composition{grid-template-columns:1fr}
.compact.jumpDecision .event-object{display:none}
.compact.jumpDecision .response-object>h4{font-size:18px;margin:3px 0}
.compact.jumpDecision .source-rules{padding:6px;margin:4px 0;font-size:11px;line-height:1.2}
.compact .jump-planner{display:grid;gap:4px}
.compact .jump-planner p{font-size:11px;line-height:1.2;margin:2px 0}
.compact .jump-planner label{display:grid;grid-template-columns:64px minmax(0,1fr);align-items:center;gap:6px;margin:2px 0;font-size:11px}
.compact .jump-planner select{margin:0;font-size:11px;padding:6px}
.compact .jump-planner .response-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin:2px 0}
.compact .jump-planner button{font-size:10px;min-height:44px;padding:4px}
.compact .jump-actions{display:grid;grid-template-columns:42px minmax(0,1fr) minmax(0,1fr);gap:5px;margin:2px 0}
.compact .jump-actions .primary{max-width:none}
/* Persisted cube outcomes are compact public records, never a narrow list
   that displaces the next faction's decision or the candidate selection. */
.saved-rolls{display:flex;flex-wrap:wrap;gap:5px;list-style:none;margin:5px 0 0;padding:0;grid-column:1 / -1;min-width:0}
.saved-rolls li{padding:4px 6px;border:1px solid #ad965b88;border-radius:4px;font-size:11px;line-height:1.2}
.compact .event-object:has(.saved-rolls)>.event-full{display:none}
.compact .event-object:has(.saved-rolls)>.event-thumbnail{display:block;width:44px;height:44px;padding:2px}
.compact .event-object:has(.saved-rolls)>.event-thumbnail img{display:block;width:100%;height:100%;object-fit:cover}
.compact .saved-rolls{gap:3px;width:100%}
.compact .saved-rolls li{font-size:10px;padding:3px;flex:1 1 100%}
/* The rotated logical reader stays480px at native4K; keep the saved
   cube identity and both legal responses together inside that same reader. */
.compact .cube-result{padding:8px;display:grid;grid-template-columns:34px minmax(0,1fr);gap:3px 7px;align-items:center}
.compact .cube-result>span{font-size:32px;grid-row:1 / span 2}
.compact .cube-result>strong{font-size:14px}
.compact .cube-result>p{font-size:11px;line-height:1.2;margin:0}
.compact .cube-result+.response-list{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin:6px 0}
.compact .cube-result+.response-list>button{font-size:11px;padding:6px;min-height:44px}
.compact .cube-result+.response-list small{font-size:10px;line-height:1.2;margin-top:3px}
</style>
