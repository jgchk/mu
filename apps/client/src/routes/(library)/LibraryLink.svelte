<script lang="ts">
  import { page } from '$app/stores'
  import { cn } from '$lib/utils/classes'

  export let href: string

  $: isCurrentUrl = $page.url.pathname === href
</script>

<a
  class={cn(
    'flex h-10 select-none items-center gap-2 px-4 transition hover:text-white',
    isCurrentUrl ? 'text-white' : 'text-gray-500'
  )}
  {href}
>
  <slot />
</a>
