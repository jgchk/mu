<script lang="ts">
  import { toErrorString } from 'utils'

  import ReleaseForm from '$lib/components/ReleaseForm.svelte'
  import { getContextToast } from '$lib/toast/toast'

  import type { PageServerData } from './$types'

  export let data: PageServerData

  const toast = getContextToast()
</script>

<ReleaseForm
  formData={data.form}
  artData={data.art ?? null}
  on:success={({ detail: { data } }) => toast.success(`Imported ${data.album.title || 'release'}!`)}
  on:failure={({ detail: { reason } }) =>
    toast.error(`Failed to import release: ${toErrorString(reason)}`)}
  on:error={({ detail: { error } }) =>
    toast.error(`Error importing release: ${toErrorString(error)}`)}
/>
