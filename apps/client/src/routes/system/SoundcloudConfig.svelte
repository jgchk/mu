<script lang="ts">
  import type { Validation } from 'sveltekit-superforms'
  import { superForm } from 'sveltekit-superforms/client'

  import { tooltip } from '$lib/actions/tooltip'
  import Button from '$lib/atoms/Button.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import {
    createStartSoundcloudMutation,
    createStopSoundcloudMutation,
    notifySoundcloudStatus,
    soundcloudErrorMessage,
  } from '$lib/services/system'
  import { formErrors } from '$lib/strings'
  import { getContextToast } from '$lib/toast/toast'
  import { slide } from '$lib/transitions/slide'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'
  import { useEditLink } from '$lib/utils/system-config'

  import type { ActionData } from './$types'
  import type { SoundcloudSchema } from './schemas'

  export let data: Validation<SoundcloudSchema>
  export let status: RouterOutput['system']['status']['soundcloud']
  $: stopped = status.status === 'stopped' || status.status === 'errored'

  let showConfig = false
  useEditLink('soundcloud', () => (showConfig = true))

  const toast = getContextToast()
  const trpc = getContextClient()

  const startSoundcloudMutation = createStartSoundcloudMutation(trpc, { toast })
  const stopSoundcloudMutation = createStopSoundcloudMutation(trpc, { toast })

  const { form, enhance, errors, delayed, reset } = superForm(data, {
    dataType: 'json',
    onResult: ({ result }) => {
      if (result.type === 'success') {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const status: RouterOutput['system']['status'] = (result.data as ActionData)!.status!
        notifySoundcloudStatus(toast, status.soundcloud)
        showConfig = false
        void trpc.system.status.utils.setData(undefined, status)
      } else {
        void trpc.system.status.utils.invalidate()
        if (result.type === 'failure') {
          toast.error(formErrors())
        } else if (result.type === 'error') {
          toast.error(soundcloudErrorMessage(result.error))
        }
      }
    },
  })
</script>

<form method="POST" action="?/soundcloud" use:enhance>
  <div class="flex items-center gap-4 rounded p-1.5 pl-3">
    <div>Soundcloud</div>
    <div
      use:tooltip={{
        content:
          status.status === 'stopped'
            ? 'Stopped'
            : status.status === 'starting'
            ? `Starting...`
            : status.status === 'errored'
            ? `Error: ${status.error}`
            : 'Running',
      }}
      class={cn(
        'h-4 w-4 rounded-full transition',
        status.status === 'stopped' && 'bg-error-600',
        status.status === 'errored' && 'bg-error-600',
        status.status === 'starting' && 'bg-warning-600',
        status.status === 'running' && 'bg-success-600'
      )}
    />
    <div class="flex items-center justify-end gap-1">
      {#if !stopped}
        <Button
          kind="text"
          on:click={() => $stopSoundcloudMutation.mutate()}
          loading={$stopSoundcloudMutation.isLoading}
        >
          Stop
        </Button>
      {/if}
      <Button
        kind="text"
        on:click={() => $startSoundcloudMutation.mutate()}
        loading={$startSoundcloudMutation.isLoading}
      >
        {#if stopped}
          Start
        {:else}
          Restart
        {/if}
      </Button>
    </div>

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
      <InputGroup errors={$errors.soundcloudAuthToken}>
        <Label for="soundcloud-auth-token">Auth Token</Label>
        <Input id="soundcloud-auth-token" bind:value={$form.soundcloudAuthToken} />
      </InputGroup>
    </div>
  {/if}
</form>
