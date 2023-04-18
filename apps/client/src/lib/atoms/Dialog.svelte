<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { fade, scale } from 'svelte/transition'

  import { trapFocus } from '$lib/actions/trapFocus'

  export let title: string | undefined = undefined

  const dispatch = createEventDispatcher<{ close: undefined }>()
  const close = () => dispatch('close')

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      close()
    }
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
  <button
    type="button"
    class="absolute h-full w-full cursor-default bg-black opacity-50"
    on:click={close}
    transition:fade|local={{ duration: 125 }}
    tabindex="-1"
  />

  <div
    class="relative w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 shadow-lg"
    transition:scale|local={{ start: 0.95, duration: 125 }}
    on:keydown={handleKeyDown}
    use:trapFocus
  >
    {#if title !== undefined}
      <h2 class="p-4 pb-0 text-lg font-semibold">{title}</h2>
    {/if}
    <div class="p-4">
      <slot />
    </div>
    {#if $$slots.buttons}
      <div class="flex gap-1 p-4 pt-2">
        <slot name="buttons" />
      </div>
    {/if}
  </div>
</div>
