<script lang="ts">
  import type { Validation } from 'sveltekit-superforms'
  import { superForm } from 'sveltekit-superforms/client'
  import type { ContextSpotifyErrors } from 'trpc'
  import { isDefined, toErrorString } from 'utils'

  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { createPopperAction } from '$lib/actions/popper'
  import Button from '$lib/atoms/Button.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import { createStartSpotifyMutation, createStopSpotifyMutation } from '$lib/services/system'
  import { formErrors } from '$lib/strings'
  import { getContextToast } from '$lib/toast/toast'
  import { slide } from '$lib/transitions/slide'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'

  import type { ActionData } from './$types'
  import type { SpotifySchema } from './schemas'

  export let data: Validation<SpotifySchema>
  export let status: RouterOutput['system']['status']

  let showConfig = false
  $: {
    if ($page.url.searchParams.has('spotify')) {
      showConfig = true
      $page.url.searchParams.delete('spotify')
      if (browser) {
        void goto(`?${$page.url.search}`)
      }
    }
  }

  const toast = getContextToast()
  const trpc = getContextClient()

  const updateErrorMsg = (error: unknown) => `Error updating Spotify: ${toErrorString(error)}`
  const formatErrors = (errors: ContextSpotifyErrors) =>
    Object.values(errors).filter(isDefined).map(toErrorString).join(', ')

  const notifyStatus = (status: RouterOutput['system']['status']['spotify']) => {
    if (status.status === 'stopped') {
      toast.error('Spotify updated: Stopped')
    } else if (status.status === 'starting') {
      toast.warning('Spotify updated: Starting...')
    } else if (status.status === 'errored') {
      toast.error(`Spotify updated: ${formatErrors(status.errors)}`)
    } else if (status.status === 'degraded') {
      toast.warning(`Spotify updated: Degraded: ${formatErrors(status.errors)}`)
    } else if (status.status === 'running') {
      toast.success('Spotify updated!')
    }
  }

  const { form, enhance, errors, delayed, reset } = superForm(data, {
    dataType: 'json',
    onResult: ({ result }) => {
      if (result.type === 'success') {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const status: RouterOutput['system']['status'] = (result.data as ActionData)!.status!
        notifyStatus(status.spotify)
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

  const startSpotifyMutation = createStartSpotifyMutation(trpc, {
    showToast: false,
    onSuccess: (data) => notifyStatus(data),
    onError: (error) => {
      toast.error(updateErrorMsg(error))
    },
  })

  const stopSpotifyMutation = createStopSpotifyMutation(trpc, {
    showToast: false,
    onSuccess: (data) => notifyStatus(data),
    onError: (error) => {
      toast.error(updateErrorMsg(error))
    },
  })

  const [popperElement, popperTooltip] = createPopperAction()
</script>

<form method="POST" action="?/spotify" use:enhance>
  <div class="flex items-center gap-4 rounded p-1.5 pl-3">
    <div>Spotify</div>
    <div
      use:popperElement
      class={cn(
        'group h-4 w-4 rounded-full transition',
        status.spotify.status === 'stopped' && 'bg-error-600',
        status.spotify.status === 'errored' && 'bg-error-600',
        status.spotify.status === 'starting' && 'bg-warning-600',
        status.spotify.status === 'degraded' && 'bg-warning-600',
        status.spotify.status === 'running' && 'bg-success-600'
      )}
    >
      <div
        class="pointer-events-none absolute space-y-1 rounded border border-gray-600 bg-gray-700 p-3 py-2 text-sm opacity-0 shadow group-hover:pointer-events-auto group-hover:opacity-100"
        use:popperTooltip={{ modifiers: [{ name: 'offset', options: { offset: [0, 8] } }] }}
      >
        <div class="flex items-center gap-2">
          <div>Downloads</div>
          <div
            class={cn(
              'h-3 w-3 rounded-full transition',
              status.spotify.status === 'stopped' && 'bg-error-600',
              status.spotify.status === 'errored' && 'bg-error-600',
              status.spotify.status === 'starting' && 'bg-warning-600',
              (status.spotify.status === 'degraded' || status.spotify.status === 'running') &&
                (status.spotify.features.downloads && !status.spotify.errors?.downloads
                  ? 'bg-success-600'
                  : 'bg-error-600')
            )}
          />
          <div class="text-gray-400">
            {#if status.spotify.status === 'stopped'}
              Stopped
            {:else if status.spotify.status === 'starting'}
              Starting...
            {:else if status.spotify.status === 'errored'}
              Error: {status.spotify.errors.downloads}
            {:else if status.spotify.status === 'degraded'}
              {#if status.spotify.errors.downloads}
                Error: {status.spotify.errors.downloads}
              {:else if status.spotify.features.downloads}
                Running
              {:else}
                Stopped
              {/if}
            {:else if status.spotify.status === 'running'}
              {#if status.spotify.features.downloads}
                Running
              {:else}
                Stopped
              {/if}
            {/if}
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div>Friend Activity</div>
          <div
            class={cn(
              'h-3 w-3 rounded-full transition',
              status.spotify.status === 'stopped' && 'bg-error-600',
              status.spotify.status === 'errored' && 'bg-error-600',
              status.spotify.status === 'starting' && 'bg-warning-600',
              (status.spotify.status === 'degraded' || status.spotify.status === 'running') &&
                (status.spotify.features.friendActivity && !status.spotify.errors?.friendActivity
                  ? 'bg-success-600'
                  : 'bg-error-600')
            )}
          />
          <div class="text-gray-400">
            {#if status.spotify.status === 'stopped'}
              Stopped
            {:else if status.spotify.status === 'starting'}
              Starting...
            {:else if status.spotify.status === 'errored'}
              Error: {status.spotify.errors.friendActivity}
            {:else if status.spotify.status === 'degraded'}
              {#if status.spotify.errors.friendActivity}
                Error: {status.spotify.errors.friendActivity}
              {:else if status.spotify.features.friendActivity}
                Running
              {:else}
                Stopped
              {/if}
            {:else if status.spotify.status === 'running'}
              {#if status.spotify.features.friendActivity}
                Running
              {:else}
                Stopped
              {/if}
            {/if}
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div>Web API</div>
          <div
            class={cn(
              'h-3 w-3 rounded-full transition',
              status.spotify.status === 'stopped' && 'bg-error-600',
              status.spotify.status === 'errored' && 'bg-error-600',
              status.spotify.status === 'starting' && 'bg-warning-600',
              (status.spotify.status === 'degraded' || status.spotify.status === 'running') &&
                (status.spotify.features.webApi && !status.spotify.errors?.webApi
                  ? 'bg-success-600'
                  : 'bg-error-600')
            )}
          />
          <div class="text-gray-400">
            {#if status.spotify.status === 'stopped'}
              Stopped
            {:else if status.spotify.status === 'starting'}
              Starting...
            {:else if status.spotify.status === 'errored'}
              Error: {status.spotify.errors.webApi}
            {:else if status.spotify.status === 'degraded'}
              {#if status.spotify.errors.webApi}
                Error: {status.spotify.errors.webApi}
              {:else if status.spotify.features.webApi}
                Running
              {:else}
                Stopped
              {/if}
            {:else if status.spotify.status === 'running'}
              {#if status.spotify.features.webApi}
                Running
              {:else}
                Stopped
              {/if}
            {/if}
          </div>
        </div>
      </div>
    </div>
    <div class="flex items-center justify-end gap-1">
      {#if status.spotify.status !== 'stopped'}
        <Button
          kind="text"
          on:click={() => $stopSpotifyMutation.mutate()}
          loading={$stopSpotifyMutation.isLoading}
        >
          Stop
        </Button>
      {/if}
      <Button
        kind="text"
        on:click={() => $startSpotifyMutation.mutate()}
        loading={$startSpotifyMutation.isLoading}
      >
        {#if status.spotify.status === 'stopped'}
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
      <InputGroup errors={$errors.spotifyClientId}>
        <Label for="spotify-client-id">Client ID</Label>
        <Input id="spotify-client-id" bind:value={$form.spotifyClientId} />
      </InputGroup>

      <InputGroup errors={$errors.spotifyClientSecret}>
        <Label for="spotify-client-secret">Client Secret</Label>
        <Input id="spotify-client-secret" bind:value={$form.spotifyClientSecret} />
      </InputGroup>

      <InputGroup errors={$errors.spotifyUsername}>
        <Label for="spotify-username">Username</Label>
        <Input id="spotify-username" bind:value={$form.spotifyUsername} />
      </InputGroup>

      <InputGroup errors={$errors.spotifyPassword}>
        <Label for="spotify-password">Password</Label>
        <Input id="spotify-password" bind:value={$form.spotifyPassword} />
      </InputGroup>

      <InputGroup errors={$errors.spotifyDcCookie}>
        <Label for="spotify-dc-cookie">DC Cookie</Label>
        <Input id="spotify-dc-cookie" bind:value={$form.spotifyDcCookie} />
      </InputGroup>
    </div>
  {/if}
</form>
