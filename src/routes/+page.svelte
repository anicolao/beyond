<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { backend, commitTable, restoreTable, retainedKey } from '$lib/backend';
  import TableSurface from '$lib/TableSurface.svelte';
  import EntryDisc from '$lib/EntryDisc.svelte';
  import ModeInstrument from '$lib/ModeInstrument.svelte';
  import { remoteRetainedKey, lastGameKey } from '$lib/remote/model';
  import type { Table, Command } from '$lib/table';
  type Screen = 'home' | 'learn' | 'play' | 'table';
  let screen = $state<Screen>('home');
  let status = $state('connecting');
  let error = $state('');
  let table = $state<Table>({ seats: {}, firstPlayer: '', revision: 0 });
  let retained = $state('');
  let retainedRoom = $state('');
  let pending: { command: Command; id: string; revision: number } | undefined;
  let busy = $state(false);
  let heading = $state<HTMLHeadingElement>();
  function show(next: Screen) { screen = next; error = ''; queueMicrotask(() => heading?.focus()); }
  async function recover(id: string) {
    busy = true; status = 'reconnecting'; error = '';
    try { table = await restoreTable(id); retained = id; retainedRoom = ''; localStorage.setItem(retainedKey, id); localStorage.setItem(lastGameKey, JSON.stringify({ mode: 'tabletop', id })); screen = 'table'; history.replaceState(null, '', `${base}/?table=${id}`); status = 'synced'; }
    catch (cause) { error = cause instanceof Error && cause.message.includes('incompatible') ? cause.message : 'We could not reopen your table. Check your connection and try again.'; status = 'offline'; }
    finally { busy = false; }
  }
  onMount(() => {
    backend().ready.then(async () => {
      status = 'synced';
      const lastGame = JSON.parse(localStorage.getItem(lastGameKey) ?? 'null');
      if (lastGame?.mode === 'remote') retainedRoom = localStorage.getItem(remoteRetainedKey) ?? '';
      retained = localStorage.getItem(retainedKey) ?? localStorage.getItem('beyond-table-pr2') ?? '';
      const id = new URL(location.href).searchParams.get('table');
      if (id) await recover(id);
    }).catch(() => { status = 'offline'; error = 'We could not connect. Please try again.'; });
  });
  async function create() {
    if (busy) return;
    busy = true; error = ''; status = 'saving';
    retained = crypto.randomUUID();
    pending = { command: { type: 'table-created', position: '', name: '' }, id: crypto.randomUUID(), revision: -1 };
    await sendPending();
  }
  async function sendPending() {
    if (!pending) return;
    busy = true; error = ''; status = 'saving';
    try {
      table = await commitTable(retained, pending.command, pending.revision, pending.id);
      localStorage.setItem(retainedKey, retained);
      localStorage.setItem(lastGameKey, JSON.stringify({ mode: 'tabletop', id: retained })); retainedRoom = '';
      history.replaceState(null, '', `${base}/?table=${retained}`);
      pending = undefined; screen = 'table'; status = 'synced';
    } catch (cause) { error = cause instanceof Error ? cause.message : 'Your change could not be saved. Retry or reopen the table.'; status = 'offline'; throw cause; }
    finally { busy = false; }
  }
  async function commit(command: Command) {
    if (busy) return;
    pending = { command, id: crypto.randomUUID(), revision: table.revision };
    await sendPending();
  }
</script>

<svelte:head><title>Beyond the Sun</title><meta name="description" content="Gather at an orbital table and build humanity's future among the stars." /></svelte:head>

