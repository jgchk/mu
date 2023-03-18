<script lang="ts">
  import { getContextClient } from '$lib/trpc';

  let url = '';

  const trpc = getContextClient();
  const downloadMutation = trpc.downloads.download.mutation();

  const handleSubmit = () => {
    $downloadMutation.mutate({ service: 'spotify', url });
  };
</script>

<form on:submit|preventDefault={handleSubmit}>
  <input class="text-black" type="text" bind:value={url} required />
  <button type="submit" disabled={url.length === 0}>Submit</button>
</form>

{#if $downloadMutation.data}
  <div>
    <pre>{JSON.stringify($downloadMutation.data, null, 2)}</pre>
  </div>
{/if}
