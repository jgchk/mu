<script lang="ts">
  import { page } from '$app/stores'

  import { cn } from '$lib/utils/classes'

  export let service: string

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
    'flex w-full select-none flex-col items-center justify-center py-2 transition hover:text-white md:flex-row md:justify-start md:gap-2 md:px-4',
    isCurrentUrl ? 'text-white' : 'text-gray-500'
  )}
  href={url.pathname + url.search}
>
  {#if $$slots.default}
    <div class="h-5 w-5">
      <slot />
    </div>
  {/if}

  <span class="text-xs md:text-base">
    {service}
  </span>
</a>
