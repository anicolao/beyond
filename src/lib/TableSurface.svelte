<script lang="ts">
  import { positions, clockwise, type Position, type Table, type Command } from './table';
  let { table, busy, commit, home, id }: { table: Table; busy: boolean; commit: (command: Command) => Promise<void>; home: () => void; id: string } = $props();
  let editing = $state<Position | ''>(''), name = $state(''), preview = $state('');
  const order = $derived(clockwise(table));
  const label = (position: string) => position.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
  const deploymentRoot = '/beyond';
  async function join(position: Position) {
    await commit({ type: table.seats[position] ? 'seat-renamed' : 'seat-joined', position, name: name.trim() });
    editing = ''; name = '';
  }
</script>
<section class="table-surface" aria-label="Shared table">
  <div class="table-center">
    <p class="eyebrow">BEYOND THE SUN</p>
    <h1>Take your places</h1>
    <p>Join where you sit.<br />Everything stays on this display.</p>
    <p class="seat-count">{order.length} of 4 factions seated</p>
    {#if order.length}<ol aria-label="Clockwise turn order">{#each order as p}<li>{table.seats[p]}{table.firstPlayer === p ? ' · Player 1' : ''}</li>{/each}</ol>{/if}
    <button class="secondary" onclick={home} disabled={busy}>Back to observatory</button>
    <details class="recovery"><summary>Recovery options</summary>
      <p>Keep this table when switching versions.</p>
      <a data-sveltekit-reload href={`${deploymentRoot}/?table=${id}`}>Open in production</a>
      <form data-sveltekit-reload action={`${deploymentRoot}/pr${preview}/`}>
        <input type="hidden" name="table" value={id} />
        <input aria-label="PR number" type="number" min="1" step="1" bind:value={preview} placeholder="PR #" required />
        <button disabled={!preview || Number(preview) < 1}>Open PR preview</button>
      </form>
    </details>
  </div>
  {#each positions as p, index}
    <section class="physical-seat" class:occupied={!!table.seats[p]} style={`--seat-index:${index}`} data-position={p} aria-label={`${label(p)} seat`}>
      <p class="seat-direction">{label(p)}</p>
      {#if editing === p}
        <form onsubmit={(event) => { event.preventDefault(); void join(p).catch(() => undefined); }}>
          <label>{table.seats[p] ? 'Player name' : 'Your name'}<input aria-label={`${label(p)} player name`} bind:value={name} maxlength="24" autocomplete="off" required /></label>
          <div class="seat-actions"><button class="primary" disabled={busy || !name.trim()}>{table.seats[p] ? 'Keep name' : 'Join table'}</button><button onclick={() => { editing = ''; name = ''; }} type="button" disabled={busy}>Cancel</button></div>
        </form>
      {:else if table.seats[p]}
        <h2>{table.seats[p]}</h2><p class="player-order">Player {order.indexOf(p) + 1}</p>
        <div class="seat-actions">
          <button aria-label={`Edit ${table.seats[p]}`} disabled={busy} onclick={() => { name = table.seats[p] ?? ''; editing = p; }}>Edit</button>
          <button aria-label={`${table.seats[p]} leaves table`} disabled={busy} onclick={() => { void commit({ type: 'seat-left', position: p, name: '' }).catch(() => undefined); }}>Leave</button>
          {#if table.firstPlayer !== p}<button aria-label={`Make ${table.seats[p]} Player 1`} disabled={busy} onclick={() => { void commit({ type: 'first-player-chosen', position: p, name: '' }).catch(() => undefined); }}>Player 1</button>{/if}
        </div>
      {:else}
        <button class="join-seat" aria-label={`Join at ${label(p)}`} disabled={busy || order.length >= 4} onclick={() => { editing = p; name = ''; }}>✧<span>Join here</span></button>
      {/if}
    </section>
  {/each}
</section>
