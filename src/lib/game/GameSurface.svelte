<script lang="ts">
  import { tick } from 'svelte';
  import CardFace from '$lib/cards/CardFace.svelte';
  import OriginalCardArt from '$lib/cards/OriginalCardArt.svelte';
  import {continuationKind} from './continuation-kind';
  import TurnInstrument from './TurnInstrument.svelte';
  import type {TurnMove} from './turn';
  import FactionMat from './FactionMat.svelte';
  import TechnologyOverview from './TechnologyOverview.svelte';
  import { cardById } from './cards';
  import { explorationBoard, technologySlots, basicActions, guilds, seatAngles, factions } from './manifest';
  import {availableClaims} from './achievements';
  import {discoveryMap} from './discovery-movement';
  import type { PublicSetup } from './setup';
  let { game, mode='remote', ownPosition, home, recovery, busy=false, commitMove }: {game:PublicSetup;mode?:'remote'|'tabletop';ownPosition?:string;home:()=>void;recovery:()=>void;busy?:boolean;commitMove?:(move:TurnMove)=>Promise<void>}=$props();
  const branchRows=$derived(Array.from({length:7},(_,row)=>game.technologies.some(t=>{const slot=technologySlots.find(node=>node.id===t.slot);return slot?.row===row&&slot.level!=='I';})?2:1));
  const branchUnits=$derived(branchRows.reduce((sum,weight)=>sum+weight,0));
  const branchCenters=$derived(branchRows.map((weight,row)=>branchRows.slice(0,row).reduce((sum,n)=>sum+n,0)+weight/2));
  let tableHeading=$state<HTMLHeadingElement>(undefined!);
  let turnInstrument=$state<{open:(space?:number,kind?:'I'|'II'|'gather')=>Promise<void>}>(undefined!);
  const claimOptions=$derived(availableClaims(game));
  const claimants=(id:string)=>(game.discovery?.claims??[]).filter(c=>c.card===id).map(c=>game.players.find(p=>p.position===c.position)!.name);
  const claimantTones=(id:string)=>(game.discovery?.claims??[]).filter(c=>c.card===id).map(c=>[170,38,8,275][game.players.findIndex(p=>p.position===c.position)]);
  const canAct=$derived(!!commitMove&&(mode==='tabletop'||ownPosition===(game.phase==='discovery'?game.discovery?.queue[0]?.responder:game.activePosition)));
  const continuation=$derived(continuationKind(game));
  const phaseName=$derived(game.phase==='action'?'Action':game.phase==='production'?'Production':game.phase==='trade'?'Trade':game.phase==='discovery'?(continuation==='control'?'Control transfer':continuation==='action'?'Action effects':continuation==='research'?'Research bonus':'Discovery'):'Achievement');
  const hasMoves=$derived(game.players.some(p=>p.research.length));
  let level=$state('I');
  let compactDetail=$state(false),technologyRegion=$state<HTMLDivElement>(undefined!);
  function scrollTechnology(direction:number){technologyRegion.scrollTo({top:direction<0?0:technologyRegion.scrollHeight,behavior:'instant'});}
  async function toggleTechnology(){compactDetail=!compactDetail;await tick();technologyRegion.scrollTop=0;}
  let wasWide=false;
  async function fitResizedBoard(){const wide=innerWidth>=2200;if(wide!==wasWide){wasWide=wide;await tick();technologyRegion.scrollTop=0;}}
  let board=$state<'technology'|'exploration'>('technology'), selectedPlayer=$state('');
  const actor=$derived(game.players.find(p=>p.position===game.activePosition)??game.players[0]);
  const focused=$derived(game.players.find(p=>p.position===(selectedPlayer||ownPosition))??game.players[0]);
  const map=$derived(discoveryMap(game));
  const publicCards=$derived([...new Set([...game.technologies,...game.systems,...game.achievements.map(card=>({card})),...(game.discovery?.events.map(e=>({card:e.id}))??[]),...(game.discovery?.records.flatMap(record=>record.revealed?.map(card=>({card}))??[])??[]),...(game.discovery?.queue[0]?.kind==='event'&&game.discovery.queue[0].event==='dimensional-rift'&&game.discovery.queue[0].stage==='attach'?[{card:game.discovery.queue[0].value!}]:[])].map(item=>item.card))]);
  let inspectionCards=$state<string[]>([]);
  let inspected=$state(''),dialog=$state<HTMLDialogElement>(undefined!),origin:HTMLElement|null=null;
  let tray=$state<HTMLDialogElement>(undefined!),trayKind=$state<'achievements'|'setup'|'mat'|'slot'>('setup'), inspectedSlot=$state('II-1');
  let trayOrigin:HTMLElement|null=null;
  const seatAngle=$derived(mode==='tabletop'&&trayKind==='mat'?(seatAngles[focused.position]??0):0);
  async function inspect(id:string,collection=publicCards){origin=document.activeElement as HTMLElement;inspectionCards=[...collection];inspected=id;await tick();dialog.showModal();}
  async function returnFromInspection(){await tick();const parent=origin?.closest('dialog');if(origin?.isConnected&&!(origin instanceof HTMLButtonElement&&origin.disabled)&&(!(parent instanceof HTMLDialogElement)||parent.open))origin.focus({preventScroll:true});else (document.querySelector<HTMLElement>('dialog.turn-instrument[open] .decision-scroll')??tableHeading).focus({preventScroll:true});}
  function adjacent(offset:number){inspected=inspectionCards[(inspectionCards.indexOf(inspected)+offset+inspectionCards.length)%inspectionCards.length];}
  async function openTray(kind:typeof trayKind){trayOrigin=document.activeElement as HTMLElement;trayKind=kind;await tick();tray.showModal();}
  function trap(event:KeyboardEvent,d:HTMLDialogElement){if(event.key!=='Tab')return;const controls=[...d.querySelectorAll<HTMLElement>('button:not([disabled]),select,a[href],[tabindex="0"]')];if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls.at(-1)?.focus();}else if(!event.shiftKey&&document.activeElement===controls.at(-1)){event.preventDefault();controls[0]?.focus();}}
