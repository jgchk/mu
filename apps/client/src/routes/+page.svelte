<script lang="ts">
  import { getContextClient } from '$lib/trpc';

  const trpc = getContextClient();
  const pingQuery = trpc.ping.query();

  const handlePing = () => {
    void $pingQuery.refetch();
  };
</script>

<button on:click={handlePing}>Ping</button>

<div>{$pingQuery.data}</div>
