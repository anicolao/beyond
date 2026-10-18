<script lang="ts">
  let { kind }: { kind: 'ore' | 'population' | 'food' | 'research' | 'ship' | 'star' } = $props();
</script>
<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
  {#if kind === 'ore'}<path d="m16 3 12 9-5 16H8L3 12Z" fill="currentColor" opacity=".2"/><path d="m16 3 12 9-5 16H8L3 12Zm0 0-4 14 11 11M3 12l9 5L8 28m4-11 16-5" />
  {:else if kind === 'population'}<circle cx="16" cy="7" r="4"/><path d="M10 28V15m12 13V15M6 20l4-8h12l4 8M16 19v9"/>
  {:else if kind === 'food'}<path d="M7 27C-2 9 18 5 28 3c-1 15-6 24-21 24Zm0 0L23 9"/>
  {:else if kind === 'research'}<path d="M5 26V6h22v20ZM11 6v20m10-20v20M5 12h22M5 20h22"/><circle cx="16" cy="16" r="3"/>
  {:else if kind === 'ship'}<path d="m16 3 5 13 7 8-9-2-3 7-3-7-9 2 7-8Z"/>
  {:else}<path d="m16 3 4 9 10 1-8 7 3 10-9-5-9 5 3-10-8-7 10-1Z"/>{/if}
</svg>
<style>svg { width: 1.65em; height: 1.65em; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }</style>
