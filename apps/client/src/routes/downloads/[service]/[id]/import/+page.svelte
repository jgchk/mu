<script lang="ts">
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  $: importQuery = trpc.import.groupDownloadData.query({
    service: data.service,
    id: data.id,
  })

  $: console.log($importQuery.data)
</script>
