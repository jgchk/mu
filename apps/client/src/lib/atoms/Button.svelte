<script lang="ts">
  import { slide } from '$lib/transitions/slide'
  import { cn, tw } from '$lib/utils/classes'

  import Loader from './Loader.svelte'

  export let disabled = false
  export let type: 'button' | 'submit' = 'button'
  export let kind: 'solid' | 'outline' | 'text' = 'solid'
  export let loading = false
  let class_: string | undefined = undefined
  export { class_ as class }

  export let layer: 700 | 800 = 800
</script>

<button
  on:click
  {disabled}
  {type}
  class={tw(
    'focus-visible:ring-primary-500 flex items-center rounded border px-2 py-1 text-sm font-medium outline-none transition focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-800',
    kind === 'solid' &&
      'bg-primary-500 hover:bg-primary-600 border-transparent text-black disabled:bg-gray-500 disabled:text-gray-700',
    kind === 'outline' &&
      cn(
        'border-primary-500 text-primary-500 bg-transparent disabled:border-gray-500 disabled:bg-transparent disabled:text-gray-500',
        layer === 700 && 'hover:bg-gray-600',
        layer === 800 && 'hover:bg-gray-700'
      ),
    kind === 'text' &&
      cn(
        'text-primary-500 focus-visible:border-primary-500 border-transparent bg-transparent disabled:bg-transparent disabled:text-gray-500',
        layer === 700 && 'hover:bg-gray-600',
        layer === 800 && 'hover:bg-gray-700'
      ),
    class_
  )}
>
  {#if loading}
    <div transition:slide|local={{ axis: 'x' }}>
      <div class="relative mr-2 h-3.5 w-3.5">
        <Loader />
      </div>
    </div>
  {/if}
  <slot />
</button>
