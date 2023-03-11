<script lang="ts">
  import { getContextClient, type RouterInput } from '$lib/trpc'

  const trpc = getContextClient()
  const downloadsQuery = trpc.downloads.getAll.query()
  const importDownloadMutation = trpc.import.download.mutation()

  const handleImport = (id: RouterInput['import']['download']['id']) =>
    $importDownloadMutation.mutate(
      { id },
      {
        onSuccess: () => {
          $downloadsQuery.refetch()
        },
      }
    )
</script>

{#if $downloadsQuery.data}
  {#if $downloadsQuery.data.length > 0}
    <div class="grid w-fit grid-cols-3 gap-x-3">
      {#each $downloadsQuery.data as download (download.id)}
        <div class="contents">
          <div>{download.name}</div>
          <div>
            {#if download.complete}
              Complete
            {:else}
              Downloading...
            {/if}
          </div>
          {#if download.complete}
            <button on:click={() => handleImport(download.id)}> Import </button>
          {:else}
            <div />
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div>No downloads</div>
  {/if}
{:else if $downloadsQuery.error}
  <div>{$downloadsQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
