<script lang="ts">
  import InstrumentIcon from './InstrumentIcon.svelte';
  let { label, detail, accessibleName = label, icon, tone, href, disabled = false, onclick }: {
    label: string; detail: string; accessibleName?: string;
    icon: 'table' | 'orbit' | 'return'; tone: 'gold' | 'teal' | 'violet';
    href?: string; disabled?: boolean; onclick?: () => void;
  } = $props();
</script>
{#snippet face()}
  <span class="instrument-face"><InstrumentIcon kind={icon}/><span class="instrument-label">{label}</span><span class="instrument-detail">{detail}</span></span>
{/snippet}
{#if href}
  <a class="mode-instrument" data-tone={tone} {href} aria-label={accessibleName}>{@render face()}</a>
{:else}
  <button class="mode-instrument" data-tone={tone} {disabled} {onclick} aria-label={accessibleName}>{@render face()}</button>
{/if}
<style>
.mode-instrument { --light:#7de8d8; --pool:#143b3d; --glow:#45bcb355; position:relative; isolation:isolate; display:block; flex:0 0 auto; width:clamp(225px,22vw,320px); height:clamp(176px,16vw,230px); padding:9px; border:1px solid #e5c483; border-radius:50%; text-align:center; text-decoration:none; color:#fff0ce; background:conic-gradient(from 105deg,#e3bd79,#65421e 17%,#d7b36c 25%,#efdaa0 34%,#75572e 47%,#af874a 63%,#f8e3ae 76%,#88612f 94%,#e3bd79); box-shadow:0 5px #6f4e27,0 9px #1c2425,0 12px #ae8a4b,4px 24px 22px #000a,13px 32px 38px #0007; transition:transform 140ms ease,filter 140ms ease; }
.mode-instrument[data-tone='gold'] { --light:#efd59c; --pool:#3a3020; --glow:#cda15944; }
.mode-instrument[data-tone='violet'] { --light:#d6bde8; --pool:#30283d; --glow:#a98ac544; }
.mode-instrument:before { content:''; pointer-events:none; position:absolute; inset:4px; border:1px solid #ffebbb99; border-radius:inherit; box-shadow:inset 0 -3px 3px #241a12aa; }
.instrument-face { position:relative; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:7px; width:100%; height:100%; padding:13px 19px; border:2px solid var(--light); border-radius:50%; background:radial-gradient(ellipse at 50% 4%,#ffffff20,transparent 50%),radial-gradient(ellipse at 50% 30%,var(--pool),#08171f 85%); box-shadow:inset 0 0 0 5px #071920,inset 0 0 0 6px #e2d5ad33,inset 0 0 23px var(--glow),0 0 10px var(--glow); }
.instrument-face :global(svg) { width:63px; height:44px; color:var(--light); filter:drop-shadow(0 0 5px var(--glow)); }
.instrument-label { font:600 clamp(25px,2.3vw,34px)/1.02 'Cormorant Garamond',serif; max-width:230px; text-shadow:0 2px 3px #000b; }
.instrument-detail { max-width:180px; color:#d7d6c1; font:12px/1.25 'Atkinson Hyperlegible',sans-serif; }
.mode-instrument:hover:not(:disabled) { transform:translateY(-4px); filter:brightness(1.08); }
.mode-instrument:active:not(:disabled) { transform:translateY(2px); }
.mode-instrument:focus-visible { outline:3px solid #bcfff1; outline-offset:9px; }
.mode-instrument:disabled { filter:saturate(.3); cursor:default; }
@media(min-width:2200px) { .mode-instrument { width:650px; height:430px; padding:16px; }.instrument-face { gap:18px; padding:26px 40px; }.instrument-face :global(svg) { width:125px; height:85px; }.instrument-label { max-width:420px; font-size:57px; }.instrument-detail { max-width:340px; font-size:23px; } }
@media(max-width:700px) { .mode-instrument { width:244px; height:145px; padding:7px; }.instrument-face { gap:4px; padding:10px 23px; }.instrument-face :global(svg) { width:48px; height:32px; }.instrument-label { font-size:25px; max-width:190px; }.instrument-detail { font-size:10px; max-width:165px; } }
@media(prefers-reduced-motion:reduce) { .mode-instrument { transition:none; } }
</style>
