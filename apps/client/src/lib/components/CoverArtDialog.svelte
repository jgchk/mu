<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { sleep } from 'utils'
  import type { Timeout } from 'utils'
  import { fetcher } from 'utils/browser'

  import Button from '$lib/atoms/Button.svelte'
  import CommaList from '$lib/atoms/CommaList.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import FlowGrid from '$lib/atoms/FlowGrid.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import Loader from '$lib/atoms/Loader.svelte'
  import { createSearchCoverArtQuery } from '$lib/services/search'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  import CoverArt from './CoverArt.svelte'
  import FullscreenLoader from './FullscreenLoader.svelte'

  export let defaultArtUrl: string | undefined
  let hasDefaultArt = defaultArtUrl !== undefined

  export let query = ''
  let debouncedQuery = query

  const handleSearch = () => {
    clearTimeout(timeout)
    debouncedQuery = query
  }

  let timeout: Timeout | undefined = undefined
  $: {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      debouncedQuery = query
    }, 1000)
  }

  const trpc = getContextClient()
  $: coverArtQuery = createSearchCoverArtQuery(trpc, debouncedQuery)

  const dispatch = createEventDispatcher<{ close: undefined; submit: File }>()
  const close = () => dispatch('close')

  let state:
    | { url: string; downloading: true }
    | { url: string; downloading: false; data: File }
    | undefined = undefined
  const handleSelect = async (url: string) => {
    state = { url, downloading: true }
    const blob = await fetcher(fetch)(url).then((res) => res.blob())
    const file = new File([blob], url.split('/').pop() ?? 'cover')
    state = { url, downloading: false, data: file }
  }

  const toast = getContextToast()
  const handleSubmit = async () => {
    if (state === undefined) {
      return toast.error('Please select a cover')
    }

    // wait until the file is downloaded, but timeout after 10 seconds
    const timeoutDate = Date.now() + 10000
    while (state.downloading && Date.now() < timeoutDate) {
      await sleep(100)
    }
    if (state.downloading) {
      return toast.error('Timed out while downloading cover')
    }

    dispatch('submit', state.data)
    close()
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <Dialog title="Find cover art" on:close={close} class="max-w-2xl">
    <div class="space-y-4">
      <div class="flex gap-1">
        <Input
          bind:value={query}
          class="w-full"
          on:keydown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSearch()
            }
          }}
        />
        <Button on:click={handleSearch} loading={$coverArtQuery.isLoading}>Search</Button>
      </div>

      <div>
        <FlowGrid>
          {#if defaultArtUrl && hasDefaultArt}
            {@const defaultArtUrl_ = defaultArtUrl}
            <div class="w-full">
              <button type="button" class="w-full" on:click={() => handleSelect(defaultArtUrl_)}>
                <CoverArt
                  src={defaultArtUrl}
                  alt="Filesystem Art"
                  on:error={() => (hasDefaultArt = false)}
                  iconClass="opacity-100"
                  selected={state?.url === defaultArtUrl_}
                >
                  {#if state?.downloading && state.url === defaultArtUrl_}
                    <Loader />
                  {/if}
                </CoverArt>
              </button>
              <div class="block truncate font-medium">File</div>
            </div>
          {/if}

          {#if $coverArtQuery.data}
            {@const results = $coverArtQuery.data}
            {#each results as result (result.id)}
              {#each result.images as image (image.id)}
                <div class="w-full">
                  <button type="button" class="w-full" on:click={() => handleSelect(image.image)}>
                    <CoverArt
                      src={image.thumbnails['500'] ?? image.image}
                      alt={result.title}
                      iconClass="opacity-100"
                      selected={state?.url === image.image}
                    >
                      {#if state?.downloading && state.url === image.image}
                        <Loader />
                      {/if}
                    </CoverArt>
                  </button>
                  <div class="block truncate font-medium" title={result.title}>
                    {result.title}
                  </div>
                  <div class="truncate text-sm text-gray-400">
                    <CommaList items={result['artist-credit']} let:item>
                      <span>{item.artist.name}</span>
                    </CommaList>
                  </div>
                </div>
              {/each}
            {/each}
          {:else if $coverArtQuery.isLoading}
            <FullscreenLoader />
          {/if}
        </FlowGrid>
      </div>
    </div>

    <svelte:fragment slot="buttons">
      <Button
        type="submit"
        disabled={state === undefined}
        tooltip={state === undefined ? 'Select a cover' : undefined}>Save</Button
      >
      <Button kind="outline" on:click={close}>Cancel</Button>
    </svelte:fragment>
  </Dialog>
</form>
