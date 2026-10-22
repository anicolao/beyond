<script lang="ts">
 import MapMiniature from './MapMiniature.svelte';
 import {base} from '$app/paths';
 import OriginalCardArt from '$lib/cards/OriginalCardArt.svelte';
 import CardFace from '$lib/cards/CardFace.svelte';
 import {discoveryMap,permittedJumpDestinations,type JumpLeg} from './discovery-movement';
 import {jumpPreview,cycleRouteShipId} from './jump-preview';
 import {fleetLocation} from './fleet-preview';
 import {cardById} from './cards';
 import type {PublicSetup} from './setup';
 let {game,position,amount,required=false,allowed,busy,compact=false,respond,source,inspect}:{game:PublicSetup;position:string;amount:number;required?:boolean;allowed:boolean;busy:boolean;compact?:boolean;respond:(option:string,extra?:Record<string,unknown>)=>void;source?:string;inspect:(id:string)=>void}=$props();
 let width=$state(0),viewportWidth=$state(0);
 const nativePower=$derived(compact&&viewportWidth>=2200);
 const dense=$derived(!compact&&game.count>2&&width>=640&&width<1100);
 const single=$derived(compact||dense||width>0&&width<640);
 const narrowMap=$derived(!compact&&width>0&&width<640&&game.count>2);
 $effect(()=>{if(single&&!compact)view='map';});
 let selected=$state(''),legs=$state<JumpLeg[]>([]),view=$state<'map'|'route'|'routes'|'power'>('route'),locationIndex=$state(0),powerDetail=$state<'power'|'outpost'|'bonus'|'card'>('power');
 const actor=$derived(game.players.find(p=>p.position===position)!);
 const map=$derived.by(()=>{const publicMap=discoveryMap(game),shortShared=(compact||dense)&&game.count>2;
  // Spread the flanking System/shipyard bands in the short physical reader.
  // Only presentation coordinates change; canonical locations and edges do not.
  const rows:Record<string,number>={'b-1':10,'b-2':10,'shipyard-north':10,'shipyard-west':45,'shipyard-east':45,'a-1':80,'a-2':80};
  // A phone-sized four-player map needs three separated columns and four
  // bands. These are presentation coordinates; all printed edges stay intact.
  if(narrowMap){
   const positions:Record<string,{x:number;y:number}>={
    'b-1':{x:10,y:10},'shipyard-north':{x:50,y:10},'b-2':{x:90,y:10},
    'shipyard-west':{x:15,y:42},'deep-space':{x:50,y:42},'shipyard-east':{x:85,y:42},
    'a-1':{x:10,y:70},'a-2':{x:90,y:70},sol:{x:50,y:96}
   };
   return {...publicMap,locations:publicMap.locations.map(location=>{
    const attached=game.discovery?.systems.find(system=>system.slot===location.id);
    // The attached System occupies a spare bottom slot, off the printed A-to-A
    // edge; its single connector follows the outside gutter below.
    const point=positions[location.id]??(attached?{x:['b-1','a-1'].includes(attached.parent)?10:90,y:96}:undefined);
    return point?{...location,...point}:location;
   })};
  }
  return {...publicMap,locations:publicMap.locations.map(location=>(compact||dense)&&game.count>2&&game.discovery?.systems.some(s=>s.slot===location.id)?{...location,x:2,y:shortShared?85:70}:shortShared&&rows[location.id]!==undefined?{...location,y:rows[location.id]}:game.count===2&&location.id==='a-1'?{...location,x:85}:game.count===2&&location.id==='b-1'?{...location,x:15}:game.count===2&&location.id==='b-2'?{...location,x:85}:game.count===2&&location.id==='shipyard-north'?{...location,y:10}:location)};});
 const preview=$derived(jumpPreview(game,position,amount,legs));
 const ship=$derived(actor.ships.find(s=>s.id===selected));
 const path=$derived(legs.find(l=>l.ship===selected)?.path??(ship?[ship.location]:[]));
 const destinations=$derived(path.length?permittedJumpDestinations(game,position,path.at(-1)!):[]);
 const point=(id:string)=>map.locations.find(l=>l.id===id)!;
 const xy=(n:number)=>8+n*.84;
 function attachmentPoints(a:string,b:string){
  const attached=game.discovery?.systems.find(system=>system.slot===a||system.slot===b);
  if(!narrowMap||!attached)return;
  const gutter=point(attached.slot).x<50?-8:108,from=point(a),to=point(b);
  return `${xy(from.x)},${xy(from.y)} ${xy(gutter)},${xy(from.y)} ${xy(gutter)},${xy(to.y)} ${xy(to.x)},${xy(to.y)}`;
 }
 $effect(()=>{const key=JSON.stringify({position,at:game.discovery?.cursor});if(key){selected=actor.ships[0]?.id??'';legs=[];view='route';locationIndex=0;}});
 function cycleRouteShip(direction:1|-1){selected=cycleRouteShipId(actor.ships,selected,direction);}
 function add(id:string){if(!ship||!destinations.includes(id)||!preview.remaining)return;legs=[...legs.filter(l=>l.ship!==selected),{ship:selected,index:actor.ships.findIndex(s=>s.id===selected),path:[...path,id]}];}
 function remove(){if(path.length<2)return;const next=path.slice(0,-1);legs=legs.filter(l=>l.ship!==selected);if(next.length>1)legs=[...legs,{ship:selected,index:actor.ships.findIndex(s=>s.id===selected),path:next}];}
 const name=(position?:string)=>game.players.find(p=>p.position===position)?.name??'uncontrolled';
 const system=(id:string)=>[...game.systems,...(game.discovery?.systems??[])].find(s=>s.slot===id);
