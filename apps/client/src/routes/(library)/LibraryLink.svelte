<script lang="ts">
  import { page } from '$app/stores'

  import { tooltip } from '$lib/actions/tooltip'
  import { cn } from '$lib/utils/classes'

  export let href: string
  export let label: string

  $: isCurrentUrl = $page.url.pathname === href
</script>

<a
  class={cn(
    'flex h-8 select-none items-center gap-2 px-4 transition hover:text-white md:h-10',
    isCurrentUrl ? 'text-white' : 'text-gray-500'
  )}
  {href}
>
  {#if $$slots.default}
    <div class="h-5 w-5" use:tooltip={{ content: label }}>
      <slot />
    </div>
  {/if}
  <span class="hidden md:inline">
    {label}
  </span>
</a>
