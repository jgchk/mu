<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import CoverArt from '$lib/components/CoverArt.svelte'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import { cn } from '$lib/utils/classes'

  export let title: string | null

  export let coverArtSrc: string | undefined
  export let coverArtClickable: boolean

  let class_: string | undefined = undefined
  export { class_ as class }

  const dispatch = createEventDispatcher<{ clickCoverArt: undefined }>()
</script>

<div class={cn('relative flex flex-col gap-6 md:flex-row', class_)}>
  <button
    type="button"
    class="relative w-64 max-w-full shrink-0 self-center overflow-hidden md:w-32 md:self-end lg:w-48 xl:w-64"
    disabled={!coverArtClickable}
    on:click={() => dispatch('clickCoverArt')}
  >
    <CoverArt
      src={coverArtSrc}
      alt={title}
      iconClass="w-8 h-8 lg:w-16 lg:h-16"
      hoverable={coverArtClickable}
    >
      <PlayIcon />

      <svelte:fragment slot="insert">
        <slot name="cover-art-icon" />
      </svelte:fragment>
    </CoverArt>
  </button>

  <div class="space-y-1 self-start px-1.5 pb-2 md:self-end md:px-0">
    <h1
      class="mr-11 line-clamp-2 break-all text-2xl font-bold leading-[1.19] md:text-3xl md:text-4xl xl:text-5xl 2xl:text-6xl"
      {title}
    >
      {title}
    </h1>
    <slot name="subtitle" />
  </div>

  {#if $$slots.buttons}
    <div class="absolute bottom-2 right-0 flex gap-1 md:bottom-[unset] md:top-0">
      <slot name="buttons" />
    </div>
  {/if}
</div>
