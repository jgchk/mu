<script lang="ts">
  import { cn, tw } from '$lib/utils/classes'

  export let src: string | undefined = undefined
  export let alt: string | null | undefined = undefined
  export let rounding = 'rounded'
  export let iconClass: string | undefined = undefined
  export let placeholderClass: string | undefined = undefined
  export let hoverable = true

  let loaded = false
  let img: HTMLImageElement | undefined

  $: if (img?.complete) {
    loaded = true
  }
</script>

<div class="relative w-full rounded pt-[100%] shadow">
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
      bind:this={img}
    />
    <div
      class={cn(
        'skeleton absolute left-0 top-0 h-full w-full overflow-hidden bg-gray-800 transition',
        loaded ? 'opacity-0' : 'opacity-100',
        rounding
      )}
    />
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
  {/if}
  <div
    class={cn(
      'center group absolute left-0 top-0 h-full w-full border border-white border-opacity-20 transition active:bg-opacity-80',
      hoverable &&
        'hover:border-primary-500 hover:border-opacity-100 hover:bg-gray-900 hover:bg-opacity-60',
      rounding
    )}
  >
    <div
      class={tw(
        'group-active:text-primary-500 h-8 w-8 text-white opacity-0 transition group-hover:opacity-100',
        iconClass
      )}
    >
      <slot />
    </div>
  </div>
</div>
