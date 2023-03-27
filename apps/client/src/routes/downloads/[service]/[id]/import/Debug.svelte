<script lang="ts">
  import { slide } from 'svelte/transition'
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte'

  import type { PageServerData } from './$types'

  export let data: PageServerData['form']['data']
  export let show = false
</script>

<div class="absolute bottom-0 left-0 w-full">
  <button
    class="w-full bg-gray-800 p-1 transition hover:bg-gray-700"
    on:click={() => (show = !show)}>{show ? 'Hide Debug' : 'Show Debug'}</button
  >
  {#if show}
    <div class="h-64 overflow-auto bg-[#222] p-4 pt-0 text-sm" transition:slide>
      <SuperDebug {data} />
    </div>
  {/if}
</div>
