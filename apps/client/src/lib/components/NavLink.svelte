<script lang="ts">
  import { page } from '$app/stores'

  import { tooltip } from '$lib/actions/tooltip'
  import { cn } from '$lib/utils/classes'

  export let href: string
  export let otherMatches: string[] = []

  export let label: string

  $: matches = $page.url.pathname === href || otherMatches.includes($page.url.pathname)
</script>

<a
  class={cn(
    'flex w-full flex-col items-center rounded px-2 py-1 font-medium transition hover:bg-gray-900 md:w-[unset] md:flex-[unset]',
    matches ? 'text-primary-500' : 'text-gray-300 hover:text-white'
  )}
  {href}
>
  {#if $$slots.default}
    <div class="h-5 w-5 md:hidden" use:tooltip={{ content: label }}>
      <slot />
    </div>
  {/if}

  <span class="text-xs md:text-base">
    {label}
  </span>
</a>
