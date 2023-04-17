<script lang="ts">
  import type { PopperTooltipAction } from '$lib/actions/popper'
  import type { RouterOutput } from '$lib/trpc'
  import { cn, tw } from '$lib/utils/classes'

  export let status: RouterOutput['system']['status']['spotify']
  export let popperTooltip: PopperTooltipAction

  let class_: string | undefined = undefined
  export { class_ as class }
</script>

<div
  class={tw(
    'space-y-1 rounded-lg border border-gray-600 bg-gray-700 p-3 py-2 text-sm shadow-lg',
    class_
  )}
  use:popperTooltip={{ modifiers: [{ name: 'offset', options: { offset: [0, 8] } }] }}
>
  <div class="flex items-center gap-2">
    <div>Downloads</div>
    <div
      class={cn(
        'h-3 w-3 rounded-full transition',
        status.status === 'stopped' && 'bg-error-600',
        status.status === 'errored' && 'bg-error-600',
        status.status === 'starting' && 'bg-warning-600',
        (status.status === 'degraded' || status.status === 'running') &&
          (status.features.downloads && !status.errors?.downloads
            ? 'bg-success-600'
            : 'bg-error-600')
      )}
    />
    <div class="text-gray-400">
      {#if status.status === 'stopped'}
        Stopped
      {:else if status.status === 'starting'}
        Starting...
      {:else if status.status === 'errored'}
        Error: {status.errors.downloads}
      {:else if status.status === 'degraded'}
        {#if status.errors.downloads}
          Error: {status.errors.downloads}
        {:else if status.features.downloads}
          Running
        {:else}
          Stopped
        {/if}
      {:else if status.status === 'running'}
        {#if status.features.downloads}
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
        status.status === 'stopped' && 'bg-error-600',
        status.status === 'errored' && 'bg-error-600',
        status.status === 'starting' && 'bg-warning-600',
        (status.status === 'degraded' || status.status === 'running') &&
          (status.features.friendActivity && !status.errors?.friendActivity
            ? 'bg-success-600'
            : 'bg-error-600')
      )}
    />
    <div class="text-gray-400">
      {#if status.status === 'stopped'}
        Stopped
      {:else if status.status === 'starting'}
        Starting...
      {:else if status.status === 'errored'}
        Error: {status.errors.friendActivity}
      {:else if status.status === 'degraded'}
        {#if status.errors.friendActivity}
          Error: {status.errors.friendActivity}
        {:else if status.features.friendActivity}
          Running
        {:else}
          Stopped
        {/if}
      {:else if status.status === 'running'}
        {#if status.features.friendActivity}
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
        status.status === 'stopped' && 'bg-error-600',
        status.status === 'errored' && 'bg-error-600',
        status.status === 'starting' && 'bg-warning-600',
        (status.status === 'degraded' || status.status === 'running') &&
          (status.features.webApi && !status.errors?.webApi ? 'bg-success-600' : 'bg-error-600')
      )}
    />
    <div class="text-gray-400">
      {#if status.status === 'stopped'}
        Stopped
      {:else if status.status === 'starting'}
        Starting...
      {:else if status.status === 'errored'}
        Error: {status.errors.webApi}
      {:else if status.status === 'degraded'}
        {#if status.errors.webApi}
          Error: {status.errors.webApi}
        {:else if status.features.webApi}
          Running
        {:else}
          Stopped
        {/if}
      {:else if status.status === 'running'}
        {#if status.features.webApi}
          Running
        {:else}
          Stopped
        {/if}
      {/if}
    </div>
  </div>
</div>
