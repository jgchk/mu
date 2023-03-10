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
    <ul>
      {#each $downloadsQuery.data as download (download.id)}
        <li>
          <button on:click={() => handleImport(download.id)}>
            {download.ref} ({download.complete ? 'complete' : 'downloading'})
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <div>No downloads</div>
  {/if}
{:else if $downloadsQuery.error}
  <div>{$downloadsQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
