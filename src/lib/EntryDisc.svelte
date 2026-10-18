<script lang="ts">
  import InstrumentIcon from './InstrumentIcon.svelte';
  let { label, icon = 'orbit', tone = 'teal', compact = false, disabled = false, accessibleName, onclick }: {
    label: string;
    icon?: 'orbit' | 'book' | 'return' | 'table';
    tone?: 'teal' | 'gold' | 'violet';
    compact?: boolean;
    disabled?: boolean;
    accessibleName?: string;
    onclick: () => void;
  } = $props();
</script>
<button class="entry-disc" class:compact data-tone={tone} aria-label={accessibleName ?? label} {disabled} {onclick}>
  <span class="disc-face"><InstrumentIcon kind={icon} /><span class="disc-label">{label}</span></span>
</button>
