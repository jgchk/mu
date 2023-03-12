<script lang="ts">
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const tracksQuery = trpc.tracks.getAll.query()
</script>

{#if $tracksQuery.data}
  <div class="grid grid-cols-1">
    <div class="contents">
      <div>Title</div>
    </div>
    {#each $tracksQuery.data as track (track.id)}
      <a class="contents" href="/tracks/{track.id}">
        <div>{track.title}</div>
      </a>
    {/each}
  </div>
{:else if $tracksQuery.error}
  <div>{$tracksQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
