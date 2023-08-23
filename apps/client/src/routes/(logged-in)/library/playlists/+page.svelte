<script lang="ts">
  import PlaylistsPage from '$lib/components/PlaylistsPage.svelte'

  import type { PageData } from './$types'

  export let data: PageData
</script>

<PlaylistsPage name={data.searchQuery} />
