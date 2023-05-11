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
    'flex h-8 w-full select-none items-center justify-center gap-2 px-4 transition hover:text-white md:h-10 md:w-[unset] md:justify-start',
    isCurrentUrl ? 'text-white' : 'text-gray-500'
  )}
  {href}
  use:tooltip={{ content: label }}
>
  {#if $$slots.default}
    <div class="h-5 w-5">
      <slot />
    </div>
  {/if}
  <span class="hidden md:inline">
    {label}
  </span>
</a>
