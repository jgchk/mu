<script lang="ts">
  import type { Validation } from 'sveltekit-superforms'
  import { superForm } from 'sveltekit-superforms/client'
  import { toErrorString } from 'utils'

  import { tooltip } from '$lib/actions/tooltip'
  import Button from '$lib/atoms/Button.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import { createReloadLastFmMutation } from '$lib/services/system'
  import { formErrors } from '$lib/strings'
  import { getContextToast } from '$lib/toast/toast'
  import { slide } from '$lib/transitions/slide'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'

  import type { ActionData } from './$types'
  import type { LastFmSchema } from './schemas'

  export let data: Validation<LastFmSchema>
  export let status: RouterOutput['system']['status']

  let showConfig = false

  const toast = getContextToast()
  const trpc = getContextClient()

  const updateErrorMsg = (error: unknown) => `Error updating Last.fm: ${toErrorString(error)}`
  const notifyStatus = (status: RouterOutput['system']['status']['lastFm']) => {
    if (status.available) {
      if (status.loggedIn) {
        toast.success('Last.fm updated!')
      } else {
        if (status.error) {
          toast.warning('Last.fm updated in degraded state: Login failed')
        } else {
          toast.warning('Last.fm updated: Not logged in')
        }
      }
    } else {
      toast.error(updateErrorMsg(status.error))
    }
  }

  const { form, enhance, errors, delayed, reset } = superForm(data, {
    dataType: 'json',
    onResult: ({ result }) => {
      if (result.type === 'success') {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const status: RouterOutput['system']['status'] = (result.data as ActionData)!.status!
        notifyStatus(status.lastFm)
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

  const reloadLastFmMutation = createReloadLastFmMutation(trpc, {
    showToast: false,
    onSuccess: (data) => notifyStatus(data),
    onError: (error) => {
      toast.error(updateErrorMsg(error))
    },
  })
</script>

<form method="POST" action="?/lastFm" use:enhance>
  <div class="flex items-center gap-4 rounded p-1.5 pl-3">
    <div>Last.fm</div>
    <div
      use:tooltip={{
        content: status.lastFm.available
          ? status.lastFm.loggedIn
            ? 'Running'
            : status.lastFm.error
            ? `Degraded: Login failed`
            : 'Not logged in'
          : `Stopped: ${toErrorString(status.lastFm.error)}`,
      }}
      class={cn(
        'h-4 w-4 rounded-full transition',
        status.lastFm.available && status.lastFm.loggedIn && 'bg-success-600',
        status.lastFm.available && !status.lastFm.loggedIn && 'bg-warning-600',
        !status.lastFm.available && 'bg-error-600'
      )}
    />
    <div class="flex flex-1 items-center justify-end gap-1">
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
        <Button
          kind="text"
          on:click={() => $reloadLastFmMutation.mutate()}
          loading={$reloadLastFmMutation.isLoading}>Reload</Button
        >
        <Button kind="outline" on:click={() => (showConfig = true)}>Edit</Button>
      {/if}
    </div>
  </div>

  {#if showConfig}
    <div class="space-y-1 p-4 pt-2" transition:slide|local={{ axis: 'y' }}>
      <InputGroup errors={$errors.lastFmKey}>
        <Label for="last-fm-key">API Key</Label>
        <Input id="last-fm-key" bind:value={$form.lastFmKey} />
      </InputGroup>

      <InputGroup errors={$errors.lastFmSecret}>
        <Label for="last-fm-secret">API Secret</Label>
        <Input id="last-fm-secret" bind:value={$form.lastFmSecret} />
      </InputGroup>

      <InputGroup errors={$errors.lastFmUsername}>
        <Label for="last-fm-username">Username</Label>
        <Input id="last-fm-username" bind:value={$form.lastFmUsername} />
      </InputGroup>

      <InputGroup errors={$errors.lastFmPassword}>
        <Label for="last-fm-password">Password</Label>
        <Input id="last-fm-password" bind:value={$form.lastFmPassword} />
      </InputGroup>
    </div>
  {/if}
</form>
