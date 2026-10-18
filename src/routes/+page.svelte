<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { backend, commitTable, restoreTable, retainedKey } from '$lib/backend';
  import TableSurface from '$lib/TableSurface.svelte';
  import type { Table, Command } from '$lib/table';
  type Screen = 'home' | 'learn' | 'play' | 'table';
  let screen = $state<Screen>('home');
  let status = $state('connecting');
  let error = $state('');
  let table = $state<Table>({ seats: {}, firstPlayer: '', revision: 0 });
  let retained = $state('');
  let pending: { command: Command; id: string; revision: number } | undefined;
  let busy = $state(false);
  let heading = $state<HTMLHeadingElement>();
  function show(next: Screen) { screen = next; error = ''; queueMicrotask(() => heading?.focus()); }
  async function recover(id: string) {
    busy = true; status = 'reconnecting'; error = '';
    try { table = await restoreTable(id); retained = id; localStorage.setItem(retainedKey, id); screen = 'table'; history.replaceState(null, '', `${base}/?table=${id}`); status = 'synced'; }
    catch (cause) { error = cause instanceof Error && cause.message.includes('incompatible') ? cause.message : 'We could not reopen your table. Check your connection and try again.'; status = 'offline'; }
    finally { busy = false; }
  }
  onMount(() => {
    backend().ready.then(async () => {
      status = 'synced';
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

<main class:at-table={screen === 'table'} data-e2e-layout data-backend-status={status} data-room-state={screen === 'table' ? 'gathering' : 'none'}>
  <img class="environment" src={`${base}/art/observatory.png`} alt="" />
  <div class="shade"></div>
  {#if screen === 'table'}
    <TableSurface {table} {busy} {commit} id={retained} home={() => { history.replaceState(null, '', `${base}/`); show('home'); }} />
  {:else}
  <div class="content" class:arrival={screen === 'home'}>
    <p class="eyebrow">HUMANITY'S NEXT CHAPTER</p>
    {#if screen === 'home'}
      <h1 bind:this={heading} tabindex="-1" class="wordmark">BEYOND<span>THE</span>SUN</h1>
      <p class="intro">One shared future.<br />A universe of possibilities.</p>
      <nav class="arrival-actions" aria-label="Enter the observatory">
        <button class="primary orbital" onclick={() => show('play')} disabled={status !== 'synced'}><span aria-hidden="true">✧</span> Play</button>
        <button class="orbital gold" onclick={() => show('learn')}><span aria-hidden="true">☷</span> Learn</button>
        {#if retained}<button class="orbital" onclick={() => { void recover(retained); }} disabled={busy}><span aria-hidden="true">↗</span> Continue</button>{/if}
      </nav>
    {:else if screen === 'learn'}
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
      <h1 bind:this={heading} tabindex="-1">Gather your players</h1>
      <p class="intro">Sit together. Reach for the same stars.</p>
      <button class="mode-card" onclick={() => { void create().catch(() => undefined); }} disabled={busy}><span class="mode-icon" aria-hidden="true">✦</span><strong>Shared table</strong><span>2–4 players · One shared display</span><span class="mode-arrow" aria-hidden="true">↗</span></button>
      <button class="secondary" onclick={() => show('home')}>Back to observatory</button>
    {/if}
  </div>
  {/if}
    {#if error}<div class="error" role="alert"><p>{error}</p><button onclick={() => { void (pending ? sendPending() : recover(retained)).catch(() => undefined); }}>Retry change</button><button onclick={() => { pending = undefined; void recover(retained); }}>Reopen table</button></div>{/if}
  <footer><span class:connected={status === 'synced'} class="connection" aria-live="polite">{status === 'synced' ? 'Connected' : busy ? 'Saving your place…' : status === 'offline' ? 'Connection interrupted' : 'Connecting…'}</span><span class="footer-title">BEYOND THE SUN</span></footer>
</main>
