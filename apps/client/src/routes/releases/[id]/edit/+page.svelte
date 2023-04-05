<script lang="ts">
  import ReleaseForm from '$lib/components/ReleaseForm.svelte'
  import { getContextToast } from '$lib/toast/toast'
  import { toErrorString } from '$lib/utils/error'

  import type { PageServerData } from './$types'

  export let data: PageServerData

  const toast = getContextToast()
</script>

<ReleaseForm
  formData={data.form}
  artData={data.art}
  on:success={({ detail: { data } }) => toast.success(`Updated ${data.album.title || 'release'}!`)}
  on:failure={({ detail: { reason } }) =>
    toast.error(`Failed to update release: ${toErrorString(reason)}`)}
  on:error={({ detail: { error } }) =>
    toast.error(`Error while updating release: ${toErrorString(error)}`)}
/>
