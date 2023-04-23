<script lang="ts">
  import IconButton from '$lib/atoms/IconButton.svelte'
  import LinkButton from '$lib/atoms/LinkButton.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import TagSelect from '$lib/components/TagSelect.svelte'
  import TrackList from '$lib/components/TrackList.svelte'
  import { makeImageUrl } from '$lib/cover-art'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import PlusIcon from '$lib/icons/PlusIcon.svelte'
  import { playTrack } from '$lib/now-playing'
  import { createReleaseWithTracksAndArtistsQuery } from '$lib/services/releases'
  import { createAddReleaseTagMutation, createReleaseTagsQuery } from '$lib/services/tags'
  import { createFavoriteTrackMutation } from '$lib/services/tracks'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  $: releaseQuery = createReleaseWithTracksAndArtistsQuery(trpc, data.id)
  $: releaseTagsQuery = createReleaseTagsQuery(trpc, data.id)

  $: favoriteMutation = createFavoriteTrackMutation(trpc, {
    getReleaseWithTracksAndArtistsQuery: { id: data.id },
  })

  let addTag: number | undefined
  const addTagMutation = createAddReleaseTagMutation(trpc)
  const handleAddTag = () => {
    if (addTag === undefined) return
    $addTagMutation.mutate({ releaseId: data.id, tagId: addTag })
  }

  const makeQueueData = (
    tracks: RouterOutput['releases']['getWithTracksAndArtists']['tracks'],
    trackIndex: number
  ) => ({
    previousTracks: tracks.slice(0, trackIndex).map((t) => t.id),
    nextTracks: tracks.slice(trackIndex + 1).map((t) => t.id),
  })
</script>

{#if $releaseQuery.data}
  {@const release = $releaseQuery.data}
  {@const tracks = release.tracks}

  <div class="space-y-4 p-4">
    <div class="relative flex items-end gap-6">
      <button
        type="button"
        disabled={tracks.length === 0}
        on:click={() => playTrack(tracks[0].id, makeQueueData(tracks, 0))}
      >
        <div class="relative w-64 shrink-0">
          <CoverArt
            src={release.imageId !== null
              ? makeImageUrl(release.imageId, { size: 512 })
              : undefined}
            alt={release.title}
            iconClass="w-16 h-16"
            hoverable={tracks.length > 0}
          >
            <PlayIcon />
          </CoverArt>
        </div>
      </button>

      <div class="space-y-1 pb-2">
        <h1
          class="mr-11 line-clamp-2 break-all text-6xl font-bold leading-[1.19]"
          title={release.title}
        >
          {release.title}
        </h1>
        <ul class="comma-list text-sm font-bold">
          {#each release.artists as artist (artist.id)}
            <li class="flex">
              <a class="hover:underline group-hover:text-white" href="/artists/{artist.id}"
                >{artist.name}</a
              >
            </li>
          {/each}
        </ul>
        {#if $releaseTagsQuery.data}
          {@const tags = $releaseTagsQuery.data}
          <ul class="comma-list text-sm">
            {#each tags as tag (tag.id)}
              <li>{tag.name}</li>
            {/each}
          </ul>
          <form class="flex items-center gap-1" on:submit|preventDefault={handleAddTag}>
            <TagSelect bind:value={addTag} />
            <IconButton type="submit" tooltip="Add tag" loading={$addTagMutation.isLoading}>
              <PlusIcon />
            </IconButton>
          </form>
        {/if}
      </div>

      <LinkButton href="/releases/{release.id}/edit" kind="outline" class="absolute right-0 top-0">
        Edit
      </LinkButton>
    </div>

    <TrackList
      {tracks}
      showCoverArt={false}
      on:play={(e) => playTrack(e.detail.track.id, makeQueueData(tracks, e.detail.i))}
      on:favorite={(e) =>
        $favoriteMutation.mutate({ id: e.detail.track.id, favorite: e.detail.favorite })}
    />
  </div>
{:else if $releaseQuery.error}
  <div>{$releaseQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
