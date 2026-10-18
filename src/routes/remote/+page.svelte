<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { base } from '$app/paths';
  import { replaceState } from '$app/navigation';
  import { backend } from '$lib/backend';
  import { createRemote, findRemote, readRemote, watchRemote, sendRemote, retainRemote, type RemoteIntent } from '$lib/remote/backend';
  import { defaultSettings, remotePositions, remoteRetainedKey, lastGameKey, type RemoteRoom, type RemoteSettings, type RemotePosition } from '$lib/remote/model';
  import InviteQr from '$lib/remote/InviteQr.svelte';
  let screen = $state<'choose' | 'create' | 'join' | 'room'>('choose');
  let room = $state<RemoteRoom>();
  let roomId = $state(''), uid = $state(''), status = $state('connecting'), busy = $state(false), error = $state('');
  let hostName = $state(''), joinName = $state(''), inviteCode = $state('');
  let settings = $state<RemoteSettings>({ ...defaultSettings });
  let selectedSeat = $state<RemotePosition | ''>(''), editingName = $state(false), changedName = $state('');
  let copyFallback = $state(false), copied = $state(false), prNumber = $state('');
  let recoveryDialog = $state<HTMLDialogElement>(undefined!);
  let recoveryOrigin: HTMLElement | null;
  async function openRecovery() { recoveryOrigin=document.activeElement as HTMLElement; await tick(); recoveryDialog.showModal(); }
  let nameDialog = $state<HTMLDialogElement>(undefined!);
  let nameOrigin: HTMLElement | null;
  async function openName(position: RemotePosition, rename = false) {
    nameOrigin = document.activeElement as HTMLElement; selectedSeat = position; editingName = rename;
    changedName = room?.seats[position]?.name ?? ''; joinName = '';
    await tick(); nameDialog.showModal();
  }
  function closeName() { nameDialog.close(); selectedSeat = ''; editingName = false; nameOrigin?.focus(); }
  let setupDialog = $state<HTMLDialogElement>(undefined!);
  let qrDialog = $state<HTMLDialogElement>(undefined!);
  let qrOrigin: HTMLElement | null;
  async function openQr() { qrOrigin = document.activeElement as HTMLElement; await tick(); qrDialog.showModal(); }
  let setupOrigin: HTMLElement | null;
  let unsubscribe: (() => void) | undefined;
  let pending: { intent: RemoteIntent; version: number; id: string } | undefined;
  const ownPosition = $derived(room?.members[uid]);
  const ownSeat = $derived(ownPosition ? room?.seats[ownPosition] : undefined);
  const host = $derived(room?.ownerUid === uid);
  const occupants = $derived(Object.values(room?.seats ?? {}));
  const readyCount = $derived(occupants.filter(seat => seat?.ready).length);
  const complete = $derived(!!room && occupants.length === room.settings.capacity && readyCount === occupants.length);
  const full = $derived(!!room && occupants.length === room.settings.capacity);
  const invitation = $derived(typeof location === 'undefined' || !room ? '' : `${location.origin}${base}/remote/?join=${room.code}`);
  function fail(cause: unknown) {
    const code = (cause as { code?: string })?.code;
    const interrupted = code === 'auth/network-request-failed' || code === 'unavailable';
    error = interrupted ? 'Connection interrupted. Your destination and any retained seat are saved. Retry to reconnect.' : cause instanceof Error ? cause.message : String(cause);
    status = interrupted ? 'offline' : 'synced'; busy = false;
  }
  function receive(next: RemoteRoom) { room = next; status = 'synced'; if (next.members[uid]) retainRemote(roomId); }
  async function openRoom(id: string, joined = false) {
    busy = true; error = ''; status = 'reconnecting'; unsubscribe?.();
    try {
      const next = await readRemote(id); roomId = id; receive(next); screen = 'room';
      if (joined || next.members[uid]) { retainRemote(id); replaceState(`${base}/remote/?room=${id}`, {}); }
      unsubscribe = watchRemote(id, receive, message => { error = message; status = 'offline'; });
    } catch (cause) { fail(cause); }
    finally { busy = false; }
  }
  async function find() {
    busy = true; error = ''; status = 'reconnecting';
    try { const code = inviteCode.trim().toUpperCase(); if (!/^[A-Z]{5}$/.test(code)) throw new Error('Enter the five-letter invitation code.'); await openRoom(await findRemote(code)); }
    catch (cause) { fail(cause); }
    finally { busy = false; }
  }
  async function create() {
    busy = true; error = ''; status = 'saving';
    try { const created = await createRemote(hostName, settings); await openRoom(created.id, true); }
    catch (cause) { fail(cause); }
  }
  async function act(intent: RemoteIntent, retry = false) {
    if (!room || busy) return;
    if (!retry) pending = { intent, version: room.configVersion, id: crypto.randomUUID() };
    if (!pending) return;
    busy = true; error = ''; status = 'saving';
    try {
      const next = await sendRemote(roomId, pending.intent, pending.version, pending.id);
      receive(next); pending = undefined; if (nameDialog?.open) closeName(); selectedSeat = ''; editingName = false;
      if (next.members[uid]) replaceState(`${base}/remote/?room=${roomId}`, {});
      else {
        if (localStorage.getItem(remoteRetainedKey) === roomId) localStorage.removeItem(remoteRetainedKey);
        const retained = JSON.parse(localStorage.getItem(lastGameKey) ?? 'null');
        if (retained?.id === roomId) localStorage.removeItem(lastGameKey);
        replaceState(`${base}/remote/?join=${next.code}`, {});
      }
    } catch (cause) {
      if ((cause as { code?: string }).code !== 'unavailable') pending = undefined;
      fail(cause);
    }
    finally { busy = false; }
  }
  async function copyInvitation() {
    try { await navigator.clipboard.writeText(invitation); copied = true; }
    catch { copyFallback = true; }
  }
  async function editSetup() { setupOrigin = document.activeElement as HTMLElement; await tick(); setupDialog.showModal(); }
  function closeSetup() { setupDialog.close(); setupOrigin?.focus(); }
  function trapSetup(event: KeyboardEvent, dialog = setupDialog) {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]),select:not([disabled]),input:not([disabled]),a[href]')];
    if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus(); }
    if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus(); }
  }
  function updateSetting(field: keyof RemoteSettings, value: string) {
    if (!room) return;
    void act({ type: 'remote-settings-changed', settings: { ...room.settings, [field]: field === 'capacity' ? Number(value) : value } as RemoteSettings });
  }
  function switchPreview(event: SubmitEvent) { event.preventDefault(); if (/^[1-9]\d*$/.test(prNumber)) location.assign(`/beyond/pr${prNumber}/remote/?room=${roomId}`); }
  onMount(() => {
    void backend().ready.then(async user => {
      uid = user.uid; status = 'synced';
      const params = new URL(location.href).searchParams;
      if (params.has('room')) await openRoom(params.get('room')!);
      else if (params.has('join')) { inviteCode = params.get('join')!; screen = 'join'; await find(); }
      else if (params.has('create')) screen = 'create';
      else if (params.has('code')) screen = 'join';
    }).catch(fail);
  });
  onDestroy(() => unsubscribe?.());
