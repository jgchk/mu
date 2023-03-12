<script lang="ts">
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const releasesQuery = trpc.releases.getAll.query()
</script>

{#if $releasesQuery.data}
  <div class="grid grid-cols-1">
    <div class="contents">
      <div>Title</div>
    </div>
    {#each $releasesQuery.data as release (release.id)}
      <a class="contents" href="/releases/{release.id}">
        <div>{release.title}</div>
      </a>
    {/each}
  </div>
{:else if $releasesQuery.error}
  <div>{$releasesQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
