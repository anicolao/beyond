<script lang="ts">
  import { base } from '$app/paths';
  import CardSymbol from './CardSymbol.svelte';
  import OriginalCardArt from './OriginalCardArt.svelte';
  import type { CardDefinition, CardPresentation, CardSymbolKind } from './types';
  let { card, presentation = {}, compact = false, overview = false }: { card: CardDefinition; presentation?: CardPresentation; compact?: boolean; overview?: boolean } = $props();
  // Decorative resource keys supplement the complete unchanged cost text.
  function costSymbols(cost:string):CardSymbolKind[]{return [...(/\bOre\b/.test(cost)?['ore' as const]:[]),...(/\bPopulation\b/.test(cost)?['population' as const]:[]),...(/(?:\d+|X) Supply\b/.test(cost)?['supply' as const]:[]),...(/military power/.test(cost)?['ship' as const]:[])];}
  const specialty=$derived(card.sections.find(s=>s.label==='Specialty'));
  const colonySymbol=$derived(presentation.colonySpecialty??(specialty?.symbol==='ore'?'ore':'food'));
  const typeSymbol=$derived(card.technology?(card.technology.incoming[0]??card.technology.outgoing[0]):undefined);
</script>
<article class="card-face" class:board-face={compact} class:overview-face={overview} data-family={card.family} aria-label={`${card.family}: ${card.title}`}>
  <div class="face-inner">
    <header><span class="card-family sr-only">{card.family}</span><span class="level" aria-label={`${card.family === 'Technology' || card.family === 'Event' ? 'Level ' : ''}${card.badge}`}>{card.badge}</span><h2>{card.title}</h2></header>
    <div class="illustration" class:unillustrated={card.art===null}>{#if card.art===null}<span class="art-pending">Original illustration pending</span>{:else if card.art === 'astronomy'}<OriginalCardArt id={card.id}/>{:else}<img src={`${base}/art/cards/${card.art}.png`} style:object-position={card.artPosition ?? 'center'} alt="" />{/if}<span class="art-seal" aria-hidden="true"><CardSymbol kind={card.family === 'System' ? (specialty?.secondarySymbol ? 'star' : specialty?.symbol ?? 'food') : card.family === 'Achievement' ? 'star' : typeSymbol==='Military'?'ship':typeSymbol==='Economic'?'food':typeSymbol==='Commercial'?'star':'research'} /></span></div>
    <p class="identity-band">{#if card.technology}<span aria-label={`Incoming types: ${card.technology.incoming.join(', ') || 'none, starting technology'}`}>{card.technology.incoming.join(' / ') || 'Starting'}</span>{#if card.technology.outgoing.length}<span aria-hidden="true"> → </span><span aria-label={`Outgoing types: ${card.technology.outgoing.join(', ')}`}>{card.technology.outgoing.join(' / ')}</span>{/if}{:else}{card.subtitle}{#if card.event?.fixed} · Fixed{/if}{/if}</p>
    <div class="card-rules">
      {#each card.sections as section}
        <section><div class="rule-heading">{#if section.label==='Action'||section.label==='Shared action'}<CardSymbol kind="action"/>{:else if section.label==='Immediate'}<CardSymbol kind="immediate"/>{:else if section.symbol}<CardSymbol kind={section.symbol}/>{/if}{#if section.secondarySymbol}<CardSymbol kind={section.secondarySymbol}/>{/if}<h3>{section.label}</h3>{#if section.spaces}<span class="action-count" aria-label={`${section.spaces} action ${section.spaces===1?'space':'spaces'}`}>{'⬡'.repeat(section.spaces)}</span>{/if}</div>{#if section.cost}<p class="cost"><span class="cost-key"><span class="cost-label sr-only">Cost</span><span class="cost-icons" aria-hidden="true">{#each costSymbols(section.cost) as symbol}<CardSymbol kind={symbol}/>{/each}</span></span> {section.cost}</p>{/if}<p>{section.text}</p></section>
      {/each}
    </div>
    <div class="card-foot">
    {#if card.rewards}
      <ol class="reward-slots" aria-label="Achievement rewards, in claim order">
        {#each card.rewards as reward, i}
          {@const unavailable = i === 1 && card.secondSlotFourPlayersOnly && (presentation.players ?? 4) < 4}
          <li class:claimed={!!presentation.claimants?.[i]} class:unavailable><span class="reward-disc" style={presentation.claimantTones&&presentation.claimants?.[i]?`--claim-tone:${presentation.claimantTones[i]}`:undefined} aria-hidden="true">{presentation.claimants?.[i] ? presentation.claimants[i].trim().charAt(0).toUpperCase() : unavailable ? '×' : reward}</span><span>{presentation.claimants?.[i] ? `${presentation.claimants[i]} · ${reward} VP` : unavailable ? '4 players only' : `${reward} VP`}</span></li>
        {/each}
      </ol>
    {/if}
    {#if presentation.researchers?.length}<div class="researchers"><span>Researched</span>{#each presentation.researchers as name, i}<span class="researcher"><i class:gold={i === 1} style={presentation.researcherTones?`--research-tone:${presentation.researcherTones[i]}`:undefined}></i>{name}</span>{/each}</div>{/if}
    {#if presentation.actionOccupant}<p class="occupied"><span class="pawn" aria-hidden="true"></span>Action occupied · {presentation.actionOccupant}</p>{/if}
    {#if presentation.colonyOwner}<p class="colony"><span class="production-disc" aria-hidden="true"><CardSymbol kind={colonySymbol}/></span><span class="production-disc" aria-hidden="true"><CardSymbol kind={colonySymbol}/></span><span>Colony · {presentation.colonyOwner}</span></p>{/if}
    {#if card.points !== undefined}<div class="scoring"><CardSymbol kind="star"/><span>{card.points} VP</span><span>{card.family === 'System' ? 'when colonized' : card.family === 'Event' ? 'when retained' : card.badge==='IIII'||presentation.personalOwner?'at game end':'when researched'}</span></div>{/if}
    </div>
  </div>
</article>
<style>
/* Physical face dimensions belong to the shared renderer, including inspection.
   Reserve the complete printed face; markers never change the card's die cut. */
.card-face { container-type:inline-size; width:100%; color:#26312f; padding:4px; border:1px solid #c8ac72; border-radius:9px; background:linear-gradient(135deg,#f4ddb0,#8c6737 45%,#e4c48b 70%,#674b2b); box-shadow:0 2px #665037,0 4px #142126,5px 9px 16px #0007; text-align:left; }
.card-face:not(.board-face) { aspect-ratio:2 / 3; }
.card-face:not(.board-face)[data-family=Achievement] { aspect-ratio:10 / 9; }
.card-face:not(.board-face)[data-family=Technology] { aspect-ratio:5 / 8; }
.card-face:not(.board-face)[data-family=Technology] .illustration,.card-face:not(.board-face)[data-family=Event] .illustration { flex:1 1 45cqw; min-height:24cqw; }
.face-inner { height:100%; min-height:0; display:flex; flex-direction:column; border-radius:5px; border:1px solid #95825e; background:repeating-linear-gradient(0deg,#ffffff08 0 1px,transparent 1px 4px),linear-gradient(125deg,#fff7e2,#e8d8b8); }
header { position:relative; flex:none; padding:2.5cqw 3cqw; min-height:12cqw; display:flex; align-items:center; }
.card-family { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
h2 { font:600 6.5cqw/1.05 'Cormorant Garamond',serif; margin:0 12cqw 0 0; overflow-wrap:anywhere; }
.level { position:absolute; top:2.5cqw; right:3cqw; font:600 5.5cqw/1 'Cormorant Garamond',serif; color:#faedcf; background:linear-gradient(140deg,#4c5752,#202d30); border:1px solid #a78a4e; border-radius:3px; min-width:9cqw; padding:1cqw; text-align:center; box-shadow:0 1px 2px #0004; }
.illustration { position:relative; flex:none; margin:0 2cqw; height:45cqw; border:1px solid #9d895d; }
.illustration img { width:100%; height:100%; object-fit:cover; display:block; }
.art-seal { display:flex; align-items:center; justify-content:center; position:absolute; bottom:-5cqw; left:3cqw; width:12cqw; height:12cqw; font-size:4cqw; border-radius:50%; border:2px solid #c8ad76; color:#f2e3bb; background:linear-gradient(140deg,#3d5352,#152d32); box-shadow:0 2px 4px #0008; }
.identity-band { flex:none; font-size:3.2cqw; line-height:1.2; letter-spacing:.07em; margin:0; padding:2cqw 3cqw 2cqw 19cqw; min-height:8cqw; color:#4d5548; border-bottom:1px solid #ac987055; }
.card-rules { flex:none; padding:0 4cqw; }
section { padding:2.4cqw 0; border-bottom:1px solid #a18d6577; }
.rule-heading { display:flex; gap:2cqw; align-items:center; font-size:3.7cqw; color:#263d35; }
h3 { font:700 3.3cqw/1.2 'Atkinson Hyperlegible',sans-serif; letter-spacing:.12em; text-transform:uppercase; margin:0; }
section p { font-size:4.2cqw; line-height:1.3; margin:1.3cqw 0 0; }
.action-count { margin-left:auto; color:#465951; font-size:4cqw; letter-spacing:.1em; }
.unillustrated { background:radial-gradient(ellipse at 50% 40%,#3f5754,#172b30); display:flex; align-items:center; justify-content:center; color:#e6d4a8; }
.art-pending { font-size:3.6cqw; letter-spacing:.04em; text-align:center; padding:3cqw; }
.card-face:not(.board-face)[data-family] .unillustrated { height:24cqw; flex:0 0 24cqw; min-height:24cqw; }
section .cost { font-size:3.8cqw; line-height:1.25; font-weight:700; padding:1.3cqw 2cqw; color:#fff2d4; background:linear-gradient(120deg,#34474a,#1e3339); border:1px solid #a18a58; border-radius:3px; }
.cost-key { display:inline-flex; vertical-align:middle; margin-right:1cqw; }
.cost-label { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
.cost-icons { display:inline-flex; align-items:center; gap:1cqw; color:#f5dca5; font-size:2.6cqw; }
.card-foot { margin-top:auto; padding-top:1cqw; flex:none; }
.scoring { display:flex; gap:2cqw; align-items:center; padding:2cqw 4cqw; font-size:3.7cqw; border-top:1px solid #a18d6555; }
.scoring > :last-child { margin-left:auto; color:#505845; font-size:3cqw; }
.reward-slots { display:flex; justify-content:space-evenly; list-style:none; padding:2cqw 3cqw 3cqw; gap:2cqw; margin:0; }
.reward-slots li { display:flex; flex:1; align-items:center; flex-direction:column; gap:1cqw; font-size:3cqw; text-align:center; }
.reward-disc { width:10cqw; height:10cqw; border:1px solid #96805a; border-radius:50%; background:radial-gradient(circle at 40% 30%,#ddcca6,#b7a27e); box-shadow:inset 1px 2px 4px #493e3388,0 1px #fff6dc; display:flex; align-items:center; justify-content:center; font:600 5cqw 'Cormorant Garamond',serif; }
.claimed .reward-disc, .production-disc { color:#f2edcc; background:linear-gradient(135deg,#4bb7b0,#156165); box-shadow:inset 0 0 0 3px #47b0a688,0 3px #134348,0 5px 6px #0004; }
.claimed .reward-disc[style] { background:linear-gradient(135deg,hsl(var(--claim-tone) 45% 70%),hsl(var(--claim-tone) 45% 35%)); box-shadow:inset 0 0 0 3px hsl(var(--claim-tone) 35% 45% / .4),0 3px hsl(var(--claim-tone) 40% 22%),0 5px 6px #0004; }
.unavailable { color:#56574d; }
.researchers { display:flex; gap:3cqw; align-items:center; padding:2cqw 4cqw; font-size:3.3cqw; }
.researcher { display:flex; align-items:center; gap:1.5cqw; }
i { display:block; width:4cqw; height:4cqw; background:linear-gradient(135deg,#76d5c7,#167a7b); box-shadow:1px 2px #14535c; border:1px solid #3c9f99; }
i.gold { background:linear-gradient(135deg,#f5d680,#b8852b); border-color:#b18b38; box-shadow:1px 2px #8c672f; }
.occupied, .colony { display:flex; gap:2cqw; align-items:center; padding:2cqw 4cqw; margin:0; font-size:3.5cqw; }
.pawn { width:4cqw; height:7cqw; background:#217b7b; border:1px solid #205959; clip-path:polygon(25% 0,75% 0,100% 25%,100% 100%,0 100%,0 25%); }
.production-disc { display:inline-flex; align-items:center; justify-content:center; border-radius:50%; width:7cqw; height:7cqw; }
.card-face:not(.board-face)[data-family=System] { aspect-ratio:5 / 8; }
.card-face:not(.board-face)[data-family=System] .illustration { height:54cqw; }
.card-face:not(.board-face)[data-family=Achievement] header { min-height:11cqw; justify-content:center; }
.card-face:not(.board-face)[data-family=Achievement] h2 { font-size:6cqw; }
.card-face:not(.board-face)[data-family=Achievement] .illustration { height:30cqw; flex:0 1 30cqw; min-height:24cqw; }
.card-face:not(.board-face)[data-family=Achievement] .identity-band { display:none; }
.card-face:not(.board-face)[data-family=Achievement] .art-seal { display:none; }
.card-face:not(.board-face)[data-family=Achievement] section { padding:2cqw 0; }
.card-face:not(.board-face)[data-family=Achievement] .rule-heading { font-size:3cqw; }
.card-face:not(.board-face)[data-family=Achievement] section p { font-size:4cqw; }
.board-face {padding:3px;border-radius:7px;box-shadow:0 2px #645133,0 4px #142226,3px 5px 8px #0007;}
.board-face .identity-band,.board-face .card-foot{display:none;}
.board-face .face-inner{display:grid;grid-template-columns:1fr 34%;grid-template-rows:minmax(0,1fr);height:100%;min-height:0;border-radius:4px;}
.board-face header{padding:1.5cqw 5cqw;min-width:0;min-height:0;display:flex;align-items:center;}
.board-face .card-family{display:none;}
.board-face h2{font-size:8.5cqw;line-height:.94;margin:0;}
.board-face .level{display:none;}
.board-face .illustration{min-height:0;height:100%;margin:0;border:0;border-left:1px solid #a58c58;}
.board-face .art-seal,.board-face .card-rules,.board-face .scoring,.board-face .reward-slots{display:none;}

.board-face .face-inner{display:grid;grid-template-columns:1fr;grid-template-rows:auto minmax(24px,1fr) auto}
.board-face header{padding:3cqw 4cqw;display:block}
.board-face h2{font-size:10cqw;line-height:.96}
.board-face .illustration{height:100%;min-height:24px;margin:0 3cqw;border:1px solid #a58c58}
.board-face .card-rules{display:block;padding:2cqw 4cqw}
.board-face .card-rules section{padding:0;border:0}
.board-face .card-rules section:not(:first-child){display:none}
.board-face .rule-heading{font-size:5cqw;gap:2cqw}.board-face h3{font-size:5cqw;letter-spacing:.05em}
.board-face section p{font-size:6cqw;line-height:1.15;margin:1cqw 0}
.board-face section .cost{font-size:5cqw;padding:1cqw}

.board-face header{min-height:min-content}
.board-face .face-inner{grid-template-rows:minmax(min-content,auto) minmax(24px,1fr) minmax(min-content,auto)}

.board-face header{padding:2cqw 4cqw}
.board-face h2{font-size:max(14px,7cqw);line-height:1}
.board-face .rule-heading{font-size:max(8px,3.5cqw)}.board-face h3{font-size:max(8px,3.5cqw)}
.board-face section p{font-size:max(9px,4cqw);line-height:1.18}
.board-face section .cost{font-size:max(9px,4cqw)}

.overview-face .face-inner{grid-template-rows:minmax(min-content,auto) minmax(16px,1fr)}
.overview-face .card-rules{display:none}.overview-face .illustration{min-height:16px}
.overview-face h2{font-size:14px}.overview-face header{padding:3px 5px}

.overview-face{container-type:size}
@container(max-height:52px) or (max-width:110px){
.overview-face .face-inner{grid-template-rows:1fr}
.overview-face .illustration{display:none}
.overview-face header{display:flex;align-items:center;padding:3px 5px}
}
.researchers{flex-wrap:wrap}.researcher{max-width:100%;overflow-wrap:anywhere}.researcher i[style]{background:linear-gradient(135deg,hsl(var(--research-tone) 45% 70%),hsl(var(--research-tone) 45% 35%));border-color:hsl(var(--research-tone) 35% 45%);box-shadow:1px 2px hsl(var(--research-tone) 40% 25%)}
</style>
