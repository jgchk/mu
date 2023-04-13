<script lang="ts">
  import { page } from '$app/stores'
  import { tooltip as tooltipAction } from '$lib/actions/tooltip'
  import { cn } from '$lib/utils/classes'

  export let service: string
  export let disabled = false
  export let tooltip: string | undefined = undefined

  let url: URL
  $: {
    const newUrl = new URL($page.url)
    newUrl.pathname = `/search/${service.toLowerCase()}`
    url = newUrl
  }

  $: isCurrentUrl = $page.url.pathname === url.pathname
</script>

<a
  class={cn(
    'flex h-10 select-none items-center gap-2 px-4 transition',
    disabled
      ? 'cursor-default text-gray-700'
      : cn('hover:text-white', isCurrentUrl ? 'text-white' : 'text-gray-500')
  )}
  href={disabled ? undefined : url.pathname + url.search}
  use:tooltipAction={{ content: tooltip, enabled: tooltip !== undefined }}
>
  {#if $$slots.default}
    <div class="h-5 w-5">
      <slot />
    </div>
  {/if}
  {service}
</a>
