<script lang="ts">
  import { tick } from 'svelte';
  import { factions, legalFaction, type FactionId, type PlayerCount } from './manifest';
  let { name, count, selected, taken=[], busy=false, choose, disabled=false, angle=0 }: {name:string;count:PlayerCount;selected?:FactionId;taken?:FactionId[];busy?:boolean;disabled?:boolean;angle?:number;choose:(id:FactionId)=>Promise<void>}=$props();
  let dialog=$state<HTMLDialogElement>(undefined!), origin:HTMLElement|null=null;
  async function open(){origin=document.activeElement as HTMLElement;await tick();dialog.showModal();}
  async function restoreFocus(){await tick();origin?.focus();origin?.scrollIntoView({block:'nearest',inline:'nearest'});}
  function portal(node:HTMLDialogElement){document.body.append(node);return{destroy(){node.remove();}};}
  function key(event:KeyboardEvent){if(event.key!=='Tab')return;const controls=[...dialog.querySelectorAll<HTMLElement>('button:not([disabled])')];if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls.at(-1)?.focus();}else if(!event.shiftKey&&document.activeElement===controls.at(-1)){event.preventDefault();controls[0]?.focus();}}
</script>
<button class="faction-trigger" disabled={busy||disabled} aria-label={`Choose faction for ${name}`} aria-haspopup="dialog" onclick={()=>{void open();}}>{selected ? factions.find(f=>f.id===selected)?.short : 'Choose faction'}<span aria-hidden="true"> ↗</span></button>
<dialog use:portal class:angled={angle!==0} style={`--reader-angle:${angle}deg`} bind:this={dialog} aria-label={`Basic faction for ${name}`} onkeydown={key} onclose={()=>{void restoreFocus();}}>
  <div class="faction-paper" data-e2e-layout>
    <header><div><p class="eyebrow">A PLACE IN HUMANITY’S FUTURE</p><h2>{name}’s faction</h2></div><button onclick={()=>dialog.close()}>Close factions</button></header>
    <p>Choose a different Basic faction for each player. The printed setup bonus is applied when you Begin.</p>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (Named bounded choice list has keyboard scrolling.) -->
    <div class="faction-options" role="region" tabindex="0" aria-label="Available Basic factions">
      {#each factions as faction}
        {@const legal=legalFaction(faction.id,count)}{@const unavailable=taken.includes(faction.id)&&selected!==faction.id}
        <button class:selected={selected===faction.id} disabled={busy||!legal||unavailable||selected===faction.id} aria-label={`Select ${faction.name}`} onclick={async()=>{await choose(faction.id);dialog.close();}}>
          <span class="faction-seal" aria-hidden="true">{faction.emblem}</span><span class="faction-copy"><strong>{faction.name}</strong><span>{faction.bonus}</span><small>{!legal?'Unavailable with 2 players':unavailable?'Chosen by another player':selected===faction.id?'Your current faction':'Available'}</small></span>
        </button>
      {/each}
    </div>
  </div>
</dialog>
<style>
.faction-trigger{scroll-margin-block:12px;min-height:44px;max-width:100%;padding:8px 12px;font-size:12px;color:inherit;border-color:#9a8050;background:linear-gradient(130deg,#fff4dc22,#3d4c4222);text-align:center;overflow-wrap:anywhere}.faction-trigger span{color:#977337}
dialog{padding:0;border:2px solid #b79a5c;border-radius:12px;background:#e8d8b6;max-width:min(800px,calc(100vw - 24px));max-height:88dvh;color:#24352f;box-shadow:0 0 0 5px #d2b67c55,0 30px 90px #000b}dialog::backdrop{background:#001017cc;backdrop-filter:blur(3px)}.faction-paper{padding:26px;max-height:85dvh;overflow:auto;background:repeating-linear-gradient(0deg,#fff2 0 1px,transparent 1px 4px),linear-gradient(120deg,#fff4d7,#d9c69f)}header{display:flex;align-items:center;gap:20px;justify-content:space-between}h2{font:600 36px/1 'Cormorant Garamond',serif;margin:5px 0}.eyebrow{font-size:9px;color:#75603c}.faction-paper>p{font-size:14px;line-height:1.5;max-width:56ch;margin:16px 0}.faction-options{display:grid;grid-template-columns:1fr 1fr;gap:16px}.faction-options>button{display:flex;align-items:center;gap:16px;padding:20px;text-align:left;color:#253831;border:1px solid #a98c55;box-shadow:inset 0 0 0 4px #b29a6240,0 3px #8a7653,3px 8px 13px #362c2733;background:linear-gradient(130deg,#fff4d8,#e0cdab);border-radius:8px}.faction-options>button:disabled{opacity:.7}.faction-options>button.selected{box-shadow:inset 0 0 0 3px #267c70,0 3px #8a7653;opacity:1}.faction-seal{display:flex;align-items:center;justify-content:center;flex-shrink:0;width:48px;height:48px;border:1px solid #ad8a4f;border-radius:50%;background:radial-gradient(circle at 35% 25%,#536b60,#192e31);color:#e9ce8f;font:32px 'Cormorant Garamond',serif;box-shadow:0 3px #4a412d}.faction-copy{display:flex;flex-direction:column;gap:8px}.faction-copy strong{font:600 23px/1.05 'Cormorant Garamond',serif}.faction-copy>span{font-size:13px;line-height:1.4}.faction-copy small{font-size:11px;color:#5c6456}header>button{font-size:12px;white-space:nowrap;min-height:44px}
@media(max-width:600px){.faction-paper{padding:17px}.faction-options{grid-template-columns:1fr;gap:12px}.faction-options>button{padding:15px}.faction-paper header{gap:10px}h2{font-size:29px}}
.faction-paper{display:flex;flex-direction:column;min-height:0;overflow:hidden}.faction-options{min-height:0;overflow:auto;flex:1;padding:10px}.faction-copy{min-width:0;overflow-wrap:anywhere}.faction-paper>header{flex-shrink:0}.faction-paper>p{flex-shrink:0}dialog.angled{transform:rotate(var(--reader-angle));width:min(800px,64vmin);max-height:64vmin;max-width:64vmin}dialog.angled .faction-paper{max-height:calc(64vmin - 8px)}
@media(min-width:761px) and (max-height:850px){
 dialog.angled{width:90vmin;max-width:90vmin;max-height:50vmin}
 dialog.angled .faction-paper{max-height:calc(50vmin - 4px);padding:12px}
 dialog.angled .faction-paper>p,dialog.angled .eyebrow,dialog.angled .faction-seal{display:none}
 dialog.angled h2{font-size:26px}
 dialog.angled .faction-options{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:6px}
 dialog.angled .faction-options>button{padding:8px}
 dialog.angled .faction-copy{gap:4px}
}
</style>