</script>
<svelte:head><title>Gather remotely — Beyond the Sun</title><meta name="description" content="Invite remote friends to a shared Beyond the Sun room and confirm its setup together." /></svelte:head>
<main class="remote-screen" class:editing-seat={editingName || !!selectedSeat} class:gathered={screen === 'room' && !!room} data-e2e-layout data-backend-status={status} data-room-state={room ? 'remote-gathering' : 'none'}>
  <div class="gathering-table" aria-hidden="true"><div class="table-inlay"></div></div>
  <img class="environment" src={`${base}/art/observatory.png`} alt=""/><div class="shade"></div>
  <header class="remote-header"><a href={`${base}/`}>← Observatory</a><span class="remote-status" aria-live="polite">{status === 'synced' ? 'Connected' : status === 'saving' ? 'Saving…' : status === 'offline' ? 'Connection interrupted' : 'Connecting…'}</span></header>
  {#if error}<div class="remote-error" role="alert"><p>{error}</p>{#if roomId || status === 'offline'}<button onclick={() => { if (pending) void act(pending.intent, true); else if (roomId) void openRoom(roomId); else location.reload(); }} disabled={busy}>Retry connection</button>{/if}<button onclick={() => { error = ''; screen = 'join'; room = undefined; unsubscribe?.(); }}>Check another code</button></div>{/if}
  {#if screen !== 'room' || !room}
    <section class="remote-entry"><div><p class="eyebrow">A SHARED HORIZON</p><h1>{screen === 'create' ? 'Host a room' : screen === 'join' ? 'Find your room' : 'Gather across the stars'}</h1><p class="entry-note">Each player joins from their own browser.<br/>Your room and place are saved as you gather.</p></div>
      {#if screen === 'choose'}<div class="entry-choices"><button onclick={() => screen = 'create'}>Create a remote room <span aria-hidden="true">→</span></button><button onclick={() => screen = 'join'}>Join by code <span aria-hidden="true">→</span></button></div>
      {:else if screen === 'create'}<form class="ivory create-form" onsubmit={event => { event.preventDefault(); void create(); }}><h2>Your place at the table</h2><label>Your name<input bind:value={hostName} maxlength="24" required autocomplete="nickname"/></label><div class="configuration-fields"><label>Players<select bind:value={settings.capacity}><option value={2}>2 players</option><option value={3}>3 players</option><option value={4}>4 players</option></select></label><label>Factions<select bind:value={settings.factions}><option value="basic">Basic</option><option value="advanced">Advanced</option></select></label><label>Achievements<select bind:value={settings.achievements}><option value="introductory">Introductory</option><option value="randomized">Randomized</option></select></label></div><button class="primary" type="submit" disabled={busy || status !== 'synced' || !hostName.trim()}>Create room</button><p>All players will review these settings before becoming ready.</p></form>
      {:else}<form class="ivory code-form" onsubmit={event => { event.preventDefault(); void find(); }}><h2>An invitation to explore</h2><label>Invitation code<input bind:value={inviteCode} maxlength="5" minlength="5" required pattern={'[A-Za-z]{5}'} autocapitalize="characters" autocomplete="off" spellcheck="false"/></label><p>Enter the five letters shared by your host. You’ll see the room before taking a seat.</p><button type="submit" class="primary" disabled={busy || status !== 'synced' || inviteCode.trim().length !== 5}>Find room</button></form>{/if}
    </section>
  {:else}
    <section class="gathering-heading"><div><p class="eyebrow">BEYOND THE SUN</p><h1>Gather your players</h1></div><p class="room-progress" role="status">{complete ? 'Everyone is ready' : `${readyCount} of ${room.settings.capacity} players ready`}</p></section>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (The roster is a named keyboard-scrollable region.) -->
    <div style:--players={room.settings.capacity} class="remote-roster" aria-label="Remote seats" role="region" tabindex="0">
      {#each remotePositions.slice(0, room.settings.capacity) as position, i}
        {@const seat = room.seats[position]}
        <article class="remote-seat" class:occupied={!!seat} class:own={position === ownPosition} aria-label={`Player ${i + 1}`}>
          <div class="seat-identity"><span class="player-seal" aria-hidden="true">{seat ? seat.name.slice(0,1).toUpperCase() : String(i + 1).padStart(2,'0')}</span><div class="seat-reader"><p class="seat-role">{i === 0 ? 'Host · Player 1' : `Player ${i + 1}`}{position === ownPosition ? ' · You' : ''}</p><h2>{seat?.name ?? 'An open place'}</h2><span class:ready={seat?.ready} class="readiness">{seat ? seat.ready ? '✓ Ready' : 'Not ready' : 'Waiting for a friend'}</span></div></div>
          {#if seat && position === ownPosition}<div class="own-actions"><button onclick={() => { void openName(position, true); }} aria-label="Edit your name">Edit</button>{#if !host}<button onclick={() => { void act({ type:'remote-seat-left', position }); }} disabled={busy} aria-label="Leave seat">Leave</button>{/if}</div>
          {:else if !seat && !ownPosition}<button class="take-seat" onclick={() => { void openName(position); }}>Take seat {i + 1}</button>{/if}
        </article>
      {/each}
    </div>
    <div class="remote-dashboard">
      <section class="invitation-instrument" aria-label="Room invitation"><div class="code-mark"><span>INVITATION CODE</span><strong aria-label="Invitation code">{room.code}</strong><div class="invitation-light"><InviteQr url={invitation}/></div><p>Share with your remote players</p></div><div class="invite-actions"><button onclick={copyInvitation}>{copied ? 'Invitation copied' : 'Copy invitation'}</button><button onclick={() => { void openQr(); }} aria-haspopup="dialog">Show QR invitation</button></div>{#if copyFallback}<a class="copy-link" href={invitation}>{invitation}</a>{/if}<span class="copy-status" aria-live="polite">{copied ? 'Invitation copied to clipboard.' : ''}</span></section>
      <section class="room-setup" aria-label="Room setup"><div class="setup-title"><h2>Expedition setup</h2>{#if host}<button class="small-button" onclick={() => { void editSetup(); }}>Edit setup</button>{:else}<span>Set by the host</span>{/if}</div><dl><div><dt>Players</dt><dd>{room.settings.capacity}</dd></div><div><dt>Factions</dt><dd>{room.settings.factions === 'basic' ? 'Basic' : 'Advanced'}</dd></div><div><dt>Achievements</dt><dd>{room.settings.achievements === 'introductory' ? 'Introductory' : 'Randomized'}</dd></div></dl><p>Setup or seating changes clear everyone’s readiness.</p></section>
    </div>
    <div class="ready-rail">{#if ownSeat}<p>{complete ? 'Your room is saved. Everyone has confirmed this setup.' : occupants.length < room.settings.capacity ? `Waiting for ${room.settings.capacity - occupants.length} more ${room.settings.capacity - occupants.length === 1 ? 'player' : 'players'}. You can confirm this setup now.` : 'Confirm the shared setup when you are ready.'}</p><button class="primary" disabled={busy || editingName} onclick={() => { void act({ type: 'remote-ready-changed', position: ownPosition, ready: !ownSeat?.ready }); }}>{ownSeat.ready ? 'Not ready' : 'Ready'}</button>{:else if full}<p>This room is full. Ask your host for another invitation.</p>{:else}<p>Review the setup, then choose an open seat to join.</p>{/if}</div>
    <button class="remote-recovery" onclick={() => { void openRecovery(); }} aria-haspopup="dialog">Recovery options</button>
  {/if}
</main>
{#if room}<dialog bind:this={recoveryDialog} aria-label="Room recovery" onkeydown={event => trapSetup(event,recoveryDialog)} onclose={() => recoveryOrigin?.focus()}><div class="ivory recovery-view" data-e2e-layout><div class="setup-title"><h2>Same room</h2><button onclick={() => recoveryDialog.close()}>Close recovery</button></div><p>Switch versions and keep your players and setup.</p><a href={`/beyond/remote/?room=${roomId}`}>Open in production</a><form onsubmit={switchPreview}><label>PR number<input bind:value={prNumber} inputmode="numeric" pattern="[1-9][0-9]*"/></label><button disabled={!/^[1-9]\d*$/.test(prNumber)}>Open PR preview</button></form></div></dialog>{/if}
{#if room}<dialog bind:this={nameDialog} aria-label={editingName ? 'Edit your player name' : 'Take an open seat'} onkeydown={event => trapSetup(event, nameDialog)} onclose={() => { selectedSeat=''; editingName=false; nameOrigin?.focus(); }}><form class="ivory name-editor" data-e2e-layout onsubmit={event => { event.preventDefault(); void act({ type:editingName ? 'remote-seat-renamed' : 'remote-seat-claimed', position:selectedSeat as RemotePosition, name:editingName ? changedName : joinName }); }}><p class="eyebrow">YOUR PLACE AT THE TABLE</p><h2>{editingName ? 'A name among the stars' : 'Join the expedition'}</h2>{#if editingName}<label>Your new name<input bind:value={changedName} maxlength="24" required/></label>{:else}<label>Your name<input bind:value={joinName} maxlength="24" autocomplete="nickname" required/></label>{/if}<div class="name-actions"><button class="primary" type="submit" disabled={busy || !(editingName ? changedName.trim() && changedName.trim() !== ownSeat?.name : joinName.trim())}>{editingName ? 'Keep name' : 'Join room'}</button><button type="button" onclick={closeName}>{editingName ? 'Cancel name edit' : 'Cancel joining'}</button></div></form></dialog>{/if}
{#if room}<dialog bind:this={setupDialog} aria-label="Edit room setup" onkeydown={trapSetup} onclose={() => setupOrigin?.focus()}><div class="ivory setup-editor" data-e2e-layout><div class="setup-title"><h2>Our expedition</h2><button onclick={closeSetup}>Close setup</button></div><p>Everyone reviews a changed setup again. Occupied seats cannot be removed.</p><label>Players<select value={room.settings.capacity} disabled={busy} onchange={event => updateSetting('capacity', event.currentTarget.value)}>{#each [2,3,4] as capacity}<option value={capacity} disabled={remotePositions.some((p,i) => i >= capacity && room?.seats[p])}>{capacity} players</option>{/each}</select></label><label>Factions<select value={room.settings.factions} disabled={busy} onchange={event => updateSetting('factions', event.currentTarget.value)}><option value="basic">Basic</option><option value="advanced">Advanced</option></select></label><label>Achievements<select value={room.settings.achievements} disabled={busy} onchange={event => updateSetting('achievements', event.currentTarget.value)}><option value="introductory">Introductory</option><option value="randomized">Randomized</option></select></label><p class="setup-status" aria-live="polite">{busy ? 'Saving setup…' : 'Setup saved · all players review before Ready'}</p></div></dialog>{/if}
{#if room}<dialog bind:this={qrDialog} aria-label="Remote QR invitation" onkeydown={event => trapSetup(event, qrDialog)} onclose={() => qrOrigin?.focus()}><div class="ivory qr-view" data-e2e-layout><button onclick={() => qrDialog.close()}>Close invitation</button><h2>Invite a fellow explorer</h2><InviteQr url={invitation}/><p>Scan to join remote room <strong>{room.code}</strong></p><a href={invitation}>{invitation}</a></div></dialog>{/if}
<style>

.remote-screen { height:100svh; min-height:680px; padding:20px 6vw 16px; display:flex; flex-direction:column; gap:14px; overflow:hidden; }
.remote-screen > .shade { background:linear-gradient(180deg,#03101a55,#06131a88 30%,#03101555); }
.remote-header { position:absolute; inset:12px 5vw auto; height:44px; display:flex; justify-content:space-between; align-items:center; z-index:3; }
.remote-header a { color:#e9d4a3; font-size:13px; min-height:44px; display:inline-flex; align-items:center; text-underline-offset:5px; }
.remote-status { color:#bbd3c9; font-size:11px; }
.gathering-table { pointer-events:none; position:absolute; z-index:-1; left:-13%; width:126%; height:78%; bottom:-9%; border-radius:50%; border:3px solid #b5995d; background:radial-gradient(ellipse at 48% 23%,#41716e22,transparent 44%),repeating-radial-gradient(ellipse at 50% 35%,transparent 0 92px,#c6ae6d23 93px 94px,transparent 95px 134px),radial-gradient(ellipse at 40% 25%,#233436e8,#101d23f8 60%,#0c191fe8); box-shadow:0 -3px 0 #f1d79488,inset 0 5px 3px #fff0b322,inset 0 13px 6px #071419aa,inset 0 0 0 13px #a28b4f55,inset 0 0 0 17px #131c20,0 10px 0 #55462d,0 18px 0 #0b171c,0 25px 45px #000a; }
.table-inlay { position:absolute; inset:8% 14% 11%; border:1px solid #b1965155; border-radius:50%; box-shadow:inset 0 0 0 7px #1d2b2c,inset 0 0 0 8px #b1965133; background:radial-gradient(ellipse at 50% 40%,#60bcb711,transparent 50%); }
.gathering-heading { margin:37px 0 0; text-align:center; z-index:1; }
.gathering-heading .eyebrow { font-size:10px; letter-spacing:.38em; color:#dfc78e; }
.gathering-heading h1 { font-size:34px; margin:5px 0 0; color:#f1e4c3; }
.room-progress { position:static; font-size:11px; color:#d4ceb8; margin:6px 0 0; }
.remote-roster { position:relative; width:min(1080px,95%); align-self:center; display:flex; justify-content:center; align-items:start; gap:clamp(20px,4vw,70px); padding:12px 18px 28px; flex-shrink:0; outline-offset:-3px; }
.remote-seat { flex:1; max-width:240px; min-width:0; min-height:218px; position:relative; padding:20px 16px 14px; border:2px solid #aa8c56; border-radius:24px 24px 10px 10px; background:linear-gradient(110deg,#09171c 0%,#25383a 4%,#101c24 12%,#0a151c 92%,#384143 96%,#101d22); box-shadow:inset 0 0 0 4px #e9c48018,inset 0 2px 2px #fff2cd55,0 4px 0 #6a5736,0 8px 0 #0a1319,8px 16px 20px #000b; transform:perspective(1200px) rotateX(-5deg); }
.remote-seat:first-child { transform:perspective(1200px) rotateX(-5deg) rotate(-4deg); top:12px; }.remote-seat:last-child { transform:perspective(1200px) rotateX(-5deg) rotate(4deg); top:12px; }
.remote-seat:before { content:''; position:absolute; inset:7px; border:1px solid #d8bc6a22; border-radius:17px 17px 5px 5px; pointer-events:none; }
.remote-seat.own { border-color:#c5ab70; box-shadow:inset 0 0 0 4px #f8d69b18,inset 0 2px 2px #fff2cd66,0 4px 0 #856e42,0 8px 0 #0a1319,8px 16px 24px #000c,0 0 24px #50c9b717; }
.seat-identity { display:flex; flex-direction:column; align-items:center; gap:12px; text-align:center; }
.player-seal { width:42px; height:42px; flex-shrink:0; display:flex; align-items:center; justify-content:center; border:1px solid #a48749; border-radius:50%; font:28px 'Cormorant Garamond',serif; color:#e9ca85; background:radial-gradient(circle at 30% 20%,#435550,#0a1c22 75%); box-shadow:0 0 14px #deb15c1a,inset 0 0 0 4px #dec77b0e,0 2px 2px #0009; }
.seat-reader { min-width:0; width:100%; }.seat-role { font-size:9px; color:#bfb795; margin:0 0 4px; letter-spacing:.07em; }.seat-reader h2 { font-size:28px; margin:0; color:#f5ead2; overflow-wrap:anywhere; line-height:1.06; }
.readiness { display:inline-flex; align-items:center; min-height:25px; padding:4px 9px; margin-top:10px; border:1px solid #a7956c66; border-radius:5px; color:#b9bfb0; font-size:11px; background:#05111888; }.readiness.ready { color:#86e5ca; border-color:#51b79999; background:linear-gradient(120deg,#20584f,#102b2d); box-shadow:inset 0 1px #a1edc355,0 0 12px #45c4a522; }
.own-actions { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin-top:9px; }.own-actions button,.take-seat { min-height:44px; padding:8px 12px; font-size:11px; border-color:#bca26855; background:linear-gradient(#293e41,#14242b); }.take-seat { display:block; margin:10px auto 0; }
.remote-dashboard { position:absolute; top:40%; bottom:135px; left:50%; transform:translateX(-50%); min-height:0; width:min(900px,88%); margin:0; display:grid; grid-template-columns:minmax(330px,470px) minmax(260px,320px); align-items:center; gap:50px; padding:0; }
.invitation-instrument { position:relative; padding:22px 28px 24px; text-align:center; color:#f3e8ca; border:3px solid #b69b60; border-radius:26px 26px 17px 17px; background:radial-gradient(ellipse at 50% 40%,#28666a88,transparent 65%),repeating-radial-gradient(ellipse at 50% 32%,transparent 0 41px,#7ed3c315 42px 43px,transparent 44px 60px),linear-gradient(125deg,#203b40,#0b1c24 70%); box-shadow:inset 0 0 0 5px #08191c,inset 0 0 0 7px #5fc5bd99,inset 0 0 26px #5be4d52e,0 4px 0 #d4b77c,0 10px 0 #5b472d,0 15px 0 #171c1c,10px 25px 28px #000a,0 0 38px #3bccc525; transform:perspective(1600px) rotateX(3deg); }
.code-mark > span { font-size:9px; letter-spacing:.3em; color:#d8d5b7; }.code-mark strong { display:block; font-family:'Cormorant Garamond',serif; font-size:56px; color:#f5efd9; letter-spacing:.2em; text-indent:.2em; line-height:1.15; text-shadow:0 0 20px #b1fff37a; }
.invitation-light { display:flex; align-items:center; justify-content:center; margin:12px auto 8px; width:132px; filter:drop-shadow(0 0 12px #6ddcca55); }.invitation-light :global(img) { width:126px; height:126px; border:7px solid #d8eeea; border-radius:6px; }
.code-mark p { font-size:11px; color:#b8c8bb; margin:8px 0 14px; }.invite-actions { display:flex; flex-direction:column; gap:9px; }.invite-actions button { min-height:44px; padding:10px 16px; font-size:14px; background:linear-gradient(120deg,#1c767d,#123c48); border-color:#73c5bd; box-shadow:inset 0 1px #a7f6e988,0 3px #06171d,0 0 12px #42c1bf18; }.invite-actions button + button { background:linear-gradient(#2c3b40,#14232b); border-color:#9caa9d88; }
.copy-status { position:absolute; top:calc(100% + 18px); left:0; right:0; color:#c8e4d6; font-size:11px; }.copy-link { display:block; color:#c3efdc; font-size:11px; overflow-wrap:anywhere; margin-top:12px; }
.room-setup { align-self:center; margin-top:85px; padding:18px 21px 20px; border:2px solid #a68950; border-radius:8px 20px 9px 18px; background:linear-gradient(130deg,#2a3b3c,#111f28 70%); color:#e8dab4; box-shadow:inset 0 0 0 4px #071419,inset 0 0 0 5px #b5944c66,0 4px #887044,0 9px #342c20,5px 18px 23px #000b; transform:rotate(3deg); }
.setup-title { display:flex; align-items:center; justify-content:space-between; gap:8px; }.room-setup .setup-title h2 { font-size:14px; font-family:'Atkinson Hyperlegible',sans-serif; letter-spacing:.1em; text-transform:uppercase; color:#ddc38a; }.setup-title > span { font-size:10px; color:#aaa78c; }.small-button { min-height:44px; font-size:11px; padding:6px 9px; }.room-setup dl { margin:10px 0; }.room-setup dl > div { display:grid; grid-template-columns:85px 1fr; gap:10px; padding:11px 0; border-bottom:1px solid #a98e4c44; }.room-setup dt { font-size:11px; color:#b1b9a8; }.room-setup dd { margin:0; font-size:15px; color:#f0e4c9; }.room-setup > p { font-size:10px; line-height:1.4; color:#b9bea8; margin:12px 0 0; }
.ready-rail { position:absolute; bottom:37px; left:25%; right:25%; display:flex; flex-direction:column-reverse; align-items:center; gap:9px; text-align:center; }.ready-rail p { font-size:11px; color:#c8ceba; margin:0; line-height:1.3; }.ready-rail button { min-width:250px; min-height:48px; font-size:18px; background:linear-gradient(#2c7776,#17494d); border-color:#7ed6c5; box-shadow:inset 0 1px #a5eadd,0 4px #092025,0 6px #8f824b55,0 0 25px #4ba9a22a; }
.remote-recovery { position:absolute; right:22px; bottom:6px; font-size:10px; color:#bec1ad; z-index:4; min-height:44px; padding:6px 10px; background:transparent; box-shadow:none; border:0; text-decoration:underline; text-underline-offset:4px; }
.recovery-view { display:flex; flex-direction:column; gap:18px; padding:24px; box-shadow:none; }.recovery-view a { color:#26352e; display:inline-flex; align-items:center; min-height:44px; text-underline-offset:4px; }.recovery-view form { display:flex; gap:12px; align-items:end; }.recovery-view label { flex:1; }.recovery-view button { min-height:44px; font-size:13px; padding:10px 12px; }

.remote-entry { position:relative; width:min(540px,100%); margin:auto; display:flex; flex-direction:column; align-items:stretch; gap:20px; text-align:center; padding:50px 0 0; }.remote-entry h1 { font-size:42px; margin:8px 0; }.remote-entry .eyebrow { font-size:10px; }.entry-note { color:#ccd0bb; font-size:14px; line-height:1.4; margin:0; }.entry-choices { display:flex; flex-direction:column; gap:14px; }.entry-choices button { min-height:70px; font-size:23px; }
.ivory { background:repeating-linear-gradient(0deg,#ffffff08 0 1px,transparent 1px 4px),linear-gradient(125deg,#fff5db,#e4d1a7); border:2px solid #c6a66b; border-radius:10px; color:#27372e; box-shadow:inset 0 0 0 4px #fff4d588,0 4px #72603c,0 7px #152027,7px 14px 26px #0006; }
.create-form,.code-form,.name-editor { padding:24px; display:flex; flex-direction:column; gap:17px; text-align:left; }.ivory h2 { margin:0; font-size:30px; }.ivory p { line-height:1.4; font-size:13px; margin:0; }.ivory .eyebrow { color:#77613c; }.configuration-fields { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
label { display:flex; flex-direction:column; gap:7px; font-size:13px; }input,select { width:100%; min-width:0; min-height:44px; padding:10px 12px; color:#26352e; background:#fff7e3; border:1px solid #a68d5c; border-radius:5px; font:inherit; font-size:16px; }select { cursor:pointer; }.code-form input { font-size:30px; letter-spacing:.28em; text-transform:uppercase; }.name-actions { display:flex; gap:12px; }.name-actions button { min-height:44px; padding:10px 14px; font-size:14px; flex:1; }
.remote-error { position:absolute; z-index:10; bottom:70px; left:50%; transform:translateX(-50%); width:min(90%,620px); color:#513126; background:#fff0ce; border:2px solid #bf8d51; border-radius:10px; padding:20px; box-shadow:0 14px 50px #000b; }.remote-error p { margin:0 0 16px; line-height:1.4; }.remote-error button { font-size:13px; padding:10px; margin-right:10px; min-height:44px; }
dialog { width:520px; max-width:calc(100vw - 28px); max-height:calc(100svh - 32px); border:2px solid #bda167; border-radius:12px; padding:5px; background:#263d3e; color:#27362e; overflow:auto; }
dialog::backdrop { background:#021019d9; }
.setup-editor { display:flex; flex-direction:column; gap:18px; padding:24px; box-shadow:none; }
.setup-title button { font-size:13px; min-height:44px; padding:9px 12px; }
.qr-view { padding:24px; display:flex; flex-direction:column; align-items:center; gap:20px; }
.qr-view h2 { font-size:30px; }
.qr-view a { color:#26352e; text-decoration:underline; text-decoration-thickness:2px; text-underline-offset:4px; overflow-wrap:anywhere; min-width:0; max-width:100%; word-break:break-word; font-size:13px; line-height:1.5; }
.qr-view a:focus-visible { outline:3px solid #17665d; outline-offset:4px; border-radius:2px; }

@media(min-width:2200px) {
.remote-entry { width:1000px; gap:32px; padding-top:65px; }.remote-entry h1 { font-size:80px; }.remote-entry .eyebrow { font-size:17px; }.entry-note { font-size:25px; }.create-form,.code-form { padding:44px; gap:28px; }.remote-entry .ivory h2 { font-size:54px; }.remote-entry .ivory p { font-size:23px; }.remote-entry label { font-size:24px; gap:12px; }.remote-entry input,.remote-entry select { font-size:28px; min-height:74px; padding:16px 20px; }.remote-entry .configuration-fields { gap:24px; }.remote-entry button { font-size:27px; min-height:74px; padding:16px 26px; }.remote-entry .code-form input { font-size:54px; }
}
@media(max-height:780px) and (min-width:701px) {
.remote-screen { padding-top:12px; gap:6px; }.remote-header { top:5px; }.gathering-heading { margin-top:28px; }.gathering-heading h1 { font-size:27px; }.gathering-heading .eyebrow { font-size:8px; }.remote-roster { gap:45px; padding:8px 12px 16px; }.remote-seat { max-width:210px; min-height:177px; padding:10px 12px 6px; }.seat-identity { gap:5px; }.player-seal { width:26px; height:26px; font-size:21px; }.seat-reader h2 { font-size:22px; }.readiness { margin-top:4px; min-height:20px; }.own-actions { margin-top:4px; }.own-actions button { font-size:10px; padding:6px 9px; }.remote-dashboard { top:45%; bottom:115px; width:min(800px,88%); grid-template-columns:360px 300px; gap:55px; padding:0; }.invitation-instrument { padding:16px 24px; }.code-mark strong { font-size:45px; }.invitation-light { margin:6px auto; }.invitation-light :global(img) { width:88px; height:88px; }.code-mark p { margin:6px 0 10px; }.invite-actions { flex-direction:row; gap:8px; }.invite-actions button { flex:1; padding:8px; font-size:12px; }.room-setup { margin-top:25px; padding:14px 17px; }.room-setup dl > div { padding:8px 0; }.room-setup > p { font-size:9px; }.ready-rail { bottom:30px; }.room-progress { bottom:88px; }.gathering-table { height:79%; bottom:-11%; }
}
@media(max-width:700px) {
.remote-screen { padding:49px 16px 10px; min-height:740px; gap:9px; }.remote-header { inset:4px 18px auto; }.remote-header a { font-size:11px; }.remote-status { font-size:10px; }.gathering-heading { margin:0; display:flex; align-items:center; justify-content:space-between; text-align:left; gap:12px; }.gathering-heading .eyebrow { font-size:7px; letter-spacing:.2em; }.gathering-heading h1 { font-size:26px; margin-top:3px; }.room-progress { position:static; font-size:10px; text-align:right; max-width:90px; }.gathering-table { inset:auto -50% -9%; width:200%; height:85%; border-width:2px; }.table-inlay { inset:6% 10%; }
.remote-roster { width:100%; padding:2px 3px 7px; display:flex; flex-direction:column; justify-content:start; gap:6px; flex-shrink:1; min-height:0; max-height:32svh; overflow:auto; scrollbar-color:#778c76 #112029; }.remote-seat,.remote-seat:first-child,.remote-seat:last-child { flex:none; top:auto; transform:none; max-width:none; width:100%; min-height:60px; padding:7px 11px; border-radius:11px; display:flex; gap:12px; justify-content:space-between; align-items:center; box-shadow:inset 0 0 0 3px #f4d89709,0 3px #73603b,0 5px #0a171e,2px 7px 10px #0008; }.remote-seat:before { inset:4px; border-radius:7px; }.seat-identity { flex-direction:row; text-align:left; gap:11px; min-width:0; flex:1; }.player-seal { width:34px; height:34px; font-size:24px; }.seat-reader { width:auto; flex:1; display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:3px 5px; }.seat-reader .seat-role { grid-column:1/-1; }.seat-reader h2 { grid-column:1; grid-row:2; }.seat-reader .readiness { grid-column:2; grid-row:2; white-space:nowrap; margin:0; }.seat-role { font-size:8px; line-height:1; margin-bottom:2px; letter-spacing:0; }.seat-reader h2 { font-size:20px; line-height:1; }.readiness { min-height:0; padding:0; margin-top:3px; border:0; background:none; font-size:9px; line-height:1.1; }.readiness.ready { padding:2px 6px; background:#18473e; border:1px solid #519e84; }.own-actions { flex-direction:row; flex-wrap:nowrap; margin:0; gap:5px; }.own-actions button,.take-seat { min-height:44px; min-width:44px; max-width:105px; padding:7px 9px; font-size:10px; }.take-seat { margin:0; }.remote-seat.own { border-color:#c5ab70; }
.remote-dashboard { position:static; transform:none; width:100%; flex:none; min-height:0; display:flex; flex-direction:column; gap:12px; padding:0 3px; margin:3px 0; }.invitation-instrument { width:100%; padding:13px 15px 16px; border-width:2px; border-radius:15px; transform:none; }.code-mark { display:grid; grid-template-columns:94px 1fr; grid-template-rows:auto auto auto; column-gap:14px; align-items:center; text-align:center; }.code-mark > span { grid-column:2; font-size:8px; letter-spacing:.18em; align-self:end; }.code-mark strong { grid-column:2; grid-row:2; font-size:41px; letter-spacing:.15em; text-indent:.15em; }.invitation-light { grid-column:1; grid-row:1/4; width:94px; margin:0; }.invitation-light :global(img) { width:94px; height:94px; border-width:5px; }.code-mark p { grid-column:2; font-size:9px; margin:0; align-self:start; }.invite-actions { flex-direction:row; gap:9px; margin-top:10px; }.invite-actions button { flex:1; font-size:11px; min-height:44px; padding:8px; }.copy-status { top:100%; font-size:9px; }.room-setup { width:100%; margin:0; transform:none; padding:10px 13px; border-radius:10px; }.room-setup .setup-title h2 { font-size:10px; letter-spacing:.1em; }.small-button { min-height:44px; padding:5px 8px; font-size:10px; }.room-setup .setup-title { position:relative; padding-right:70px; min-height:24px; }.room-setup .setup-title button { position:absolute; right:0; top:0; transform:translateY(-4px); }.setup-title > span { font-size:9px; }.room-setup dl { display:grid; grid-template-columns:.6fr .8fr 1.3fr; gap:10px; margin:5px 0 0; }.room-setup dl > div { display:block; padding:0; border:0; }.room-setup dt { font-size:9px; }.room-setup dd { font-size:12px; margin-top:3px; }.room-setup > p { font-size:9px; margin:8px 0 0; }.ready-rail { position:static; margin-top:auto; flex-direction:row; text-align:left; gap:12px; padding:0 4px; }.ready-rail p { flex:1; font-size:10px; }.ready-rail button { min-width:110px; min-height:44px; font-size:16px; }.remote-recovery { position:relative; align-self:center; right:auto; bottom:auto; min-height:44px; font-size:10px; margin-top:-4px; }.recovery-view { padding:20px; }.recovery-view form { flex-direction:column; align-items:stretch; }
.remote-entry { padding:5px 3px 20px; gap:16px; }.remote-entry h1 { font-size:33px; }.entry-note { font-size:12px; }.create-form,.code-form { padding:21px; gap:15px; }.ivory h2 { font-size:27px; }.configuration-fields { gap:9px; }label { font-size:11px; }input,select { padding:9px; font-size:14px; }.name-actions { flex-direction:column; }.name-editor { padding:21px; }.setup-editor { padding:20px; }.setup-title button { font-size:12px; }.qr-view { padding:22px; }.qr-view h2 { font-size:28px; }
}
</style>
