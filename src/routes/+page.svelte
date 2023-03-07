<script lang="ts">
  import { browser } from '$app/environment'
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const pingQuery = trpc.ping.query()
  let syncMutation = trpc.sync.mutation()

  const handlePing = () => {
    $pingQuery.refetch()
  }
  const handleSync = () => {
    $syncMutation.mutate()
  }
</script>

<button on:click={handlePing}>Ping</button>
<button on:click={handleSync}>Sync</button>

<div>{$pingQuery.data}</div>
<pre>{JSON.stringify($syncMutation.data, null, 2)}</pre>
