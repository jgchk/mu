<script lang="ts">
  import { makeImageUrl } from 'mutils'
  import { ifDefined } from 'utils'

  import Button from '$lib/atoms/Button.svelte'
  import FlowGrid from '$lib/atoms/FlowGrid.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import TrackList from '$lib/components/TrackList.svelte'
  import { getContextDialogs } from '$lib/dialogs/dialogs'
  import { playTrack } from '$lib/now-playing'
  import { createReleasesByTagQuery } from '$lib/services/releases'
  import { createTagQuery, createTagsTreeQuery } from '$lib/services/tags'
  import { createFavoriteTrackMutation, createTracksByTagQuery } from '$lib/services/tracks'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  import Layout from '../+layout.svelte'
  import NavNode from '../NavNode.svelte'
  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  $: tagQuery = createTagQuery(trpc, data.id)
  const tagsQuery = createTagsTreeQuery(trpc)
  $: tagsMap = ifDefined($tagsQuery.data, (tags) => new Map(tags.map((t) => [t.id, t])))

  $: releasesQuery = createReleasesByTagQuery(trpc, data.id)
  $: tracksQuery = createTracksByTagQuery(trpc, data.tracksQuery)

  $: favoriteMutation = createFavoriteTrackMutation(trpc, {
    getTracksByTagQuery: data.tracksQuery,
  })

  const makeQueueData = (tracks: RouterOutput['tracks']['getByTag'], trackIndex: number) => ({
    previousTracks: tracks.slice(0, trackIndex).map((t) => t.id),
    nextTracks: tracks.slice(trackIndex + 1).map((t) => t.id),
  })

  const dialogs = getContextDialogs()
</script>

<Layout>
  <svelte:fragment slot="sidebar">
    {#if tagsMap}
      {@const tag = tagsMap.get(data.id)}

      {#if tag?.parents.length}
        {#each tag.parents as parentId (parentId)}
          {@const parent = tagsMap.get(parentId)}
          {#if parent}
            <a href="/tags/{parent.id}" class="block text-gray-400 hover:underline">
              {parent.name}
            </a>
          {/if}
        {/each}
      {:else}
        <a href="/tags" class="block text-gray-400 hover:underline">All Tags</a>
      {/if}
      <div class="ml-2">
        <NavNode id={data.id} {tagsMap} current />
      </div>
    {:else if $tagsQuery.error}
      <div>{$tagsQuery.error.message}</div>
    {:else}
      <FullscreenLoader />
    {/if}
  </svelte:fragment>

  <div class="p-4">
    {#if $tagQuery.data}
      {@const tag = $tagQuery.data}
      <div class="relative flex items-end gap-6">
        <div class="space-y-1 pb-2">
          <h1
            class="mr-11 line-clamp-2 break-all text-6xl font-bold leading-[1.19]"
            title={tag.name}
          >
            {tag.name}
          </h1>
          {#if tag.description}
            <p
              class="line-clamp-5 whitespace-pre-wrap leading-[1.19] text-gray-400"
              title={tag.description}
            >
              {tag.description}
            </p>
          {/if}
        </div>

        <div class="absolute right-0 top-0 flex gap-1">
          <Button kind="text" on:click={() => dialogs.open('delete-tag', { tag })}>Delete</Button>
          <Button
            kind="outline"
            on:click={() =>
              dialogs.open('edit-tag', {
                tag: {
                  ...tag,
                  parents: tagsMap?.get(tag.id)?.parents ?? [],
                  children: tagsMap?.get(tag.id)?.children ?? [],
                },
              })}
            disabled={!tagsMap}
          >
            Edit
          </Button>
        </div>
      </div>
    {/if}

    <h2 class="mb-4 mt-8 text-2xl font-bold">Releases</h2>
    {#if $releasesQuery.data}
      {@const releases = $releasesQuery.data}

      {#if releases.length > 0}
        <FlowGrid>
          {#each releases as release (release.id)}
            <div class="w-full">
              <a href="/releases/{release.id}" class="w-full">
                <CoverArt
                  src={release.imageId !== null
                    ? makeImageUrl(release.imageId, { size: 512 })
                    : undefined}
                />
              </a>
              <a
                href="/releases/{release.id}"
                class="mt-1 block truncate font-medium hover:underline"
                title={release.title}
              >
                {release.title}
              </a>
            </div>
          {/each}
        </FlowGrid>
      {:else}
        <div>No releases</div>
      {/if}
    {:else if $releasesQuery.error}
      <div>{$releasesQuery.error.message}</div>
    {:else}
      <FullscreenLoader />
    {/if}

    <h2 class="mb-4 mt-12 text-2xl font-bold">Tracks</h2>
    {#if $tracksQuery.data}
      {@const tracks = $tracksQuery.data}

      {#if tracks.length > 0}
        <TrackList
          {tracks}
          sortable
          favorites={data.tracksQuery.filter?.favorite ?? false}
          on:play={(e) => playTrack(e.detail.track.id, makeQueueData(tracks, e.detail.i))}
          on:favorite={(e) =>
            $favoriteMutation.mutate({ id: e.detail.track.id, favorite: e.detail.favorite })}
        />
      {:else}
        <div>No tracks</div>
      {/if}
    {:else if $tracksQuery.error}
      <div>{$tracksQuery.error.message}</div>
    {:else}
      <FullscreenLoader />
    {/if}
  </div>
</Layout>
