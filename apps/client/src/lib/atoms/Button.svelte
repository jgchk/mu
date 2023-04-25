<script lang="ts">
  import type { SvelteComponentTyped } from 'svelte'
  import { scale } from 'svelte/transition'

  import { tooltip } from '$lib/actions/tooltip'
  import { slide } from '$lib/transitions/slide'
  import { cn, tw } from '$lib/utils/classes'

  import Loader from './Loader.svelte'

  export let disabled = false
  export let type: 'button' | 'submit' = 'button'
  export let kind: 'solid' | 'outline' | 'text' = 'solid'
  export let align: 'left' | 'center' | 'right' = 'center'
  export let loading = false
  let class_: string | undefined = undefined
  export { class_ as class }
  let tooltip_: string | undefined = undefined
  export { tooltip_ as tooltip }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-undef
  type C = $$Generic<typeof SvelteComponentTyped<any, any, any>>
  export let icon: C | undefined = undefined

  export let layer: 700 | 800 = 800
</script>

<button
  on:click
  {disabled}
  {type}
  class={tw(
    'relative flex items-center rounded border px-2 py-1 text-sm font-medium transition',

    align === 'left' && 'justify-start',
    align === 'center' && 'justify-center',
    align === 'right' && 'justify-end',

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
        'text-primary-500 border-transparent bg-transparent disabled:bg-transparent disabled:text-gray-500',
        layer === 700 && 'hover:bg-gray-600',
        layer === 800 && 'hover:bg-gray-700'
      ),
    class_
  )}
>
  {#if loading || icon}
    <div transition:slide|local={{ axis: 'x' }}>
      <div class="relative mr-2 h-3.5 w-3.5">
        {#if loading}
          <Loader />
        {:else}
          <div class="absolute" transition:scale|local={{ duration: 150 }}>
            <svelte:component this={icon} />
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <slot />

  {#if tooltip_ !== undefined}
    <div class="absolute left-0 top-0 h-full w-full" use:tooltip={{ content: tooltip_ }} />
  {/if}
</button>
