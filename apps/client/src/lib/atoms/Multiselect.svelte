<script lang="ts">
  /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
  import { createEventDispatcher } from 'svelte'

  import { clickOutside } from '$lib/actions/clickOutside'
  import { createPopperAction } from '$lib/actions/popper'
  import { tooltip } from '$lib/actions/tooltip'
  import { getInputGroupErrors } from '$lib/atoms/InputGroup'
  import ChevronDownIcon from '$lib/icons/ChevronDownIcon.svelte'
  import { slide } from '$lib/transitions/slide'
  import { cn, tw } from '$lib/utils/classes'

  import type { Option } from './Select'

  type InternalOption = $$Generic<Option>
  type Value = InternalOption['value']

  export let value: InternalOption[] = []
  export let options: InternalOption[] = []
  export let hasMore = false
  export let open = false
  export let filter = ''
  export let virtual = false
  export let focusedIndex = 0
  export let id: string | undefined = undefined
  export let placeholder: string | undefined = undefined

  let class_: string | undefined = undefined
  export { class_ as class }

  let propErrors: string[] | undefined = undefined
  export { propErrors as errors }
  const contextErrors = getInputGroupErrors()
  $: errors = propErrors || ($contextErrors && $contextErrors.length > 0)

  let inputRef: HTMLInputElement | undefined

  $: selectedValues = new Set<Value>(value.map((v) => v.value))

  $: isValueSelected = (value: Value) => selectedValues.has(value)

  $: filteredOptions = virtual
    ? options
    : options.filter(
        (option) =>
          !isValueSelected(option.value) &&
          option.label.toLowerCase().includes(filter.toLowerCase())
      )

  $: lastIndex = hasMore ? filteredOptions.length : filteredOptions.length - 1

  // prevent focusedIndex from being out of bounds
  $: filteredOptions && (focusedIndex = Math.min(focusedIndex, lastIndex))

  // reset focusedIndex when closing
  $: !open && (focusedIndex = 0)

  const dispatch = createEventDispatcher<{
    loadMore: undefined
    change: { value: InternalOption[] }
  }>()

  const handleSelect = (option: InternalOption) => {
    filter = ''
    if (isValueSelected(option.value)) {
      handleRemove(option)
    } else {
      handleAdd(option)
    }
  }

  const handleAdd = (option: InternalOption) => {
    if (option.onSelect) {
      option.onSelect()
    } else {
      value = [...value, option]
      dispatch('change', { value })
    }
  }

  const handleRemove = (option: InternalOption) => {
    value = value.filter((v) => v.value !== option.value)
    dispatch('change', { value })
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
        open = false
        return
      }

      event.preventDefault()
      handleAdd(focusedOption)
      filter = ''
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusedIndex = (focusedIndex + 1) % (lastIndex + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusedIndex = (focusedIndex - 1 + (lastIndex + 1)) % (lastIndex + 1)
    } else if (event.key === 'Backspace' && filter.length === 0 && value.length > 0) {
      event.preventDefault()
      handleRemove(value[value.length - 1])
    } else if (event.key === 'Escape') {
      if (open) {
        event.preventDefault()
        event.stopPropagation()
        open = false
      }
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
    {#if value.length > 0}
      <div class="flex items-center gap-1 pl-1">
        {#each value as v (v.value)}
          <button
            type="button"
            class="hover:bg-error-600 rounded-[3px] bg-gray-600 px-1 py-0.5 text-sm hover:bg-opacity-75"
            use:tooltip={{ content: 'Remove' }}
            on:click={() => {
              handleRemove(v)
              inputRef?.focus()
            }}
            tabindex="-1"
          >
            {#if $$slots.selected}
              <slot name="selected" option={v} />
            {:else}
              <div>
                {v.label}
              </div>
            {/if}
          </button>
        {/each}
      </div>
    {/if}

    <input
      {id}
      class={cn(
        'flex-1 bg-transparent py-1 text-white outline-none',
        value.length > 0 ? 'pl-1' : 'pl-2'
      )}
      placeholder={value.length === 0 ? placeholder : undefined}
      type="text"
      autocomplete="off"
      bind:value={filter}
      on:keydown={handleKeyDown}
      on:click={() => (open = true)}
      on:focus={() => (open = true)}
      on:blur
      bind:this={inputRef}
    />

    <button
      class="px-2"
      type="button"
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
                inputRef?.focus()
              }}
              on:mouseenter={() => (focusedIndex = i)}
            >
              {option.label}
            </button>
          {/each}

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
        {/if}
      </div>
      <div
        class="pointer-events-none absolute left-0 top-0 h-full w-full rounded border border-white opacity-5"
      />
    </div>
  {/if}
</div>
