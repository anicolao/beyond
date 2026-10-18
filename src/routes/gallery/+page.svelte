<script lang="ts">
  import { base } from '$app/paths';
  import { tick } from 'svelte';
  import CardFace from '$lib/cards/CardFace.svelte';
  import { representativeCards, rulebookURL } from '$lib/cards/definitions';
  import { examplePresentation } from '$lib/gallery/fixtures';
  import type { CardDefinition, CardFamily } from '$lib/cards/types';
  let family = $state<CardFamily | 'All'>('All');
  let query = $state('');
  let marked = $state(false);
  let players = $state<2 | 3 | 4>(4);
  let selected = $state<CardDefinition | null>(null);
  let inspector: HTMLDialogElement;
  let origin: HTMLElement | null;
  let inspectionScroll = $state<HTMLDivElement>();
  function changeCard(offset: number) { selected = visible[index + offset]; inspectionScroll?.scrollTo({ top: 0 }); }
  const families = ['All', 'Technology', 'Event', 'System', 'Achievement'] as const;
  const visible = $derived(representativeCards.filter(card => (family === 'All' || card.family === family) && `${card.title} ${card.subtitle} ${card.sections.map(s => s.text).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())));
  const index = $derived(selected ? visible.findIndex(c => c.id === selected?.id) : -1);
  async function inspect(card: CardDefinition) {
    origin = document.activeElement as HTMLElement;
    selected = card;
    await tick();
    inspector.showModal();
  }
  function trapFocus(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const controls = [...inspector.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]')].filter(element => element.checkVisibility());
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  function close() { inspector.close(); origin?.focus(); }
  function reset() { family = 'All'; query = ''; }
</script>
<svelte:head><title>Card gallery — Beyond the Sun</title><meta name="description" content="Inspect the reusable Technology, Event, System and Achievement components of Beyond the Sun." /></svelte:head>
<div class="gallery-shell" data-backend-status="synced">
  <a class="skip-link" href="#collection">Skip to cards</a>
  <header class="gallery-header"><a href={`${base}/`} class="home">← Observatory</a><span>BEYOND THE SUN <span aria-hidden="true">/</span> COMPONENT COLLECTION</span></header>
  <main class="gallery-main" data-e2e-layout>
    <div class="gallery-heading"><div><p class="eyebrow">THE SHAPE OF DISCOVERY</p><h1>Card gallery</h1></div></div>
    <p class="fixture-note"><strong>Visual reference collection.</strong> Six reviewed examples; fictional markers, no live game state. Effects not yet playable.</p>
    <nav class="filters" aria-label="Card family">{#each families as item}<button aria-pressed={family === item} onclick={() => { family = item; }}>{item === 'All' ? 'All cards' : item}</button>{/each}</nav>
    <div class="tools"><label>Search cards<input type="search" placeholder="Name or rules…" bind:value={query}/></label><label for="presentation">Presentation<select id="presentation" bind:value={marked}><option value={false}>Clean faces</option><option value={true}>Example markers</option></select></label><label for="players">Players<select id="players" bind:value={players}><option value={4}>4 players</option><option value={3}>3 players</option><option value={2}>2 players</option></select></label><button class="reset" onclick={reset}>Reset filters</button></div>
    <div class="collection-line"><p role="status" aria-live="polite">{visible.length} of {representativeCards.length} cards</p><span>{marked ? 'Example markers · Ada / Bora' : 'Clean faces'} · Select Inspect for full size</span></div>
    <section id="collection" class="collection" aria-label="Card collection" tabindex="-1">
      {#each visible as card (card.id)}<div class="specimen" id={card.id}>
        <CardFace {card} presentation={marked ? examplePresentation(card, players) : { players }}/>
        <div class="specimen-caption"><span>{card.family}<small>{card.id}</small></span><button aria-haspopup="dialog" aria-label={`Inspect ${card.title}`} onclick={() => inspect(card)}>Inspect <span aria-hidden="true">↗</span></button></div>
      </div>{/each}
      {#if !visible.length}<p class="empty">No cards match. Change your search or reset the filters.</p>{/if}
    </section>
    <aside class="source-note"><h2>From the rulebook to the table</h2><p>Rules and numbers are live text, with labelled symbols and distinct costs. These same card faces accept public presentation state for future board views. Artwork illustrates each family; it carries no rules.</p><a href={rulebookURL} target="_blank" rel="noreferrer">Publisher’s second-printing rules ↗</a></aside>
  </main>
</div>
<dialog bind:this={inspector} onkeydown={trapFocus} aria-label="Card inspection" onclose={() => origin?.focus()}>
  {#if selected}
    <div class="inspection" data-e2e-layout>
      <div class="inspection-nav"><button onclick={close}>Close inspection <span aria-hidden="true">×</span></button><span>{index + 1} / {visible.length}</span></div>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (The labelled scroll region must be reachable by keyboard.) -->
      <div class="inspection-scroll" bind:this={inspectionScroll} tabindex="0" role="region" aria-label="Card face and source details">
      <div class="inspected-card"><CardFace card={selected} presentation={marked ? examplePresentation(selected, players) : { players }}/></div>

      <p class="inspection-context">{marked ? 'Visual fixture · example markers' : 'Visual fixture · clean face'} · Effects not yet playable</p>
      <p class="source"><a href={`${rulebookURL}#page=${selected.source.page + 2}`} target="_blank" rel="noreferrer">Rules source · printed p. {selected.source.page} ↗</a><span>{selected.source.note}</span></p>
      </div>
      <div class="inspector-pagination"><button disabled={index <= 0} onclick={() => changeCard(-1)}>← Previous card</button><button disabled={index >= visible.length - 1} onclick={() => changeCard(1)}>Next card →</button></div>
    </div>
  {/if}
</dialog>
<style>
.gallery-shell { background: radial-gradient(ellipse at 80% 0,#24404688,transparent 55%), repeating-linear-gradient(0deg,#ffffff03 0 1px,transparent 1px 4px),#101e25; min-height:100svh; }
.gallery-header { padding:6px max(24px,calc((100vw - 1260px)/2)); display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #b99c5b66; gap:20px; background:#09171dcc; }
.gallery-header > span { font-size:11px; letter-spacing:.18em; color:#cbbd9a; }
.gallery-header > span > span { padding:0 18px; color:#777856; }
a { color:#e3cc96; text-underline-offset:5px; }
.home { font-size:16px; display:inline-flex; align-items:center; min-height:44px; }
.gallery-main { display:block; height:auto; min-height:0; max-width:1320px; margin:0 auto; padding:18px 30px 60px; }
.gallery-heading { display:flex; align-items:end; justify-content:space-between; gap:24px; }
h1 { font-size:44px; margin:0; }
.gallery-heading > div { display:flex; align-items:baseline; gap:18px; }
.gallery-heading .eyebrow { font-size:10px; }

.fixture-note { color:#bfc8bf; font-size:14px; line-height:1.5; max-width:1050px; margin:10px 0 14px; }
.fixture-note strong { color:#e8dbc0; }
.filters { display:flex; gap:10px; flex-wrap:wrap; padding:10px 0; border-block:1px solid #b99c5b66; }
.filters button { border-radius:30px; min-height:44px; padding:10px 24px; font-size:15px; }
.filters button[aria-pressed='true'] { background:linear-gradient(130deg,#faedce,#dbc28c); color:#25342f; box-shadow:inset 0 0 0 3px #f9f0d299,0 3px #77603d; }
.tools { display:flex; align-items:end; gap:18px; padding:12px 0 0; }
.tools label { display:flex; flex-direction:column; gap:5px; font-size:12px; color:#c9cdbd; }
.tools label:first-child { flex:1; max-width:420px; }
.tools input, .tools select { color:#f0e6cb; background:#0c191e; border:1px solid #8c815c; border-radius:5px; padding:10px 12px; height:46px; min-height:44px; min-width:0; font:inherit; font-size:16px; }
.tools input { width:100%; }
.tools button { min-height:46px; font-size:14px; padding:10px 20px; }
.collection-line { display:flex; justify-content:space-between; align-items:center; gap:20px; margin:10px 0 18px; font-size:13px; color:#b9c5b9; }
.collection-line p { margin:0; color:#eddfbd; }
.collection { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:42px 44px; outline:none; align-items:start; }
.specimen { min-width:0; }
.specimen-caption { display:flex; align-items:center; justify-content:space-between; padding-top:18px; gap:14px; color:#d9caa5; font-size:13px; }
.specimen-caption small { display:block; color:#9caeaa; font-size:11px; margin-top:4px; }
.specimen-caption button { min-height:44px; padding:8px 18px; font-size:14px; }
.specimen-caption button span { margin-left:22px; }
.source-note { border-top:1px solid #a18c5466; margin-top:48px; padding-top:28px; max-width:800px; color:#bcc8bd; font-size:15px; line-height:1.5; }
.source-note h2 { color:#e9dcbb; font-size:32px; }
.empty { grid-column:1/-1; padding:36px 0; }
.skip-link { position:absolute; top:0; left:24px; transform:translateY(-120%); padding:12px; background:#123d43; z-index:10; }
.skip-link:focus { transform:none; }
dialog { width:500px; max-width:calc(100vw - 32px); height: min(900px, calc(100svh - 32px)); max-height:calc(100svh - 32px); margin:auto; padding:0; overflow:hidden; border:2px solid #c5a568; border-radius:12px; color:#ecdfc0; background:linear-gradient(145deg,#2b3f42,#0e2027); box-shadow:0 0 0 5px #161e21,0 20px 80px #000b; overscroll-behavior:contain; }
.inspection { height:100%; display:flex; flex-direction:column; padding:14px; gap:12px; }
.inspection-scroll { overflow:auto; min-height:0; flex:1; padding:6px 8px 12px; overscroll-behavior:contain; scrollbar-color:#9e986e #17292e; scrollbar-gutter:stable; }
dialog::backdrop { background:#020c13de; }
.inspection-nav { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:0; flex-shrink:0; font-size:13px; }
.inspection-nav button { flex:1; display:flex; justify-content:space-between; padding:10px 14px; }
.inspected-card { max-width:420px; margin:auto; }
.inspector-pagination { display:flex; justify-content:space-between; gap:12px; margin:0; flex-shrink:0; }
.inspector-pagination button { font-size:14px; padding:10px 16px; flex:1; }
.inspection-context { font-size:12px; line-height:1.4; color:#c4c9b8; text-align:center; margin:16px 0 12px; }
.source { font-size:12px; line-height:1.4; margin:0; }
.source a, .source-note a { display:inline-flex; align-items:center; min-height:44px; }
.source span { display:block; margin-top:7px; color:#afc1b8; }
@media(min-width:1200px) and (max-width:2199px) {
  .gallery-main { display:grid; grid-template-columns:auto 1fr; column-gap:24px; }
  .gallery-heading { grid-column:1; grid-row:1; }
  .gallery-heading .eyebrow { display:none; }
  .filters { grid-column:2; grid-row:1; justify-content:flex-end; padding:0; border:0; }
  .fixture-note { grid-column:1/-1; grid-row:2; margin:10px 0 0; }
  .tools { grid-column:1/-1; grid-row:3; padding-top:14px; }
  .collection-line { grid-column:1/-1; grid-row:4; }
  .collection { grid-column:1/-1; grid-row:5; }
  .source-note { grid-column:1/-1; grid-row:6; }
}
@media(min-width:2200px) { .gallery-header { padding:30px max(64px,calc((100vw - 2600px)/2)); }.gallery-header > span { font-size:20px; }.home { font-size:26px; }.gallery-main { max-width:2700px; padding:60px 50px 100px; }h1 { font-size:110px; }.eyebrow { font-size:21px; }.fixture-note { font-size:24px; max-width:1900px; margin:32px 0; }.filters { gap:22px; padding:28px 0; }.filters button { font-size:25px; padding:16px 40px; }.tools { gap:30px; padding:32px 0 20px; }.tools label { font-size:22px; gap:12px; }.tools label:first-child { max-width:800px; }.tools input,.tools select,.tools button { font-size:26px; height:66px; }.collection-line { font-size:23px; margin:20px 0 40px; }.collection { gap:70px 80px; }.specimen-caption { font-size:23px; padding-top:28px; }.specimen-caption small { font-size:20px; }.specimen-caption button { font-size:24px; padding:14px 30px; }.source-note { font-size:25px; max-width:1800px; }.source-note h2 { font-size:52px; }dialog { width:1000px; height:min(1750px,calc(100svh - 64px)); max-height:calc(100svh - 64px); }.inspection { padding:26px; gap:22px; }.inspected-card { max-width:850px; }.inspection-nav,.inspection-nav button,.inspector-pagination button { font-size:25px; }.inspection-context,.source { font-size:22px; } }
@media(max-width:650px) { .gallery-header { padding:12px 20px; }.gallery-header > span { max-width:130px; font-size:8px; line-height:1.6; }.gallery-header > span > span { display:none; }.home { font-size:14px; }.gallery-main { padding:26px 24px 40px; }.gallery-heading { display:block; }.gallery-heading > div { display:block; }.gallery-heading .eyebrow { margin-bottom:8px; }h1 { font-size:44px; }.fixture-note { font-size:13px; margin:18px 0; }.filters { gap:10px; padding:16px 0; }.filters button { padding:10px 16px; font-size:14px; }.tools { flex-wrap:wrap; gap:14px; padding-top:18px; }.tools label:first-child { flex-basis:100%; max-width:none; }.tools label { flex:1; }.tools input,.tools select { font-size:14px; }.tools button { flex-basis:100%; }.collection-line { align-items:start; font-size:12px; gap:16px; margin:20px 0 28px; }.collection-line span { max-width:190px; text-align:right; }.collection { grid-template-columns:1fr; gap:32px; }.source-note { font-size:14px; }.source-note h2 { font-size:29px; }dialog { width:calc(100vw - 16px); max-width:calc(100vw - 16px); padding:0; }.inspection { padding:12px; gap:10px; }.inspection-nav { margin:0; }.inspection-scroll { padding:4px 6px 12px; }.inspected-card { max-width:none; }.inspector-pagination { margin:0; gap:10px; }.inspector-pagination button { font-size:12px; padding:8px; }.inspection-context,.source { font-size:11px; }.source span { display:none; } }
</style>
