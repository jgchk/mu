<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import { clickOutside } from '$lib/actions/clickOutside'
  import { createPopperAction } from '$lib/actions/popper'
  import Input from '$lib/atoms/Input.svelte'
  import { createAllArtistsQuery } from '$lib/services/artists'
  import { dropdown } from '$lib/transitions/dropdown'
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const artistsQuery = createAllArtistsQuery(trpc)

  export let value:
    | {
        id: number
        action: 'connect'
      }
    | {
        id: number
        action: 'create'
      }
    | undefined = undefined
  export let createArtists: Map<number, string>
  export let open = false

  export let filter = ''
  $: filteredArtists = [
    ...((filter.length > 0
      ? $artistsQuery.data
          ?.filter((artist) => artist.name.toLowerCase().includes(filter.toLowerCase()))
          .map((artist) => ({ action: 'connect', ...artist } as const))
      : $artistsQuery.data?.map((artist) => ({ action: 'connect', ...artist } as const))) ?? []),
    ...(filter.length > 0
      ? [...createArtists.entries()]
          .filter(([, name]) => name.toLowerCase().includes(filter.toLowerCase()))
          .map(([id, name]) => ({ action: 'created', id, name } as const))
      : [...createArtists.entries()].map(
          ([id, name]) => ({ action: 'created', id, name } as const)
        )),
  ]

  let displayFilter = filter

  $: {
    if (value === undefined) {
      displayFilter = ''
    } else if (value.action === 'connect') {
      if ($artistsQuery.data) {
        const value_ = value
        const artist = $artistsQuery.data.find((artist) => artist.id === value_.id)
        if (artist) {
          displayFilter = artist.name
        } else {
          displayFilter = 'Unknown'
        }
      } else if ($artistsQuery.error) {
        displayFilter = 'Error'
      } else {
        displayFilter = 'Loading...'
      }
    } else {
      const name = createArtists.get(value.id)
      displayFilter = name ?? 'Unknown'
    }
  }

  const dispatch = createEventDispatcher<{ create: string; created: number; connect: number }>()

  const [popperElement, popperTooltip] = createPopperAction()
</script>

<div class="relative w-fit" use:clickOutside={() => (open = false)}>
  <div use:popperElement>
    <Input
      type="text"
      value={displayFilter}
      on:input={(e) => {
        filter = e.currentTarget.value
        displayFilter = e.currentTarget.value
      }}
      on:focus={() => (open = true)}
      on:keydown={(e) => {
        switch (e.key) {
          case 'Enter': {
            e.preventDefault()
            if (filteredArtists.length === 0) {
              dispatch('create', displayFilter)
            } else {
              dispatch(filteredArtists[0].action, filteredArtists[0].id)
            }
            filter = ''
            break
          }
          case 'Tab': {
            open = false
            break
          }
        }
      }}
    />
  </div>

  {#if open}
    <div
      class="relative z-10 w-full overflow-hidden rounded bg-gray-700 shadow"
      transition:dropdown|local
      use:popperTooltip={{
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 4],
            },
          },
        ],
      }}
    >
      {#if filteredArtists.length > 0}
        {#each filteredArtists as artist}
          <button
            tabIndex={-1}
            type="button"
            class="block w-full px-2 py-1 text-left hover:bg-gray-600"
            on:click={() => {
              dispatch(artist.action, artist.id)
              filter = ''
            }}
          >
            {artist.name}
          </button>
        {/each}
      {/if}

      {#if displayFilter.length > 0}
        <button
          tabIndex={-1}
          type="button"
          class="block w-full px-2 py-1 text-left hover:bg-gray-600"
          on:click={() => {
            dispatch('create', displayFilter)
            filter = ''
          }}
        >
          Create new artist: {displayFilter}
        </button>
      {/if}

      <div
        class="pointer-events-none absolute left-0 top-0 h-full w-full rounded border border-white opacity-5"
      />
    </div>
  {/if}
</div>
