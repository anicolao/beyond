<script lang="ts">
  import { base } from '$app/paths';
  import CardSymbol from './CardSymbol.svelte';
  import type { CardDefinition, CardPresentation } from './types';
  let { card, presentation = {} }: { card: CardDefinition; presentation?: CardPresentation } = $props();
</script>
<article class="card-face" data-family={card.family} aria-label={`${card.family}: ${card.title}`}>
  <div class="face-inner">
    <header><span class="card-family">{card.family}</span><span class="level" aria-label={`${card.family === 'Technology' || card.family === 'Event' ? 'Level ' : ''}${card.badge}`}>{card.badge}</span><h2>{card.title}</h2><p>{card.subtitle}</p></header>
    <div class="illustration"><img src={`${base}/art/cards/${card.art}.png`} alt="" /><span class="art-seal" aria-hidden="true"><CardSymbol kind={card.family === 'System' ? 'food' : card.family === 'Achievement' ? 'star' : 'research'} /></span></div>
    <div class="card-rules">
      {#each card.sections as section}
        <section><div class="rule-heading">{#if section.symbol}<CardSymbol kind={section.symbol}/>{/if}<h3>{section.label}</h3></div>{#if section.cost}<p class="cost"><span>Cost</span> {section.cost}</p>{/if}<p>{section.text}</p></section>
      {/each}
    </div>
    {#if card.rewards}
      <ol class="reward-slots" aria-label="Achievement rewards, in claim order">
        {#each card.rewards as reward, i}
          {@const unavailable = i === 1 && card.secondSlotFourPlayersOnly && (presentation.players ?? 4) < 4}
          <li class:claimed={!!presentation.claimants?.[i]} class:unavailable><span class="reward-disc" aria-hidden="true">{presentation.claimants?.[i] ? 'A' : unavailable ? '×' : reward}</span><span>{presentation.claimants?.[i] ? `${presentation.claimants[i]} · ${reward} VP` : unavailable ? '4 players only' : `${reward} VP`}</span></li>
        {/each}
      </ol>
    {/if}
    {#if presentation.researchers?.length}<div class="researchers"><span>Researched</span>{#each presentation.researchers as name, i}<span class="researcher"><i class:gold={i === 1}></i>{name}</span>{/each}</div>{/if}
    {#if presentation.actionOccupant}<p class="occupied"><span class="pawn" aria-hidden="true"></span>Action occupied · {presentation.actionOccupant}</p>{/if}
    {#if presentation.colonyOwner}<p class="colony"><span class="production-disc" aria-hidden="true">❧</span><span class="production-disc" aria-hidden="true">❧</span><span>Colony · {presentation.colonyOwner}</span></p>{/if}
    {#if card.points !== undefined}<div class="scoring"><CardSymbol kind="star"/><span>{card.points} VP</span><span>{card.family === 'System' ? 'when colonized' : card.family === 'Event' ? 'when retained' : 'when researched'}</span></div>{/if}
  </div>
</article>
<style>
.card-face { container-type: inline-size; width: 100%; color: #26312f; padding: 5px; border: 1px solid #dab87c; border-radius: 13px; background: linear-gradient(135deg,#f4ddb0,#8c6737 45%,#e4c48b 70%,#674b2b); box-shadow: 0 3px #605039,0 6px #1b2427,8px 15px 25px #0008; text-align: left; }
.face-inner { overflow: hidden; border-radius: 8px; border: 1px solid #807150; background: repeating-linear-gradient(0deg,#ffffff08 0 1px,transparent 1px 4px),linear-gradient(125deg,#fff7e2,#e8d8b8); min-height: 100%; }
header { position: relative; padding: 4cqw 5cqw 3.5cqw; }
.card-family { text-transform: uppercase; font-size: 2.8cqw; letter-spacing: .22em; color: #655331; }
h2 { font: 600 8cqw/.98 'Cormorant Garamond',serif; margin: 2cqw 10cqw 1.5cqw 0; overflow-wrap: anywhere; }
header p { font-size: 3.5cqw; margin: 0; color: #586057; }
.level { position: absolute; top: 5cqw; right: 4cqw; font: 600 7cqw 'Cormorant Garamond',serif; color: #faedcf; background: linear-gradient(140deg,#4c5752,#202d30); border: 1px solid #a78a4e; border-radius: 4px; min-width: 10cqw; padding: 1cqw; text-align: center; }
.illustration { position: relative; margin: 0 2cqw; height: 44cqw; border: 1px solid #9d895d; }
.illustration img { width: 100%; height: 100%; object-fit: cover; display: block; }
.art-seal { display: flex; align-items:center; justify-content:center; position:absolute; bottom: -5cqw; left: 3cqw; width: 13cqw; height: 13cqw; font-size: 4cqw; border-radius: 50%; border: 2px solid #c8ad76; color: #f2e3bb; background: linear-gradient(140deg,#3d5352,#152d32); box-shadow: 0 2px 4px #0008; }
.card-rules { padding: 5cqw 5cqw 0; }
section { padding: 3cqw 0; border-bottom: 1px solid #a18d6599; }
.rule-heading { display: flex; gap: 2cqw; align-items:center; font-size: 3cqw; color: #4b665c; }
h3 { font: 700 3cqw 'Atkinson Hyperlegible',sans-serif; letter-spacing:.14em; text-transform:uppercase; margin: 0; }
section p { font-size: 4.2cqw; line-height: 1.35; margin: 1.8cqw 0 0; }
section .cost { font-size: 3.8cqw; font-weight:700; padding: 1.4cqw 2cqw; background: #d6c49f88; border:1px solid #ab956833; border-radius:3px; }
.cost span { font-weight:400; margin-right:1cqw; }
.scoring { display: flex; gap: 2cqw; align-items: center; padding: 3.2cqw 5cqw; font-size: 3.7cqw; }
.scoring > :last-child { margin-left: auto; color: #5d624f; font-size:3.2cqw; }
.reward-slots { display: flex; justify-content: space-evenly; list-style: none; padding: 4cqw 2cqw; gap: 2cqw; margin:0; }
.reward-slots li { display: flex; flex: 1; align-items:center; flex-direction:column; gap:1.5cqw; font-size:3cqw; text-align:center; }
.reward-disc { width: 12cqw; height:12cqw; border: 1px solid #96805a; border-radius:50%; background:radial-gradient(circle at 40% 30%,#ddcca6,#b7a27e); box-shadow:inset 1px 2px 4px #493e3388,0 1px #fff6dc; display:flex; align-items:center; justify-content:center; font:600 6cqw 'Cormorant Garamond',serif; }
.claimed .reward-disc, .production-disc { color:#f2edcc; background:linear-gradient(135deg,#4bb7b0,#156165); box-shadow:inset 0 0 0 3px #47b0a688,0 3px #134348,0 5px 6px #0004; }
.unavailable { color:#68665d; }
.researchers { display:flex; gap:3cqw; align-items:center; padding:3cqw 5cqw 1cqw; font-size:3.3cqw; }
.researcher { display:flex; align-items:center; gap:1.5cqw; }
i { display:block; width:4cqw; height:4cqw; background:linear-gradient(135deg,#76d5c7,#167a7b); box-shadow:1px 2px #14535c; border:1px solid #3c9f99; }
i.gold { background:linear-gradient(135deg,#f5d680,#b8852b); border-color:#b18b38; box-shadow:1px 2px #8c672f; }
.occupied, .colony { display:flex; gap:2cqw; align-items:center; padding:2cqw 5cqw; margin:0; font-size:3.5cqw; }
.pawn { width:4cqw; height:7cqw; background:#217b7b; border:1px solid #205959; clip-path:polygon(25% 0,75% 0,100% 25%,100% 100%,0 100%,0 25%); }
.production-disc { display:inline-flex; align-items:center; justify-content:center; border-radius:50%; width:7cqw; height:7cqw; }
</style>
