<script lang="ts">
  import ReleaseForm from '$lib/components/ReleaseForm.svelte'
  import { updateReleaseError, updateReleaseFail, updateReleaseSuccess } from '$lib/strings'
  import { getContextToast } from '$lib/toast/toast'

  import type { PageServerData } from './$types'

  export let data: PageServerData

  const toast = getContextToast()
</script>

<ReleaseForm
  formData={data.form}
  artData={data.art}
  on:success={({ detail: { data } }) => toast.success(updateReleaseSuccess(data.album.title))}
  on:failure={({ detail: { reason } }) => toast.error(updateReleaseFail(reason))}
  on:error={({ detail: { error } }) => toast.error(updateReleaseError(error))}
/>
