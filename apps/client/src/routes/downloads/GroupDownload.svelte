<script lang="ts">
  import { getTimeSinceShort, sum, toPrettyDate } from 'utils'

  import { tooltip } from '$lib/actions/tooltip'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import LinkButton from '$lib/atoms/LinkButton.svelte'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
  import { createDeleteGroupDownloadMutation } from '$lib/services/downloads'
  import { getContextClient } from '$lib/trpc'

  import GroupDownloadTrack from './GroupDownloadTrack.svelte'
  import type {
    GroupDownload as GroupDownloadType,
    TrackDownload as TrackDownloadType,
  } from './types'

  export let group: GroupDownloadType & { tracks: TrackDownloadType[] }

  let status: { type: 'complete' | 'queued' | 'idle' } | { type: 'downloading'; progress: number } =
    {
      type: 'queued',
    }
  $: {
    if (group.tracks.length === 0) {
      status = { type: 'idle' }
    } else if (group.tracks.every((track) => track.progress === 100)) {
      status = { type: 'complete' }
    } else if (group.tracks.every((track) => track.progress === null)) {
      status = { type: 'queued' }
    } else {
      const totalProgress = group.tracks.length * 100
      const currentProgress = sum(group.tracks.map((track) => track.progress ?? 0))
      status = {
        type: 'downloading',
        progress: Math.floor((currentProgress / totalProgress) * 100),
      }
    }
  }

  const trpc = getContextClient()
  const deleteGroupDownloadMutation = createDeleteGroupDownloadMutation(trpc)
  const handleDeleteGroupDownload = () => {
    $deleteGroupDownloadMutation.mutate({ id: group.id, service: group.service })
  }
</script>

<div class="max-w-4xl rounded bg-gray-900 p-4 text-gray-200">
  <div class="grid items-center gap-x-4" style:grid-template-columns="auto 1fr auto">
    <div class="contents">
      <div class="mb-2 truncate text-lg">{group.name ?? 'Loading...'}</div>
      <div />
      <div class="mb-2 flex items-center">
        {#if status.type === 'complete'}
          <LinkButton kind="outline" href="/downloads/{group.service}/group/{group.id}/import">
            Import
          </LinkButton>
        {:else if status.type === 'downloading'}
          {status.progress}%
        {/if}
        <IconButton
          tooltip="Delete"
          on:click={handleDeleteGroupDownload}
          loading={$deleteGroupDownloadMutation.isLoading}
        >
          <DeleteIcon />
        </IconButton>
      </div>
    </div>
    {#each group.tracks as track (track.id)}
      <GroupDownloadTrack {track} />
    {/each}
  </div>
  <div class="mt-3 flex items-center gap-4 text-sm">
    <div class="rounded bg-gray-500 bg-opacity-40 px-1.5 py-0.5 capitalize">{group.service}</div>
    <div
      class="rounded bg-gray-500 bg-opacity-40 px-1.5 py-0.5"
      use:tooltip={{ content: toPrettyDate(group.createdAt) }}
    >
      {getTimeSinceShort(group.createdAt)}
    </div>
  </div>
</div>
