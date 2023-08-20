<script lang="ts">
  import TracksPage from '$lib/components/TracksPage.svelte'

  import type { PageData } from './$types'

  export let data: PageData
</script>

<TracksPage {data} />
