<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { fade } from 'svelte/transition'
  import { ifDefined } from 'utils'

  import type { PopperTooltipAction } from '$lib/actions/popper'
  import { tooltip } from '$lib/actions/tooltip'
  import Button from '$lib/atoms/Button.svelte'
  import Input from '$lib/atoms/Input.svelte'
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
  export let offset = 8

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
</script>

<div
  class={tw(
    'z-40 w-screen max-w-xs rounded-lg border border-gray-600 bg-gray-700 shadow-lg',
    class_
  )}
  use:popperTooltip={{ modifiers: [{ name: 'offset', options: { offset: [0, offset] } }] }}
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
        {#each filteredTags as tag (tag.id)}
          {@const selected = selectedTagIdsSet.has(tag.id)}
          <Button
            kind="text"
            class="w-full text-white"
            layer={700}
            align="left"
            on:click={() => handleTag(tag.id, !selected)}
            icon={selected ? CheckIcon : undefined}
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
      <div class="block w-full p-1 px-2 text-left text-sm text-gray-400">Loading tags...</div>
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