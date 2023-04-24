<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import { clickOutside } from '$lib/actions/clickOutside'
  import { createPopperAction } from '$lib/actions/popper'
  import Input from '$lib/atoms/Input.svelte'
  import { createTagsQuery } from '$lib/services/tags'
  import { dropdown } from '$lib/transitions/dropdown'
  import { getContextClient } from '$lib/trpc'

  export let value: number | undefined = undefined
  export let open = false
  export let id: string | undefined = undefined

  const trpc = getContextClient()
  const tagsQuery = createTagsQuery(trpc)

  export let filter = ''
  $: filteredTags =
    $tagsQuery.data?.filter((tag) => tag.name.toLowerCase().includes(filter.toLowerCase())) ?? []

  let displayFilter = filter

  $: {
    if (value === undefined) {
      displayFilter = ''
    } else {
      if ($tagsQuery.data) {
        const artist = $tagsQuery.data.find((tag) => tag.id === value)
        if (artist) {
          displayFilter = artist.name
        } else {
          displayFilter = 'Unknown'
        }
      } else if ($tagsQuery.error) {
        displayFilter = 'Error'
      } else {
        displayFilter = 'Loading...'
      }
    }
  }

  const [popperElement, popperTooltip] = createPopperAction()

  const dispatch = createEventDispatcher<{ change: { value: number | undefined } }>()
  const change = (v: number | undefined) => {
    value = v
    dispatch('change', { value: v })
  }
</script>

<div class="relative w-fit" use:clickOutside={() => (open = false)}>
  <div use:popperElement>
    <Input
      {id}
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
            if (filteredTags.length === 0) {
              change(undefined)
            } else {
              change(filteredTags[0].id)
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
      {#if filteredTags.length > 0}
        {#each filteredTags as tag}
          <button
            tabIndex={-1}
            type="button"
            class="block w-full px-2 py-1 text-left hover:bg-gray-600"
            on:click={() => {
              change(tag.id)
              filter = ''
            }}
          >
            {tag.name}
          </button>
        {/each}
      {/if}

      <div
        class="pointer-events-none absolute left-0 top-0 h-full w-full rounded border border-white opacity-5"
      />
    </div>
  {/if}
</div>
