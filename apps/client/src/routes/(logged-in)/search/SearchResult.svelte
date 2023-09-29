<script lang="ts">
  import { makeCollageUrl, makeImageUrl } from 'mutils'
  import { cn } from 'utils/browser'

  import CommaList from '$lib/atoms/CommaList.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import { player } from '$lib/now-playing'

  import type { SearchResult } from './model'
  import { getTitle } from './model'

  export let result: SearchResult

  $: title = getTitle(result)

  let coverArtSrc: string | undefined
  $: if ('imageId' in result && result.imageId !== null) {
    coverArtSrc = makeImageUrl(result.imageId, { size: 80 })
  } else if ('imageIds' in result) {
    coverArtSrc = makeCollageUrl(result.imageIds, { size: 80 })
  } else {
    coverArtSrc = undefined
  }

  let href: string | undefined
  let onClick: (() => void) | undefined

  $: if (result.kind === 'track') {
    href = undefined
    onClick = () => player.playTrack(result.id)
  } else if (result.kind === 'release') {
    href = `/library/releases/${result.id}`
    onClick = undefined
  } else if (result.kind === 'artist') {
    href = `/library/artists/${result.id}`
    onClick = undefined
  } else if (result.kind === 'playlist') {
    href = `/library/playlists/${result.id}`
    onClick = undefined
  } else if (result.kind === 'tag') {
    href = `/library/tags/${result.id}`
    onClick = undefined
  } else {
    href = undefined
    onClick = undefined
  }
</script>

<svelte:element
  this={result.kind === 'track' ? 'button' : 'a'}
  class={cn(
    'flex w-full cursor-pointer gap-2 p-1.5 text-left',
    result.kind === 'track' && 'transition active:origin-center active:scale-[99%] active:transform'
  )}
  {href}
  on:click={onClick}
>
  <div class="block h-11 w-11">
    <CoverArt
      src={coverArtSrc}
      alt={title}
      iconClass="w-5 h-5"
      placeholderClass="text-[5px]"
      rounding="rounded-sm"
      hoverable={false}
    />
  </div>

  <div class="min-w-0 flex-1 overflow-hidden">
    <div class="truncate">{title}</div>
    <div class="truncate text-sm text-gray-400">
      <span class="capitalize">{result.kind}</span>
      {#if 'artists' in result}
        •
        <CommaList items={result.artists} let:item>
          <a class="hover:underline" href="/library/artists/{item.id}">{item.name}</a>
        </CommaList>
      {/if}
    </div>
  </div>
</svelte:element>
