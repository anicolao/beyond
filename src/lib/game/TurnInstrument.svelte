<script lang="ts">
  import {tick} from 'svelte';
  import {saveErrorMessage} from '$lib/user-error';
  import CardFace from '$lib/cards/CardFace.svelte';
  import TechnologyActionPlan from './TechnologyActionPlan.svelte';
  import ProductionPreview from './ProductionPreview.svelte';
  import TradePlan from './TradePlan.svelte';
  import LevelTwoPlan from './LevelTwoPlan.svelte';
  import DiscoveryChoices from './DiscoveryChoices.svelte';
  import {availableClaims} from './achievements';
  import {continuationKind} from './continuation-kind';
  import {canAdvanceDiscovery} from './discovery-resolution';
  import {cardById} from './cards';
  import {factions,seatAngles} from './manifest';
  import {growthColumns,oreProduction,researchBlocker,type TurnMove} from './turn';
  import type {PublicSetup} from './setup';
  let {game,mode,ownPosition,busy=false,commit,inspect,fallbackFocus}:{game:PublicSetup;mode:'remote'|'tabletop';ownPosition?:string;busy?:boolean;commit:(move:TurnMove)=>Promise<void>;inspect:(id:string,collection?:string[])=>void;fallbackFocus:()=>void}=$props();
  let dialog=$state<HTMLDialogElement>(undefined!),origin:HTMLElement|null=null;
  let scrollArea=$state<HTMLDivElement>(undefined!);
  let previewIndex=$state(0);
  let viewportWidth=$state(0);
  const overview=$derived(viewportWidth>=761&&viewportWidth<2200);
  let openedPosition=$state(''),finishing=$state(false),finishAttempted=$state(false),finishError=$state('');
  let action=$state<'I'|'II'|'gather'|'technology'>('I');
  let selected=$state(''),space=$state(0),ship=$state(''),fallback=$state<'population'|'skip'>('skip'),error=$state('');
  const controlTransfer=$derived(game.phase==='discovery'&&continuationKind(game)==='control');
  const actionEffects=$derived(game.phase==='discovery'&&continuationKind(game)==='action');
  const knownResearchBonus=$derived(game.phase==='discovery'&&continuationKind(game)==='research');
  const actor=$derived(game.players.find(p=>p.position===(game.phase==='discovery'?game.discovery?.queue[0]?.responder:game.activePosition))!);
  const angled=$derived(mode==='tabletop'&&((seatAngles[actor.position]??0)%180!==0));
  const allowed=$derived(mode==='tabletop'||ownPosition===actor.position);
  const choices=$derived(game.technologies.filter(t=>cardById(t.card).technology?.level==='I'));
  const claimOptions=$derived(availableClaims(game));
  const receipt=$derived(game.discovery?.completed&&game.discovery.completed.turn===game.turn?game.discovery.completed.card:actor.research.at(-1));
  const researchCubes=$derived(actor.research.length+(actor.reservedResearch?.length??0));
  const usedTechnology=$derived(actor.actionLocation?.startsWith('technology:')?actor.actionLocation.split(':')[1]:undefined);
  const gathered=$derived(actor.actionLocation==='supply-population:0');
  const card=$derived(selected?cardById(selected):undefined);
  const columnYield=$derived(growthColumns(actor));
  const growth=$derived(columnYield.filter(c=>c.available).length);
  const eligibleShips=$derived(actor.ships.filter(s=>s.level<4));
  const blocker=$derived(researchBlocker(game,space,selected||undefined));
  const angle=$derived(mode==='tabletop'?(seatAngles[actor.position]??0):0);
  const needsShip=$derived(selected==='narrow-beam-lasers'&&eligibleShips.length>0);
  const upgradeTarget=$derived(needsShip?eligibleShips.find(candidate=>candidate.id===ship):undefined);
  export async function open(index?:number,kind:'I'|'II'|'gather'|'technology'='I'){
    origin=document.activeElement as HTMLElement;openedPosition=game.activePosition;action=kind;prepareAttempted=false;powerAttempt='';error='';selected='';ship='';
    previewIndex=0;if(mode==='tabletop'&&((seatAngles[actor.position]??0)%180!==0))selected=game.technologies[0].card;
    space=index??Array.from({length:game.count},(_,i)=>i).find(i=>!researchBlocker(game,i))??0;
    await tick();dialog.showModal();scrollArea.scrollTop=0;
  }
  async function finishEmptyPhase(){
    finishing=true;finishError='';
    try{await commit({kind:'end-turn'});}
    catch(cause){finishError=saveErrorMessage(cause);if(!dialog.open){await tick();openedPosition=actor.position;dialog.showModal();}}
    finally{finishing=false;}
  }
  // Empty or already-claimed achievement phases hand off without a redundant acknowledgement.
  $effect(()=>{if(game.phase!=='achievement'){finishAttempted=false;finishError='';return;}if(allowed&&!busy&&!finishing&&!finishAttempted){if(claimOptions.length){if(!game.discovery){finishAttempted=true;void send({kind:'prepare-discovery'}).finally(()=>{finishAttempted=false;});}else if(!dialog?.open){void open();}return;}finishAttempted=true;void finishEmptyPhase();}});
  $effect(()=>{const current=game.activePosition,opened=openedPosition;if(dialog?.open&&opened&&current!==opened)dialog.close();});
  function browse(offset:number){previewIndex=(previewIndex+offset+choices.length)%choices.length;select(choices[previewIndex].card);}
  async function select(id:string){
    selected=id;ship='';error='';await tick();
    const control=document.activeElement;
    if(!angled&&control instanceof HTMLElement&&dialog.contains(control)){
      const face=control.closest('article')?.querySelector<HTMLElement>('.choose-card');
      // Read the selected face from its title without scrolling the dialog's
      // persistent chrome or leaving keyboard focus below the reader viewport.
      scrollArea.focus({preventScroll:true});
      scrollArea.scrollTo({top:scrollArea.scrollTop+(face??control).getBoundingClientRect().top-scrollArea.getBoundingClientRect().top-8,behavior:'instant'});
    }
  }
  async function send(move:TurnMove){if(!allowed||busy)return;error='';try{await commit(move);await tick();if(dialog.open&&(!dialog.contains(document.activeElement)||document.activeElement instanceof HTMLButtonElement&&document.activeElement.disabled)&&[...document.querySelectorAll('dialog[open]')].at(-1)===dialog)scrollArea.focus({preventScroll:true});}catch(cause){error=saveErrorMessage(cause);}}
  function trap(e:KeyboardEvent){if(e.key!=='Tab')return;const controls=[...dialog.querySelectorAll<HTMLElement>('button:not([disabled]),select,input,a[href],[tabindex="0"]')].filter(el=>el.getClientRects().length);if(e.shiftKey&&document.activeElement===controls[0]){e.preventDefault();controls.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===controls.at(-1)){e.preventDefault();controls[0]?.focus();}}
  function commitResearch(){if(!selected)return;void send({kind:'research-I',space,card:selected as 'terraforming'|'advanced-genetics'|'advanced-robotics'|'narrow-beam-lasers',...(needsShip?{ship}:{}),...(selected==='terraforming'&&!actor.supply.some(n=>n>0)?{supplyFallback:fallback}:{})});}
  let preparing=$state(false),prepareAttempted=$state(false),powerAttempt=$state('');
  $effect(()=>{if((action==='II'||action==='technology')&&game.phase==='action'&&(game.turn??0)>=game.count&&!game.discovery&&dialog?.open&&allowed&&!busy&&!preparing&&!prepareAttempted){preparing=true;prepareAttempted=true;void send({kind:'prepare-discovery'}).finally(()=>{preparing=false;});}});
  $effect(()=>{if((action!=='II'&&action!=='technology')||game.phase!=='action'||!game.discovery||game.discovery.powerReady||!dialog?.open||!allowed||busy)return;const next=game.players.find(p=>!game.discovery!.powerPositions?.includes(p.position));if(next&&powerAttempt!==next.position){powerAttempt=next.position;void send({kind:'prepare-fleet-power',position:next.position});}});
  let automaticAttempt=$state(-1);
  $effect(()=>{const cursor=game.discovery?.cursor;if(game.phase!=='discovery'){automaticAttempt=-1;return;}if(cursor!==undefined&&allowed&&!busy&&automaticAttempt!==cursor&&canAdvanceDiscovery(game)){automaticAttempt=cursor;void send({kind:'discovery-advance',at:cursor});}});
  $effect(()=>{const phase=game.phase;if(scrollArea&&phase)scrollArea.scrollTop=0;});
  $effect(()=>{if(game.activePosition&&dialog?.open&&!allowed&&game.phase!=='discovery')dialog.close();});
