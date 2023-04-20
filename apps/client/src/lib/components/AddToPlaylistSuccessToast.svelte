<script lang="ts">
  import type { Toast } from '$lib/toast/toast'

  export let id: number
  export let name: string
  export let toast: Toast
</script>

<span
  >Added to <a class="underline" href="/playlists/{id}" on:click={() => toast.hide()}>{name}</a
  >!</span
>
