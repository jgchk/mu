<script lang="ts">
  import { toErrorString } from 'utils'

  import LinkToast from '$lib/components/LinkToast.svelte'
  import ReleaseForm from '$lib/components/ReleaseForm.svelte'
  import { getContextToast } from '$lib/toast/toast'

  import type { PageServerData } from './$types'

  export let data: PageServerData

  const toast = getContextToast()
</script>

<ReleaseForm
  formData={data.form}
  artUrl={data.artUrl}
  on:success={({ detail: { data } }) =>
    toast.success(LinkToast, {
      props: {
        message: [
          'Updated ',
          { href: `/library/releases/${data.id}`, text: data.album.title || 'release' },
          '!',
        ],
      },
    })}
  on:failure={({ detail: { reason } }) =>
    toast.error(`Failed to update release: ${toErrorString(reason)}`)}
  on:error={({ detail: { error } }) =>
    toast.error(`Error updating release: ${toErrorString(error)}`)}
/>