<main data-screen={screen} class:at-table={screen === 'table'} data-e2e-layout data-backend-status={status} data-room-state={screen === 'table' ? table.start?'started':'gathering' : 'none'}>
  <img class="environment" src={`${base}/art/observatory.png`} alt="" />
  <div class="shade"></div>
  {#if screen === 'table'}
    <TableSurface {table} {busy} {commit} id={retained} home={() => { history.replaceState(null, '', `${base}/`); show('home'); }} />
  {:else}
  <div class="content" class:arrival={screen === 'home'} class:choosing-mode={screen === 'play'}>
    {#if screen === 'home'}
      <div class="arrival-copy">
      <p class="eyebrow">HUMANITY'S NEXT CHAPTER</p>
      <h1 bind:this={heading} tabindex="-1" class="wordmark">BEYOND<span>THE</span>SUN</h1>
      <p class="intro">One shared future.<br />A universe of possibilities.</p>
      </div>
      <nav class="arrival-actions" aria-label="Enter the observatory">
        <EntryDisc label="Play" disabled={status !== 'synced'} onclick={() => show('play')} />
        <EntryDisc label="Learn" icon="book" tone="gold" onclick={() => show('learn')} />
        {#if retained || retainedRoom}<EntryDisc label="Continue" icon="return" tone="violet" disabled={busy} onclick={() => { if (retainedRoom) location.assign(`${base}/remote/?room=${retainedRoom}`); else void recover(retained); }} />{/if}
      </nav>
    {:else if screen === 'learn'}
      <p class="eyebrow">HUMANITY'S NEXT CHAPTER</p>
      <h1 bind:this={heading} tabindex="-1">A future beyond Earth</h1>
      <p class="intro">Shape humanity's discoveries.<br />Build the faction that leads the way.</p>
      <section class="phases" aria-label="The three phases of a turn">
        <article><span class="phase-number">01</span><h2>Action</h2><p>Move your pawn to an open action. Research, develop your economy, or send your fleet among the stars.</p></article>
        <article><span class="phase-number">02</span><h2>Production</h2><p>Grow Population, produce Ore, or trade resources. Choose the resources your next turn needs.</p></article>
        <article><span class="phase-number">03</span><h2>Achievement</h2><p>Claim one achievement if you qualify. The shared race starts the countdown to the final round.</p></article>
      </section>
      <p class="note">Discoveries are shared. Each faction researches them to use their actions.</p>
      <button class="secondary" onclick={() => show('home')}>Back to observatory</button>
    {:else if screen === 'play'}
      <div class="mode-heading"><p class="eyebrow">A PLACE AMONG THE STARS</p><h1 bind:this={heading} tabindex="-1">Gather your players</h1><p class="intro">One shared display, or friends across the stars.</p></div>
      <nav class="mode-instruments" aria-label="Choose how to play">
        <ModeInstrument label="Shared table" detail="2–4 players · One shared display" accessibleName="Shared table · 2–4 players · One shared display" icon="table" tone="gold" onclick={() => { void create().catch(() => undefined); }} disabled={busy}/>
        <ModeInstrument label="Create remote room" detail="Host friends on their own screens" accessibleName="Create a remote room" icon="orbit" tone="teal" href={`${base}/remote/?create`}/>
        <ModeInstrument label="Join by code" detail="Enter a remote room’s invitation" icon="return" tone="violet" href={`${base}/remote/?code`}/>
      </nav>
      <button class="secondary mode-back" onclick={() => show('home')}>Back to observatory</button>
    {/if}
  </div>
  {/if}
    {#if error}<div class="error" role="alert"><p>{error}</p><button onclick={() => { if (!pending && !retained) location.reload(); else void (pending ? sendPending() : recover(retained)).catch(() => undefined); }}>Retry change</button><button onclick={() => { pending = undefined; void recover(retained); }}>Reopen table</button></div>{/if}
  <footer><span class:connected={status === 'synced'} class="connection" aria-live="polite">{status === 'synced' ? 'Connected' : busy ? 'Saving your place…' : status === 'offline' ? 'Connection interrupted' : 'Connecting…'}</span>{#if screen === 'home'}<a class="gallery-entry" href={`${base}/gallery/`}>Card gallery ↗</a>{/if}<span class="footer-title">BEYOND THE SUN</span></footer>
</main>

<style>
.content.choosing-mode { position:absolute; inset:0; width:100%; height:100%; display:block; }
.mode-heading { position:absolute; top:13%; left:50%; transform:translateX(-50%); width:90%; text-align:center; display:flex; align-items:center; flex-direction:column; gap:14px; }
.mode-heading h1 { font-size:clamp(40px,4vw,64px); }.mode-heading .intro { font-size:17px; }
.mode-instruments { position:absolute; bottom:20%; left:8%; right:8%; display:flex; align-items:center; justify-content:center; gap:clamp(30px,4vw,100px); isolation:isolate; }
.mode-instruments:before { content:''; pointer-events:none; position:absolute; z-index:-1; inset:-25% -5% -32%; border:1px solid #c4a36966; border-radius:50%; background:radial-gradient(ellipse,#8c6e3022,transparent 70%); box-shadow:0 0 0 7px #b69a4b09,inset 0 0 0 13px #826b3a0d; }
.mode-back { position:absolute; left:50%; bottom:6.5%; transform:translateX(-50%); min-height:44px; padding:10px 20px; }
@media(min-width:2200px) { .mode-heading { gap:30px; }.mode-heading h1 { font-size:110px; }.mode-heading .intro { font-size:31px; }.mode-back { font-size:27px; min-height:65px; } }
@media(max-width:700px) { .mode-heading { top:7%; gap:11px; }.mode-heading .eyebrow { font-size:9px; }.mode-heading h1 { font-size:35px; }.mode-heading .intro { font-size:13px; max-width:250px; }.mode-instruments { bottom:15%; flex-direction:column; gap:20px; left:12%; right:12%; }.mode-instruments:before { inset:-3% -6% -7%; }.mode-back { bottom:5.7%; font-size:12px; padding:8px 16px; } }
.gallery-entry { color:#e3cc96; display:inline-flex; align-items:center; min-height:44px; font-size:13px; text-underline-offset:4px; }
@media(min-width:2200px) { .gallery-entry { font-size:22px; min-height:58px; } }
@media(max-width:650px) { .gallery-entry { font-size:12px; } }
</style>