</script>
<svelte:window onresize={()=>{void fitResizedBoard();}}/>
{#snippet turnButton()}{#if mode==='tabletop'||focused.position===ownPosition}<button class="turn-control" disabled={busy||!canAct||(game.phase==='achievement'&&!claimOptions.length)} onclick={()=>{void turnInstrument.open();}}>{canAct?(game.phase==='action'?'Plan research':game.phase==='production'?'Choose production':game.phase==='trade'?'Continue trading':game.phase==='discovery'?(continuation==='control'?'Continue outpost control':continuation==='action'?'Continue action effects':continuation==='research'?'Continue research bonus':'Continue discovery'):claimOptions.length?'Claim achievement':'Completing turn…'):`${actor.name}’s turn`}</button>{/if}{/snippet}
{#snippet matButtons()}<button onclick={()=>{void openTray('mat');}}>Full faction mat</button>{#if focused.position!==(ownPosition??game.players[0].position)}<button onclick={()=>selectedPlayer=ownPosition??game.players[0].position}>{ownPosition?'Your mat':'Starting mat'}</button>{/if}{/snippet}
<section data-e2e-layout class="game-surface" style={`--branch-rows:${branchRows.map(weight=>`calc(var(--branch-unit) * ${weight})`).join(' ')};--branch-units:${branchUnits}`} class:discovered-branches={game.technologies.some(t=>cardById(t.card).technology?.level!=='I')} class:technology-focus={compactDetail} class:shared={mode==='tabletop'} class:diagonal={mode==='tabletop'&&game.players.some(p=>p.position.includes('-'))} class:corner-only={mode==='tabletop'&&game.players.every(p=>p.position.includes('-'))} aria-label="Basic game starting position">
  <header class="game-heading"><div><p class="eyebrow">BEYOND THE SUN</p><h1 tabindex="-1" bind:this={tableHeading}>{actor.name} · {phaseName} phase</h1><p>{game.count} players · Achievements {game.achievementClaims} / {game.endgameClaims} · {hasMoves?'Turn saved':'Starting position saved'}</p></div>{#if mode==='remote'}<div class="opponent-strip" aria-label="Public factions">{#each game.players.filter(p=>p.position!==focused.position) as p}<button onclick={()=>{selectedPlayer=p.position;}} aria-label={`Inspect ${p.name} resources`}><span class="opponent-emblem" aria-hidden="true">{factions.find(f=>f.id===p.faction)?.emblem}</span><strong>{p.name}</strong><span>{p.ore} Ore · {p.population} Pop</span></button>{/each}</div>{/if}<div class="game-tools">{#if game.phase==='discovery'&&mode==='remote'&&!canAct}<button class="public-discovery" onclick={()=>{void turnInstrument.open();}}>{continuation==='control'?'Observe outpost control':continuation==='action'?'Observe public action effects':continuation==='research'?'Observe research bonus':'Observe public discovery'}</button>{/if}<button onclick={()=>{void openTray('achievements');}}>Achievements</button><button onclick={()=>{void openTray('setup');}}>Setup record</button><button onclick={recovery}>Recovery options</button>{#if mode==='tabletop'}<button onclick={home}>Observatory</button>{/if}</div></header>
  <div class="board-switch" role="group" aria-label="Board view"><button aria-pressed={board==='technology'} onclick={()=>board='technology'}>Technology</button><button aria-pressed={board==='exploration'} onclick={()=>board='exploration'}>Exploration</button></div>
  <div class="board-table">
    <section class="technology-board" class:phone-hidden={board!=='technology'} aria-label="Technology board">
      <header><h2>Technology</h2><button class="compact-focus-toggle" aria-pressed={compactDetail} onclick={()=>{void toggleTechnology();}}>{compactDetail?'Both boards':'Focus Technology'}</button><p>Discover together. Research for your faction.</p>{#if mode==='remote'}<button class="spacefaring-plaque" onclick={()=>{void openTray('setup');}}>Basic Spacefaring &amp; guilds</button>{/if}<div class="pawn-rest" aria-label={hasMoves?'Off-board Action pawns':'Action pawns start off-board'}>{#each game.players as p,i}{#if !p.actionLocation}<span class="action-pawn" style={`--tone:${[170,38,8,275][i]}`} aria-label={`${p.name} Action pawn, off-board`}></span>{/if}{/each}<span>Action pawns · {hasMoves?'unplaced pawns':'off-board'}</span></div></header>
      <div class="phone-technology-controls"><div role="group" aria-label="Technology level">{#each ['I','II','III','IIII'] as value}<button aria-pressed={level===value} onclick={()=>level=value}>{value}</button>{/each}</div><button onclick={()=>{void openTray('setup');}}>Basic Spacefaring &amp; guilds</button></div>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (The named overview supports bounded scrolling on short landscape screens.) -->
      <div class="compact-overview" role="region" tabindex="0" aria-label="Complete technology overview scroll area"><p class="overview-scroll-cue">Scroll the overview ↑↓ · Focus Technology for readable branches</p><TechnologyOverview {game} inspect={id=>{void inspect(id);}}/></div>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Named bounded board area supports keyboard scrolling on compact displays.) -->
      <div class="technology-layout" bind:this={technologyRegion} tabindex="0" role="region" aria-label="Technology board surface">
        <!-- svelte-ignore a11y_no_noninteractive_tabindex (Named board rules object has bounded keyboard scrolling.) -->
        <div class="spacefaring" role="region" tabindex="0" aria-label="Basic Spacefaring and guilds"><h3>Basic Spacefaring</h3><span class="overlay-label">{game.count}-player {game.count===4?'board':'overlay'}</span>{#each basicActions as action}<div class="basic-action"><div class="action-sockets" aria-label={`${action.spaces[game.count].length} action spaces`}>{#each action.spaces[game.count] as extra,i}{@const occupant=game.players.find(p=>p.actionLocation===`${action.id}:${i}`)}{#if action.id==='research-I'||action.id==='research-II'||action.id==='supply-population'}<button class="action-socket live-socket" style={occupant?`--pawn-tone:${[170,38,8,275][game.players.indexOf(occupant)]}`:undefined} disabled={busy||!canAct} aria-label={`Plan ${action.id==='research-II'?'Research Level II':action.id==='research-I'?'Research Level I':'Gather resources'} space ${i+1}${occupant?`: occupied by ${occupant.name}`:''}`} onclick={()=>{void turnInstrument.open(i,action.id==='research-II'?'II':action.id==='supply-population'?'gather':'I');}}>{occupant?'♟':i+1}</button>{:else}<span class="action-socket" aria-label={extra?'Action space: +1 Ore':'Action space'}>{extra?'+1':''}</span>{/if}{/each}</div><strong>{action.title}</strong><p>{action.text}</p></div>{/each}<h4>Guilds</h4>{#each guilds as guild}<button class="guild-cover" onclick={()=>{void openTray('setup');}} aria-label={`Inspect ${game.discovery?.guilds.includes(guild.id)?'unlocked':'covered'} ${guild.name}`}><span>Tier {guild.tier}</span>{guild.name}<small>{game.discovery?.guilds.includes(guild.id)?'Unlocked · printed action':'Locked'}</small></button>{/each}</div>
        <div class="technology-tree" aria-label="Technology prerequisites">
          <svg class="prerequisite-lines" viewBox={`0 0 1000 ${branchUnits*100}`} preserveAspectRatio="none" aria-hidden="true">{#each technologySlots as slot}{#each slot.prerequisites as prerequisite}{@const from=technologySlots.find(p=>p.id===prerequisite)!}{@const x1=['I','II','III','IIII'].indexOf(from.level)*250+225}{@const x2=['I','II','III','IIII'].indexOf(slot.level)*250+25}<path d={`M${x1} ${branchCenters[from.row]*100}H${(x1+x2)/2}V${branchCenters[slot.row]*100}H${x2}`}/>{/each}{/each}</svg>
          {#each ['I','II','III','IIII'] as level,i}<span class="column-title" style={`--column:${i}`}>{level}<small>{i?`${game.deckCounts[level]} cards · face down`:'Four discoveries'}</small></span>{/each}
          {#each technologySlots as slot}
            {@const revealed=game.technologies.find(t=>t.slot===slot.id)}{@const pendingDiscovery=game.discovery?.records.find(r=>r.slot===slot.id&&!r.chosen)}
            <div class="technology-slot" class:revealed={!!revealed} class:level-hidden={slot.level!==level} style={`--column:${['I','II','III','IIII'].indexOf(slot.level)};--row:${slot.row}`} aria-label={`${slot.id}${slot.prerequisites.length?`: requires ${slot.required} of ${slot.prerequisites.join(', ')}`:''}`}>
              {#if revealed}<button class="card-button" onclick={()=>{void inspect(revealed.card);}} aria-label={`Inspect ${cardById(revealed.card).title}`}><CardFace card={cardById(revealed.card)} compact presentation={{actionOccupant:game.players.find(p=>p.actionLocation?.startsWith(`technology:${revealed.card}:`))?.name}}/></button><div class="research-markers" aria-label="Permanent research cubes">{#each game.players.filter(p=>p.research.includes(revealed.card)) as p}<span role="img" style={`--cube-tone:${[170,38,8,275][game.players.indexOf(p)]}`} aria-label={`${p.name} researched ${cardById(revealed.card).title}`}></span>{/each}</div>{:else}<button class="card-back" data-level={slot.level} aria-label={`Inspect undiscovered ${slot.id}`} onclick={()=>{inspectedSlot=slot.id;void openTray('slot');}}><span aria-hidden="true">✧</span><strong>{slot.level}</strong><span>{pendingDiscovery?'Discovery in progress':slot.level==='IIII'?'Undiscovered technology':'Unrevealed Event'}</span><small>{slot.required>1?`${slot.required} of ${slot.prerequisites.length} prerequisites`:slot.prerequisites[0]}</small></button>{#if pendingDiscovery}<div class="research-markers" aria-label="Reserved permanent research cubes">{#each game.discovery?.reservations.filter(r=>r.slot===slot.id)??[] as reserved}{@const p=game.players.find(p=>p.position===reserved.position)!}<span role="img" style={`--cube-tone:${[170,38,8,275][game.players.indexOf(p)]}`} aria-label={`${p.name} committed permanent research at ${slot.id}`}></span>{/each}</div>{/if}{/if}
            </div>
          {/each}
        </div>
      </div>
      <nav class="technology-scroll-tools" aria-label="Technology focus navigation"><button onclick={()=>scrollTechnology(-1)}>↑ Upper branches</button><span>All 19 spaces · scroll inside the board</span><button onclick={()=>scrollTechnology(1)}>Lower branches ↓</button></nav>
    </section>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Named exploration board permits keyboard scrolling on short landscape screens.) -->
    <section class="exploration-board" tabindex="0" class:phone-hidden={board!=='exploration'} aria-label="Exploration board"><header><h2>Exploration</h2><p>{game.count===2?'Two-player':'Three / four-player'} face</p></header><div class="star-map" class:rift-map={(game.discovery?.systems.length??0)>0}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{#each map.edges as [a,b]}{@const from=map.locations.find(l=>l.id===a)!}{@const to=map.locations.find(l=>l.id===b)!}<path d={`M${from.x} ${from.y}L${to.x} ${to.y}`}/>{/each}</svg>
      {#each map.locations as location}
        {@const system=game.systems.find(s=>s.slot===location.id)}
        <div class="map-location" class:system={!!system} class:deep={location.kind==='deep-space'} style={`--x:${location.x}%;--y:${location.y}%`} aria-label={location.title}>
          {#if system}<button class="system-button" onclick={()=>{void inspect(system.card);}} aria-label={`Inspect ${cardById(system.card).title}`}><span class="system-art" aria-hidden="true"><OriginalCardArt id={system.card}/></span><strong>{cardById(system.card).title}</strong><small>Deck {location.deck} · {cardById(system.card).points} VP</small></button>{:else}<span class="planet" class:sol={location.id==='sol'} class:shipyard={location.kind==='shipyard'} aria-hidden="true">{location.kind==='deep-space'?'✧':location.kind==='shipyard'?'⚒':''}</span><strong>{location.title}</strong><small>{location.specialty?`${location.specialty==='either'?'Food / Ore':location.specialty} outpost`:'No control disc'}</small>{/if}
          {#if game.discovery?.outposts[location.id]}{@const outpost=game.discovery.outposts[location.id]}{@const owner=game.players.find(p=>p.position===outpost.owner)!}<span class="outpost-marker" style={`--outpost-tone:${[170,38,8,275][game.players.indexOf(owner)]}`} aria-label={`${owner.name} controls ${location.title} with ${outpost.placeholder?'a placeholder':outpost.track==='food'?'a Food disc':'an Ore disc'}`}>{outpost.track==='food'?'❧':'✹'} <span>{owner.name}</span></span>{/if}
          <div class="fleet">{#each game.players as player,i}{#each player.ships.filter(s=>s.location===location.id) as ship}<span class="ship-cube" style={`--tone:${[170,38,8,275][i]}`} aria-label={`${player.name} level-${ship.level} ship`}><span aria-hidden="true">▲</span>{ship.level}</span>{/each}{/each}</div>
        </div>
      {/each}
    </div><p class="map-key">Each line is 1 jump. Sol and Deep Space cannot be controlled.</p></section>
  </div>
  {#if mode==='remote'}<div class="player-shelf">
    <div class="personal-mat"><FactionMat player={focused} order={game.players.indexOf(focused)+1} dock>{#snippet controls()}{@render turnButton()}{@render matButtons()}{/snippet}</FactionMat></div>
    <div class="mat-controls"><div><strong>{focused.name}</strong><span>{focused.position===ownPosition?'Your faction':'Public faction'} · {focused.ore} Ore · {focused.population} Population</span></div>{@render turnButton()}{@render matButtons()}<small>Supply {focused.supply.reduce((sum,n)=>sum+n,0)} · {hasMoves?`${focused.research.length+(focused.reservedResearch?.length??0)} research cubes`:'Starting position'}</small></div>
  </div>
  {:else}{#each game.players as p,i}<div class="shared-mat" data-position={p.position}><FactionMat player={p} order={i+1} rim/><div class="seat-game-controls"><button onclick={()=>{selectedPlayer=p.position;void openTray('mat');}} aria-label={`Inspect ${p.name} faction mat`}>Inspect mat</button>{#if p.position===(game.phase==='discovery'?game.discovery?.queue[0]?.responder:game.activePosition)}{@render turnButton()}{/if}</div></div>{/each}{/if}
</section>

{#if commitMove}<TurnInstrument bind:this={turnInstrument} {game} {mode} {ownPosition} {busy} commit={commitMove} fallbackFocus={()=>tableHeading.focus()} inspect={(id,collection)=>{void inspect(id,collection);}}/>{/if}
<!-- svelte-ignore a11y_no_noninteractive_tabindex (Named region provides keyboard access to the independently scrolling card.) -->
<dialog data-e2e-layout class="card-inspector" bind:this={dialog} aria-label="Game card inspection" onkeydown={e=>trap(e,dialog)} onclose={()=>{void returnFromInspection();}}><header><button onclick={()=>dialog.close()}>Close card</button><span>Public card · {hasMoves?'current position':'starting position'}</span></header><div class="inspection-scroll" tabindex="0" role="region" aria-label="Full card face">{#if inspected}<div class="full-card"><CardFace card={cardById(inspected)} presentation={{players:game.count,claimants:claimants(inspected),claimantTones:claimantTones(inspected),actionOccupant:game.players.find(p=>p.actionLocation?.startsWith(`technology:${inspected}:`))?.name,researchers:game.players.filter(p=>p.research.includes(inspected)).map(p=>p.name),researcherTones:game.players.filter(p=>p.research.includes(inspected)).map(p=>[170,38,8,275][game.players.indexOf(p)])}}/></div>{/if}</div><nav aria-label="Card inspection"><button onclick={()=>adjacent(-1)}>Previous card</button><button onclick={()=>adjacent(1)}>Next card</button></nav></dialog>
<!-- svelte-ignore a11y_no_noninteractive_tabindex (Named region provides keyboard access to independently scrolling inspection details.) -->
<dialog data-e2e-layout class="record-tray" class:seat-reader={mode==='tabletop'&&trayKind==='mat'} style={`--reader-angle:${seatAngle}deg`} bind:this={tray} aria-label={trayKind==='mat'?'Faction mat inspection':trayKind==='achievements'?'Game achievements':trayKind==='slot'?'Technology prerequisites':'Setup record'} onkeydown={e=>trap(e,tray)} onclose={()=>trayOrigin?.focus()}><header><h2>{trayKind==='mat'?focused.name:trayKind==='achievements'?'Humanity’s milestones':trayKind==='slot'?`Technology ${inspectedSlot}`:'A beginning, preserved'}</h2><button onclick={()=>tray.close()}>Close tray</button></header><div class="tray-scroll" tabindex="0" role="region" aria-label="Inspection details">
  {#if trayKind==='mat'}<FactionMat player={focused} order={game.players.indexOf(focused)+1} expanded/><p>Supply is stored capacity; Population and Ore above are the available resources. Production discs remain on both tracks. The Action pawn is a separate piece, off-board.</p>
  {:else if trayKind==='achievements'}<p>{game.endgameClaims} total achievement claims trigger the final-round sequence. {game.achievementClaims?`${game.achievementClaims} achievement${game.achievementClaims===1?' has':'s have'} been claimed.`:'No achievements have been claimed.'}</p><div class="achievement-row">{#each game.achievements as id}<button class="card-button" aria-label={`Inspect ${cardById(id).title}`} onclick={()=>{void inspect(id);}}><CardFace card={cardById(id)} presentation={{players:game.count,claimants:claimants(id),claimantTones:claimantTones(id)}}/></button>{/each}</div>
  {:else if trayKind==='slot'}{@const slot=technologySlots.find(s=>s.id===inspectedSlot)!}{@const pendingDiscovery=game.discovery?.records.find(r=>r.slot===slot.id)}<p>{#if pendingDiscovery}{cardById(pendingDiscovery.event).title} is public. The research Population is committed; complete the saved public discovery to continue.{:else}{slot.level==='IIII'?'An undiscovered Level IIII technology space.':'An unrevealed Event covers this technology space.'} Its contents stay concealed until a legal discovery.{/if}</p><h3>Prerequisites · {slot.required} of {slot.prerequisites.length}</h3><ul>{#each slot.prerequisites as prerequisite}{@const known=game.technologies.find(t=>t.slot===prerequisite)}<li>{prerequisite}{known?` · ${cardById(known.card).title}`:' · undiscovered'} · {!!known&&actor.research.includes(known.card)?'researched':'not researched'}</li>{/each}</ul><p>{actor.name} has researched {slot.prerequisites.filter(p=>actor.research.includes(game.technologies.find(t=>t.slot===p)?.card??'')).length} of these prerequisites; {slot.required} {slot.required===1?'is':'are'} required. Level III and IIII research also require an enabling action. Inspection reveals no future cards; committed Event and candidate choices remain public.</p>
  {:else}<p>This starting position is saved once. Reopening this game restores the same setup.</p><dl class="setup-record"><div><dt>Players / Basic Spacefaring</dt><dd>{game.count} / {game.overlay}-player {game.count===4?'board':'overlay'}</dd></div><div><dt>Exploration</dt><dd>{game.count===2?'Two-player face · 1 starting A, 2 B':'Standard face · 2 starting A, 2 B'}</dd></div><div><dt>Technology decks</dt><dd>II: 16 · III: 16 · IIII: 10 · face down</dd></div><div><dt>Events</dt><dd>6 Level II and 6 Level III, face down. Each level contains its 2 fixed guild Events and 4 others. Unused Events are out of the game.</dd></div><div><dt>System decks remaining</dt><dd>A: {game.deckCounts.A} · B: {game.deckCounts.B} · face down</dd></div><div><dt>Achievement A second reward</dt><dd>{game.achievementSecondSlot?'Available with 4 players':'Unavailable with 2–3 players'}</dd></div></dl><h3>Basic Spacefaring · {game.count} players</h3>{#each basicActions as action}<section class="guild-record"><h4>{action.title} · {action.spaces[game.count].length} {action.spaces[game.count].length===1?'space':'spaces'}</h4><p>{action.text}{action.spaces[game.count].some(cost=>cost)?` Space surcharges, in order: ${action.spaces[game.count].map(cost=>cost?'+1 Ore':'none').join(', ')}.`: ''}</p></section>{/each}<h3>Covered guild actions</h3>{#each guilds as guild}<section class="guild-record"><h4>{guild.name} · Tier {guild.tier} · {guild.spaces} {guild.spaces===1?'space':'spaces'}</h4><p>{guild.text}</p></section>{/each}<p class="source-note">Rules: Rio Grande Games, second-print setup sheets and printed component faces. Covered decks stay concealed until a legal reveal.</p>{/if}
</div></dialog>
<style>
.public-discovery{min-height:44px;padding:10px 16px;border:1px solid #b49a5e;border-radius:7px;color:#f1e5c6;background:#17393f;box-shadow:0 3px #796137;font:14px 'Atkinson Hyperlegible',sans-serif}.public-discovery:focus-visible{outline:3px solid #71eee7;outline-offset:3px}
.turn-control{border-color:#76b8a6!important;background:linear-gradient(140deg,#326b60,#164642)!important;color:#f5ebc8!important;box-shadow:0 2px #a4894b!important}.live-socket{min-width:44px!important;min-height:44px!important;height:44px!important;width:44px!important;font-size:18px!important;cursor:pointer}.action-sockets:has(.live-socket){flex-wrap:wrap}.research-markers{position:absolute;bottom:3px;left:4px;display:flex;gap:3px;color:#91e2ca;pointer-events:none;text-shadow:1px 2px #173d35}.research-markers span{font-size:18px;filter:drop-shadow(0 1px 2px #000)}.seat-game-controls{display:flex;justify-content:space-between;gap:6px}.seat-game-controls button{min-height:44px}.seat-game-controls .turn-control{flex:1}.shared-mat .seat-game-controls{position:absolute;bottom:6px;right:10px;left:10px}.shared-mat .seat-game-controls button{position:static!important}.shared-mat .seat-game-controls button{width:32%;flex:0 0 32%;min-width:44px}.shared-mat .seat-game-controls .turn-control{max-width:32%;flex:0 0 32%}

.game-surface{width:100%;height:100%;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) clamp(210px,33vh,650px);gap:16px;position:relative;isolation:isolate;color:#ecdfbe;padding:6px 0 0}.game-heading{display:flex;justify-content:space-between;align-items:center;gap:20px}.game-heading h1{font:600 clamp(25px,2.8vw,64px)/1 'Cormorant Garamond',serif;margin:3px 0}.game-heading p{font-size:11px;color:#c0c7b3;margin:5px 0 0}.game-heading .eyebrow{font-size:9px;color:#d0b878;letter-spacing:.3em}.game-tools{display:flex;gap:9px;flex-wrap:wrap}.game-tools button{font-size:12px;padding:9px 13px;min-height:44px;color:#dfd7bb}.board-switch{display:none}.board-table{display:grid;grid-template-columns:minmax(0,3fr) minmax(270px,1fr);gap:18px;min-height:0;perspective:1800px}.technology-board,.exploration-board{border:2px solid #a98b4f;border-radius:12px;padding:15px;min-width:0;min-height:0;display:flex;flex-direction:column;position:relative;background:radial-gradient(ellipse at 30% 40%,#416b672b,transparent 55%),repeating-radial-gradient(ellipse at 50% 60%,transparent 0 72px,#c7ac6a14 73px 74px,transparent 75px 115px),linear-gradient(130deg,#203436,#081a24 60%,#203137);box-shadow:inset 0 0 0 4px #d1b36c22,inset 0 1px 2px #fff1c177,0 4px #775e35,0 8px #101b1e,7px 15px 25px #0009}.technology-board>header,.exploration-board>header{display:flex;align-items:baseline;gap:10px;border-bottom:1px solid #b0975055;padding:0 3px 8px;margin-bottom:10px}.technology-board h2,.exploration-board h2{font:600 clamp(21px,1.8vw,48px) 'Cormorant Garamond',serif;margin:0}.technology-board header p,.exploration-board header p{font-size:10px;color:#b7c2ad;margin:0}.technology-layout{display:flex;gap:16px;flex:1;min-height:0;overflow:auto}.spacefaring{flex:0 0 18%;min-width:114px;display:flex;flex-direction:column;gap:5px;overflow:auto;padding:8px;color:#344336;background:linear-gradient(125deg,#f4e7c6,#cfbc91);border:1px solid #bba16b;border-radius:5px;box-shadow:0 3px #735e3c,3px 6px 8px #0008}.spacefaring h3{font:600 19px/.95 'Cormorant Garamond',serif;margin:0}.overlay-label{font-size:9px;color:#665c43}.basic-action{padding:5px 0;border-bottom:1px solid #9e8a5a77}.basic-action strong{font-size:10px}.basic-action p{font-size:9px;line-height:1.25;margin:3px 0}.action-sockets{display:flex;gap:4px;min-height:15px;align-items:center}.action-socket{display:inline-flex;width:14px;height:14px;align-items:center;justify-content:center;clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%);background:#8a8c73;box-shadow:inset 1px 2px 2px #4f5137;font-size:7px;color:#f1e4b9}.spacefaring h4{font-size:10px;margin:3px 0}.guild-cover{display:grid;grid-template-columns:24px 1fr;gap:2px;padding:5px;font-size:9px;line-height:1.1;min-height:44px;background:linear-gradient(125deg,#384541,#192b2b);color:#e8d6aa;border-color:#ac945c;box-shadow:0 2px #74613a}.guild-cover span{grid-row:span 2;font-size:8px}.guild-cover small{font-size:7px;color:#a3b4a5}.pawn-rest{display:flex;margin-left:auto;align-items:center;flex-wrap:wrap;gap:5px;padding-top:4px}.pawn-rest>span:last-child{font-size:8px;flex-basis:100%;color:#5e644b}.action-pawn{display:block;width:12px;height:25px;clip-path:polygon(20% 0,80% 0,100% 20%,100% 100%,0 100%,0 20%);background:linear-gradient(90deg,hsl(var(--tone) 35% 62%),hsl(var(--tone) 45% 32%));filter:drop-shadow(2px 3px 2px #0008)}.technology-tree{flex:1;min-width:0;position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(7,minmax(44px,1fr));gap:6px 17px;padding-top:27px}.prerequisite-lines{position:absolute;inset:27px 0 0;width:100%;height:calc(100% - 27px);pointer-events:none}.prerequisite-lines path{fill:none;stroke:#c2ae75;stroke-width:1.8;filter:drop-shadow(0 0 3px #afcb9a);opacity:.65}.column-title{position:absolute;top:0;left:calc(var(--column)*25%);width:25%;text-align:center;font:600 18px/.9 'Cormorant Garamond',serif;letter-spacing:.08em;color:#e6c98b}.column-title small{display:block;font:7px 'Atkinson Hyperlegible',sans-serif;letter-spacing:0;margin:3px 0;color:#aabaad}.technology-slot{grid-column:calc(var(--column) + 1);grid-row:calc(var(--row) + 1);z-index:1;min-height:0;min-width:0;display:flex;align-items:stretch}.card-button{display:block;padding:0;border:0;background:none;box-shadow:none;text-align:left;width:100%;min-height:0}.card-button :global(.card-face){height:100%}.card-back{width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:1px solid #b39d62;border-radius:5px;background:radial-gradient(ellipse at 35% 30%,#386162,#192f36 70%);box-shadow:inset 0 0 0 3px #c0a56433,0 3px #816d42,2px 6px 7px #0006;color:#c5c9aa}.card-back>span:first-child{font:17px 'Cormorant Garamond',serif;color:#c4ae75;line-height:.7}.card-back>strong{font:600 clamp(17px,1.4vw,38px)/.8 'Cormorant Garamond',serif;color:#e7d5a5}.card-back>span:not(:first-child){font-size:7px;text-align:center}.card-back small{font-size:6px;color:#a4b8a4}.card-back[data-level='IIII']{background:radial-gradient(ellipse at 30% 20%,#46504b,#182a32 75%)}.star-map{position:relative;min-height:0;flex:1;background:radial-gradient(ellipse at 40% 40%,#d3bd5b0c,transparent 60%)}.star-map>svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.star-map path{stroke:#beaa73;stroke-width:.35;fill:none;filter:drop-shadow(0 0 1px #86b8a1);opacity:.75}.map-location{position:absolute;left:var(--x);top:var(--y);transform:translate(-50%,-50%);width:28%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:2px;z-index:1}.map-location strong{font:600 clamp(10px,.85vw,28px)/1 'Cormorant Garamond',serif;color:#efe0b4}.map-location small{font-size:7px;color:#b9c8b6}.system-button{width:100%;min-height:64px;padding:6px 4px;display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid #ac925a;border-radius:5px;background:linear-gradient(130deg,#28433c,#122b30);box-shadow:0 3px #715d3a,2px 5px 8px #0009}.planet{--hue:155;display:block;width:clamp(25px,2.4vw,80px);height:clamp(25px,2.4vw,80px);border-radius:50%;background:radial-gradient(circle at 27% 25%,hsl(var(--hue) 30% 72%),hsl(var(--hue) 25% 38%) 37%,#102934 77%);border:1px solid #d4bf7a;box-shadow:0 1px 2px #0008,0 0 10px #a8cebd22;flex-shrink:0}.planet.shipyard{font-size:16px;display:flex;align-items:center;justify-content:center;color:#dac791;background:radial-gradient(circle at 30% 20%,#596455,#253d3d)}.planet.sol{background:radial-gradient(circle at 30% 20%,#eff0c4,#bc913d 35%,#79552b 65%,#2d302b);box-shadow:0 0 13px #dcb97077}.deep>.planet{background:radial-gradient(circle,#0c1c26,#14282c 70%);border-color:#7c8970;color:#d3bc78;display:flex;align-items:center;justify-content:center;font-size:27px}.fleet{display:flex;justify-content:center;gap:4px;flex-wrap:wrap;min-height:0}.ship-cube{display:flex;align-items:center;justify-content:center;gap:1px;min-width:20px;height:21px;font-size:9px;border:1px solid hsl(var(--tone) 25% 72%);background:linear-gradient(135deg,hsl(var(--tone) 40% 60%),hsl(var(--tone) 45% 30%));box-shadow:1px 2px #0a2024;color:#f4edce}.ship-cube>span{font-size:8px}.map-key{font-size:8px;text-align:center;color:#b6c5af;margin:10px 0 0}.player-shelf{display:grid;grid-template-columns:minmax(140px,1fr) minmax(0,3fr) minmax(130px,1fr);gap:20px;min-height:0;align-items:center}.personal-mat{max-height:100%;min-height:0;width:100%;max-width:min(660px,calc(clamp(210px,33vh,650px)*1.7));justify-self:center}.phone-technology-controls{display:none}
.shared{display:block;padding:0}.shared .board-table{position:absolute;left:24%;right:24%;top:30%;bottom:30%;gap:12px;grid-template-columns:minmax(0,2.8fr) minmax(170px,1fr)}.shared .game-heading{position:absolute;left:25%;right:25%;top:25%;height:4%}.shared .game-heading h1{font-size:clamp(19px,1.3vw,42px)}.shared .game-heading p:not(.eyebrow){display:none}.shared .game-tools button{font-size:clamp(9px,.65vw,20px);padding:7px;min-height:44px}.shared .technology-board,.shared .exploration-board{padding:10px}.shared .spacefaring{min-width:85px;padding:5px}.shared .spacefaring h3{font-size:13px}.shared .basic-action p{font-size:7px}.shared .basic-action strong{font-size:8px}.shared .guild-cover{font-size:7px;min-height:44px;padding:4px}.shared .technology-layout{gap:8px}.shared .technology-tree{gap:5px 10px}.shared .technology-board header p,.shared .exploration-board header p{display:none}.shared-mat{--x:50%;--y:15%;--angle:180deg;position:absolute;left:var(--x);top:var(--y);width:23%;transform:translate(-50%,-50%) rotate(var(--angle));display:flex;flex-direction:column;align-items:center;gap:10px}.shared-mat[data-position='north-east']{--x:84%;--y:18%;--angle:225deg}.shared-mat[data-position='east']{--x:87%;--y:50%;--angle:270deg}.shared-mat[data-position='south-east']{--x:84%;--y:82%;--angle:315deg}.shared-mat[data-position='south']{--y:85%;--angle:0deg}.shared-mat[data-position='south-west']{--x:16%;--y:82%;--angle:45deg}.shared-mat[data-position='west']{--x:13%;--y:50%;--angle:90deg}.shared-mat[data-position='north-west']{--x:16%;--y:18%;--angle:135deg}.shared-mat>button,.shared-mat .seat-game-controls button{font-size:clamp(10px,.65vw,22px);padding:8px 12px;min-height:44px}
dialog{padding:0;background:#162c30;color:#e5d7af;border:2px solid #baa069;border-radius:10px;box-shadow:0 0 0 4px #bea37144,0 30px 100px #000b;max-height:90dvh;max-width:calc(100vw - 24px)}dialog::backdrop{background:#001019cc;backdrop-filter:blur(3px)}dialog>header{padding:13px 18px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-shrink:0;border-bottom:1px solid #ac945b77;background:linear-gradient(130deg,#3b5047,#193237)}dialog>header button{font-size:12px;min-height:44px;white-space:nowrap}dialog>header span{font-size:10px;color:#c8c9b1}.card-inspector{width:540px;display:none;grid-template-rows:auto minmax(0,1fr) auto;height:min(920px,90dvh)}.card-inspector[open]{display:grid}.inspection-scroll{overflow:auto;padding:20px 24px 30px;min-height:0}.full-card{width:min(100%,370px);margin:auto}.card-inspector nav{padding:12px 18px;display:flex;justify-content:space-between;gap:20px;border-top:1px solid #b1965c66;background:#243f3c}.card-inspector nav button{flex:1;font-size:13px;min-height:44px}.record-tray{width:960px;display:none;grid-template-rows:auto minmax(0,1fr);height:min(820px,89dvh)}.record-tray[open]{display:grid}.record-tray h2{font:600 31px 'Cormorant Garamond',serif;margin:0}.tray-scroll{padding:24px;min-height:0;overflow:auto;font-size:15px;line-height:1.5}.tray-scroll>p{margin:0 0 22px}.tray-scroll :global(.faction-mat){margin-bottom:22px}.achievement-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;max-width:760px;margin:auto}.setup-record{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:15px}.setup-record>div{padding:15px;border:1px solid #b09b6555;background:#56706222}.setup-record dt{color:#d9c48b;font-size:12px;margin-bottom:8px}.setup-record dd{margin:0;font-size:14px}.tray-scroll h3{font:600 30px 'Cormorant Garamond',serif;color:#e6d3a0}.guild-record{padding:12px 0;border-bottom:1px solid #b9a26a44}.guild-record h4{font-size:15px;color:#d7c895;margin:0 0 6px}.guild-record p{font-size:14px;margin:0;color:#d6d9bf}.source-note{font-size:12px;color:#aebca7;margin-top:22px!important}
@media(min-width:2200px){.game-surface{gap:30px}.game-heading p{font-size:20px}.game-heading .eyebrow{font-size:16px}.game-tools button{font-size:22px;padding:18px 24px}.board-table{gap:34px}.technology-board,.exploration-board{padding:28px}.technology-board>header,.exploration-board>header{margin-bottom:20px}.technology-board header p,.exploration-board header p{font-size:18px}.technology-layout{gap:28px}.spacefaring{min-width:240px;padding:18px;gap:10px}.spacefaring h3{font-size:36px}.overlay-label{font-size:16px}.basic-action{padding:10px 0}.basic-action strong{font-size:20px}.basic-action p{font-size:17px}.action-sockets{gap:9px;min-height:28px}.action-socket{width:27px;height:27px;font-size:13px}.spacefaring h4{font-size:19px}.guild-cover{font-size:17px;min-height:60px;padding:12px;grid-template-columns:40px 1fr}.guild-cover span{font-size:15px}.guild-cover small{font-size:13px}.action-pawn{width:22px;height:46px}.pawn-rest>span:last-child{font-size:15px}.technology-tree{gap:15px 30px;padding-top:44px}.prerequisite-lines{inset:44px 0 0;height:calc(100% - 44px)}.column-title{font-size:34px}.column-title small{font-size:13px}.card-back>span:first-child{font-size:32px}.card-back>span:not(:first-child){font-size:14px}.card-back small{font-size:12px}.map-location small{font-size:14px}.system-button{padding:13px 8px;gap:7px;min-height:130px}.planet.shipyard{font-size:29px}.ship-cube{min-width:35px;height:35px;font-size:16px}.ship-cube>span{font-size:15px}.map-key{font-size:15px}.personal-mat{max-width:min(1500px,calc(clamp(210px,33vh,650px)*1.7))}.shared .spacefaring{min-width:170px;padding:12px}.shared .spacefaring h3{font-size:26px}.shared .basic-action p{font-size:15px}.shared .basic-action strong{font-size:17px}.shared .guild-cover{font-size:14px;min-height:50px}.shared .technology-board,.shared .exploration-board{padding:22px}}
@media(max-width:760px){.game-surface{padding:0;grid-template-rows:auto 44px minmax(0,1fr) 135px;gap:10px}.game-heading{gap:8px}.game-heading h1{font-size:23px}.game-heading .eyebrow{font-size:8px}.game-heading p{font-size:9px}.game-tools{gap:5px;flex-direction:column}.game-tools button{min-height:44px;padding:6px 8px;font-size:10px}.board-switch{display:flex;gap:8px}.board-switch button{flex:1;padding:8px;font-size:15px;min-height:44px;border-color:#b49b65}.board-switch button[aria-pressed='true']{background:linear-gradient(130deg,#44736a,#1f4d4b);box-shadow:inset 0 0 0 2px #d4c18244,0 3px #8f773f}.board-table{display:block}.technology-board,.exploration-board{height:100%;padding:12px}.phone-hidden{display:none}.technology-board>header,.exploration-board>header{margin-bottom:8px;padding-bottom:7px}.technology-board h2,.exploration-board h2{font-size:22px}.technology-board header p{display:none}.exploration-board header p{font-size:9px}.technology-layout{display:block;overflow:auto;min-height:0}.spacefaring{display:none}.phone-technology-controls{display:flex;align-items:center;gap:8px;margin-bottom:10px;justify-content:space-between}.phone-technology-controls>div{display:flex;gap:4px}.phone-technology-controls button{font-size:11px;min-height:44px;min-width:44px;padding:5px 9px}.phone-technology-controls button[aria-pressed='true']{background:#466b5d;border-color:#dfc27b}.phone-technology-controls>button{max-width:130px;font-size:10px}.technology-tree{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:none;grid-auto-rows:112px;padding:0;gap:14px 15px;min-height:100%}.prerequisite-lines,.column-title{display:none}.technology-slot{grid-column:auto;grid-row:auto}.technology-slot.level-hidden{display:none}.card-back>strong{font-size:30px}.card-back>span:not(:first-child){font-size:11px}.card-back small{font-size:9px}.card-back>span:first-child{font-size:26px}.planet{width:35px;height:35px}.map-location strong{font-size:14px}.map-location small{font-size:8px}.system-button{padding:7px;min-height:79px}.ship-cube{min-width:23px;height:23px;font-size:11px}.map-key{font-size:9px}.player-shelf{grid-template-columns:1fr;gap:0;border:1px solid #a88d52;border-radius:7px;padding:10px 12px;background:linear-gradient(130deg,#2b4541,#132c32);box-shadow:0 4px #725d34,3px 8px 15px #0008}.personal-mat{display:none}.record-tray h2{font-size:25px}.tray-scroll{padding:17px;font-size:13px}.setup-record{grid-template-columns:1fr;gap:10px}.setup-record>div{padding:12px}.achievement-row{grid-template-columns:1fr;max-width:320px}.card-inspector>header{padding:9px 12px;gap:8px}.card-inspector>header span{font-size:9px}.inspection-scroll{padding:17px 18px 25px}.record-tray{height:88dvh}.record-tray .tray-scroll :global(.faction-mat){min-width:0}.shared{display:block}.shared .board-table{display:grid}.shared .phone-hidden{display:flex}.shared .board-switch,.shared .phone-technology-controls{display:none}}
@media(min-width:761px) and (max-height:800px){.game-surface:not(.shared){grid-template-rows:auto minmax(0,1fr) 155px;gap:10px}.game-heading h1{font-size:25px}.game-heading p{font-size:9px}.game-heading .eyebrow{font-size:8px}.personal-mat{max-width:260px}.technology-board,.exploration-board{padding:10px}.technology-layout{gap:10px}.spacefaring{min-width:110px;padding:6px}.spacefaring h3{font-size:15px}.basic-action{padding:3px 0}.guild-cover{min-height:44px}.technology-tree{gap:4px 12px}}
@media(max-width:2199px){.shared .game-heading>div:first-child{display:none}.shared .game-tools{width:100%;justify-content:center}}
@media(max-width:760px){.technology-board>header .pawn-rest{display:none}}
@media(max-width:760px){.game-heading{display:flex;flex-direction:column;align-items:stretch;gap:8px}.game-heading h1{font-size:22px}.game-tools{display:flex;flex-direction:row;gap:7px}.game-tools button{flex:1;font-size:10px;min-height:44px;padding:7px}}
.shared .board-table{left:14%;right:14%;top:28%;bottom:24%;grid-template-columns:minmax(0,2.5fr) minmax(170px,1fr)}.shared .game-heading{left:14%;right:14%;top:24%;height:44px}.shared .game-heading>div:first-child{display:none}.shared .game-tools{width:100%;justify-content:center}.shared-mat{--y:12%;width:52%}.shared-mat[data-position='south']{--y:88%}.shared-mat[data-position='east']{--x:93%;width:34%}.shared-mat[data-position='west']{--x:7%;width:34%}.shared-mat[data-position='north-east']{--x:85%;--y:20%;width:24%}.shared-mat[data-position='north-west']{--x:15%;--y:20%;width:24%}.shared-mat[data-position='south-east']{--x:85%;--y:80%;width:24%}.shared-mat[data-position='south-west']{--x:15%;--y:80%;width:24%}.shared.diagonal .board-table{left:25%;right:25%;top:30%;bottom:30%}.shared.diagonal .game-heading{left:25%;right:25%;top:26%}
.shared .board-table{top:29%}.shared .game-heading>div:first-child{display:block}.shared .game-heading .eyebrow{display:none}.shared .game-heading h1{font-size:clamp(19px,1.2vw,38px);margin:0}.shared .game-heading p:not(.eyebrow){display:block;font-size:clamp(9px,.55vw,17px);margin:3px 0 0}.shared .game-tools{width:auto;justify-content:flex-end;flex-wrap:nowrap}.shared .game-heading{height:44px}.shared.diagonal .game-heading{top:25%}.shared.diagonal .board-table{top:30%}
.shared.diagonal .shared-mat{width:32%}.shared.diagonal .shared-mat[data-position='east'],.shared.diagonal .shared-mat[data-position='west']{width:22%}.shared.diagonal .shared-mat[data-position='north-east']{--x:80%;--y:16%;width:16%}.shared.diagonal .shared-mat[data-position='north-west']{--x:20%;--y:16%;width:16%}.shared.diagonal .shared-mat[data-position='south-east']{--x:80%;--y:84%;width:16%}.shared.diagonal .shared-mat[data-position='south-west']{--x:20%;--y:84%;width:16%}
.record-tray.seat-reader{transform:rotate(var(--reader-angle));width:min(960px,64vmin);height:min(820px,64vmin);max-width:64vmin;max-height:64vmin}
.card-back{padding:4px;min-height:44px;height:100%;border-radius:5px}.card-back>span:first-child{display:none}.card-back:hover{border-color:#f0d495;background:radial-gradient(ellipse at 35% 30%,#416f6d,#203d42 70%)}
.shared.corner-only.diagonal .shared-mat{width:24%}.shared.corner-only.diagonal .shared-mat[data-position='north-east']{--x:85%;--y:20%}.shared.corner-only.diagonal .shared-mat[data-position='north-west']{--x:15%;--y:20%}.shared.corner-only.diagonal .shared-mat[data-position='south-east']{--x:85%;--y:80%}.shared.corner-only.diagonal .shared-mat[data-position='south-west']{--x:15%;--y:80%}.shared .game-heading>div:first-child{min-width:0;flex:1}.shared .game-tools{flex-shrink:0}.shared.diagonal .board-table{top:32%}

/* Personal table: public seats on the far edge, boards in the field, economy at hand. */
.game-surface:not(.shared){grid-template-rows:70px minmax(0,1fr) auto;gap:14px;padding:0}
.game-surface:not(.shared) .game-heading{gap:16px;align-items:center;border-bottom:1px solid #a98c4f66;padding:0 4px 10px}
.game-surface:not(.shared) .game-heading h1{font-size:clamp(22px,2vw,52px);white-space:nowrap}
.game-surface:not(.shared) .game-heading p{font-size:10px}
.game-surface:not(.shared) .game-heading .eyebrow{display:none}
.opponent-strip{display:flex;gap:9px;margin-left:auto;min-width:0}
.opponent-strip button{display:grid;grid-template-columns:30px minmax(0,1fr);gap:2px 7px;padding:7px 10px;text-align:left;border:1px solid #a58c53;background:linear-gradient(125deg,#3c4840,#111f27 75%);box-shadow:inset 0 1px #e4c88644,0 3px #645337,3px 6px 9px #0008;min-height:51px;min-width:90px;max-width:155px}
.opponent-emblem{grid-row:span 2;align-self:center;font:28px 'Cormorant Garamond',serif;color:#d9c68d;text-shadow:0 0 10px #7bd6b666}
.opponent-strip strong{font:600 19px/.95 'Cormorant Garamond',serif;overflow-wrap:anywhere;color:#eee2bf}
.opponent-strip button>span:last-child{font-size:9px;color:#bec6ae}
.game-surface:not(.shared) .game-tools{gap:6px;flex-wrap:nowrap}
.game-surface:not(.shared) .game-tools button{padding:8px;font-size:10px;min-height:44px}
.game-surface:not(.shared) .board-table{grid-template-columns:minmax(0,1.65fr) minmax(0,1fr);gap:18px}
.game-surface:not(.shared) .technology-board,.game-surface:not(.shared) .exploration-board{padding:12px; border-radius:8px}
.game-surface:not(.shared) .technology-board>header,.game-surface:not(.shared) .exploration-board>header{margin-bottom:6px;padding-bottom:7px}
.game-surface:not(.shared) .technology-board h2,.game-surface:not(.shared) .exploration-board h2{font-size:clamp(24px,2vw,50px)}
.game-surface:not(.shared) .technology-board header p{display:none}
.game-surface:not(.shared) .technology-layout{display:block;overflow:auto;padding:4px 7px 12px}
.game-surface:not(.shared) .spacefaring{display:none}
.game-surface:not(.shared) .phone-technology-controls{display:flex;justify-content:flex-end;margin-bottom:5px}
.game-surface:not(.shared) .phone-technology-controls>div{display:none}
.game-surface:not(.shared) .phone-technology-controls>button{padding:6px 12px;font-size:10px;min-height:44px;background:linear-gradient(125deg,#e7d7ad,#b8a478);color:#263c35;border-color:#ba9d64;box-shadow:0 3px #6d5a35}
.game-surface:not(.shared) .technology-tree{min-height:530px;grid-template-rows:repeat(7,64px);padding:40px 0 32px;gap:0 17px;min-width:520px}
.game-surface:not(.shared) .technology-slot{align-self:center;height:52px}
.game-surface:not(.shared) .technology-slot.revealed{height:118px}
.game-surface:not(.shared) .column-title{font-size:24px}
.game-surface:not(.shared) .column-title small{font-size:9px}
.game-surface:not(.shared) .prerequisite-lines{inset:40px 0 32px;height:448px}
.game-surface:not(.shared) .card-back{min-height:50px;gap:2px}
.game-surface:not(.shared) .card-back>strong{font-size:22px}
.game-surface:not(.shared) .card-back>span:not(:first-child){font-size:8px}
.game-surface:not(.shared) .card-back small{font-size:8px}
.game-surface:not(.shared) .map-location{width:28%}
.game-surface:not(.shared) .map-location strong{font-size:clamp(14px,1.2vw,32px)}
.game-surface:not(.shared) .map-location small{font-size:clamp(9px,.7vw,18px)}
.game-surface:not(.shared) .system-button{padding:8px 5px;min-height:88px;background:linear-gradient(135deg,#f4e6c6,#bbaa83);color:#233b33;box-shadow:inset 0 0 0 2px #fff1ca77,0 3px #79633d,3px 6px 10px #0009}
.game-surface:not(.shared) .system-button strong{color:#243d36}
.game-surface:not(.shared) .system-button small{color:#53604a}
.game-surface:not(.shared) .planet{width:clamp(34px,3vw,84px);height:clamp(34px,3vw,84px)}
.game-surface:not(.shared) .player-shelf{display:flex;flex-direction:column;align-items:stretch;gap:8px;min-height:0}
.game-surface:not(.shared) .personal-mat{width:100%;max-width:none;max-height:none}
.mat-controls{display:flex;align-items:center;gap:12px;padding:0 5px;color:#d7c494;min-height:44px}
.mat-controls>div{display:flex;gap:14px;align-items:center}
.mat-controls strong{font:600 22px 'Cormorant Garamond',serif}
.mat-controls span{font-size:11px;color:#c3c9b4}
.mat-controls button{min-height:44px;font-size:12px;padding:7px 15px}
.mat-controls small{margin-left:auto;font-size:10px;color:#a8bba8}
@media(min-width:2200px){
.game-surface:not(.shared){grid-template-rows:125px minmax(0,1fr) auto;gap:28px}
.game-surface:not(.shared) .game-heading p{font-size:20px}
.game-surface:not(.shared) .game-tools button{font-size:20px;padding:16px}
.opponent-strip{gap:18px}.opponent-strip button{grid-template-columns:58px 1fr;max-width:330px;padding:15px 22px;min-height:100px;gap:5px 15px}.opponent-emblem{font-size:55px}.opponent-strip strong{font-size:39px}.opponent-strip button>span:last-child{font-size:19px}
.game-surface:not(.shared) .technology-board,.game-surface:not(.shared) .exploration-board{padding:25px}
.game-surface:not(.shared) .technology-tree{min-height:1100px;grid-template-rows:repeat(7,135px);padding:75px 0 60px;gap:0 35px}
.game-surface:not(.shared) .technology-slot{height:112px}.game-surface:not(.shared) .technology-slot.revealed{height:250px}
.game-surface:not(.shared) .column-title{font-size:48px}.game-surface:not(.shared) .column-title small{font-size:18px}
.game-surface:not(.shared) .prerequisite-lines{inset:75px 0 60px;height:945px}
.game-surface:not(.shared) .card-back>strong{font-size:46px}.game-surface:not(.shared) .card-back>span:not(:first-child),.game-surface:not(.shared) .card-back small{font-size:17px}
.game-surface:not(.shared) .phone-technology-controls>button{font-size:20px;padding:14px 25px}
.game-surface:not(.shared) .system-button{min-height:175px;padding:16px 10px}
.mat-controls{gap:25px;min-height:75px}.mat-controls strong{font-size:40px}.mat-controls span{font-size:22px}.mat-controls button{font-size:23px;padding:14px 30px}.mat-controls small{font-size:19px}
}
@media(max-width:760px){
.game-surface:not(.shared){grid-template-rows:auto 44px minmax(0,1fr) auto;gap:8px}
.game-surface:not(.shared) .game-heading{display:grid;grid-template-columns:1fr auto;gap:6px;padding:0 2px 6px}
.game-surface:not(.shared) .game-heading>div:first-child{grid-column:1}
.game-surface:not(.shared) .game-heading h1{font-size:21px;white-space:normal;margin:0}
.game-surface:not(.shared) .game-heading p{font-size:8px;margin:2px 0 0}
.opponent-strip{grid-row:1 / 3;grid-column:2;flex-direction:row;gap:3px;max-width:170px}
.opponent-strip button{display:flex;flex-direction:column;justify-content:center;align-items:center;min-width:44px;max-width:56px;padding:4px;gap:2px;min-height:62px;text-align:center}
.opponent-emblem{font-size:21px}.opponent-strip strong{font-size:13px}.opponent-strip button>span:last-child{font-size:7px}
.game-surface:not(.shared) .game-tools{grid-row:2;grid-column:1;gap:4px;justify-content:start}
.game-surface:not(.shared) .game-tools button{min-width:44px;font-size:8px;padding:4px;flex:0 1 auto}
.game-surface:not(.shared) .board-switch{display:flex;margin:0;gap:8px}
.game-surface:not(.shared) .board-table{display:block;min-height:0}
.game-surface:not(.shared) .technology-board,.game-surface:not(.shared) .exploration-board{padding:9px;height:100%}
.game-surface:not(.shared) .technology-board>header{display:none}
.game-surface:not(.shared) .phone-technology-controls{display:flex;align-items:center;gap:6px;justify-content:space-between;margin:0 0 9px}
.game-surface:not(.shared) .phone-technology-controls>div{display:flex;gap:4px}
.game-surface:not(.shared) .phone-technology-controls button{min-width:44px;min-height:44px;padding:4px;font-size:12px}
.game-surface:not(.shared) .phone-technology-controls>button{font-size:9px;max-width:120px;padding:4px}
.game-surface:not(.shared) .technology-layout{padding:5px 5px 14px;min-height:0}
.game-surface:not(.shared) .technology-tree{min-height:0;min-width:0;grid-template-columns:1fr 1fr;grid-template-rows:none;grid-auto-rows:190px;padding:0;gap:17px 14px}
.game-surface:not(.shared) .technology-slot,.game-surface:not(.shared) .technology-slot.revealed{height:100%;align-self:stretch}
.game-surface:not(.shared) .card-back>strong{font-size:35px}.game-surface:not(.shared) .card-back>span:not(:first-child){font-size:12px}.game-surface:not(.shared) .card-back small{font-size:10px}
.game-surface:not(.shared) .player-shelf{border:0;padding:0;background:none;box-shadow:none;gap:0}
.game-surface:not(.shared) .personal-mat{display:none}
.mat-controls{padding:10px 12px;display:grid;grid-template-columns:1fr auto;gap:6px 10px;border:1px solid #b29b62;border-radius:8px;background:linear-gradient(120deg,#f1e2bd,#c3b18b);box-shadow:inset 0 0 0 3px #fff0c155,0 4px #75613b,0 8px 12px #0008;color:#263d36}
.mat-controls>div{display:flex;flex-direction:column;align-items:start;gap:2px}.mat-controls strong{font-size:23px}.mat-controls span{font-size:12px;color:#3d5447}.mat-controls button{font-size:11px;padding:8px;min-height:44px;background:linear-gradient(120deg,#344e47,#162d32);color:#f3e6bf}
.mat-controls small{grid-column:1 / -1;margin:0;font-size:9px;color:#5d634b}
}


.spacefaring-plaque{font-size:10px;min-height:44px;padding:6px 10px;background:linear-gradient(125deg,#e7d7ad,#b8a478);color:#263c35;border-color:#ba9d64;box-shadow:0 3px #6d5a35;margin-left:auto}
.game-surface:not(.shared) .technology-board>header{align-items:center}
.game-surface:not(.shared) .phone-technology-controls{display:none}
.game-surface:not(.shared) .pawn-rest{margin-left:6px}.game-surface:not(.shared) .pawn-rest>span:last-child{display:none}
@media(min-width:2200px){.spacefaring-plaque{font-size:20px;padding:14px 24px}}
@media(min-width:761px) and (max-height:850px){
.game-surface:not(.shared){grid-template-rows:55px minmax(0,1fr) auto;gap:10px}
.game-surface:not(.shared) .technology-tree{min-height:340px;grid-template-rows:repeat(7,43px);padding:25px 0 14px}
.game-surface:not(.shared) .prerequisite-lines{inset:25px 0 14px;height:301px}
.game-surface:not(.shared) .technology-slot{height:40px;min-height:40px}
.game-surface:not(.shared) .technology-slot.revealed{height:83px}
.game-surface:not(.shared) .card-back{min-height:40px;height:40px}
.game-surface:not(.shared) .card-back>strong{font-size:18px}
.game-surface:not(.shared) .card-back small{display:none}
.game-surface:not(.shared) .column-title{font-size:20px}.game-surface:not(.shared) .column-title small{font-size:7px}
}
@media(max-width:760px){.game-surface:not(.shared) .phone-technology-controls{display:flex}.spacefaring-plaque{display:none}}

@media(min-width:761px){
.game-surface:not(.shared) .player-shelf{position:relative}
.mat-controls{position:absolute;left:18px;bottom:17px;min-height:44px;padding:0;max-width:15%;display:flex}
.mat-controls>div,.mat-controls small{display:none}.mat-controls button{font-size:10px;padding:6px 10px;white-space:normal}
}
@media(min-width:761px) and (max-height:850px){
.game-surface:not(.shared) .technology-tree{min-height:445px;grid-template-rows:repeat(7,56px);padding:34px 0 19px}
.game-surface:not(.shared) .prerequisite-lines{inset:34px 0 19px;height:392px}
.game-surface:not(.shared) .technology-slot{height:48px;min-height:48px}
.game-surface:not(.shared) .technology-slot.revealed{height:106px}
.game-surface:not(.shared) .card-back{min-height:48px;height:48px}
}
@media(min-width:2200px){.mat-controls{left:40px;bottom:30px}.mat-controls button{font-size:23px;padding:14px 25px}}

.shared .technology-tree{min-height:560px;min-width:440px;grid-template-rows:repeat(7,70px);padding-top:40px;padding-bottom:30px}
.shared .technology-slot{align-self:center;height:54px}.shared .technology-slot.revealed{height:132px}
.shared .prerequisite-lines{inset:40px 0 30px;height:490px}
@media(min-width:2200px){.shared .technology-tree{min-height:850px;grid-template-rows:repeat(7,105px);padding-top:65px;padding-bottom:50px}.shared .technology-slot{height:86px}.shared .technology-slot.revealed{height:196px}.shared .prerequisite-lines{inset:65px 0 50px;height:735px}}

.system-art{display:block;width:100%;height:35px;overflow:hidden;border:1px solid #a58b56;background:#102832;border-radius:2px}.system-art :global(svg){width:100%;height:100%;display:block}
@media(min-width:2200px){.system-art{height:75px}}

.map-location:not(.system) .fleet{flex-wrap:nowrap}
@media(max-width:760px){.mat-controls small{font-size:10px}}

.compact-overview,.compact-focus-toggle,.technology-scroll-tools{display:none}
@media(min-width:761px){.mat-controls{display:none}}
@media(min-width:761px) and (max-height:850px){
.game-surface:not(.shared) .compact-overview{display:flex;flex:1;min-height:0}
.game-surface:not(.shared) .technology-layout{display:none}
.compact-focus-toggle{display:block;min-height:44px;padding:6px 10px;font-size:11px;background:linear-gradient(130deg,#456a5c,#203e3f);border-color:#c5ad6e;white-space:nowrap}
.game-surface:not(.shared) .technology-board>header{gap:8px}
.game-surface:not(.shared) .technology-board h2{font-size:24px}
.game-surface:not(.shared) .spacefaring-plaque{font-size:9px;padding:5px 7px}
.game-surface:not(.shared) .technology-board .pawn-rest{gap:3px}
.game-surface:not(.shared) .technology-board .action-pawn{width:9px;height:21px}
.game-surface.technology-focus:not(.shared) .board-table{grid-template-columns:1fr}
.game-surface.technology-focus:not(.shared) .exploration-board,.game-surface.technology-focus:not(.shared) .compact-overview,.game-surface.technology-focus:not(.shared) .personal-mat{display:none}
.game-surface.technology-focus:not(.shared) .technology-layout{display:block;scrollbar-width:auto;scrollbar-color:#c8ae72 #132c32;scrollbar-gutter:stable}
.game-surface.technology-focus:not(.shared) .technology-tree{min-width:680px;max-width:1000px;margin:auto;min-height:600px;grid-template-rows:repeat(7,76px);padding:42px 0 26px}
.game-surface.technology-focus:not(.shared) .technology-slot.revealed{height:143px}
.game-surface.technology-focus:not(.shared) .technology-slot{height:60px}
.game-surface.technology-focus:not(.shared) .card-back{height:60px}
.game-surface.technology-focus:not(.shared) .prerequisite-lines{inset:42px 0 26px;height:532px}
.game-surface.technology-focus:not(.shared) .card-back small{display:block;font-size:10px}
.game-surface.technology-focus .technology-scroll-tools{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:8px;border-top:1px solid #a78e5555}
.technology-scroll-tools button{min-height:44px;padding:6px 12px;font-size:12px}.technology-scroll-tools span{font-size:11px;color:#c2cbb1}
.game-surface.technology-focus .mat-controls{display:flex;position:static;max-width:none;padding:8px 13px;border:1px solid #b69a61;border-radius:6px;background:linear-gradient(130deg,#e9dcb9,#bda980);color:#243b33;gap:15px;min-height:60px}
.game-surface.technology-focus .mat-controls>div{display:flex}.game-surface.technology-focus .mat-controls span{color:#344e40}.game-surface.technology-focus .mat-controls small{display:block;color:#526246}
}
@media(min-width:761px) and (max-height:650px){
.game-surface:not(.shared) .personal-mat{display:none}
.game-surface:not(.shared) .mat-controls{display:flex;position:static;max-width:none;padding:8px 13px;border:1px solid #b69a61;border-radius:6px;background:linear-gradient(130deg,#e9dcb9,#bda980);color:#243b33;gap:15px;min-height:60px}
.game-surface:not(.shared) .mat-controls>div{display:flex}.game-surface:not(.shared) .mat-controls span{color:#344e40}.game-surface:not(.shared) .mat-controls small{display:block;color:#526246}
}

@media(max-width:2199px){.shared.diagonal .technology-layout{display:block}.shared.diagonal .spacefaring{display:none}.shared.diagonal .technology-tree{min-width:0;width:100%}}

/* A compact shared display keeps the complete topology, with deliberate focus. */
@media(min-width:761px) and (max-width:2199px){
.shared .compact-overview{display:flex;flex:1;min-height:0}
.shared .technology-layout{display:none}
.shared .compact-focus-toggle{display:block;min-height:44px;padding:6px 9px;font-size:10px;white-space:nowrap;border-color:#b8a16a;background:linear-gradient(130deg,#456a5c,#203e3f)}
.shared .technology-board>header{align-items:center;gap:8px}
.shared .technology-board h2{font-size:23px}
.shared .pawn-rest{margin-left:auto;gap:3px}.shared .pawn-rest>span:last-child{display:none}
.shared .board-table{grid-template-columns:minmax(0,1.65fr) minmax(170px,1fr)}
.shared.corner-only.diagonal .board-table{top:25%;bottom:20%}
.shared.corner-only.diagonal .game-heading{top:19%;height:44px}
.shared.technology-focus .board-table{grid-template-columns:1fr}
.shared.technology-focus .exploration-board,.shared.technology-focus .compact-overview,.shared.technology-focus .spacefaring{display:none}
.shared.technology-focus .technology-layout{display:block;scrollbar-width:auto;scrollbar-color:#c8ae72 #132c32;scrollbar-gutter:stable;padding:4px 7px 12px}
.shared.technology-focus .technology-tree{min-width:0;width:100%;min-height:600px;grid-template-rows:repeat(7,76px);padding:42px 0 26px;gap:0 16px}
.shared.technology-focus .technology-slot{height:60px}.shared.technology-focus .technology-slot.revealed{height:143px}
.shared.technology-focus .prerequisite-lines{inset:42px 0 26px;height:532px}
.shared.technology-focus .technology-scroll-tools{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:8px;border-top:1px solid #a78e5555}
.shared.technology-focus .technology-scroll-tools button{font-size:10px;min-height:44px;padding:6px 9px}
.shared.technology-focus .technology-scroll-tools span{font-size:9px;text-align:center;color:#c2cbb1}
}

@media(min-width:761px) and (max-width:2199px){
.shared:not(.technology-focus) .technology-layout{display:none}
.shared.corner-only.diagonal .board-table{left:23%;right:23%}
}

@media(min-width:761px) and (max-width:2199px) and (max-height:850px){
.shared.corner-only.diagonal .game-heading{top:14%;height:64px;right:28%}
.shared.corner-only.diagonal .shared-mat[data-position='north-east'],.shared.corner-only.diagonal .shared-mat[data-position='north-west']{--y:25%}
.shared.corner-only.diagonal .shared-mat[data-position='south-east'],.shared.corner-only.diagonal .shared-mat[data-position='south-west']{--y:75%}
.shared:not(.diagonal) .shared-mat[data-position='north'],.shared:not(.diagonal) .shared-mat[data-position='south']{width:40%}
}


@media(min-width:761px) and (max-height:850px){
 .record-tray.seat-reader{width:80vmin;max-width:80vmin;height:60vmin;max-height:60vmin}
 .record-tray.seat-reader>header{padding:8px 12px;gap:12px}
 .record-tray.seat-reader h2{font-size:26px}
 .record-tray.seat-reader .tray-scroll{padding:10px}
 .record-tray.seat-reader .tray-scroll>p{display:none}
 .record-tray.seat-reader .tray-scroll :global(.faction-mat){margin-bottom:0}
}
.overview-scroll-cue{display:none}
@media(min-width:761px) and (max-width:1100px) and (max-height:500px){
.game-surface:not(.shared){grid-template-rows:44px 44px minmax(0,1fr) 60px;gap:6px}.game-heading h1{font-size:20px}.game-heading p{font-size:8px}.game-heading .eyebrow{display:none}.opponent-strip{gap:5px}.opponent-strip button{padding:5px 8px}.opponent-strip button span{font-size:9px}.game-tools{gap:5px}.game-tools button{font-size:9px;min-height:44px;padding:6px 8px}.board-switch{display:flex;gap:8px;padding-right:165px}.board-switch button{min-height:44px;font-size:13px;flex:1;padding:7px}.game-surface:not(.shared) .board-table{display:block;min-height:0}.game-surface:not(.shared) .phone-hidden{display:none}.game-surface:not(.shared) .technology-board,.game-surface:not(.shared) .exploration-board{height:100%;padding:6px 10px}.game-surface:not(.shared) .technology-board>header{display:contents}.game-surface:not(.shared) .technology-board>header>h2,.game-surface:not(.shared) .technology-board>header>p,.game-surface:not(.shared) .technology-board>header>.spacefaring-plaque,.game-surface:not(.shared) .technology-board>header>.pawn-rest{display:none}.compact-focus-toggle{position:absolute;right:0;top:50px;width:155px;min-height:44px}.game-surface:not(.shared) .compact-overview{display:block;overflow-y:auto;scrollbar-color:#c6ad70 #17363a;padding-right:8px}.compact-overview :global(.technology-overview){height:280px}.overview-scroll-cue{display:block;font-size:10px;color:#ddcfaa;margin:0 0 8px}.game-surface:not(.shared) .player-shelf{padding:0;min-height:0}.game-surface:not(.shared) .mat-controls{padding:6px 10px;gap:10px;min-height:60px}.mat-controls small{display:none!important}.mat-controls>div{flex:1}.mat-controls strong{font-size:18px}.mat-controls span{font-size:10px}.mat-controls button{min-height:44px;font-size:11px}.exploration-board>header{display:none}.game-surface:not(.shared) .map-key{font-size:8px}.game-surface:not(.shared) .star-map{min-height:240px}.game-surface:not(.shared) .exploration-board{overflow-y:auto;scrollbar-color:#c6ad70 #17363a}.game-surface.technology-focus:not(.shared) .technology-scroll-tools span{font-size:9px}
}
@media(min-width:761px) and (max-width:1100px) and (min-height:501px){
.game-surface:not(.shared){grid-template-rows:auto 44px minmax(0,1fr) 90px;gap:12px}.game-heading{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px}.game-heading h1{font-size:26px}.game-heading p{font-size:11px}.game-heading .eyebrow{font-size:9px}.game-tools{grid-column:2;grid-row:1 / span 2;max-width:220px;flex-wrap:wrap;gap:7px}.game-tools button{font-size:11px;min-height:44px;padding:9px}.opponent-strip{grid-column:1;gap:7px;flex-wrap:wrap}.opponent-strip button{padding:6px 9px}.opponent-strip span{font-size:10px}.board-switch{display:flex;gap:10px}.board-switch button{flex:1;min-height:44px;font-size:16px}.game-surface:not(.shared) .board-table{display:block}.game-surface:not(.shared) .phone-hidden{display:none}.game-surface:not(.shared) .technology-board,.game-surface:not(.shared) .exploration-board{height:100%;padding:17px}.game-surface:not(.shared) .compact-overview{display:none}.game-surface:not(.shared) .technology-layout{display:block;overflow-y:auto;min-height:0}.game-surface:not(.shared) .spacefaring{display:none}.phone-technology-controls{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.phone-technology-controls>div{display:flex;gap:7px}.phone-technology-controls button{min-height:44px;min-width:44px;padding:8px;font-size:13px}.phone-technology-controls button[aria-pressed=true]{background:#426d62;border-color:#e1c884}.game-surface:not(.shared) .technology-tree{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:none;grid-auto-rows:160px;padding:0;gap:22px;min-width:0;min-height:100%}.game-surface:not(.shared) .column-title,.game-surface:not(.shared) .prerequisite-lines{display:none}.game-surface:not(.shared) .technology-slot,.game-surface:not(.shared) .technology-slot.revealed{grid-column:auto;grid-row:auto;height:160px}.game-surface:not(.shared) .technology-slot.level-hidden{display:none}.game-surface:not(.shared) .card-back{min-height:90px;height:100%}.game-surface:not(.shared) .card-back small{display:block;font-size:12px}.game-surface:not(.shared) .personal-mat{display:none}.game-surface:not(.shared) .player-shelf{padding:0}.game-surface:not(.shared) .mat-controls{display:flex;position:static;max-width:none;padding:14px;border:1px solid #b69a61;border-radius:7px;background:linear-gradient(130deg,#e9dcb9,#bda980);color:#243b33;gap:15px}.mat-controls>div{display:flex;flex-direction:column;flex:1}.mat-controls span{font-size:13px;color:#344e40}.mat-controls small{display:none}.mat-controls button{min-height:44px;font-size:13px}.technology-board>header>p,.technology-board>header>.spacefaring-plaque,.technology-board>header>.pawn-rest,.compact-focus-toggle{display:none}.exploration-board .map-key{font-size:12px}
}
.research-markers{left:100%;top:2px;bottom:auto;flex-direction:column;gap:2px}.research-markers span{width:9px;height:9px;border:1px solid hsl(var(--cube-tone) 35% 75%);background:linear-gradient(135deg,hsl(var(--cube-tone) 50% 68%),hsl(var(--cube-tone) 45% 32%));box-shadow:1px 1px hsl(var(--cube-tone) 35% 20%)}
.live-socket[style]{color:hsl(var(--pawn-tone) 45% 75%);background:linear-gradient(135deg,hsl(var(--pawn-tone) 30% 35%),hsl(var(--pawn-tone) 35% 20%));border-color:hsl(var(--pawn-tone) 30% 65%)}
.game-surface .technology-tree:has(.research-markers span){padding-right:12px}
.technology-slot{position:relative}
.shared-mat .seat-game-controls{position:static;align-self:stretch;width:calc(100% - 8px);margin:0 4px}.shared-mat .seat-game-controls:not(:has(.turn-control)){justify-content:center}
@media(max-height:650px){.shared.corner-only.diagonal .board-table{bottom:8%}.shared.corner-only.diagonal :global(.overview-map){min-height:244px}.shared.corner-only.diagonal :global(.overview-node.known){min-height:58px}.shared.corner-only.diagonal .shared-mat[data-position='north-east'],.shared.corner-only.diagonal .shared-mat[data-position='north-west']{--y:30%}.shared.corner-only.diagonal .shared-mat[data-position='south-east'],.shared.corner-only.diagonal .shared-mat[data-position='south-west']{--y:70%}}
@media(min-width:2200px){.shared.corner-only.diagonal .technology-layout{padding-top:6px}.shared.corner-only.diagonal .board-table{top:25%;bottom:20%}.shared.corner-only.diagonal .game-heading{top:21%}.shared .spacefaring{min-width:230px}.shared .spacefaring h4{margin:12px 0 8px}.shared .basic-action{padding:5px 0}}
/* Full card inspection must remain readable across a shared 4K table. */
@media(min-width:2200px){
 .card-inspector{width:1000px;height:min(1750px,90dvh)}
 .card-inspector .full-card{width:min(100%,850px)}
 .card-inspector>header{padding:22px 28px;gap:28px}
 .card-inspector>header button,.card-inspector nav button{font-size:25px;min-height:66px}
 .card-inspector>header span{font-size:21px}
 .card-inspector .inspection-scroll{padding:28px 36px 36px}
 .card-inspector nav{padding:22px 28px;gap:28px}
}
/* Keep the complete shared4K topology inside its board, including focusable edge cards. */
@media(min-width:2200px){
 .shared:not(.diagonal):not(.technology-focus) .board-table{top:27%}
 .shared:not(.diagonal):not(.technology-focus) .technology-tree{min-height:0;grid-template-rows:repeat(7,minmax(0,1fr));padding-top:120px;padding-bottom:60px}
 .shared:not(.diagonal):not(.technology-focus) .prerequisite-lines{inset:117.5px 0 57.5px;height:calc(100% - 175px)}
 /* Leave physical ink clearance inside the clipped board at fractional origins. */
 .shared:not(.diagonal):not(.technology-focus) .column-title{top:4px;line-height:1.2}
}
.outpost-marker{display:flex;align-items:center;justify-content:center;gap:4px;width:max-content;max-width:100%;margin:3px auto;padding:3px 6px;border:1px solid #d4c18c;border-radius:12px;background:hsl(var(--outpost-tone) 30% 24%);color:#fff0c5;box-shadow:0 2px #102d2b;font-size:11px}.outpost-marker span{overflow-wrap:anywhere}
@media(min-width:761px) and (max-width:2199px) and (max-height:650px){.shared:not(.diagonal) .shared-mat[data-position='south']{top:auto;bottom:8px;transform:translateX(-50%)}}

/* Revealed higher-level cards occupy adjacent rows. Give each its own complete
   physical space, with explicit bounded navigation instead of overlapping ink. */
@media(min-width:761px){
 .game-surface.discovered-branches{--branch-unit:76px}
 .game-surface.discovered-branches .technology-tree,.game-surface.shared.discovered-branches .technology-tree{height:calc(var(--branch-unit)*var(--branch-units) + 68px);min-height:calc(var(--branch-unit)*var(--branch-units) + 68px);grid-template-rows:var(--branch-rows);row-gap:0;padding-top:42px;padding-bottom:26px}
 .game-surface.discovered-branches .technology-slot.revealed{height:143px}
 .game-surface.discovered-branches .prerequisite-lines{inset:42px 0 26px;height:calc(var(--branch-unit)*var(--branch-units))}
}
@media(min-width:2200px), (min-width:761px) and (min-height:851px){
 .game-surface.discovered-branches .technology-scroll-tools{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:8px;border-top:1px solid #a78e5555}
 .game-surface.discovered-branches .technology-layout{scrollbar-color:#c8ae72 #132c32;scrollbar-gutter:stable}
}
@media(min-width:2200px){
 .game-surface.discovered-branches{--branch-unit:105px}
 .game-surface.discovered-branches .technology-tree,.game-surface.shared.discovered-branches .technology-tree{height:calc(var(--branch-unit)*var(--branch-units) + 180px);min-height:calc(var(--branch-unit)*var(--branch-units) + 180px);padding-top:120px;padding-bottom:60px}
 .game-surface.discovered-branches .technology-slot.revealed{height:196px}
 .game-surface.discovered-branches .prerequisite-lines{inset:120px 0 60px;height:calc(var(--branch-unit)*var(--branch-units))}
 .game-surface.discovered-branches .technology-scroll-tools button{font-size:20px;padding:10px 18px}
 .game-surface.discovered-branches .technology-scroll-tools span{font-size:18px}
}
@media(min-width:761px) and (max-width:2199px){
 .game-surface.shared.discovered-branches .compact-overview{display:block;overflow:auto;scrollbar-color:#c8ae72 #132c32;padding-right:6px}
 .game-surface.shared.discovered-branches .overview-scroll-cue{display:block;margin:0 0 8px;font-size:10px;line-height:1.3;color:#ddcfaa}
 .game-surface.shared.discovered-branches .compact-overview :global(.technology-overview){min-height:400px}
 .game-surface.shared.discovered-branches .compact-overview :global(.overview-map){min-height:352px}
 .game-surface.shared.discovered-branches .compact-overview :global(.overview-node.known){height:44px;min-height:44px;max-height:44px}
}
.rift-map .map-location.system{width:24%}
@media(min-width:2200px){
 .shared.corner-only.diagonal:not(.discovered-branches) .technology-tree{--overview-row:105px;--overview-gap:5px;grid-template-rows:repeat(7,var(--overview-row));row-gap:var(--overview-gap);padding-top:120px}
 .shared.corner-only.diagonal:not(.discovered-branches) .prerequisite-lines{inset:calc(120px - var(--overview-gap)/2) 0 auto;height:calc(var(--overview-row)*7 + var(--overview-gap)*7)}
}
/* Keep real touch-size overview cards separated after recovery on short tables. */
@media(min-width:761px) and (max-width:2199px) and (max-height:650px){
 .shared:not(.diagonal):not(.discovered-branches):not(.technology-focus) .compact-overview{display:block;overflow:auto;scrollbar-color:#c8ae72 #132c32;padding-right:6px}
 .shared:not(.diagonal):not(.discovered-branches):not(.technology-focus) .overview-scroll-cue{display:block;margin:0 0 8px;font-size:10px;line-height:1.3;color:#ddcfaa}
 .shared:not(.diagonal):not(.discovered-branches):not(.technology-focus) .compact-overview :global(.technology-overview){min-height:300px}
 .shared:not(.diagonal):not(.discovered-branches):not(.technology-focus) .compact-overview :global(.overview-map){min-height:244px}
}
@media(min-width:2200px){.shared.corner-only.diagonal .spacefaring{min-width:260px}}
</style>
