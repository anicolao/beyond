<script lang="ts">
 import {cardById} from './cards';
 import {supplyCapacity} from './manifest';
 import type {PublicSetup} from './setup';
 import type {BonusEffect} from './discovery-effects';
 let {game,position,effect,allowed,busy,respond,inspect,compact=false}:{game:PublicSetup;position:string;effect:BonusEffect;compact?:boolean;allowed:boolean;busy:boolean;respond:(option:string,extra?:Record<string,unknown>)=>void;inspect:(id:string)=>void}=$props();
 const actor=$derived(game.players.find(p=>p.position===position)!);
 const count=$derived(Math.min(2,actor.supply.reduce((a,b)=>a+b,0)));
 let columns=$state([0,0]);
 const projected=$derived.by(()=>{const supply=[...actor.supply];for(let i=0;i<count;i++){const right=supply.findLastIndex(n=>n>0);supply[right]--;}for(const target of columns.slice(0,count))supply[target]++;return supply;});
 const invalid=$derived(projected.some((n,i)=>n>supplyCapacity[i]&&n>actor.supply[i]));
</script>
<div class="personal-immediate" class:compact>
 {#if effect.kind==='personal-research'}
  <p>Optional · 1 Population · no immediate bonus.</p>
  <div class="options">{#each game.technologies.filter(t=>['I','II'].includes(cardById(t.card).technology?.level??'')&&!actor.research.includes(t.card)) as t}<div><button disabled={!allowed||busy||actor.population<1} onclick={()=>respond(t.card)}>Research {cardById(t.card).title} · 1 Population</button><button aria-label={`Inspect ${cardById(t.card).title}`} title="Full rules" onclick={()=>inspect(t.card)}>↗</button></div>{/each}<button disabled={!allowed||busy} onclick={()=>respond('pass')}>Skip optional research</button></div>
 {:else if effect.kind==='redistribute-supply'}
  <p class="move-instruction">Move the {count} rightmost Supply cubes into available slots.</p>
  <div class="supply" aria-label="Supply after redistribution">{#each projected as amount,i}<span><strong>{String.fromCharCode(65+i)}</strong>{amount} / {supplyCapacity[i]}</span>{/each}</div>
  <div class="placement-options">{#each Array.from({length:count}) as _,i}<label><span>{compact?'Cube '+(i+1)+' →':'Destination of cube '+(i+1)}</span><select aria-label={"Destination of cube "+(i+1)} bind:value={columns[i]} disabled={!allowed||busy}>{#each supplyCapacity as _,j}<option value={j}>Column {String.fromCharCode(65+j)}</option>{/each}</select></label>{/each}</div>
  {#if invalid}<p role="status">Choose empty Supply slots.</p>{/if}<button disabled={!allowed||busy||invalid} onclick={()=>respond('redistribute',{columns:columns.slice(0,count)})}>Save Supply positions</button>
 {:else if effect.kind==='choice'&&effect.id==='android-armada'}
  <p class="choice-progress">Choice {effect.ordinal??1} of 2 · repeats allowed.</p>
  <div class="options"><button disabled={!allowed||busy} onclick={()=>respond('ship')}>Convert 1 Supply → level-2 ship</button><button disabled={!allowed||busy} onclick={()=>respond('population')}>Convert 1 Supply → Population</button></div>
 {:else if effect.kind==='choice'&&effect.id==='capital-second-ship'}
  <p>Level-4 ship saved. Optional: 2 Ore + 1 Population → level 2.</p><div class="options"><button disabled={!allowed||busy||actor.ore<2||actor.population<1} onclick={()=>respond('build')}>Pay 2 Ore + 1 Population → level-2 ship</button><button disabled={!allowed||busy} onclick={()=>respond('pass')}>Skip second build · continue to jumps</button></div>
 {:else if effect.kind==='choice'&&effect.id==='optional-population-ship'}
  <p>Optional · 1 Population → level-2 ship, then up to 2 jumps.</p>
  <div class="options"><button disabled={!allowed||busy||actor.population<1} onclick={()=>respond('build')}>Convert 1 Population → level-2 ship</button><button disabled={!allowed||busy} onclick={()=>respond('pass')}>Keep Population · continue to jumps</button></div>
 {/if}
</div>
<style>
.personal-immediate{display:grid;gap:12px;min-width:0;color:#efe6cb}.personal-immediate p{margin:0;line-height:1.35}.options{display:grid;gap:10px}.options>div{display:grid;grid-template-columns:minmax(0,1fr) 44px;gap:8px}.options>div>button:last-child{font-size:22px;padding:5px}.personal-immediate button,.personal-immediate select{min-height:44px;font:inherit}.personal-immediate label{display:grid;gap:5px}.supply{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}.supply span{display:grid;gap:5px;padding:8px;border:1px solid #b79e65;background:#183b3e;border-radius:5px}.supply strong{color:#f5e2ad}
.placement-options{display:grid;gap:12px}
@media(max-width:2199px){.compact{gap:5px;font-size:12px}.compact>p:not(.choice-progress):not(.move-instruction):not([role]){display:none}.compact .supply{gap:3px}.compact .supply span{padding:3px;gap:2px;font-size:12px}.compact .supply strong{font-size:12px}.compact .placement-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.compact label{font-size:11px;gap:2px}.compact select,.compact button{font-size:12px;min-height:44px}.compact .options{gap:5px}}
@media(min-width:2200px){.compact{font-size:18px;gap:8px}.compact>p:not(.choice-progress):not(.move-instruction):not([role]){display:none}.compact .placement-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.compact .supply span{padding:6px;gap:3px}.compact label{gap:4px}.compact .options{gap:8px}}
</style>
