<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import { cn, tw } from '$lib/utils/classes'

  export let src: string | undefined = undefined
  export let alt: string | null | undefined = undefined
  export let rounding = 'rounded'
  export let iconClass: string | undefined = undefined
  export let placeholderClass: string | undefined = undefined
  export let hoverable = true
  export let selected = false

  let loaded = false
  let img: HTMLImageElement | undefined

  $: if (img?.complete) {
    loaded = true

    // There is no way to detect if an image failed to load :(
    // The best we can do is below where we check if an image is 0x0
    // Have to be careful since successfully loading a 0x0 image will
    // trigger a false alarm too. Should be fine though since no
    // cover art should really be 0x0
    if (img?.naturalWidth === 0 && img?.naturalHeight === 0 && img?.complete) {
      dispatch('error')
    }
  }

  const dispatch = createEventDispatcher<{ error: undefined }>()
</script>

<div class={cn('relative w-full pt-[100%] shadow', rounding)}>
  {#if src !== undefined}
    <img
      class={cn(
        'absolute left-0 top-0 h-full w-full object-cover transition',
        loaded ? 'opacity-100' : 'opacity-0',
        rounding
      )}
      {src}
      {alt}
      on:load={() => (loaded = true)}
      on:error
      bind:this={img}
    />
    <div
      class={cn(
        'skeleton absolute left-0 top-0 h-full w-full overflow-hidden bg-gray-800 transition',
        loaded ? 'opacity-0' : 'opacity-100',
        rounding
      )}
    />
    <slot name="insert" />
  {:else}
    <div
      class={tw(
        'center absolute left-0 top-0 h-full w-full bg-gray-800 italic text-gray-600',
        rounding,
        placeholderClass
      )}
    >
      No cover art
    </div>
    <slot name="insert" />
  {/if}
  <div
    class={tw(
      'center group absolute left-0 top-0 h-full w-full border border-white border-opacity-20 transition active:bg-opacity-80',
      hoverable &&
        'hover:border-primary-500 hover:border-opacity-100 hover:bg-gray-900 hover:bg-opacity-60',
      rounding,
      selected && 'border-primary-500 border-2 border-opacity-100'
    )}
  >
    {#if $$slots.default && hoverable}
      <div
        class={tw(
          'group-active:text-primary-500 h-8 w-8 text-white opacity-0 transition group-hover:opacity-100',
          iconClass
        )}
      >
        <slot />
      </div>
    {/if}
  </div>
</div>
