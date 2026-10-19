<script lang="ts">
  import CardFace from '$lib/cards/CardFace.svelte';
  import { cardById } from './cards';
  import { technologySlots } from './manifest';
  import type { PublicSetup } from './setup';
  let {game, inspect}:{game:PublicSetup;inspect:(id:string)=>void}=$props();
</script>
<section class="technology-overview" aria-label="Complete technology overview">
  <div class="overview-levels" aria-hidden="true">{#each ['I','II','III','IIII'] as value}<span>{value}</span>{/each}</div>
  <div class="overview-map">
    <svg viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">{#each technologySlots as slot}{#each slot.prerequisites as prerequisite}{@const from=technologySlots.find(p=>p.id===prerequisite)!}{@const x1=['I','II','III','IIII'].indexOf(from.level)*250+225}{@const x2=['I','II','III','IIII'].indexOf(slot.level)*250+25}<path d={`M${x1} ${from.row*100}H${(x1+x2)/2}V${slot.row*100}H${x2}`}/>{/each}{/each}</svg>
    {#each technologySlots as slot}
      {@const revealed=game.technologies.find(t=>t.slot===slot.id)}
      <div class="overview-node" class:known={!!revealed} style={`--column:${['I','II','III','IIII'].indexOf(slot.level)};--row:${slot.row}`}>
        {#if revealed}<button aria-label={`Inspect ${cardById(revealed.card).title}`} onclick={()=>inspect(revealed.card)}><CardFace card={cardById(revealed.card)} compact overview/></button>
        {:else}<span class="overview-cover" aria-label={`${slot.id}: ${slot.level==='IIII'?'Undiscovered technology':'Unrevealed Event'}, requires ${slot.required} of ${slot.prerequisites.join(', ')}`}><strong>{slot.id}</strong><span aria-hidden="true">{slot.required} / {slot.prerequisites.length} ◇</span></span>{/if}
      </div>
    {/each}
  </div>
  <p>All 19 spaces · Select a public card to inspect. Focus Technology for every space’s prerequisites.</p>
</section>
<style>
.technology-overview{display:flex;flex-direction:column;flex:1;min-height:0}
.overview-levels{display:grid;grid-template-columns:repeat(4,1fr);font:600 20px/1 'Cormorant Garamond',serif;text-align:center;color:#dec58b;padding:0 0 3px}
.overview-map{position:relative;flex:1;min-height:188px;margin:0 6px}
.overview-map>svg{position:absolute;left:0;top:32px;width:100%;height:calc(100% - 64px);pointer-events:none}
path{stroke:#c4b07b;stroke-width:2;fill:none;filter:drop-shadow(0 0 3px #acc9a0);opacity:.8}
.overview-node{position:absolute;left:calc(var(--column)*25%);top:calc(32px + var(--row)*(100% - 64px)/6);width:22.5%;transform:translateY(-50%)}
.overview-cover{height:clamp(18px,5vh,28px);display:flex;align-items:center;justify-content:space-between;gap:3px;padding:2px 6px;border:1px solid #b19c65;border-radius:4px;background:linear-gradient(140deg,#355853,#142e34);box-shadow:inset 0 0 0 2px #c7ad6e22,0 3px #715e39,2px 5px 7px #0008;color:#e0d0a5;font-size:11px;line-height:1}
.overview-cover>span{font-size:9px;color:#bdc5aa}
.known{height:64px;max-height:calc((100% - 64px)/3 - 2px);min-height:44px}
button{display:block;width:100%;height:100%;min-height:44px;padding:0;border:0;border-radius:6px;background:none;text-align:left;box-shadow:none}
button :global(.card-face){height:100%}
p{margin:6px 0 0;font-size:10px;line-height:1.3;color:#bfccb4;text-align:center}

@container(max-height:240px){
.overview-map>svg{top:24px;height:calc(100% - 48px)}
.overview-node{top:calc(24px + var(--row)*(100% - 48px)/6)}
.known{height:44px;max-height:44px}
.overview-cover{height:20px}
}
</style>
