<script lang="ts">
  import { tick } from 'svelte';
  import FactionChoice from './game/FactionChoice.svelte';
  import GameSurface from './game/GameSurface.svelte';
  import { setupVersion, seatAngles } from './game/manifest';
  import {projectGame} from './game/turn';
  import { startingSetup } from './game/setup';
  import EntryDisc from './EntryDisc.svelte';
  import InstrumentIcon from './InstrumentIcon.svelte';
  import { positions, clockwise, type Position, type Table, type Command } from './table';
  let { table, busy, commit, home, id }: { table: Table; busy: boolean; commit: (command: Command) => Promise<void>; home: () => void; id: string } = $props();
  let editing = $state<Position | ''>(''), name = $state(''), preview = $state('');
  const order = $derived(clockwise(table));
  const settings = $derived(table.settings ?? {factions:'basic' as const,achievements:'introductory' as const});
  const game = $derived(table.start ? projectGame(startingSetup(table.start,order.map(p=>({position:p,name:table.seats[p]!,faction:table.factions![p]!})),settings),table.play):undefined);
  const canBegin = $derived(order.length>=2 && settings.factions==='basic' && order.every(p=>table.factions?.[p]));
  let setupOpen=$state(false), recoveryDialog=$state<HTMLDialogElement>(undefined!);
  let recoveryOrigin:HTMLElement|null=null;
  async function openGameRecovery(){recoveryOrigin=document.activeElement as HTMLElement;await tick();recoveryDialog.showModal();}
  function trapRecovery(e:KeyboardEvent){if(e.key!=='Tab')return;const controls=[...recoveryDialog.querySelectorAll<HTMLElement>('button:not([disabled]),input,a[href]')];if(e.shiftKey&&document.activeElement===controls[0]){e.preventDefault();controls.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===controls.at(-1)){e.preventDefault();controls[0]?.focus();}}
  const label = (position: string) => position.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
  const deploymentRoot = '/beyond';
  async function join(position: Position) {
    await commit({ type: table.seats[position] ? 'seat-renamed' : 'seat-joined', position, name: name.trim() });
    editing = ''; name = '';
  }
