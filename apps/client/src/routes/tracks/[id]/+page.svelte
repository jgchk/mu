<script lang="ts">
  import { getContextClient } from '$lib/trpc';

  import type { PageData } from './$types';
  import TrackForm from './TrackForm.svelte';

  export let data: PageData;

  const trpc = getContextClient();
  const trackQuery = trpc.tracks.getById.query({ id: data.id });
  const trackMutation = trpc.tracks.updateMetadata.mutation();
</script>

{#if $trackQuery.data}
  <TrackForm
    track={$trackQuery.data}
    on:submit={(event) => $trackMutation.mutate({ id: data.id, data: event.detail })}
  />
{:else if $trackQuery.error}
  <div>{$trackQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
