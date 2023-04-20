<script lang="ts">
  import type { Toast } from '$lib/toast/toast'

  export let toast: Toast
  export let message: (string | { href: string; text: string })[]
</script>

<span>
  {#each message as segment}
    {#if typeof segment === 'string'}
      {segment}
    {:else}
      <a href={segment.href} class="underline" on:click={() => toast.hide()}>{segment.text}</a>
    {/if}
  {/each}
</span>