</script>
{#if game}<GameSurface {game} mode="tabletop" {home} {busy} commitMove={move=>commit({type:'game-move',position:game!.activePosition as Position,name:'',move})} recovery={()=>{void openGameRecovery();}}/>{:else}
<section class="table-surface" aria-label="Shared table">
  <div class="table-center">
    <div class="gathering-crest"><InstrumentIcon kind="compass" /></div>
    <p class="eyebrow">BEYOND THE SUN</p>
    <h1>Take your places</h1>
    <p>Join where you sit. Everything stays on this display.</p>
    <p class="seat-count">{order.length} of 4 players seated</p>
    {#if order.length}<ol aria-label="Clockwise turn order">{#each order as p}<li>{table.seats[p]}{table.firstPlayer === p ? ' · Player 1' : ''}</li>{/each}</ol>{/if}
    <button class="setup-control" aria-expanded={setupOpen} onclick={()=>setupOpen=!setupOpen}>Expedition setup</button>
    {#if setupOpen}<div class="table-configuration"><label>Factions<select value={settings.factions} disabled={busy} onchange={e=>{void commit({type:'table-settings-changed',position:'',name:'',settings:{...settings,factions:e.currentTarget.value as 'basic'|'advanced'}});}}><option value="basic">Basic</option><option value="advanced">Advanced</option></select></label><label>Achievements<select value={settings.achievements} disabled={busy} onchange={e=>{void commit({type:'table-settings-changed',position:'',name:'',settings:{...settings,achievements:e.currentTarget.value as 'introductory'|'randomized'}});}}><option value="introductory">Introductory</option><option value="randomized">Randomized</option></select></label></div>{/if}
    {#if settings.factions==='advanced'}<p class="setup-limit">Advanced setup arrives in its dedicated increment. Choose Basic to begin.</p>{/if}
    <button class="primary" disabled={busy||!canBegin} onclick={()=>{void commit({type:'game-begun',position:'',name:'',start:{version:setupVersion,seed:crypto.randomUUID()}});}}>Begin</button>
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
    <section class="physical-seat" class:occupied={!!table.seats[p]} class:editing={editing === p} class:unavailable={!table.seats[p] && order.length >= 4} style={`--seat-index:${index}`} data-position={p} aria-label={`${label(p)} seat`}>
      <p class="seat-direction">{label(p)}</p>
      {#if editing === p}
        <form onsubmit={(event) => { event.preventDefault(); void join(p).catch(() => undefined); }}>
          <label>{table.seats[p] ? 'Player name' : 'Your name'}<input aria-label={`${label(p)} player name`} bind:value={name} maxlength="24" autocomplete="off" required /></label>
          {#if settings.factions==='basic'}<FactionChoice angle={seatAngles[p]} name={table.seats[p]??`${label(p)} seat`} count={Math.max(2,order.length) as 2|3|4} selected={table.factions?.[p]} taken={Object.values(table.factions??{})} {busy} disabled={!table.seats[p]||order.length<2} choose={id=>commit({type:'table-faction-selected',position:p,name:'',faction:id})}/>{/if}
        <div class="seat-actions"><button class="primary" disabled={busy || !name.trim()}>{table.seats[p] ? 'Keep name' : 'Join table'}</button><button onclick={() => { editing = ''; name = ''; }} type="button" disabled={busy}>Cancel</button></div>
        </form>
      {:else if table.seats[p]}
        <span class="seat-seal" aria-hidden="true">{table.seats[p]?.slice(0,1).toUpperCase()}</span>
        <h2>{table.seats[p]}</h2><p class="player-order">Player {order.indexOf(p) + 1}</p>
        {#if settings.factions==='basic'}<FactionChoice angle={seatAngles[p]} name={table.seats[p]!} count={Math.max(2,order.length) as 2|3|4} selected={table.factions?.[p]} taken={Object.values(table.factions??{})} {busy} disabled={order.length<2} choose={id=>commit({type:'table-faction-selected',position:p,name:'',faction:id})}/>{/if}
        <div class="seat-actions">
          <button aria-label={`Edit ${table.seats[p]}`} disabled={busy} onclick={() => { name = table.seats[p] ?? ''; editing = p; }}>Edit</button>
          <button aria-label={`${table.seats[p]} leaves table`} disabled={busy} onclick={() => { void commit({ type: 'seat-left', position: p, name: '' }).catch(() => undefined); }}>Leave</button>
          {#if table.firstPlayer !== p}<button aria-label={`Make ${table.seats[p]} Player 1`} disabled={busy} onclick={() => { void commit({ type: 'first-player-chosen', position: p, name: '' }).catch(() => undefined); }}>Player 1</button>{/if}
        </div>
      {:else}
        <EntryDisc compact label={order.length >= 4 ? 'Table full' : 'Join here'} accessibleName={`Join at ${label(p)}`} disabled={busy || order.length >= 4} onclick={() => { editing = p; name = ''; }} />
        <p class="seat-hint">{order.length >= 4 ? 'Four players seated' : 'Choose this position'}</p>
      {/if}
    </section>
  {/each}
</section>

{/if}
{#if game}<dialog bind:this={recoveryDialog} aria-label="Table recovery" onkeydown={trapRecovery} onclose={()=>recoveryOrigin?.focus()}><div data-e2e-layout class="table-recovery-paper"><header><h2>Same table</h2><button onclick={()=>recoveryDialog.close()}>Close recovery</button></header><p>Switch client versions and retain this starting position.</p><a data-sveltekit-reload href={`${deploymentRoot}/?table=${id}`}>Open in production</a><form data-sveltekit-reload action={`${deploymentRoot}/pr${preview}/`}><input type="hidden" name="table" value={id}/><label>PR number<input type="number" min="1" step="1" bind:value={preview} required/></label><button disabled={!preview||Number(preview)<1}>Open PR preview</button></form></div></dialog>{/if}
<style>
/* The active seat object stays above neighboring diagonal entry plates. */
.physical-seat.editing{z-index:3}
.table-configuration{padding:12px;border:1px solid #a78e52;background:linear-gradient(130deg,#203a3d,#112b31);border-radius:8px;display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:100%;position:absolute;top:72px;z-index:5;box-shadow:0 5px #66522e,5px 12px 30px #000b}.table-configuration label{display:flex;flex-direction:column;gap:7px;font-size:12px;text-align:left;min-width:0}.table-configuration select{min-width:0;width:100%;font-size:12px;min-height:44px;padding:6px}.setup-control{font-size:13px;min-height:44px;padding:7px 14px}.setup-limit{font-size:11px!important}.table-center>.primary{min-height:44px;padding:8px 30px;font-size:15px}.physical-seat:has(:global(.faction-trigger)){gap:7px}.physical-seat :global(.faction-trigger){font-size:12px;min-height:44px}.physical-seat:has(:global(.faction-trigger)) .seat-seal{display:none}
@media(min-width:2200px){.table-configuration{top:140px;padding:24px;gap:20px}.table-configuration label,.table-configuration select{font-size:21px}.table-configuration select{padding:13px}.table-center>.primary,.setup-control{font-size:24px;padding:15px 28px}.physical-seat :global(.faction-trigger){font-size:20px;min-height:52px}.physical-seat:has(:global(.faction-trigger)){gap:13px}.setup-limit{font-size:19px!important}}
dialog{padding:5px;width:500px;max-width:calc(100vw - 28px);max-height:88dvh;overflow:auto;color:#2d3b31;background:#263e3d;border:2px solid #bca165;border-radius:12px}dialog::backdrop{background:#001019cc;backdrop-filter:blur(3px)}.table-recovery-paper{padding:24px;background:linear-gradient(125deg,#fff2d0,#decba0);border:1px solid #aa8e55;border-radius:7px;box-shadow:inset 0 0 0 4px #fff3d255}.table-recovery-paper header{display:flex;gap:15px;align-items:center;justify-content:space-between}.table-recovery-paper h2{font:600 31px 'Cormorant Garamond',serif;margin:0}.table-recovery-paper p{font-size:14px;line-height:1.4}.table-recovery-paper a{display:flex;align-items:center;color:#284e43;min-height:44px;text-underline-offset:4px}.table-recovery-paper form{display:flex;align-items:end;gap:10px;margin-top:14px}.table-recovery-paper label{display:flex;flex-direction:column;gap:7px;font-size:13px;flex:1;min-width:0}.table-recovery-paper input{width:100%;min-width:0}.table-recovery-paper button{min-height:44px;font-size:12px;padding:10px 13px}
</style>
