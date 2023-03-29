<script lang="ts">
  let count = 0

  function handleClick() {
    count += 1
  }
</script>

<button type="button" on:click={handleClick}>
  clicks: {count}
</button>
