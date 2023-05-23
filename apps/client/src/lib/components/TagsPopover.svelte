<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { fade } from 'svelte/transition'
  import { ifDefined } from 'utils'

  import type { PopperTooltipAction } from '$lib/actions/popper'
  import { tooltip } from '$lib/actions/tooltip'
  import Button from '$lib/atoms/Button.svelte'
  import Delay from '$lib/atoms/Delay.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import Loader from '$lib/atoms/Loader.svelte'
  import PopoverArrow from '$lib/components/PopoverArrow.svelte'
  import CheckIcon from '$lib/icons/CheckIcon.svelte'
  import { createTagsQuery } from '$lib/services/tags'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'
  import { tw } from '$lib/utils/classes'

  export let selectedTagIds: number[]
  $: selectedTagIdsSet = new Set(selectedTagIds)

  export let popperTooltip: PopperTooltipAction
  let class_: string | undefined = undefined
  export { class_ as class }

  const trpc = getContextClient()
  const tagsQuery = createTagsQuery(trpc, { taggable: true })

  const dispatch = createEventDispatcher<{
    close: undefined
    tag: { id: number; tagged: boolean }
  }>()
  const close = () => dispatch('close')
  const handleTag = (tagId: number, tagged: boolean) => {
    dispatch('tag', { id: tagId, tagged })
  }

  let filter = ''
  let filteredTags: RouterOutput['tags']['getAll'] | undefined = undefined
  $: filteredTags = ifDefined($tagsQuery.data, (tags) =>
    tags.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
  )

  $: selectedFilteredTags = ifDefined(filteredTags, (tags) =>
    tags.filter((p) => selectedTagIdsSet.has(p.id))
  )
  $: unselectedFilteredTags = ifDefined(filteredTags, (tags) =>
    tags.filter((p) => !selectedTagIdsSet.has(p.id))
  )
</script>

<div
  class={tw(
    'z-40 w-screen max-w-xs rounded-lg border border-gray-600 bg-gray-700 shadow-lg',
    class_
  )}
  use:popperTooltip={{ modifiers: [{ name: 'offset', options: { offset: [0, 8] } }] }}
  transition:fade|local={{ duration: 75 }}
>
  <PopoverArrow />

  <div class="m-2 mb-0">
    <Input
      class="w-full"
      layer={700}
      bind:value={filter}
      autofocus
      placeholder="Find a tag..."
      on:keydown={(e) => {
        if (e.key === 'Enter') {
          if (filteredTags?.length) {
            e.preventDefault()

            const tag = filteredTags[0]
            const selected = selectedTagIdsSet.has(tag.id)
            handleTag(tag.id, !selected)
          }
        }
      }}
    />
  </div>

  <div class="max-h-[calc(100vh/3)] overflow-auto p-2" tabindex="-1">
    {#if filteredTags}
      {#if filteredTags.length}
        {#each selectedFilteredTags ?? [] as tag (tag.id)}
          <Button
            kind="text"
            class="w-full text-white"
            layer={700}
            align="left"
            on:click={() => handleTag(tag.id, false)}
            icon={CheckIcon}
          >
            {tag.name}
          </Button>
        {/each}

        {#if selectedFilteredTags?.length && unselectedFilteredTags?.length}
          <div class="my-1 h-px w-full bg-gray-600" />
        {/if}

        {#each unselectedFilteredTags ?? [] as tag (tag.id)}
          <Button
            kind="text"
            class="w-full text-white"
            layer={700}
            align="left"
            on:click={() => handleTag(tag.id, true)}
          >
            {tag.name}
          </Button>
        {/each}
      {:else}
        <div class="px-2 py-1 text-sm font-medium text-gray-400">No tags found.</div>
      {/if}
    {:else if $tagsQuery.error}
      <Button
        kind="text"
        class="w-full text-white"
        layer={700}
        align="left"
        on:click={() => $tagsQuery.refetch()}
        loading={$tagsQuery.isFetching}
      >
        <span class="text-error-500" use:tooltip={{ content: $tagsQuery.error.message }}>Error</span
        > loading tags. Retry?
      </Button>
    {:else}
      <div class="flex h-7 w-full items-center justify-center">
        <Delay>
          <Loader class="h-5 w-5 text-gray-500" />
        </Delay>
      </div>
    {/if}
  </div>
</div>

<svelte:window
  on:keydown={(e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }}
/>
