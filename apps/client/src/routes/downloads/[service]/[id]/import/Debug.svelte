<script lang="ts">
  import { slide } from 'svelte/transition'
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte'

  import { mapValuesRecursive } from '$lib/utils/object'

  export let data: unknown
  export let show = false

  $: transformedData = mapValuesRecursive(data, (value) => {
    if (value instanceof Map) {
      return Object.fromEntries(value)
    } else {
      return value
    }
  })
</script>

<div class="absolute bottom-0 left-0 w-full">
  <button
    class="w-full bg-gray-800 p-1 transition hover:bg-gray-700"
    on:click={() => (show = !show)}>{show ? 'Hide Debug' : 'Show Debug'}</button
  >
  {#if show}
    <div class="h-64 overflow-auto bg-[#222] p-4 pt-0 text-sm" transition:slide|local>
      <SuperDebug data={transformedData} />
    </div>
  {/if}
</div>
