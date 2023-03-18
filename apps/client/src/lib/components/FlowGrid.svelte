<script lang="ts">
  export let targetColumnWidth = 200;

  let clientWidth: number | undefined;
  let numColumns = 1;
  $: {
    if (clientWidth !== undefined) {
      numColumns = getColumnCount(clientWidth, targetColumnWidth);
    } else {
      numColumns = 1;
    }
  }

  function getColumnCount(screenWidth: number, targetColumnWidth: number) {
    const columnCount = Math.floor(screenWidth / targetColumnWidth);
    const columnWidth = screenWidth / columnCount;
    const delta1 = Math.abs(columnWidth - targetColumnWidth);
    const delta2 = Math.abs(screenWidth / (columnCount + 1) - targetColumnWidth);
    return delta1 < delta2 ? columnCount : columnCount + 1;
  }
</script>

<div
  bind:clientWidth
  class="grid gap-4 p-4"
  style="grid-template-columns: repeat({numColumns}, 1fr);"
>
  <slot />
</div>
