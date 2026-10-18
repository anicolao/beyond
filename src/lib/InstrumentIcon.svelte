<script lang="ts">
  let { kind = 'orbit' }: { kind?: 'orbit' | 'book' | 'return' | 'table' | 'compass' } = $props();
</script>
<svg class="instrument-icon" viewBox="0 0 80 64" fill="none" aria-hidden="true" focusable="false">
  {#if kind === 'book'}
    <path d="M40 19C29 12 19 14 10 17L7 48c12-4 22-3 33 3 11-6 21-7 33-3l-3-31c-9-3-19-5-30 2Z" fill="currentColor" fill-opacity=".12" />
    <path d="M40 19C29 12 19 14 10 17L7 48c12-4 22-3 33 3 11-6 21-7 33-3l-3-31c-9-3-19-5-30 2Zm0 0v32M15 23c7-2 13-1 19 2m-20 5c7-2 14-1 20 2m-20 5c7-2 14-1 20 2m12-14c6-3 12-4 19-2m-19 9c6-3 13-4 20-2m-20 9c6-3 13-4 20-2" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
  {:else if kind === 'table'}
    <ellipse cx="40" cy="34" rx="24" ry="14" stroke="currentColor" stroke-width="1.5" />
    <ellipse cx="40" cy="34" rx="18" ry="9" stroke="currentColor" stroke-opacity=".4" />
    {#each [[40,10],[40,57],[6,34],[74,34]] as [cx,cy]}<circle {cx} {cy} r="4" fill="currentColor" />{/each}
    <path d="M16 15l4 4m40 0 4-4M16 53l4-4m40 0 4 4" stroke="currentColor" stroke-width="1.5" />
  {:else if kind === 'compass'}
    <circle cx="40" cy="32" r="22" stroke="currentColor" stroke-width=".7" />
    <ellipse cx="40" cy="32" rx="34" ry="10" transform="rotate(-20 40 32)" stroke="currentColor" stroke-width=".7" />
    <path d="m40 7 5 20 20 5-20 5-5 20-5-20-20-5 20-5Z" stroke="currentColor" fill="currentColor" fill-opacity=".15" />
    <circle cx="40" cy="32" r="3" fill="currentColor" />
  {:else}
    <circle cx="40" cy="30" r="14" fill="currentColor" fill-opacity=".13" stroke="currentColor" stroke-width="1.5" />
    <ellipse cx="40" cy="32" rx="33" ry="9" transform="rotate(-18 40 32)" stroke="currentColor" stroke-width="1.5" />
    <path d="M34 19c-5 7-5 16 0 22M46 19c5 7 5 16 0 22M27 26c7 4 19 4 26 0" stroke="currentColor" stroke-opacity=".45" />
    {#if kind === 'return'}<path d="m64 14 7 4-2-9M70 17C59 0 24 3 13 18" stroke="currentColor" stroke-width="1.6" />{:else}<circle cx="66" cy="18" r="2.5" fill="currentColor" />{/if}
  {/if}
</svg>
