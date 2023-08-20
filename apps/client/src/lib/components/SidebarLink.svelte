<script lang="ts">
  import { page } from '$app/stores'

  import { cn } from '$lib/utils/classes'

  export let href: string
  export let label: string

  $: hrefPathname = new URL(href, $page.url.origin).pathname

  $: isCurrentUrl = $page.url.pathname === hrefPathname
</script>

<a
  class={cn(
    'flex w-full select-none flex-col items-center justify-center px-4 py-2 transition hover:text-white md:w-[unset] md:flex-row md:justify-start md:gap-2',
    isCurrentUrl ? 'text-white' : 'text-gray-500'
  )}
  {href}
>
  {#if $$slots.default}
    <div class="h-5 w-5">
      <slot />
    </div>
  {/if}

  <span class="text-xs md:text-base">
    {label}
  </span>
</a>
