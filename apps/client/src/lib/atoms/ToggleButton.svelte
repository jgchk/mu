<script lang="ts">
  import { slide } from '$lib/transitions/slide'
  import { cn } from '$lib/utils/classes'

  import Loader from './Loader.svelte'

  export let selected = false
  export let disabled = false
  export let type: 'button' | 'submit' = 'button'
  export let kind: 'outline' | 'text' = 'outline'
  export let loading = false
  let class_: string | undefined = undefined
  export { class_ as class }
</script>

<button
  on:click
  {disabled}
  {type}
  class={cn(
    'focus:ring-primary-500 flex items-center rounded border px-2 py-1 text-sm font-medium outline-none transition focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800',
    selected
      ? 'bg-primary-500 hover:bg-primary-600 border-transparent text-black disabled:bg-gray-500 disabled:text-gray-700'
      : cn(
          kind === 'outline' &&
            'border-primary-500 text-primary-500 bg-transparent hover:bg-gray-700 disabled:border-gray-500 disabled:bg-transparent disabled:text-gray-500',
          kind === 'text' &&
            'border-transparent bg-transparent text-gray-300 hover:bg-gray-700 disabled:bg-transparent disabled:text-gray-500'
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
