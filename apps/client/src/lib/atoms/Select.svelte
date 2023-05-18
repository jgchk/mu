<script lang="ts">
  /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
  import { createEventDispatcher } from 'svelte'

  import { clickOutside } from '$lib/actions/clickOutside'
  import { createPopperAction } from '$lib/actions/popper'
  import ChevronDownIcon from '$lib/icons/ChevronDownIcon.svelte'
  import { slide } from '$lib/transitions/slide'
  import { cn, tw } from '$lib/utils/classes'

  import { getInputGroupErrors } from './InputGroup'
  import type { Option } from './Select'

  type InternalOption = $$Generic<Option>

  export let value: InternalOption | undefined = undefined
  export let options: InternalOption[] = []
  export let hasMore = false
  export let open = false
  export let filter = ''
  export let displayFilter = value?.label ?? ''
  export let virtual = false
  export let disabled = false
  export let focusedIndex = 0
  export let id: string | undefined = undefined
  let class_: string | undefined = undefined
  export { class_ as class }
  export let placeholder: string | undefined = undefined
  export let closeOnSelect = true

  let propErrors: string[] | undefined = undefined
  export { propErrors as errors }
  const contextErrors = getInputGroupErrors()
  $: errors = propErrors || ($contextErrors && $contextErrors.length > 0)

  let inputRef: HTMLInputElement | undefined

  $: displayFilter = value?.label ?? ''

  $: filteredOptions = virtual
    ? options
    : options.filter(
        (option) => !value || option.label.toLowerCase().includes(filter.toLowerCase())
      )

  $: lastIndex = hasMore ? filteredOptions.length : filteredOptions.length - 1

  // prevent focusedIndex from being out of bounds
  $: filteredOptions && (focusedIndex = Math.min(focusedIndex, lastIndex))

  // reset focusedIndex when closing
  $: !open && (focusedIndex = 0)

  const dispatch = createEventDispatcher<{
    loadMore: undefined
    change: { value: InternalOption | undefined }
  }>()

  const handleSelect = (option: InternalOption) => {
    if (closeOnSelect) {
      open = false
    } else {
      inputRef?.focus()
    }

    if (option.onSelect) {
      option.onSelect()
    } else {
      value = option
      displayFilter = option.label
      dispatch('change', { value })
    }
  }

  const handleLoadMore = () => {
    dispatch('loadMore')
  }

  $: if (filter.length > 0) {
    open = true
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      open = false
    } else if (event.key === 'Enter') {
      if (!open) {
        event.preventDefault()
        open = true
        return
      }

      // if user is focused on the load more button, load more
      if (focusedIndex === filteredOptions.length) {
        handleLoadMore()
        return
      }

      // otherwise, add the focused option
      const focusedOption = filteredOptions[focusedIndex]
      if (focusedOption === undefined) {
        if (closeOnSelect) {
          open = false
        }
        return
      }

      event.preventDefault()
      handleSelect(focusedOption)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusedIndex = (focusedIndex + 1) % (lastIndex + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusedIndex = (focusedIndex - 1 + lastIndex + 1) % (lastIndex + 1)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      open = false
      filter = ''
      displayFilter = value?.label ?? ''
    }
  }

  const [popperElement, popperTooltip] = createPopperAction()
</script>

<div
  use:popperElement
  data-invalid={errors}
  class={tw('relative', class_)}
  use:clickOutside={(e) => {
    if (open) {
      e.stopPropagation()
      open = false
    }
  }}
>
  <div class="focus-within:outline-auto flex rounded bg-gray-700">
    <input
      {id}
      class="w-0 flex-1 bg-transparent py-1 pl-2 text-white outline-none"
      {disabled}
      {placeholder}
      type="text"
      value={displayFilter}
      autocomplete="off"
      on:input={(event) => {
        displayFilter = event.currentTarget.value
        filter = event.currentTarget.value
      }}
      on:focus={() => (open = true)}
      on:click={() => (open = true)}
      bind:this={inputRef}
      on:keydown={handleKeyDown}
      on:blur
    />

    <button
      class="px-2"
      type="button"
      {disabled}
      tabindex="-1"
      on:click={(e) => {
        e.currentTarget.blur()
        open = !open
        if (open) {
          inputRef?.focus()
        }
      }}
    >
      <ChevronDownIcon
        size={18}
        class={cn('transition-transform', open && 'rotate-180 transform')}
      />
    </button>
  </div>

  {#if open}
    <div
      class="relative z-10 w-full overflow-hidden rounded bg-gray-700 shadow"
      transition:slide|local={{ axis: 'y' }}
      tabindex="-1"
      on:keydown={handleKeyDown}
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
      <div tabindex="-1">
        {#if filteredOptions.length === 0}
          <div class="select-none px-2 py-1 text-gray-300">No results</div>
        {:else}
          {#each filteredOptions as option, i}
            <button
              type="button"
              class={cn(
                'block w-full px-2 py-1 text-left hover:bg-gray-600',
                focusedIndex === i && 'bg-gray-600'
              )}
              tabindex="-1"
              on:click={() => {
                handleSelect(option)
              }}
              on:mouseenter={() => (focusedIndex = i)}
            >
              {option.label}
            </button>
          {/each}
        {/if}

        {#if hasMore}
          <button
            type="button"
            class={cn(
              'block w-full px-2 py-1 text-left hover:bg-gray-600',
              focusedIndex === filteredOptions.length && 'bg-gray-600'
            )}
            tabindex="-1"
            on:click={() => handleLoadMore()}
            on:mouseenter={() => (focusedIndex = filteredOptions.length)}
          >
            Load More...
          </button>
        {/if}
      </div>
      <div
        class="pointer-events-none absolute left-0 top-0 h-full w-full rounded border border-white opacity-5"
      />
    </div>
  {/if}
</div>
