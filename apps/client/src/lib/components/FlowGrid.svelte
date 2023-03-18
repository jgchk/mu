<script lang="ts">
  export let minColumnWidth = 150;
</script>

<div
  class="grid gap-4 p-4"
  style="grid-template-columns: repeat(auto-fit, minmax({minColumnWidth}px, 1fr));"
>
  <slot />
</div>