</script>
<svelte:window bind:innerWidth={viewportWidth}/>
{#snippet shipPicker()}   <label class="ship-choice">Your ship<select bind:value={selected} disabled={!allowed||busy||!actor.ships.length}>{#if !actor.ships.length}<option value="">No owned ships available</option>{/if}{#each actor.ships as s,i}<option value={s.id}>Ship {i+1} · level {s.level} · {fleetLocation(game,s.location)}</option>{/each}</select></label>{/snippet}
{#snippet selectedRoute()}
 <div class="route" role="group" aria-label="Selected ship route" aria-live="polite"><span class="route-cube" aria-hidden="true">{ship?.level??'—'}</span><div><strong>{ship?`Ship ${actor.ships.findIndex(s=>s.id===selected)+1} · level ${ship.level}`:'No owned ships'}</strong><p>{path.map(id=>fleetLocation(game,id)).join(' → ')||'No ships available'}</p></div>{#if path.length&&system(path.at(-1)!)}{@const endpoint=system(path.at(-1)!)!}<button class="endpoint-art" aria-label={`Inspect route endpoint ${cardById(endpoint.card).title}`} onclick={()=>inspect(endpoint.card)}>{#if cardById(endpoint.card).art==='astronomy'}<OriginalCardArt id={endpoint.card}/>{:else}<img src={`${base}/art/cards/${cardById(endpoint.card).art}.png`} alt=""/>{/if}</button>{/if}</div>
{/snippet}
{#snippet routeMap()}
   <div class="map" style={`--space-art:url('${base}/art/cards/system.png')`} aria-label="Public exploration route map">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="jump-route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z"/></marker></defs>{#each map.edges as [a,b]}{@const bend=attachmentPoints(a,b)}{#if bend}<polyline class="connection" points={bend} fill="none" stroke-linejoin="round"/>{:else}<line class="connection" x1={xy(point(a).x)} y1={xy(point(a).y)} x2={xy(point(b).x)} y2={xy(point(b).y)}/>{/if}{/each}{#each legs as leg}{#each leg.path.slice(1) as to,i}{@const bend=attachmentPoints(leg.path[i],to)}{#if bend}<polyline class="planned" class:other={leg.ship!==selected} points={bend} fill="none" stroke-linejoin="round" marker-end="url(#jump-route-arrow)"/>{:else}<line class="planned" class:other={leg.ship!==selected} x1={xy(point(leg.path[i]).x)} y1={xy(point(leg.path[i]).y)} x2={xy(point(to).x)} y2={xy(point(to).y)} marker-end="url(#jump-route-arrow)"/>{/if}{/each}{/each}</svg>
    {#each map.locations as location}{@const face=system(location.id)}{@const faceArt=face?cardById(face.card).art:null}<button class="node" class:attached={!!game.discovery?.systems.some(s=>s.slot===location.id)} class:reachable={destinations.includes(location.id)} class:current={path.at(-1)===location.id} style={`left:${xy(location.x)}%;top:${xy(location.y)}%;${faceArt&&faceArt!=='astronomy'?`--location-art:url('${base}/art/cards/${faceArt}.png')`:''}`} disabled={!allowed||busy||!preview.remaining||!destinations.includes(location.id)} aria-label={`Map jump to ${location.title}`} onclick={()=>add(location.id)}><span>{location.title}</span><small>{#if face&&!preview.ships.some(s=>s.location===location.id)}<span class="map-system-art" aria-hidden="true">{#if faceArt==='astronomy'}<OriginalCardArt id={face.card}/>{:else if faceArt}<MapMiniature art={faceArt} width={compact?20:23}/>{/if}</span>{/if}{#if preview.ships.some(s=>s.location===location.id)}{#each preview.ships.filter(s=>s.location===location.id).slice(0,3) as s}<i class="map-cube" aria-hidden="true">{s.level}</i>{/each}{#if preview.ships.filter(s=>s.location===location.id).length>3}+{preview.ships.filter(s=>s.location===location.id).length-3}{/if}{:else}{location.kind==='shipyard'?'Shipyard':location.kind==='sol'?'Home':location.kind==='deep-space'?'Open space':'System'}{/if}</small></button>{/each}
   </div>
{/snippet}
<section class="jump-plan" bind:clientWidth={width} class:compact class:single class:dense class:narrow-map={narrowMap} class:native-read={nativePower} class:power-view={view==='power'} class:map-view={single&&view==='map'} aria-label="Simultaneous jump planner">
 <div class="budget" aria-live="polite"><strong>Jump {amount}</strong><span>Planned {preview.spent}</span><b>{preview.remaining} remaining</b>{#if compact&&source}<span class="source-identity">{cardById(source).title}</span>{/if}<small>Unspent points expire · nothing moves until commit</small>{#if !single}<button class="consequence-toggle" onclick={()=>view=view==='power'?'route':'power'}>{view==='power'?'Map & routes':`After all jumps · ${preview.locations.length} endpoints`}</button>{/if}{#if source&&!single}<button onclick={()=>inspect(source!)}>Read effect ↗</button>{/if}</div>

 {#if single}<nav class="view-tabs" aria-label="Jump planning views"><button aria-pressed={view==='map'} onclick={()=>view='map'}>Exploration</button><button aria-pressed={view==='route'} onclick={()=>view='route'}>Route editor</button><button aria-pressed={view==='routes'} onclick={()=>view='routes'}>Routes</button><button aria-pressed={view==='power'} onclick={()=>view='power'}>Final power · {preview.locations.length}</button>{#if source}<button onclick={()=>inspect(source!)}>Read effect ↗</button>{/if}</nav>{/if}
 {#if single&&(!compact&&view!=='power'||view==='route')}{@render shipPicker()}{/if}
 {#if view==='power'}{#if preview.locations.length}<nav class="power-pages" aria-label="Endpoint power preview"><button aria-label="Previous endpoint" onclick={()=>locationIndex=(locationIndex+preview.locations.length-1)%preview.locations.length}>‹</button>{#if compact&&!nativePower}<button class="detail-turn" aria-label="Next consequence detail" onclick={()=>powerDetail=powerDetail==='power'?'outpost':powerDetail==='outpost'?'bonus':powerDetail==='bonus'?'card':'power'}>{powerDetail==='power'?'Power':powerDetail==='outpost'?'Outpost':powerDetail==='bonus'?'Bonus':'Printed rules'} · endpoint {Math.min(locationIndex+1,preview.locations.length)}/{preview.locations.length} ↻</button>{:else}<span>Endpoint {Math.min(locationIndex+1,preview.locations.length)} / {preview.locations.length}</span>{/if}<button aria-label="Next endpoint" onclick={()=>locationIndex=(locationIndex+1)%preview.locations.length}>›</button></nav>{/if}{/if}
 <!-- svelte-ignore a11y_no_noninteractive_tabindex (Bounded route/power panel supports keyboard scrolling.) -->
 <div class="plan-scroll" tabindex="0" role="region" aria-label="Jump routes and endpoint consequences">
 <div class="composition">
 {#if (!single&&view!=='power')||view==='map'}<div class="map-object">{@render routeMap()}</div>{/if}
  {#if (!single&&view!=='power')||view==='route'}<div class="navigation">
   {#if !single}{@render shipPicker()}{/if}

   {@render selectedRoute()}
   {#if !preview.remaining}<p class="route-allocation">All {amount} points planned · remove a leg to reroute.</p>{/if}
   <div class="list-routes" class:allocated={!preview.remaining} role="group" aria-label="Connected destinations">{#each destinations as id}<button disabled={!allowed||busy||!preview.remaining} onclick={()=>add(id)}>Jump to {fleetLocation(game,id)}</button>{/each}</div>
  </div>{/if}
  {#if single&&view==='routes'}<section class="route-reader" aria-label="Complete selected ship route">{#if actor.ships.length}<nav class="power-pages"><button aria-label="Previous route ship" disabled={actor.ships.length<2} onclick={()=>cycleRouteShip(-1)}>‹</button><strong>Ship {actor.ships.findIndex(s=>s.id===selected)+1} · {Math.max(0,path.length-1)} points</strong><button aria-label="Next route ship" disabled={actor.ships.length<2} onclick={()=>cycleRouteShip(1)}>›</button></nav>{@render selectedRoute()}{:else}<p role="status">No owned ships. {required?'A real jump is required.':'You may commit no movement; unused jump points expire.'}</p>{/if}</section>{/if}{#if view==='power'}<aside class="power"><h4>After all jumps <small>Endpoint consequences · use arrows for every affected location</small></h4>{#each preview.locations.slice(Math.min(locationIndex,preview.locations.length-1),Math.min(locationIndex,preview.locations.length-1)+1) as location}<section class:illustrated={nativePower&&!!location.card} aria-label={`${location.title} final power`}>{#if nativePower&&location.card}<button class="endpoint-card" aria-label={`Inspect full System ${location.title}`} onclick={()=>inspect(location.card!)}><CardFace card={cardById(location.card)}/></button>{/if}<div class="endpoint-details">{#if nativePower&&location.card}<h5>Final fleet power</h5>{:else}<h5>{location.title}</h5>{/if}{#if location.card&&!nativePower&&(!compact||powerDetail==='card')}<button class="read-system" aria-label={`Inspect full System ${location.title}`} onclick={()=>inspect(location.card!)}>Read System ↗</button>{/if}{#if !compact||nativePower||powerDetail==='power'}<dl>{#each location.powers.filter(p=>p.before||p.after) as row}<div><dt>{row.name}</dt><dd>{row.before} → <b>{row.after}</b></dd></div>{/each}</dl>{/if}<p>{#if !location.controllable}No outpost at this location.{:else if !location.controlChanges}{name(location.beforeOwner)}{location.beforeOwner?' retains control.':' · no new control.'}{:else}Control: {name(location.beforeOwner)} → <strong>{name(location.afterOwner)}</strong>.{/if}</p>{#if location.controlChanges&&(!compact||nativePower||powerDetail==='outpost')}{#if location.beforeOwner&&!location.beforePlaceholder}<small>{name(location.beforeOwner)} returns the {location.beforeTrack} outpost disc.</small>{/if}{#if location.afterOwner}<small>{name(location.afterOwner)} places {location.specialty==='either'?'a Food or Ore':`a ${location.specialty==='food'?'Food':'Ore'}`} outpost; {location.specialty==='either'?'its owner chooses after commit.':'matching disc or placeholder after commit.'}</small>{/if}{/if}{#if location.controlChanges&&location.afterOwner&&(!compact||nativePower||powerDetail==='bonus')}<p class="bonus">{location.gainBonus?`Gain control · ${location.gainBonus}`:'No printed gain-control bonus.'}</p>{/if}{#if nativePower}<p class="boundary">Passing through a System gives no temporary outpost or bonus. All endpoint changes settle after the complete move.</p>{/if}</div></section>{:else}<p>Choose connected destinations to inspect final fleet power and outposts.</p>{/each}{#if !nativePower}<p class="boundary">Passing through a System gives no temporary outpost or bonus. All endpoint changes settle after the complete move.</p>{/if}</aside>{/if}
 </div>
 </div>
 {#if (!single&&view!=='power')||view==='map'}<p class="map-key">Solid: printed routes · dashed: planned · cubes: your final positions</p>{/if}
 <p class="scroll-cue">Scroll this framed panel for complete {view==='power'?'endpoint consequences':'routes'} ↕</p>
 <div class="jump-actions"><div class="edits"><button disabled={!allowed||busy||path.length<2} onclick={remove}>Remove last leg</button><button disabled={!allowed||busy||!legs.length} onclick={()=>{legs=[];}}>Clear unpaid jump plan</button></div><div class="commit"><p aria-live="polite">{preview.reason|| (required&&!preview.moved?'Plan a real jump.':`${preview.spent} jumps · ${preview.ore} Ore · ${preview.remaining} unused points expire.`)}</p><button class="primary" disabled={!allowed||busy||!!preview.reason||required&&!preview.moved} onclick={()=>respond('jump',{legs})}>{required&&!preview.moved?'Plan a real jump':preview.spent?'Commit jumps':'Commit no movement'}</button></div></div>
</section>
<style>
.jump-plan{display:flex;flex-direction:column;min-height:0;height:100%;color:#ecdfbb;container-type:inline-size}.budget{display:flex;gap:8px 18px;align-items:center;flex-wrap:wrap;padding:10px 12px;background:linear-gradient(100deg,#0f3037,#253f3c);border:1px solid #b39a61;border-radius:8px;box-shadow:inset 0 2px 5px #0008;flex:none;font-size:14px}.budget strong{font:600 25px 'Cormorant Garamond',serif}.budget b{color:#76e5d4}.budget small{flex-basis:auto;font-size:11px;color:#cccfb7}.plan-scroll{flex:1;min-height:0;overflow:auto;padding:8px 4px;scrollbar-color:#bca067 #122d33}.composition{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(230px,.8fr);grid-template-rows:auto minmax(0,1fr);gap:10px 16px}.map-object{grid-column:1;grid-row:1 / span 2;min-width:0}.navigation{grid-column:2;grid-row:1}.power{grid-column:2;grid-row:2}.navigation,.power{min-width:0}.ship-choice{display:flex;gap:10px;align-items:center;font-size:12px;margin:0 0 8px}.ship-choice select{flex:1;min-width:0;min-height:44px;background:#e6d8b4;border:1px solid #b5995f;border-radius:5px;color:#203738;padding:8px;font:14px 'Atkinson Hyperlegible',sans-serif}.map{height:268px;position:relative;border:2px solid #aa905b;border-radius:10px;background:radial-gradient(ellipse at 50% 40%,#17333aef,#071a24f5),var(--space-art) center/cover;box-shadow:inset 0 0 26px #000b}.map svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}.connection{stroke:#b8b18d66;stroke-width:.5}.planned{stroke:#6ce4df;stroke-width:1;filter:drop-shadow(0 0 1px #6ce4df);stroke-dasharray:3 1}.planned.other{stroke:#e5c06d}.map marker path{fill:#6ce4df}.node{position:absolute;transform:translate(-50%,-50%);width:80px;height:44px;min-height:44px;padding:3px;background:linear-gradient(#142f3ddd,#0b202ef0),var(--location-art) center/cover;border:1px solid #a28d5e;border-radius:5px;color:#e9dfc2;font:12px/1.1 'Cormorant Garamond',serif;text-align:center;cursor:pointer}.node span{position:relative;z-index:1;display:block;font-size:12px;line-height:12px;font-weight:600}.node small{position:relative;z-index:1;display:block;font:10px/12px 'Atkinson Hyperlegible',sans-serif;height:12px;margin-top:0;color:#d5c49d}.map-cube{display:inline-grid;place-items:center;vertical-align:middle;width:13px;height:12px;margin:0 2px;border:1px solid #a9e2d2;border-radius:2px;box-shadow:inset 2px 2px 2px #caffee66,1px 2px #073b3c;background:linear-gradient(135deg,#6bbeb0,#286a6a);font:600 10px/1 'Atkinson Hyperlegible',sans-serif;color:#eff8dd}.map-key{font-size:10px;line-height:1.3;margin:4px 0 0;color:#c6cdb6}.node:disabled{opacity:1;cursor:default}.node.reachable:not(:disabled){border-color:#73ded5;box-shadow:0 0 10px #5bd3ce44}.node.current{box-shadow:inset 0 0 0 2px #e1c583}.route{padding:8px 0;font-size:12px}.route p{margin:4px 0;line-height:1.4}.list-routes{display:flex;flex-wrap:wrap;gap:6px}.list-routes button{flex:1 1 115px}.list-routes.allocated{display:none}.power{border:1px solid #a18b5655;border-radius:8px;padding:10px;background:linear-gradient(135deg,#243c3c,#10272e)}.power h4{font:600 25px 'Cormorant Garamond',serif;margin:0 0 8px}.power h4 small{display:block;font:11px 'Atkinson Hyperlegible',sans-serif;color:#c5c9ae;margin-top:4px}.power section{padding:10px 0;border-top:1px solid #c9aa5a55}.power h5{font:600 23px 'Cormorant Garamond',serif;margin:0 0 6px}.power dl{margin:0}.power dl div{display:flex;justify-content:space-between;gap:10px;font-size:13px}.power dd{margin:0}.power p,.power small{font-size:12px;line-height:1.4;margin:6px 0}.power small{display:block}.power .bonus{padding:8px;background:#c7b17615;border-left:2px solid #ac945d}.boundary{color:#cbd0b6}.jump-actions{flex:none;padding:8px 4px 0}.edits{display:flex;gap:8px;margin-bottom:8px}.edits button{flex:1}.commit{display:flex;justify-content:space-between;gap:12px;align-items:center;background:#19363c;border:1px solid #b89c60;border-radius:8px;padding:10px}.commit p{font-size:12px;line-height:1.3;margin:0}.jump-plan button:not(.node){min-height:44px;padding:8px 10px;border:1px solid #b69c65;border-radius:6px;background:linear-gradient(#344d49,#132d36);color:#e9dfc1;font:13px 'Atkinson Hyperlegible',sans-serif;cursor:pointer}.jump-plan .primary{background:linear-gradient(#21696b,#14464d)!important;flex:none}.jump-plan .node:disabled{opacity:1}.jump-plan button:disabled{opacity:.5;cursor:default}.jump-plan button:focus-visible,.jump-plan select:focus-visible,.plan-scroll:focus-visible{outline:3px solid #6df2de;outline-offset:2px}.view-tabs{display:flex;gap:8px;padding:6px 0}.view-tabs button{flex:1}.view-tabs [aria-pressed=true]{border-color:#77e9d8;background:#265452}.single .composition{display:block}.compact .power{max-height:none}.compact .map{height:230px}.compact .ship-choice{display:flex}.compact .ship-choice select{width:auto}.compact .map{height:230px}.compact .node.attached{width:64px}.compact .node{width:68px;font-size:11px}.compact .node span{font-size:12px}.compact .budget{padding:6px 8px;font-size:12px;gap:4px 10px}.compact .budget strong{font-size:20px}.compact .budget small{display:none}.compact .budget{min-height:34px}.compact.map-view .jump-actions{display:none}.compact.power-view .edits{display:none}.compact.power-view .power{padding:4px}.compact.power-view .plan-scroll{padding:2px}.power-pages .detail-turn{flex:1;width:auto;font-size:11px!important}.single:not(.compact).map-view .edits{display:none}.compact .map{height:230px}.compact .jump-actions{padding-top:4px}.compact .edits{margin-bottom:5px;gap:5px}.compact .commit{display:grid;grid-template-columns:minmax(0,1fr) auto;padding:4px}.compact .commit .primary{width:auto}.compact .commit p{font-size:11px}.jump-plan.compact button{font-size:11px}.compact .ship-choice{display:flex}.compact .ship-choice select{width:auto;margin-top:0}.compact .plan-scroll{padding:3px}.compact .view-tabs{padding:4px 0}.compact .list-routes{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:4px}.compact .list-routes button{padding:4px;min-width:44px;font-size:10px!important}.compact .list-routes.allocated{display:none}.compact .route{font-size:11px;padding:0;min-height:14px}.compact .route strong{display:none}.compact .route p{margin:0;line-height:1.2}.compact .ship-choice{margin-bottom:3px;flex:none}.single>.ship-choice{margin:5px 3px;flex:none}.route-reader{font-size:12px}.route-reader p{line-height:1.4;margin:7px 0}.compact .power{padding:6px}.compact .power>h4{display:none}.compact .power section{padding:4px 0}.compact .power h5{font-size:20px;margin:0 0 3px}.compact .power p,.compact .power small{font-size:11px;margin:3px 0}.compact .power .boundary{display:none}.power-pages{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:11px}.power-pages button{width:44px;font-size:23px!important;padding:0!important}
@container(max-width:640px){.composition{display:flex;flex-direction:column}.navigation{order:0}.map-object{order:1}.power{order:2}.map{height:280px}.node{width:74px}.budget{gap:5px 12px}.budget strong{font-size:22px}.commit{align-items:stretch;flex-direction:column;gap:7px}.commit .primary{width:100%}.power h4{font-size:23px}.ship-choice{display:block}.ship-choice select{display:block;width:100%;margin-top:5px}.jump-plan button:not(.node){font-size:12px}.edits{gap:5px}}

/* Navigation stays outside the bounded reader: long consequences never sit behind payment. */
.budget .consequence-toggle{margin-left:auto;flex:none}.jump-plan:not(.single) .composition{height:100%}.jump-plan:not(.single) .map-object{height:100%;min-height:0}.jump-plan:not(.single) .map{height:100%;min-height:180px}.scroll-cue{flex:none;margin:0;padding:4px 8px;border-top:1px solid #b99b63;color:#f4e6c2;background:#18363b;font-size:11px;line-height:1.4}
.jump-plan:not(.single) .power>h4{display:none}.jump-plan:not(.single) .power h5{display:inline-block;margin-right:12px}.power-view .composition{display:block}.power-view .power{margin:0}.jump-plan>.power-pages{flex:none;background:#18363b;padding:4px;border-bottom:1px solid #a98e59}
.map{background:radial-gradient(ellipse at 50% 40%,#23424b,#091d29);box-shadow:inset 0 0 0 4px #c5a86a22,inset 0 0 26px #0009,0 3px 0 #80673c}
.connection{stroke:#d6c495;stroke-width:.8}.planned{stroke:#83fff0;stroke-width:1.4;filter:drop-shadow(0 0 2px #122d32)}
.node{background:linear-gradient(135deg,#f4e9cc,#cfba8e);color:#203935;border:2px solid #b29459;box-shadow:inset 0 0 0 1px #fff7,0 3px 0 #6b5635,0 5px 8px #0008}
.node span{font-family:'Atkinson Hyperlegible',sans-serif;font-size:11px;line-height:13px;text-shadow:0 1px #fff8}.node small{color:#29453d}.node.reachable:not(:disabled){border-color:#65f5df;outline:1px solid #113f40;box-shadow:0 0 0 2px #65f5df44,0 3px #436259}.node.current{border-color:#f3cf72;box-shadow:inset 0 0 0 2px #8b692d,0 3px #6b5635}
.map-cube{width:18px;height:16px;border-color:#287f7c;border-radius:3px;background:linear-gradient(130deg,#57bdb9,#1b615f);box-shadow:inset -3px -3px #133f4b66,inset 2px 2px #a5f4e655,1px 2px #173e42;font-size:12px;color:#fff5d3}.node small{height:16px;line-height:16px}.compact .node span{font-size:11px}
.compact .scroll-cue{display:none}.compact.map-view .scroll-cue{display:none}

.route{display:flex;align-items:center;gap:10px}.route>div{flex:1;min-width:0}.route-cube{display:inline-grid;place-items:center;flex:none;width:40px;height:40px;border:1px solid #7ed8d0;border-radius:6px;background:linear-gradient(130deg,#57bdb9,#1b615f);box-shadow:inset -5px -5px #133f4b66,inset 3px 3px #a5f4e655,2px 4px #173e42;color:#fff5d3;font:600 28px 'Cormorant Garamond',serif}.jump-plan button.endpoint-art{width:52px;height:52px;flex:none;padding:3px;background:#102832;border-color:#a58b56;overflow:hidden}.endpoint-art :global(svg){display:block;width:100%;height:100%}
.map-key{flex:none;text-align:left;padding:3px 4px;margin:0}

.dense.map-view>.ship-choice,.dense.map-view .jump-actions,.dense.map-view .scroll-cue{display:none}.dense .map{height:240px}
/* Exploration keeps the same visible allowance as every other planner view.
   Fit its complete map within the short reader instead of hiding the budget. */
:is(.compact,.dense).map-view .composition{height:100%}:is(.compact,.dense).map-view .map-object{height:100%;max-height:240px}
:is(.compact,.dense).map-view .map{height:100%;min-height:188px;max-height:240px}
.compact.map-view .map-object,.compact.map-view .map{max-height:230px}
.compact .source-identity{flex-basis:100%;font-size:11px;color:#f2dfb4}

.native-read .power section.illustrated{display:grid;grid-template-columns:160px minmax(0,1fr);gap:12px;align-items:start;min-height:0}
.jump-plan button.endpoint-card{width:160px;padding:0;border:0;border-radius:8px;background:none;box-shadow:0 3px 8px #0009;text-align:left;container-type:inline-size}
.endpoint-card :global(.card-face){width:100%}.native-read .endpoint-details{min-width:0}.native-read .power .boundary{display:block}
.native-read.power-view .power{padding:0}
/* Use the same original illustration as the production System face; retain the
   full-width semantic title and existing numbered fleet cubes at occupied nodes. */
.node .map-system-art{position:relative;display:inline-block;width:25px;height:14px;vertical-align:middle;margin-right:3px;overflow:hidden;border:1px solid #ad945d;border-radius:7px;background:#102f37;pointer-events:none}
.map-system-art :global(svg){display:block;width:100%;height:100%;object-fit:cover}

/* Short corner and cardinal editors reserve its reader for the actual selected ship/path.
   Keep all44px actions in one row, with the exact commitment summary above. */
:is(.compact,.dense) .budget .source-identity{flex-basis:auto;margin-left:auto}
:is(.compact,.dense) .view-tabs button{padding:4px 5px}
:is(.compact,.dense) .route{min-height:44px;gap:8px;padding:2px 0}
:is(.compact,.dense) .route strong{display:block;font-size:12px;line-height:1.25}
:is(.compact,.dense) .route p{font-size:11px;line-height:1.3;margin:2px 0 0}
:is(.compact,.dense) .route-cube{width:32px;height:32px;border-radius:5px;font-size:25px}
:is(.compact,.dense) button.endpoint-art{width:44px;height:44px;min-width:44px;padding:2px}
.endpoint-art img{display:block;width:100%;height:100%;object-fit:cover}
.route-allocation{font-size:11px;line-height:1.3;margin:4px 0;color:#e4d7b3}
:is(.compact,.dense):not(.native-read):not(.power-view):not(.map-view) .jump-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:4px;border:1px solid #b89c60;border-radius:7px;background:#19363c}
:is(.compact,.dense):not(.native-read):not(.power-view):not(.map-view) .edits,:is(.compact,.dense):not(.native-read):not(.power-view):not(.map-view) .commit{display:contents}
:is(.compact,.dense):not(.native-read):not(.power-view):not(.map-view) .edits button,:is(.compact,.dense):not(.native-read):not(.power-view):not(.map-view) .commit .primary{grid-row:2;min-width:0;padding:5px}
:is(.compact,.dense):not(.native-read):not(.power-view):not(.map-view) .commit p{grid-column:1/-1;grid-row:1;margin:0;font-size:11px;line-height:1.3}
/* Keep the same readable control allocation in the short cardinal reader. */
.dense .budget{padding:6px 8px;font-size:12px;gap:4px 10px;min-height:34px}
.dense .budget strong{font-size:20px}.dense .budget small{display:none}
.dense .view-tabs{padding:4px 0;gap:4px}.dense>.ship-choice{margin:3px}
.dense .plan-scroll{padding:3px}
/* Final power keeps the endpoint identity/consequence above the fold. Route
   edits remain available in the adjacent Route editor and Routes views. */
.dense.power-view .edits,.dense.power-view .power>h4{display:none}
.dense.power-view .power{padding:4px}
.compact:not(.native-read).power-view .power{padding:4px}
.compact:not(.native-read).power-view .power section{padding:0;border-top:0}
/* Keep every title, illustration/type row and cube inside its physical object. */
.node{height:52px}.compact .node,.compact .node.attached{width:70px}.node small{display:flex;align-items:center;justify-content:center;gap:1px}
.compact .node .map-system-art{width:22px;margin-right:2px;flex:none}.compact .node .map-cube{width:16px}
.compact.map-view .budget{padding:4px 8px}.compact.map-view .view-tabs{padding:2px 0}
.narrow-map .map{height:300px;min-height:300px}
</style>
