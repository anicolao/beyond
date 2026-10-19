<script lang="ts">
  import type {CardSymbolKind} from './types';
  let { kind }: { kind: CardSymbolKind } = $props();
</script>
<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
  {#if kind === 'action'}<circle cx="16" cy="16" r="13"/><path d="M8 16h15m-6-6 6 6-6 6"/>
  {:else if kind === 'immediate'}<path d="m19 2-13 17h9l-2 11L27 12h-9Z" fill="currentColor" stroke-width="1"/>
  {:else if kind === 'supply'}<path d="m16 3 12 7v13l-12 7-12-7V10Zm0 13v14M4 10l12 6 12-6"/>
  {:else if kind === 'ore'}<path d="m16 3 12 9-5 16H8L3 12Z" fill="currentColor" opacity=".2"/><path d="m16 3 12 9-5 16H8L3 12Zm0 0-4 14 11 11M3 12l9 5L8 28m4-11 16-5" />
  {:else if kind === 'population'}<circle cx="16" cy="7" r="4"/><path d="M10 28V15m12 13V15M6 20l4-8h12l4 8M16 19v9"/>
  {:else if kind === 'food'}<path d="M7 27C-2 9 18 5 28 3c-1 15-6 24-21 24Zm0 0L23 9"/>
  {:else if kind === 'research'}<path d="M11 3h10M13 3v10L5 26q-1 3 3 3h16q4 0 3-3l-8-13V3M9 21h14"/><circle cx="14" cy="24" r="1"/><circle cx="19" cy="17" r="1"/>
  {:else if kind === 'ship'}<path d="m16 3 5 13 7 8-9-2-3 7-3-7-9 2 7-8Z"/>
  {:else}<path d="m16 3 4 9 10 1-8 7 3 10-9-5-9 5 3-10-8-7 10-1Z"/>{/if}
</svg>
<style>svg { width: 1.65em; height: 1.65em; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }</style>
