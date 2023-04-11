<script lang="ts">
  import { scale } from 'svelte/transition'

  import { tooltip as tooltipAction } from '$lib/actions/tooltip'
  import { cn, tw } from '$lib/utils/classes'

  import Loader from './Loader.svelte'

  export let tooltip: string
  export let disabled = false
  export let type: 'button' | 'submit' = 'button'
  export let loading = false
  export let kind: 'solid' | 'outline' | 'text' = 'solid'
  let class_: string | undefined = undefined
  export { class_ as class }
</script>

<button
  on:click
  {disabled}
  {type}
  class={tw(
    'focus:ring-primary-500 center h-8 w-8 rounded-full border p-[7px] transition',
    kind === 'solid' &&
      'bg-primary-500 hover:bg-primary-600 border-transparent text-black disabled:bg-gray-500 disabled:text-gray-700',
    kind === 'outline' &&
      'border-primary-500 text-primary-500 bg-transparent hover:bg-gray-700 disabled:border-gray-500 disabled:bg-transparent disabled:text-gray-500',
    kind === 'text' &&
      'border-transparent bg-transparent text-gray-300 hover:bg-gray-700 disabled:bg-transparent disabled:text-gray-500',
    class_
  )}
  use:tooltipAction={{ content: tooltip }}
>
  <div class={cn('relative h-full w-full', !disabled && 'group-active:top-px')}>
    {#if loading}
      <Loader />
    {:else}
      <div class="absolute" transition:scale|local={{ duration: 150 }}>
        <slot />
      </div>
    {/if}
  </div>
</button>
