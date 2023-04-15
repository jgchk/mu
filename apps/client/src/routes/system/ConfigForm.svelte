<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client'
  import { toErrorString } from 'utils'

  import { tooltip } from '$lib/actions/tooltip'
  import Button from '$lib/atoms/Button.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import {
    formErrors,
    updateConfigError,
    updateConfigFail,
    updateConfigSuccess,
  } from '$lib/strings'
  import { getContextToast } from '$lib/toast/toast'
  import { slide } from '$lib/transitions/slide'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'

  import type { PageServerData } from './$types'

  export let formData: PageServerData['form']
  export let status: RouterOutput['system']['status']

  let showLastFmConfig = false

  const toast = getContextToast()
  const trpc = getContextClient()

  const { form, enhance, errors, delayed, reset } = superForm(formData, {
    dataType: 'json',
    onResult: ({ result }) => {
      void trpc.system.status.utils.invalidate()

      if (result.type === 'redirect' || result.type === 'success') {
        toast.success(updateConfigSuccess())
        showLastFmConfig = false
      } else if (result.type === 'failure') {
        if (result.data?.reason) {
          toast.error(updateConfigFail(result.data.reason))
        } else {
          toast.error(formErrors())
        }
      } else if (result.type === 'error') {
        toast.error(updateConfigError(result.error))
      }
    },
  })
</script>

<form method="POST" use:enhance>
  <div class="flex items-center gap-4 rounded p-1.5 pl-3 hover:bg-gray-700">
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
      {#if showLastFmConfig}
        <Button
          kind="text"
          on:click={() => {
            showLastFmConfig = false
            reset()
          }}
        >
          Cancel
        </Button>
        <Button kind="outline" type="submit" loading={$delayed}>Save</Button>
      {:else}
        <Button kind="outline" on:click={() => (showLastFmConfig = true)}>Edit</Button>
      {/if}
    </div>
  </div>

  {#if showLastFmConfig}
    <div class="space-y-1 p-4 pt-2" transition:slide|local={{ axis: 'y' }}>
      <InputGroup errors={$errors.lastFmKey}>
        <Label for="last-fm-key">Last.fm API Key</Label>
        <Input id="last-fm-key" bind:value={$form.lastFmKey} />
      </InputGroup>

      <InputGroup errors={$errors.lastFmSecret}>
        <Label for="last-fm-secret">Last.fm API Secret</Label>
        <Input id="last-fm-secret" bind:value={$form.lastFmSecret} />
      </InputGroup>

      <InputGroup errors={$errors.lastFmUsername}>
        <Label for="last-fm-username">Last.fm Username</Label>
        <Input id="last-fm-username" bind:value={$form.lastFmUsername} />
      </InputGroup>

      <InputGroup errors={$errors.lastFmPassword}>
        <Label for="last-fm-password">Last.fm Password</Label>
        <Input id="last-fm-password" bind:value={$form.lastFmPassword} />
      </InputGroup>
    </div>
  {/if}
</form>
