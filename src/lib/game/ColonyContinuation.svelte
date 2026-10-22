<script lang="ts">
 import OriginalCardArt from '$lib/cards/OriginalCardArt.svelte';
 import CardFace from '$lib/cards/CardFace.svelte';
 import CardSymbol from '$lib/cards/CardSymbol.svelte';
 import {canonicalCard} from '../cards/catalog';
 import {colonyTracks} from './colonization';
 import type {ColonyStep} from './colonization';
 import type {PublicSetup} from './setup';
 let {game,step,allowed,busy,respond,inspect,compact=false}:{game:PublicSetup;step:ColonyStep;compact?:boolean;allowed:boolean;busy:boolean;respond:(option:string)=>void;inspect:(id:string)=>void}=$props();
 const actor=$derived(game.players.find(p=>p.position===step.responder)!);
 const colony=$derived(game.discovery?.colonies?.find(c=>c.card===step.card&&c.owner===step.responder));
 const replacement=$derived(game.systems.find(s=>s.slot===step.slot));
 const face=$derived(canonicalCard(step.card));
</script>
{#snippet discs()}{#each colonyTracks(step.card,game,step.responder)as track}{@const remaining=actor[track==='food'?'foodDiscs':'oreDiscs']}<button disabled={busy||!allowed} onclick={()=>respond(track)}><span class="disc" aria-hidden="true"><CardSymbol kind={remaining?track:'star'}/></span><strong>{track==='food'?'Food':'Ore'}</strong><small>{remaining?`Production level ${9-remaining} → ${10-remaining}`:'No matching disc left · permanent placeholder'}</small></button>{/each}{/snippet}
{#if compact}<section class="colony-continuation compact" aria-label="Colony production choice"><div class="compact-world"><button class="art-inspection" aria-label={`Inspect colony ${face.title}`} onclick={()=>inspect(face.id)}><OriginalCardArt id={face.id}/></button><div><h4>{face.title} · acquired</h4><p>{colony?.discs.length??0} retained outpost disc · choose the additional disc</p></div></div><div class="replacement"><strong>Replacement already revealed</strong>{#if replacement}<button onclick={()=>inspect(replacement.card)}>Inspect {canonicalCard(replacement.card).title} ↗</button>{:else}<span>{step.slot.startsWith('rift-')?'Attached location removed; no refill.':'Both decks exhausted; slot empty.'}</span>{/if}</div><div class="disc-choices">{@render discs()}</div><p class="next">Then: {face.sections.find(s=>s.label==='Colonize')?.text}</p></section>{:else}
<section class="colony-continuation" aria-label="Colony production choice"><div class="colony-card"><button aria-label={`Inspect colony ${face.title}`} onclick={()=>inspect(face.id)}><CardFace card={face}/></button><p>{colony?.discs.length??0} retained production disc{colony?.discs.length===1?'':'s'} · {actor.name}’s permanent territory</p></div><div class="choice"><h4>{face.title} · acquired</h4><p>Settlers have returned to Supply. Remaining fleets are in Deep Space.</p><div class="replacement"><strong>Replacement already revealed</strong>{#if replacement}<span>{canonicalCard(replacement.card).title}</span><button onclick={()=>inspect(replacement.card)}>Inspect replacement System</button>{:else}<span>{step.slot.startsWith('rift-')?'The attached location is removed; no refill.':'Both decks are exhausted; the printed slot stays empty.'}</span>{/if}</div><h5>Add the colony’s second disc</h5><p>Its original outpost stays with this card. The extra disc does not count as automation.</p><div class="disc-choices">{#each colonyTracks(step.card,game,step.responder)as track}{@const remaining=actor[track==='food'?'foodDiscs':'oreDiscs']}<button disabled={busy||!allowed} onclick={()=>respond(track)}><span class="disc" aria-hidden="true"><CardSymbol kind={remaining?track:'star'}/></span><strong>{track==='food'?'Food':'Ore'}</strong><small>{remaining?`Production level ${9-remaining} → ${10-remaining}`:'No matching disc left · permanent placeholder'}</small></button>{/each}</div><p class="next">Then resolve: {face.sections.find(s=>s.label==='Colonize')?.text}</p></div></section>
{/if}
<style>
.colony-continuation{min-height:0;display:grid;grid-template-columns:minmax(140px,230px) minmax(0,1fr);gap:20px;color:#eadfc3}.colony-card>button{width:100%;padding:0;border:0;background:none;container-type:inline-size;box-shadow:none;text-align:left}.colony-card>p{font-size:11px;line-height:1.35;margin:10px 0}.choice h4{font:600 28px 'Cormorant Garamond',serif;margin:0 0 9px}.choice p{font-size:14px;line-height:1.4}.replacement{padding:12px;margin:12px 0;background:#112b34;border:1px solid #ad935b;border-radius:8px;display:grid;gap:7px}.replacement strong{font-size:11px;letter-spacing:.07em;text-transform:uppercase}.replacement span{font:600 23px 'Cormorant Garamond',serif}.replacement button{justify-self:start}.choice h5{font:600 24px 'Cormorant Garamond',serif;margin:14px 0 6px}.disc-choices{display:flex;gap:10px;margin:14px 0}.disc-choices button{flex:1;min-width:0;display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:12px;background:linear-gradient(125deg,#eee0bb,#bda67b);color:#203d35;box-shadow:0 4px #7c643d}.disc-choices strong{font:600 23px 'Cormorant Garamond',serif}.disc-choices small{flex-basis:100%;font-size:12px;line-height:1.3}.disc{display:grid;place-items:center;width:35px;height:35px;border:2px solid #a08a53;border-radius:50%;background:linear-gradient(135deg,#e2cf96,#8f7540);font-size:21px;box-shadow:inset 1px 2px #fff7,0 2px #645031}.next{border-top:1px solid #ad955c77;padding-top:10px}button{min-height:44px;border:1px solid #b69c62;border-radius:7px;background:#203f42;color:#eee2c0;font:13px 'Atkinson Hyperlegible',sans-serif;padding:8px 12px;cursor:pointer}button:disabled{opacity:.6;cursor:default}button:focus-visible{outline:3px solid #83e8d7;outline-offset:3px}@media(max-width:760px){.colony-continuation{grid-template-columns:1fr;gap:10px}.colony-card{display:none}.choice h4{font-size:24px}.choice p{font-size:12px}.replacement{padding:9px;margin:10px 0}.disc-choices button{padding:10px}.disc-choices small{font-size:11px}}

.compact{display:flex;flex-direction:column;gap:6px;min-height:0}
.compact-world{display:grid;grid-template-columns:52px minmax(0,1fr);gap:8px;align-items:center}
.art-inspection{width:52px;height:52px;padding:3px;overflow:hidden;background:linear-gradient(135deg,#f2dfb2,#927644)}
.art-inspection :global(svg){display:block;width:100%;height:100%}
.compact h4{font:600 21px/1.1 'Cormorant Garamond',serif;margin:0 0 3px}
.compact p{font-size:11px;line-height:1.3;margin:0}
.compact .replacement{display:flex;align-items:center;gap:10px;margin:0;padding:0;border:0;background:none;min-height:44px}
.compact .replacement strong{font-size:10px;flex:1}
.compact .replacement button{min-height:44px;font-size:11px;padding:5px 8px}
.compact .replacement span{font:11px/1.3 'Atkinson Hyperlegible',sans-serif;flex:1}
.compact .disc-choices{margin:0;gap:8px}
.compact .disc-choices button{min-height:44px;padding:5px 8px;gap:4px 7px}
.compact .disc{width:25px;height:25px;font-size:17px}
.compact .disc-choices strong{font-size:20px}
.compact .disc-choices small{font-size:10px;line-height:1.2}
.compact .next{padding-top:5px;font-size:11px;line-height:1.3}
</style>