</script>
<svelte:window bind:innerWidth={viewportWidth}/>
<!-- svelte-ignore a11y_no_noninteractive_tabindex (Named internal reader supports bounded keyboard scrolling.) -->
<dialog data-e2e-layout class="turn-instrument" data-phase={game.phase} class:shared={mode==='tabletop'} class:angled={angled} class:bounded-choices={game.phase==='discovery'||game.phase==='action'&&(action==='II'||action==='technology')} style={`--reader-angle:${angle}deg`} bind:this={dialog} aria-label="Turn decision" onkeydown={trap} onclose={async()=>{await tick();if((openedPosition&&game.activePosition!==openedPosition)||!origin?.isConnected||(origin instanceof HTMLButtonElement&&origin.disabled))fallbackFocus();else origin?.focus();}}>
  <div class="instrument-frame">
    <header><div class="faction-seal" aria-hidden="true">{factions.find(f=>f.id===actor.faction)?.emblem}</div><div><p class="eyebrow">{actor.name} · {game.phase==='action'?'Action':game.phase==='trade'?'Resource trade':game.phase==='production'?'Production':game.phase==='discovery'?(controlTransfer?'Control transfer':actionEffects?'Action effects':knownResearchBonus?'Research bonus':'Discovery'):'Achievement'} phase</p><h2>{game.phase==='action'?(action==='I'?'Research Level\u00a0I':action==='II'?'Research Level\u00a0II':action==='technology'?'Technology Action':'Gather resources'):game.phase==='discovery'?(controlTransfer?'Resolve outpost control':actionEffects?'Resolve printed Action':knownResearchBonus?'Resolve research bonus':viewportWidth<761?'Choose a discovery':'Humanity’s next discovery'):game.phase==='production'?'Choose your production':game.phase==='trade'?'Trade resources':claimOptions.length?'Claim an achievement':'Completing turn'}</h2></div>{#if game.phase==='action'}<label class="action-select"><span>Basic action</span><select aria-label="Basic action" bind:value={action}><option value="I">Research Level I</option><option value="II">Research Level II</option><option value="gather">Gather resources</option><option value="technology">Printed Action</option></select></label>{/if}<button class="close" onclick={()=>dialog.close()}>Back to table</button></header>
    <div class="decision-scroll" bind:this={scrollArea} role="region" aria-label="Turn choices" tabindex="0">
      {#if game.phase==='action'}
       {#if action==='technology'}<TechnologyActionPlan compact={angled} {game} {busy} {allowed} send={move=>{void send(move);}} {inspect}/>
       {:else if action==='II'}<LevelTwoPlan compact={angled} {game} {busy} {allowed} send={move=>{void send(move);}} {inspect}/>
       {:else if action==='gather'}<section class="gather-plan"><h3>Gather resources</h3><p>Convert the leftmost Supply cube to Population, then gain1 Ore. This action may be repeated on your next turn while your pawn remains here; another faction’s pawn blocks the space.</p>{#if !actor.supply.some(n=>n>0)}<label>Supply exhausted<select aria-label="Gather Supply exception" bind:value={fallback}><option value="skip">Pass on Supply conversion</option><option value="population" disabled={!actor.population}>Use available Population</option></select></label>{/if}<button class="primary" disabled={busy||!allowed||game.players.some(p=>p.position!==actor.position&&p.actionLocation==='supply-population:0')} onclick={()=>{void send({kind:'gather',...(!actor.supply.some(n=>n>0)?{supplyFallback:fallback}:{})});}}>Gather Population and Ore</button></section>
       {:else}
        <div class="action-plan"><div><h3>Move your Action pawn</h3><p>Choose an open Basic Spacefaring space. Research uses a separate permanent Population cube.</p></div><div class="spaces" role="group" aria-label="Level I action spaces">{#each Array.from({length:game.count},(_,i)=>i) as i}{@const reason=researchBlocker(game,i)}<button aria-pressed={space===i} aria-disabled={!!reason} title={reason||'Open · 0 Ore'} aria-label={`Research Level I space ${i+1}${reason?`: ${reason}`:''}`} onclick={()=>space=i}><span aria-hidden="true" class="pawn-socket">{game.players.find(p=>p.actionLocation===`research-I:${i}`)?'♟':'◇'}</span><strong>{i+1}</strong><small>{angled?(reason?(reason==='Move to another action space'?'Current':reason.startsWith('Occupied by')?'Occupied':'Blocked'):'Open · 0 Ore'):(reason||'Open · 0 Ore')}</small></button>{/each}</div></div>
        {#if angled}
          <div class="compact-research-choice">
            <nav aria-label="Public technology choices"><button aria-label="Previous technology" onclick={()=>browse(-1)}>←</button><span>Level I · {previewIndex+1} of {choices.length}</span><button aria-label="Next technology" onclick={()=>browse(1)}>→</button></nav>
            <div class="compact-card-object"><div class="angled-card-face"><CardFace card={cardById(choices[previewIndex].card)} compact/></div><div class="planning-bonus"><strong>Immediate bonus</strong><p>{cardById(choices[previewIndex].card).sections.find(s=>s.label==='Immediate')?.text}</p></div></div>
            <div class="compact-choice-tools"><button onclick={()=>inspect(choices[previewIndex].card)}>Inspect full card</button><span>{actor.research.includes(choices[previewIndex].card)?'Already researched':'No prerequisites'}</span></div>
            {#if needsShip}<label class="compact-target">Ship (required)<select required aria-label="Ship to upgrade" bind:value={ship}><option value="">Choose a ship</option>{#each eligibleShips as s}<option value={s.id}>{s.id.endsWith('ship-2')?'Second ship':'Ship'} · {s.location==='sol'?'Sol':'Deep Space'} · {s.level} → {s.level+1}</option>{/each}</select></label>{/if}
          {#if selected==='terraforming'&&!actor.supply.some(n=>n>0)}<label class="compact-target">Supply exhausted<select aria-label="Exhausted Supply bonus" bind:value={fallback}><option value="skip">Pass on the ship bonus</option><option value="population" disabled={actor.population<2}>Use 1 additional Population</option></select></label>{/if}</div>
        {:else}
        <p class="reader-cue">Four public technologies · scroll to review every face · inspect freely, then select.</p>
        <div class="technology-choices" aria-label="Level I technologies">{#each choices as choice}{@const face=cardById(choice.card)}{@const researched=actor.research.includes(choice.card)}<article class:selected={selected===choice.card} class:researched class:overview-choice={overview}><div class="choose-card"><CardFace card={face} compact={overview}/></div><div class="choice-details">{#if overview}<div class="choice-bonus"><strong>Immediate bonus</strong><p>{face.sections.find(section=>section.label==='Immediate')?.text}</p></div>{/if}<div class="card-caption"><button class="select-card" aria-pressed={selected===choice.card} aria-label={`Choose ${face.title}${researched?' · already researched':''}`} onclick={()=>select(choice.card)}>{selected===choice.card?'Selected':'Select'}</button><button onclick={()=>inspect(choice.card)} aria-label={`Read full ${face.title}`}>Inspect full card ↗</button><span>{researched?'Permanent cube already placed':'No prerequisites'}</span></div></div>        {#if needsShip&&selected===choice.card}<fieldset><legend>Immediate bonus · choose your ship to upgrade</legend>{#each eligibleShips as s}<label class="ship-option"><input type="radio" name="upgrade-ship" value={s.id} bind:group={ship}/><strong>{s.id.endsWith('ship-2')?'Second ship':'Ship'} · {s.location==='deep-space'?'Deep Space':'Sol'}</strong><span>Level {s.level} → {s.level+1}</span></label>{/each}</fieldset>{/if}
        {#if selected===choice.card&&selected==='terraforming'&&!actor.supply.some(n=>n>0)}<fieldset><legend>Supply exhausted · bonus choice</legend><label><input type="radio" name="supply-fallback" value="skip" bind:group={fallback}/>Pass on the ship bonus</label><label><input type="radio" name="supply-fallback" value="population" bind:group={fallback} disabled={actor.population<2}/>Use 1 additional Population for the ship</label></fieldset>{/if}</article>{/each}</div>
        {/if}

       {/if}
      {:else if game.phase==='discovery'}<DiscoveryChoices saveError={!!error} compact={angled} {game} {allowed} {busy} send={move=>{void send(move);}} {inspect}/>
      {:else if game.phase==='production'}
        <div class="bonus-receipt"><span class="permanent-cube" aria-hidden="true">{usedTechnology?'♟':'▣'}</span><div><h3>{usedTechnology?cardById(usedTechnology).title+' · Action resolved':gathered?'Resources gathered':receipt?cardById(receipt).title+' · researched':'Action resolved'}</h3><p>{usedTechnology?'The printed Action and all its saved effects are complete. Your research cube remains in place.':gathered?'Gather resources resolved. Gained1 Ore.':receipt?'1 Population permanently placed. '+(cardById(receipt).sections.find(s=>s.label==='Immediate')?.text??'No immediate bonus.'):'Your action has been saved.'}</p><strong>{usedTechnology?'Printed Action resolved and saved':'Immediate bonus resolved and saved'}</strong></div></div>
        <div class="production-preview"><ProductionPreview player={actor} compact={angled}/></div>
        <div class="production-branches"><button class="production-choice" disabled={busy||!allowed} onclick={()=>{void send({kind:'grow'});}}><span aria-hidden="true">♧</span><div><strong>Grow Population</strong><small>Gain {growth} Population · {columnYield.map(c=>`${c.letter}: ${c.available?'1':'empty'}`).join(' · ')}</small></div><b>+{growth} ▣</b></button><button class="production-choice" disabled={busy||!allowed} onclick={()=>{void send({kind:'ore'});}}><span aria-hidden="true">◆</span><div><strong>Produce Ore</strong><small>Take the full exposed Ore yield</small></div><b>+{oreProduction(actor)} ◆</b></button><button class="production-choice" disabled={busy||!allowed} onclick={()=>{void send({kind:'trade'});}}><span aria-hidden="true">⇄</span><div><strong>Trade resources</strong><small>Use exchange rates · no ordinary production</small></div><b>→</b></button></div>
      {:else if game.phase==='achievement'&&claimOptions.length}<section class="achievement-review"><h3>Claim one achievement</h3><p>You qualify at the end of this turn. Choose one available reward.</p>{#each claimOptions as id}<div class="eligible-achievement"><button onclick={()=>inspect(id)}>Inspect {cardById(id).title}</button><button class="primary" disabled={busy||!allowed} onclick={()=>{finishAttempted=false;void send({kind:'claim-achievement',card:id});}}>Claim {cardById(id).title}</button></div>{/each}</section>
      {:else if game.phase==='trade'}
        <TradePlan {game} compact={angled||viewportWidth<761} {busy} {allowed} send={move=>{void send(move);}}/>
      {:else}<div class="achievement-review"><span aria-hidden="true">✧</span><h3>Completing turn</h3><p>No achievement requirement is met by this position. Your research cube, Action pawn and production changes remain on the table.</p><p>Passing automatically to: <strong>{game.players[(game.players.indexOf(actor)+1)%game.count].name}</strong> · Action phase</p></div>{/if}
    </div>
    <footer>{#if game.discovery?.events.some(e=>e.id==='black-market-industries'&&e.resolved)&&game.activePosition===actor.position&&!game.discovery.industry.includes(actor.position)}<details class="free-industry"><summary>Black Market Industries · optional, once</summary><p>Move a production disc here. Increase production without automation; lose 2 VP at game end.</p><button disabled={!allowed||busy||!actor.foodDiscs} onclick={()=>{void send({kind:'black-market',track:'food'});}}>Move Food disc · −2 VP</button><button disabled={!allowed||busy||!actor.oreDiscs} onclick={()=>{void send({kind:'black-market',track:'ore'});}}>Move Ore disc · −2 VP</button></details>{/if}<div class="decision-balance"><strong>{actor.population} <span>Population</span></strong><strong>{actor.ore} <span>Ore</span></strong><small>{researchCubes} permanent research {researchCubes===1?'cube':'cubes'}</small></div>{#if error}<p class="error" role="alert">{error}</p>{#if game.phase==='discovery'&&canAdvanceDiscovery(game)}<button disabled={busy||!allowed} onclick={()=>{error='';automaticAttempt=-1;}}>Retry saved continuation</button>{:else if (action==='II'||action==='technology')&&(!game.discovery||!game.discovery.powerReady)}<button disabled={busy||!allowed} onclick={()=>{error='';prepareAttempted=false;powerAttempt='';}}>Retry discovery preparation</button>{/if}{/if}{#if game.phase==='action'&&action==='I'}<div class="commit-plan"><p>{#if selected&&angled}Pay 1 Population · 0 Ore · permanent cube{:else if card}<strong class="commit-identity">{card.title}</strong><span class="commit-payment">Pay 1 Population · 0 Ore · permanent cube placement</span><span class="commit-consequence" aria-live="polite">{#if upgradeTarget}Gain 1 Ore. Upgrade {upgradeTarget.id.endsWith('ship-2')?'Second ship':'Ship'} at {upgradeTarget.location==='deep-space'?'Deep Space':'Sol'} · level {upgradeTarget.level} → {upgradeTarget.level+1}.{:else}{card.sections.find(section=>section.label==='Immediate')?.text}{/if}</span>{:else}Choose a technology. Inspection and selection spend nothing.{/if}{#if blocker}<span class="blocker">{blocker}</span>{/if}{#if needsShip&&!ship}<span class="target-hint">Choose a ship for the mandatory upgrade.</span>{/if}</p><button class="primary" disabled={busy||!allowed||!selected||!!blocker||(needsShip&&!ship)} onclick={commitResearch}>Research {card?.title??'technology'}</button></div>{:else if game.phase==='trade'}<button class="primary" disabled={busy||!allowed} onclick={()=>{void send({kind:'finish-trading'});}}>Finish trading</button>{:else if game.phase==='achievement'}{#if claimOptions.length}<span class="saved">Choose one eligible achievement above</span>{:else if finishError}<p class="error" role="alert">{finishError}</p><button class="primary" disabled={busy||finishing||!allowed} onclick={()=>{finishAttempted=false;}}>Retry completing turn</button>{:else}<span class="saved" role="status">Saving handoff…</span>{/if}{:else if game.phase==='discovery'}<span class="saved">{controlTransfer?'Control transfer':actionEffects?'Printed Action':knownResearchBonus?'Research bonus':'Public discovery'} · {actor.name} responds</span>{:else if game.phase==='action'}{#if action!=='technology'}<span class="saved">Planning spends nothing · commit above when ready</span>{/if}{:else}<span class="saved">Choose one production branch above</span>{/if}</footer>
  </div>
</dialog>
<style>
.action-select{display:grid;gap:4px;font-size:11px;color:#dbcdab;margin-left:auto}.action-select select,.gather-plan select{min-height:44px;border:1px solid #b49a5e;border-radius:6px;padding:7px;background:#d8cba8;color:#213d37;font:14px 'Atkinson Hyperlegible',sans-serif}.gather-plan{max-width:650px;display:grid;gap:20px}.gather-plan p{line-height:1.5}.gather-plan .primary{max-width:none}.gather-plan label{display:grid;gap:8px}@media(max-width:760px){.action-select{max-width:130px;width:130px;flex-shrink:0}.action-select select{width:100%;font-size:12px}.turn-instrument header:has(.action-select){gap:8px;padding:12px}.turn-instrument header:has(.action-select) h2{font-size:24px}.turn-instrument header:has(.action-select) .faction-seal{display:none}.turn-instrument header:has(.action-select) .close{font-size:11px;padding:7px;max-width:75px}}
.turn-instrument{position:fixed;inset:0;margin:auto;width:min(1120px,94vw);height:min(900px,92dvh);padding:0;border:2px solid #b79a59;border-radius:17px;color:#e9e3cf;background:radial-gradient(ellipse at 45% 0,#355957,#142b31 65%,#0d1d24);box-shadow:inset 0 0 0 5px #0e2028,inset 0 0 0 6px #ab945d77,0 7px #6b552f,0 22px 60px #000b;max-height:94dvh;max-width:95vw}.turn-instrument:not([open]){display:none}.turn-instrument::backdrop{background:#020a10b8;backdrop-filter:blur(3px)}.instrument-frame{height:100%;display:grid;grid-template-rows:auto minmax(0,1fr) auto;min-height:0}header{display:flex;align-items:center;gap:17px;padding:22px 26px;border-bottom:1px solid #b49b6155;background:linear-gradient(140deg,#1d3c40,#0f252f)}.faction-seal{display:grid;place-items:center;width:53px;height:53px;border:1px solid #beaa6f;border-radius:50%;background:#244a4a;color:#d9c386;font:42px 'Cormorant Garamond',serif;box-shadow:0 3px #655230}.eyebrow{font-size:12px;letter-spacing:.07em;color:#dbcdab;margin:0 0 4px}h2{font:600 34px 'Cormorant Garamond',serif;margin:0}h3{font:600 25px 'Cormorant Garamond',serif;margin:0 0 7px}p{line-height:1.45;margin:0}button{min-height:44px;color:#f0e4c7;border:1px solid #b49a5e;background:linear-gradient(130deg,#354c48,#152f37);border-radius:7px;padding:10px 15px;font:14px 'Atkinson Hyperlegible',sans-serif;box-shadow:0 2px #796137;cursor:pointer}button:focus-visible,input:focus-visible{outline:3px solid #71eee7;outline-offset:3px}button:disabled{opacity:.55;cursor:default}.close{margin-left:auto;flex-shrink:0}.decision-scroll{overflow:auto;padding:22px 26px;scrollbar-color:#c5ab70 #112b31;scrollbar-width:auto;min-height:0;scroll-padding:12px}.action-plan{display:flex;gap:25px;align-items:center}.action-plan>div:first-child{max-width:47%}.action-plan p,.reader-cue{font-size:13px;color:#d5d3bd}.spaces{display:flex;gap:8px;flex:1}.spaces button{flex:1;padding:8px;display:grid;grid-template-columns:25px 1fr;align-items:center;gap:6px}.spaces small{grid-column:1 / -1;font-size:10px;line-height:1.3}.spaces button[aria-disabled=true]{background:#233237;color:#b7b4a4}.spaces button[aria-pressed=true]{border-color:#80efdc;box-shadow:0 0 0 2px #62e8dc55,inset 0 0 20px #3b8e7a44}.pawn-socket{display:grid;place-items:center;width:25px;height:25px;border:1px solid #b9aa74;border-radius:50%;font-size:21px}.reader-cue{margin:17px 0 12px;padding:9px 0;border-top:1px solid #b49b6144}.technology-choices{display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:start;max-width:850px;margin:auto}.technology-choices article{padding:8px;border:1px solid #b29b6044;border-radius:12px;background:#081c22;box-shadow:0 4px 9px #0008}.technology-choices article.selected{border:2px solid #81f4e8;padding:7px;box-shadow:0 0 20px #65e5da55}.choose-card{display:block;width:100%;height:auto;padding:0;border:0;background:none;box-shadow:none;text-align:left;container-type:inline-size}.card-caption{display:flex;gap:10px;align-items:center;padding-top:10px;font-size:11px;color:#c0c6b3}.card-caption button{font-size:12px;padding:7px 10px}.card-caption span{flex:1}.permanent-cube{display:grid;place-items:center;width:54px;height:54px;background:linear-gradient(130deg,#75a99c,#2b6159);color:#baf6d8;border:1px solid #acd4b5;box-shadow:3px 4px #0a3531;font-size:35px;flex-shrink:0}.bonus-receipt{display:flex;gap:20px;padding:17px 20px;border:1px solid #a99e62;border-radius:9px;background:linear-gradient(125deg,#d9c99b,#f3e6c4);color:#203b36;box-shadow:0 4px #77603c,0 8px 16px #0006}.bonus-receipt p{font-size:14px}.bonus-receipt strong{display:block;margin-top:9px;font-size:12px}.production-branches{display:grid;gap:12px}.production-choice{display:flex;gap:18px;align-items:center;text-align:left;padding:18px}.production-choice>span{font-size:35px;color:#d6c58b;min-width:40px}.production-choice>div{flex:1}.production-choice strong{display:block;font:600 25px 'Cormorant Garamond',serif}.production-choice small{display:block;margin-top:5px;color:#ced3bd;font-size:13px}.production-choice b{font-size:21px;color:#f0d99a;white-space:nowrap}.achievement-review{text-align:center;max-width:600px;margin:30px auto}.achievement-review>span{font-size:88px;color:#dfc689}.achievement-review h3{font-size:38px}.achievement-review p{margin:20px 0}.decision-balance{display:flex;gap:20px;align-items:center}.decision-balance strong{font:600 27px 'Cormorant Garamond',serif;white-space:nowrap}.decision-balance strong span{font:12px 'Atkinson Hyperlegible',sans-serif}.decision-balance small{font-size:11px;color:#cfceb3}footer{position:static;width:auto;margin:0;display:flex;flex-wrap:wrap;align-items:center;gap:15px;justify-content:space-between;padding:17px 26px;border-top:1px solid #b49b6166;background:#10262d}.commit-plan{display:flex;align-items:center;gap:16px;width:100%;justify-content:space-between}.commit-plan p{font-size:13px;max-width:58%;color:#dddcc4}.commit-plan p span{display:block;color:#ffd8a6}.primary{background:linear-gradient(140deg,#277c79,#135256);box-shadow:0 3px #a58a4e,inset 0 0 0 2px #5bd7cc33;color:#f6f4db;font-size:16px;max-width:50%;min-height:48px}.saved{font-size:13px;color:#d2c69f}.error{width:100%;color:#ffe2bd;font-size:13px;padding:10px;border:1px solid #cda46b}fieldset{border:1px solid #c6b079;border-radius:9px;margin-top:22px;padding:16px}legend{font-size:16px;color:#e7d49f;padding:0 9px}.ship-option{display:flex;gap:15px;align-items:center;padding:13px;background:#193b40;border:1px solid #8b9165;border-radius:7px;margin:8px 0;min-height:44px}.ship-option input{width:44px;height:44px;flex-shrink:0;accent-color:#66d9cc}.ship-option span{margin-left:auto}.shared{transform:rotate(var(--reader-angle));width:min(1120px,86vmin);height:90vmin;max-width:none;max-height:none}
.shared.angled{width:64vmin;height:64vmin}.shared.angled .action-plan{display:block}.shared.angled .action-plan>div:first-child{max-width:none}.shared.angled .spaces{margin-top:10px}.shared.angled .technology-choices{grid-template-columns:1fr;max-width:360px}.shared.angled header{padding:12px;gap:8px}.shared.angled h2{font-size:23px}.shared.angled .eyebrow{font-size:10px}.shared.angled .close{font-size:10px;padding:8px}.shared.angled .faction-seal{width:33px;height:33px;font-size:26px}.shared.angled footer{padding:12px}.shared.angled .commit-plan{display:block}.shared.angled .commit-plan p{max-width:none;font-size:11px;margin-bottom:9px}.shared.angled .primary{max-width:100%;font-size:14px}.shared.angled .decision-balance{gap:9px}.shared.angled .decision-balance strong{font-size:21px}.shared.angled .decision-balance strong span,.shared.angled .decision-balance small{font-size:9px}
@media(min-width:2200px){.turn-instrument{width:1680px;height:1800px}header{padding:35px 45px;gap:26px}h2{font-size:54px}.eyebrow{font-size:19px}.faction-seal{width:85px;height:85px;font-size:66px}.decision-scroll{padding:35px 45px}.action-plan h3,h3{font-size:38px}.action-plan p,.reader-cue,.bonus-receipt p,.production-choice small{font-size:21px}.reader-cue{margin:24px 0;padding:16px 0}.technology-choices{max-width:1300px;gap:34px}.card-caption{font-size:17px}.card-caption button,button{font-size:21px;padding:18px 24px}.spaces small{font-size:16px}.spaces button{padding:14px}.spaces{gap:14px}.pawn-socket{width:38px;height:38px;font-size:29px}.spaces button{grid-template-columns:38px 1fr}.bonus-receipt{padding:28px;gap:25px}.bonus-receipt strong{font-size:19px}.production-choice{padding:29px}.production-choice strong{font-size:40px}.production-choice b{font-size:32px}.decision-balance strong{font-size:44px}.decision-balance strong span,.decision-balance small,.saved{font-size:19px}.commit-plan p{font-size:20px}.primary{font-size:25px}footer{padding:28px 45px}.shared{width:1400px;height:1840px}.achievement-review{max-width:1000px}.achievement-review p{font-size:25px}}
@media(max-width:760px){.turn-instrument{width:96vw;height:94dvh;max-height:94dvh;max-width:96vw;border-radius:12px}header{padding:13px;gap:10px}.faction-seal{width:36px;height:36px;font-size:28px;flex-shrink:0}.eyebrow{font-size:9px}h2{font-size:25px}.close{padding:7px 10px;font-size:10px;max-width:76px}.decision-scroll{padding:14px}.action-plan{display:block}.action-plan>div:first-child{max-width:none}.action-plan h3{font-size:23px}.action-plan p{font-size:12px}.spaces{margin-top:12px;gap:7px}.spaces button{padding:8px 5px;grid-template-columns:20px 1fr}.spaces small{font-size:9px}.pawn-socket{width:20px;height:20px;font-size:17px}.reader-cue{font-size:11px;margin:14px 0 11px}.technology-choices{grid-template-columns:1fr;gap:20px;max-width:330px}.card-caption button{font-size:11px}.card-caption span{font-size:10px}.bonus-receipt{padding:13px;gap:12px}.permanent-cube{width:36px;height:36px;font-size:25px}.bonus-receipt h3{font-size:24px}.bonus-receipt p{font-size:12px}.bonus-receipt strong{font-size:10px}.production-choice{padding:13px;gap:9px}.production-choice>span{min-width:26px;font-size:26px}.production-choice strong{font-size:23px}.production-choice small{font-size:11px}.production-choice b{font-size:16px}.production-branches{gap:10px}.decision-balance{gap:13px;flex-wrap:wrap}.decision-balance strong{font-size:24px}.decision-balance strong span{font-size:10px}.decision-balance small{font-size:10px}.commit-plan{display:block}.commit-plan p{max-width:none;font-size:11px;margin-bottom:10px}.commit-plan .primary{width:100%;max-width:none;font-size:15px}.primary{max-width:100%;font-size:15px}footer{padding:12px 14px;gap:10px}.achievement-review{margin:15px auto}.achievement-review h3{font-size:31px}.achievement-review p{font-size:14px}.ship-option{padding:10px;gap:10px;flex-wrap:wrap;font-size:13px}.ship-option span{margin-left:32px}legend{font-size:14px}}
@media(max-width:760px){.bonus-receipt h3{font-size:21px;line-height:1.1}.bonus-receipt p{font-size:11px;line-height:1.35}.bonus-receipt strong{font-size:9px;margin-top:6px}.production-choice{padding:11px}.production-choice strong{font-size:21px}.production-choice small{font-size:10px}}
@media(min-width:761px) and (max-height:800px){.turn-instrument{height:94dvh}header{padding:14px 22px}.decision-scroll{padding:16px 22px}footer{padding:12px 22px}.action-plan h3{font-size:22px}.action-plan p{font-size:12px}.technology-choices{max-width:780px;gap:20px}.decision-balance strong{font-size:23px}.reader-cue{margin:12px 0}.bonus-receipt{padding:13px 18px}.production-choice{padding:13px}.production-choice strong{font-size:23px}.production-choice small{font-size:12px}.shared{width:86vmin;height:90vmin}.production-choice{padding:10px}.production-choice strong{font-size:22px}.bonus-receipt{padding:10px 15px}.bonus-receipt strong{margin-top:5px}.bonus-receipt p{font-size:12px}.bonus-receipt h3{font-size:23px}}
.compact-research-choice nav{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:6px 0}.compact-research-choice nav button{width:44px;height:44px;padding:6px;font-size:22px}.compact-research-choice nav span{font-size:12px;color:#e1d09d}.compact-card-object{display:grid;grid-template-columns:48% 1fr;gap:12px;align-items:center}.angled-card-face{height:93px;container-type:size}.angled-card-face :global(.card-face){height:100%}.compact-card-object>div:last-child{font-size:12px}.compact-card-object p{font-size:11px;line-height:1.35;margin-top:4px}.compact-choice-tools{display:flex;justify-content:space-between;gap:15px;align-items:center;margin-top:8px;font-size:10px}.compact-choice-tools button{font-size:12px;min-height:44px}.compact-target{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;margin-top:8px}.compact-target select{min-height:44px;max-width:68%;background:#eee0b7;color:#203a36;border:1px solid #b2995f;padding:7px;font:12px 'Atkinson Hyperlegible',sans-serif;border-radius:5px}.shared.angled .decision-scroll{overflow:visible;padding:8px 14px}.shared.angled .action-plan>div:first-child,.shared.angled .reader-cue{display:none}.shared.angled .spaces{margin-top:0}.shared.angled .spaces button{min-height:44px;padding:5px;grid-template-columns:20px 1fr}.shared.angled .spaces small{font-size:8px}.shared.angled .spaces .pawn-socket{width:20px;height:20px;font-size:17px}.shared.angled .bonus-receipt{padding:7px 10px;gap:8px}.shared.angled .bonus-receipt .permanent-cube,.shared.angled .bonus-receipt strong{display:none}.shared.angled .bonus-receipt h3{font-size:19px}.shared.angled .bonus-receipt p{font-size:11px;line-height:1.25}.shared.angled .production-branches{gap:8px}.shared.angled .production-choice{padding:6px 9px;min-height:44px;gap:9px}.shared.angled .production-choice strong{font-size:19px}.shared.angled .production-choice small{font-size:9px;margin-top:1px}.shared.angled .production-choice>span{font-size:22px;min-width:24px}.shared.angled .production-choice b{font-size:15px}.shared.angled .achievement-review{margin:0 auto}.shared.angled .achievement-review>span{font-size:45px}.shared.angled .achievement-review h3{font-size:26px}.shared.angled .achievement-review p{font-size:12px;margin:9px 0}.shared.angled footer{gap:8px}.shared.angled .commit-plan .primary{min-height:44px}.shared.angled .saved{font-size:11px}
.shared.angled{padding:1px;width:calc(64vmin + 6px);height:calc(64vmin + 6px)}.shared.angled .instrument-frame{width:460px;height:460px;transform:scale(calc(64vmin / 460px));transform-origin:0 0}
fieldset label:has(input[type=radio]){display:flex;align-items:center;gap:10px;min-height:44px}fieldset input[type=radio]{width:44px;height:44px;flex-shrink:0}

/* Seat-facing decisions fit without scroll: real controls keep their native
   44px targets on short displays; larger tables scale the whole instrument up. */
.shared.angled[data-phase=action] .decision-scroll{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto auto auto;gap:8px;align-content:start}
.shared.angled .compact-research-choice{display:contents}.shared.angled[data-phase=action] .action-plan{grid-column:1;grid-row:1;min-width:0}.shared.angled .compact-research-choice nav{grid-column:2;grid-row:1;margin:0;min-width:0}.shared.angled .compact-card-object{grid-column:1 / -1;grid-row:2}.shared.angled .compact-choice-tools{grid-column:1;grid-row:3;margin:0;min-width:0}.shared.angled .compact-target{grid-column:2;grid-row:3;margin:0;min-width:0}.shared.angled .compact-target select{min-width:0;flex:1}.shared.angled .compact-choice-tools>span{font-size:9px}.shared.angled .spaces{gap:5px}.shared.angled .spaces button{min-width:44px}.shared.angled .commit-plan{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}.shared.angled .commit-plan p{max-width:none;margin:0}.shared.angled .commit-plan .target-hint{display:none}.shared.angled .commit-plan .primary{max-width:260px}.shared.angled[data-phase=production] .decision-scroll{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;align-content:start}.shared.angled .bonus-receipt{grid-column:1;grid-row:1}.shared.angled .production-branches{grid-column:2;grid-row:1 / span 2}.shared.angled .production-choice>span{display:none}.shared.angled[data-phase=trade] .decision-scroll{display:block}.shared.angled[data-phase=trade] .compact-target{grid-column:1;grid-row:1}
@media(max-width:2199px){.shared.angled{width:calc(80vmin + 6px);height:calc(58vmin + 6px)}.shared.angled .instrument-frame{width:calc(min(100vmin,720px) * .8);height:calc(min(100vmin,720px) * .58);transform:scale(max(1,calc(100vmin / 720px)));transform-origin:0 0}}
@media(max-height:650px){.shared.angled header{padding:8px 12px}.shared.angled .angled-card-face{height:64px}.shared.angled .compact-card-object p{font-size:11px}.shared.angled .decision-scroll{padding:8px 12px}.shared.angled footer{padding:8px 12px;gap:6px}.shared.angled .compact-choice-tools>span{display:none}.shared.angled .production-choice strong{font-size:17px}.shared.angled .production-choice small{font-size:9px}.shared.angled .bonus-receipt h3{font-size:18px}.shared.angled .bonus-receipt p{font-size:11px}}

/* A seat-facing planning spread gives the illustrated card a real vertical
   field, beside the pawn, bonus and mandatory target instruments. */
.shared.angled[data-phase=action] .decision-scroll{grid-template-columns:minmax(0,2fr) minmax(0,3fr);grid-template-rows:44px 44px minmax(0,1fr) 44px;align-content:stretch}
.shared.angled[data-phase=action] .action-plan{grid-column:2;grid-row:1}
.shared.angled .compact-research-choice nav{grid-column:2;grid-row:2}
.shared.angled .compact-card-object{display:contents}
.shared.angled .angled-card-face{grid-column:1;grid-row:1 / 4;height:100%;min-height:0}
.shared.angled .planning-bonus{grid-column:2;grid-row:3;min-height:0;align-self:stretch;padding:8px 10px;border:1px solid #b49b65;border-radius:6px;color:#253b34;background:repeating-linear-gradient(0deg,#ffffff08 0 1px,transparent 1px 4px),linear-gradient(130deg,#f5e7bf,#cfba8c);box-shadow:inset 0 0 0 2px #fff2cb55,0 3px #6d5937}
.shared.angled .planning-bonus strong{font-size:11px;letter-spacing:.04em}
.shared.angled .planning-bonus p{font-size:12px;line-height:1.3;margin:5px 0 0}
.shared.angled .compact-choice-tools{grid-column:1;grid-row:4;gap:0}
.shared.angled .compact-choice-tools button{width:100%;padding:6px 8px}
.shared.angled .compact-choice-tools>span{display:none}
.shared.angled .compact-target{grid-column:2;grid-row:4}
@media(max-width:2199px){.shared.angled[data-phase=action]{width:calc(74vmin + 6px);height:calc(64vmin + 6px)}.shared.angled[data-phase=action] .instrument-frame{width:calc(min(100vmin,720px) * .74);height:calc(min(100vmin,720px) * .64)}}
@media(max-height:650px){.shared.angled .planning-bonus{padding:6px 8px}.shared.angled .planning-bonus p{font-size:11px;line-height:1.25}.shared.angled .planning-bonus strong{font-size:10px}}
.shared.angled .spaces button{height:44px;grid-template-rows:20px 10px;gap:2px 5px;font-size:14px}.shared.angled .spaces button strong{font-size:16px;line-height:20px}.shared.angled .spaces small{line-height:10px}
.shared.angled .angled-card-face :global(.face-inner){padding:1px}
/* Production and exchange instruments follow their contents, leaving the
   faction mat visible instead of extending an empty modal across the table. */
.turn-instrument:not([data-phase=action]):not(.angled){height:fit-content}
.turn-instrument:not([data-phase=action]):not(.angled) .instrument-frame{height:auto;max-height:calc(92dvh - 4px)}
@media(max-width:760px){.turn-instrument:not([data-phase=action]):not(.angled) .instrument-frame{max-height:calc(94dvh - 4px)}}

/* A compact decision spread keeps each illustrated production card beside its
   immediate consequence and native selection/inspection controls. Full faces
   retain their canonical dimensions in the separate inspection reader. */
.technology-choices:has(.overview-choice){max-width:none;gap:18px}
.overview-choice{--choice-height:clamp(220px,calc(94dvh - 390px),288px);display:grid;grid-template-columns:calc(var(--choice-height) * .625) minmax(0,1fr);gap:14px;align-items:stretch}
.overview-choice .choose-card{width:calc(var(--choice-height) * .625);height:var(--choice-height);container-type:size}
.overview-choice .choose-card :global(.card-face){height:100%}
.choice-details{min-width:0}
.overview-choice .choice-details{display:flex;flex-direction:column;justify-content:center;gap:18px}
.choice-bonus{padding:14px;border:1px solid #b49b65;border-radius:7px;color:#253b34;background:repeating-linear-gradient(0deg,#ffffff08 0 1px,transparent 1px 4px),linear-gradient(130deg,#f5e7bf,#cfba8c);box-shadow:inset 0 0 0 2px #fff2cb55,0 3px #6d5937}
.choice-bonus strong{font-size:12px;letter-spacing:.06em;text-transform:uppercase}
.choice-bonus p{font-size:16px;line-height:1.4;margin-top:7px}
.overview-choice .card-caption{display:grid;grid-template-columns:1fr;gap:8px;padding:0}
.overview-choice .card-caption button{font-size:14px;min-height:44px;padding:8px}
.overview-choice .card-caption span{font-size:12px;text-align:center}
.overview-choice>fieldset{grid-column:1 / -1;margin-top:0}
.commit-identity{display:block;font:600 21px/1.1 'Cormorant Garamond',serif;color:#f5e7bf}
.commit-plan p .commit-payment{font-size:12px;color:#dddcc4;margin:3px 0}
.commit-plan p .commit-consequence{font-size:14px;color:#d5eee2;line-height:1.3}
@media(min-width:761px) and (max-width:2199px){
 .turn-instrument:not(.angled)[data-phase=action] header{padding:12px 22px}
 .turn-instrument:not(.angled)[data-phase=action] .action-plan>div:first-child{max-width:52%}
 .turn-instrument:not(.angled)[data-phase=action] .action-plan h3{font-size:20px}
 .turn-instrument:not(.angled)[data-phase=action] .action-plan p{font-size:12px}
 .turn-instrument:not(.angled)[data-phase=action] .reader-cue{margin:8px 0;padding:7px 0;font-size:12px}
 .shared:not(.angled) .technology-choices:has(.overview-choice){grid-template-columns:1fr}
 .shared:not(.angled)[data-phase=action] header{display:grid;grid-template-columns:36px minmax(0,1fr) 144px 92px;gap:10px;padding:12px}
 .shared:not(.angled)[data-phase=action] header h2{font-size:28px;line-height:1.1;white-space:nowrap}
 .shared:not(.angled)[data-phase=action] .faction-seal{width:36px;height:36px;font-size:28px}
 .shared:not(.angled)[data-phase=action] .action-select{margin:0;min-width:0}
 .shared:not(.angled)[data-phase=action] .action-select select{width:100%;min-width:0;font-size:12px}
 .shared:not(.angled)[data-phase=action] header .close{margin:0;width:100%;padding:8px 6px;font-size:12px;white-space:nowrap}
}
@media(max-width:760px){
 .commit-identity{font-size:19px}
 .commit-plan p .commit-payment{font-size:10px}
 .commit-plan p .commit-consequence{font-size:12px;line-height:1.25}
}
@media(min-width:2200px){
 .commit-identity{font-size:32px}
 .commit-plan p .commit-payment{font-size:19px}
 .commit-plan p .commit-consequence{font-size:22px}
}

.turn-instrument[data-phase=discovery]:not(.angled){height:min(920px,94dvh)}.turn-instrument[data-phase=discovery]:not(.angled) .instrument-frame{height:100%}.turn-instrument[data-phase=discovery] .decision-scroll{overflow:hidden;min-height:0;padding:14px 22px}.turn-instrument[data-phase=discovery] header{padding:14px 22px}.turn-instrument[data-phase=discovery] footer{padding:10px 22px}.turn-instrument[data-phase=discovery] header h2{font-size:30px}@media(max-width:760px){.turn-instrument[data-phase=discovery] header{padding:10px 12px;gap:10px}.turn-instrument[data-phase=discovery] header h2{font-size:25px}.turn-instrument[data-phase=discovery] .faction-seal{display:none}.turn-instrument[data-phase=discovery] .decision-scroll{padding:10px 12px}.turn-instrument[data-phase=discovery] footer{padding:9px 12px}}
.turn-instrument[data-phase=discovery] footer .saved{display:none}
.turn-instrument.bounded-choices .decision-scroll{display:block;overflow:hidden;min-height:0}.turn-instrument.bounded-choices .instrument-frame{min-height:0}.turn-instrument.bounded-choices .decision-scroll{container-type:inline-size}
.free-industry{width:100%;font-size:12px}.free-industry summary{min-height:44px;cursor:pointer;padding:10px;border:1px solid #b3a06c;border-radius:6px}.free-industry p{margin:8px 0}.free-industry button{margin-right:8px}
.shared.angled.bounded-choices[data-phase] .decision-scroll{display:block;overflow:hidden}.shared.angled.bounded-choices[data-phase] header h2{font-size:23px}
.shared.angled.bounded-choices{width:calc(68vmin + 6px);height:calc(68vmin + 6px)}.shared.angled.bounded-choices .instrument-frame{width:min(68vmin,480px);height:min(68vmin,480px);transform:scale(max(1,calc(68vmin / 480px)));transform-origin:0 0}.shared.angled.bounded-choices[data-phase] .decision-scroll{padding:8px 12px}

.shared.angled.bounded-choices[data-phase=action] header{display:grid;grid-template-columns:28px minmax(0,1fr) 130px 62px;gap:6px;padding:8px}
.shared.angled.bounded-choices[data-phase=action] header>div{min-width:0}
.shared.angled.bounded-choices[data-phase=action] .faction-seal{width:28px;height:28px;font-size:23px}
.shared.angled.bounded-choices[data-phase=action] .action-select{width:130px;max-width:none;min-width:0;margin:0}
.shared.angled.bounded-choices[data-phase=action] .action-select select{width:100%;min-width:0;font-size:12px}
.shared.angled.bounded-choices[data-phase=action] .close{width:62px;max-width:none;margin:0;padding:6px;font-size:10px}
/* Retry remains readable within the same seat-facing instrument scale. */
.shared.angled.bounded-choices footer .error{font-size:11px;line-height:1.3;padding:6px;margin:4px 0}
.shared.angled.bounded-choices footer>button{font-size:11px;min-height:44px;padding:6px 8px}
.shared.angled .production-preview{grid-column:1;grid-row:2;min-width:0}

.turn-instrument[data-phase=production]:not(.angled) .decision-scroll{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:14px;align-content:start}
.turn-instrument[data-phase=production]:not(.angled) .bonus-receipt{grid-column:1 / -1;margin:0}
.turn-instrument[data-phase=production]:not(.angled) .production-preview{grid-column:1;min-width:0}
.turn-instrument[data-phase=production]:not(.angled) .production-branches{grid-column:2;align-self:start;margin-top:18px}
@media(max-width:760px){.turn-instrument[data-phase=production]:not(.angled) .decision-scroll{display:block}.turn-instrument[data-phase=production] .bonus-receipt p,.turn-instrument[data-phase=production] .bonus-receipt .permanent-cube{display:none}.turn-instrument[data-phase=production] .bonus-receipt{padding:9px 12px}.turn-instrument[data-phase=production]:not(.angled) .production-branches{margin-top:10px}}
@media(max-width:760px){.turn-instrument[data-phase=production] header{padding:10px 12px}.turn-instrument[data-phase=production] header h2{font-size:27px}.turn-instrument[data-phase=production] .decision-scroll{padding:10px 12px}.turn-instrument[data-phase=production] .production-choice{padding:9px}.turn-instrument[data-phase=production] .production-branches{gap:8px}}

/* Keep the resolved-card receipt above the seat-facing production mat. */
.shared.angled[data-phase=production] .bonus-receipt{grid-column:1 / -1;grid-row:1}
.shared.angled[data-phase=production] .bonus-receipt p{display:none}
.shared.angled[data-phase=production] .production-preview{grid-column:1;grid-row:2}
.shared.angled[data-phase=production] .production-branches{grid-column:2;grid-row:2;align-self:start}
/* Cardinal seats use the available landscape for the production mat and choices. */
@media(min-width:761px) and (max-width:2199px){
 .shared:not(.angled)[data-phase=production]{width:min(1120px,94vw)}
 .shared:not(.angled)[data-phase=production] .production-branches{min-width:0}
 .shared:not(.angled)[data-phase=production] .production-choice{min-width:0}
}
@media(min-width:761px) and (max-height:800px){
 .shared:not(.angled)[data-phase=production] .bonus-receipt p{display:none}
}
/* Gathering is one complete decision, rather than a single research-grid cell. */
.shared.angled[data-phase=action] .gather-plan{grid-column:1 / -1;grid-row:1 / -1;display:flex;flex-direction:column;justify-content:center;gap:12px;min-height:0}
.shared.angled .gather-plan h3{font-size:30px;margin:0}
.shared.angled .gather-plan p{font-size:15px;line-height:1.4;margin:0}
.shared.angled .gather-plan .primary{align-self:start;min-height:44px;max-width:100%}
@media(min-width:761px) and (max-width:2199px){.shared:not(.angled)[data-phase=trade]{width:min(1120px,94vw)}}
/* Rebalance the same diagonal footprint on short tables; keep both native
   selectors and the decommission/Finish controls at their full touch height. */
@media(min-width:761px) and (max-width:2199px) and (max-height:650px){
 .shared.angled[data-phase=trade]{width:calc(74vmin + 6px);height:calc(64vmin + 6px)}
 .shared.angled[data-phase=trade] .instrument-frame{width:calc(min(100vmin,720px) * .74);height:calc(min(100vmin,720px) * .64)}
}
</style>
