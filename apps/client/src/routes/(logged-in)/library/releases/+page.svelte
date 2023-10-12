<script lang="ts">
  import { makeImageUrl } from 'mutils'
  import { inview } from 'svelte-inview'

  import Button from '$lib/atoms/Button.svelte'
  import CommaList from '$lib/atoms/CommaList.svelte'
  import FlowGrid from '$lib/atoms/FlowGrid.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  $: releasesQuery = trpc.releases.getAll.infiniteQuery(
    { title: data.searchQuery, limit: 100 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  )

  let inView = false
  $: {
    if (inView && $releasesQuery.hasNextPage && !$releasesQuery.isFetchingNextPage) {
      void $releasesQuery.fetchNextPage()
    }
  }
</script>

{#if $releasesQuery.data}
  {@const releases = $releasesQuery.data.pages.flatMap((page) => page.items)}
  <FlowGrid>
    {#each releases as release (release.id)}
      <div class="w-full">
        <a href="/library/releases/{release.id}" class="w-full">
          <CoverArt
            src={release.imageId !== null
              ? makeImageUrl(release.imageId, { size: 512 })
              : undefined}
          />
        </a>
        <a
          href="/library/releases/{release.id}"
          class="mt-1 block truncate font-medium hover:underline"
          title={release.title}
        >
          {release.title}
        </a>
        <div class="truncate text-sm text-gray-400">
          <CommaList items={release.artists} let:item>
            <a class="hover:underline" href="/library/artists/{item.id}">{item.name}</a>
          </CommaList>
        </div>
      </div>
    {/each}
  </FlowGrid>

  {#if $releasesQuery.hasNextPage}
    <div
      class="m-1 flex justify-center"
      use:inview
      on:inview_change={(event) => (inView = event.detail.inView)}
    >
      <Button kind="outline" on:click={() => $releasesQuery.fetchNextPage()}>
        {$releasesQuery.isFetchingNextPage ? 'Loading...' : 'Load More'}
      </Button>
    </div>
  {/if}
{:else if $releasesQuery.error}
  <div>{$releasesQuery.error.message}</div>
{:else}
  <FullscreenLoader />
{/if}
