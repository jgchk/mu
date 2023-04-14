<script lang="ts">
  import ReleaseForm from '$lib/components/ReleaseForm.svelte'
  import { importTrackError, importTrackFail, importTrackSuccess } from '$lib/strings'
  import { getContextToast } from '$lib/toast/toast'

  import type { PageServerData } from './$types'

  export let data: PageServerData

  const toast = getContextToast()
</script>

<ReleaseForm
  formData={data.form}
  artData={data.art ?? null}
  on:success={({ detail: { data } }) => toast.success(importTrackSuccess(data.album.title))}
  on:failure={({ detail: { reason } }) => toast.error(importTrackFail(reason))}
  on:error={({ detail: { error } }) => toast.error(importTrackError(error))}
/>
