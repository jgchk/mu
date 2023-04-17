<script lang="ts">
  import type { Validation } from 'sveltekit-superforms'
  import { superForm } from 'sveltekit-superforms/client'
  import { toErrorString } from 'utils'

  import { tooltip } from '$lib/actions/tooltip'
  import Button from '$lib/atoms/Button.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import { createStartSoulseekMutation, createStopSoulseekMutation } from '$lib/services/system'
  import { formErrors } from '$lib/strings'
  import { getContextToast } from '$lib/toast/toast'
  import { slide } from '$lib/transitions/slide'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'
  import { useEditLink } from '$lib/utils/system-config'

  import type { ActionData } from './$types'
  import type { SlskSchema } from './schemas'

  export let data: Validation<SlskSchema>
  export let status: RouterOutput['system']['status']['soulseek']

  let showConfig = false
  useEditLink('soulseek', () => (showConfig = true))

  const toast = getContextToast()
  const trpc = getContextClient()

  const updateErrorMsg = (error: unknown) => `Error updating Soulseek: ${toErrorString(error)}`
  const notifyStatus = (status: RouterOutput['system']['status']['soulseek']) => {
    if (status.status === 'stopped') {
      toast.error('Soulseek updated: Not logged in')
    } else if (status.status === 'errored') {
      toast.error(updateErrorMsg(status.error))
    } else if (status.status === 'logging-in') {
      toast.warning('Soulseek updated: Logging in...')
    } else {
      toast.success('Soulseek updated!')
    }
  }

  const { form, enhance, errors, delayed, reset } = superForm(data, {
    dataType: 'json',
    onResult: ({ result }) => {
      if (result.type === 'success') {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const status: RouterOutput['system']['status'] = (result.data as ActionData)!.status!
        notifyStatus(status.soulseek)
        showConfig = false
        void trpc.system.status.utils.setData(undefined, status)
      } else {
        void trpc.system.status.utils.invalidate()
        if (result.type === 'failure') {
          toast.error(formErrors())
        } else if (result.type === 'error') {
          toast.error(updateErrorMsg(result.error))
        }
      }
    },
  })

  const startSoulseekMutation = createStartSoulseekMutation(trpc, {
    showToast: false,
    onSuccess: (data) => notifyStatus(data),
    onError: (error) => toast.error(updateErrorMsg(error)),
  })
  const stopSoulseekMutation = createStopSoulseekMutation(trpc, {
    showToast: false,
    onSuccess: (data) => notifyStatus(data),
    onError: (error) => {
      toast.error(updateErrorMsg(error))
    },
  })
</script>

<form method="POST" action="?/slsk" use:enhance>
  <div class="flex items-center gap-4 rounded p-1.5 pl-3">
    <div>Soulseek</div>

    <div
      use:tooltip={{
        content:
          status.status === 'stopped'
            ? 'Stopped'
            : status.status === 'errored'
            ? `Error: ${status.error}`
            : status.status === 'logging-in'
            ? 'Logging in...'
            : 'Running',
      }}
      class={cn(
        'h-4 w-4 rounded-full transition',
        status.status === 'stopped' && 'bg-error-600',
        status.status === 'errored' && 'bg-error-600',
        status.status === 'logging-in' && 'bg-warning-600',
        status.status === 'logged-in' && 'bg-success-600'
      )}
    />

    <div class="flex items-center justify-end gap-1">
      {#if status.status === 'logged-in'}
        <Button
          kind="text"
          on:click={() => {
            if (!$stopSoulseekMutation.isLoading) {
              $stopSoulseekMutation.mutate()
              $startSoulseekMutation.reset()
            }
          }}
          loading={$stopSoulseekMutation.isLoading}
        >
          Stop
        </Button>
        <Button
          kind="text"
          on:click={() => {
            if (!$startSoulseekMutation.isLoading) {
              $startSoulseekMutation.mutate()
              $stopSoulseekMutation.reset()
            }
          }}
          loading={$startSoulseekMutation.isLoading}
        >
          Restart
        </Button>
      {:else}
        <Button
          kind="text"
          on:click={() => {
            if (!$startSoulseekMutation.isLoading) {
              $startSoulseekMutation.mutate()
              $stopSoulseekMutation.reset()
            }
          }}
          loading={$startSoulseekMutation.isLoading}
        >
          Start
        </Button>
      {/if}
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
      <InputGroup errors={$errors.soulseekUsername}>
        <Label for="slsk-username">Username</Label>
        <Input id="slsk-username" bind:value={$form.soulseekUsername} />
      </InputGroup>

      <InputGroup errors={$errors.soulseekPassword}>
        <Label for="slsk-password">Password</Label>
        <Input id="slsk-password" bind:value={$form.soulseekPassword} />
      </InputGroup>
    </div>
  {/if}
</form>
