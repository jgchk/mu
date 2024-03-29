<script lang="ts">
  import type { Validation } from 'sveltekit-superforms'
  import { superForm } from 'sveltekit-superforms/client'

  import { tooltip } from '$lib/actions/tooltip'
  import Button from '$lib/atoms/Button.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import {
    createStartLastFmMutation,
    createStopLastFmMutation,
    lastFmErrorMessage,
    notifyLastFmStatus,
  } from '$lib/services/system'
  import { formErrors } from '$lib/strings'
  import { getContextToast } from '$lib/toast/toast'
  import { slide } from '$lib/transitions/slide'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'
  import { listenForEditLink } from '$lib/utils/system-config'

  import type { ActionData } from './$types'
  import type { LastFmSchema } from './schemas'

  export let data: Validation<LastFmSchema>
  export let status: RouterOutput['system']['status']['lastFm']
  $: stopped = status.status === 'stopped' || status.status === 'errored'

  let showConfig = false
  listenForEditLink('last-fm', () => (showConfig = true))

  const toast = getContextToast()
  const trpc = getContextClient()

  const startLastFmMutation = createStartLastFmMutation(trpc, { toast })
  const stopLastFmMutation = createStopLastFmMutation(trpc, { toast })

  const { form, enhance, errors, delayed, reset } = superForm(data, {
    dataType: 'json',
    onResult: ({ result }) => {
      if (result.type === 'success') {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const status: RouterOutput['system']['status'] = (result.data as ActionData)!.status!
        notifyLastFmStatus(toast, status.lastFm)
        showConfig = false
        void trpc.system.status.utils.setData(undefined, status)
      } else {
        void trpc.system.status.utils.invalidate()
        if (result.type === 'failure') {
          toast.error(formErrors())
        } else if (result.type === 'error') {
          toast.error(lastFmErrorMessage(result.error))
        }
      }
    },
  })
</script>

<form method="POST" action="?/lastFm" use:enhance>
  <div class="flex items-center gap-4 rounded p-1.5 pl-3">
    <div>Last.fm</div>
    <div
      use:tooltip={{
        content:
          status.status === 'stopped'
            ? 'Stopped'
            : status.status === 'errored'
            ? `Error: ${status.error}`
            : status.status === 'authenticating'
            ? 'Authenticating...'
            : status.status === 'authenticated'
            ? 'Authenticated'
            : status.status === 'logging-in'
            ? 'Logging in...'
            : status.status === 'degraded'
            ? `Degraded: ${status.error}`
            : 'Running',
      }}
      class={cn(
        'h-4 w-4 rounded-full transition',
        status.status === 'stopped' && 'bg-error-600',
        status.status === 'errored' && 'bg-error-600',
        status.status === 'authenticating' && 'bg-warning-600',
        status.status === 'authenticated' && 'bg-warning-600',
        status.status === 'logging-in' && 'bg-warning-600',
        status.status === 'degraded' && 'bg-warning-600',
        status.status === 'logged-in' && 'bg-success-600'
      )}
    />
    <div class="flex items-center justify-end gap-1">
      {#if !stopped}
        <Button
          kind="text"
          on:click={() => $stopLastFmMutation.mutate()}
          loading={$stopLastFmMutation.isLoading}
        >
          Stop
        </Button>
      {/if}
      <Button
        kind="text"
        on:click={() => $startLastFmMutation.mutate()}
        loading={$startLastFmMutation.isLoading}
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
