<script lang="ts">
  import type { Validation } from 'sveltekit-superforms'
  import { superForm } from 'sveltekit-superforms/client'
  import { toErrorString } from 'utils'

  import Button from '$lib/atoms/Button.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import { formErrors } from '$lib/strings'
  import { getContextToast } from '$lib/toast/toast'
  import { slide } from '$lib/transitions/slide'
  import { getContextClient } from '$lib/trpc'

  import type { DownloaderSchema } from './schemas'

  export let data: Validation<DownloaderSchema>

  let showConfig = false

  const toast = getContextToast()
  const trpc = getContextClient()

  const { form, enhance, errors, delayed, reset } = superForm(data, {
    dataType: 'json',
    onResult: ({ result }) => {
      if (result.type === 'success') {
        toast.success('Downloader config updated!')
        showConfig = false
      } else {
        void trpc.system.status.utils.invalidate()
        if (result.type === 'failure') {
          toast.error(formErrors())
        } else if (result.type === 'error') {
          toast.error(`Error updating Downloader config: ${toErrorString(result.error)}`)
        }
      }
    },
  })
</script>

<form method="POST" action="?/downloader" use:enhance>
  <div class="flex items-center gap-4 rounded p-1.5 pl-3">
    <div>Downloader</div>

    <div class="ml-auto flex items-center gap-1">
      {#if showConfig}
        <Button
          kind="text"
          on:click={() => {
            showConfig = false
            reset()
          }}
        >
          Cancel
        </Button>
        <Button kind="outline" type="submit" loading={$delayed}>Save</Button>
      {:else}
        <Button kind="outline" on:click={() => (showConfig = true)}>Edit</Button>
      {/if}
    </div>
  </div>

  {#if showConfig}
    <div class="space-y-1 p-4 pt-2" transition:slide|local={{ axis: 'y' }}>
      <InputGroup errors={$errors.downloaderConcurrency}>
        <Label for="downloader-concurrency">Concurrency</Label>
        <Input
          id="downloader-concurrency"
          value={$form.downloaderConcurrency.toString()}
          on:input={(e) => ($form.downloaderConcurrency = parseInt(e.currentTarget.value))}
          type="number"
        />
      </InputGroup>
    </div>
  {/if}
</form>
