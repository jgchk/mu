<script lang="ts">
  import { page } from '$app/stores';
  import { cn } from '$lib/utils/classes';

  export let service: string;

  let url: URL;
  $: {
    const newUrl = new URL($page.url);
    newUrl.pathname = `/search/${service.toLowerCase()}`;
    url = newUrl;
  }

  $: isCurrentUrl = $page.url.pathname === url.pathname;
</script>

<a
  class={cn(
    'flex h-10 items-center gap-2 px-4 transition hover:text-white',
    isCurrentUrl ? 'text-white' : 'text-gray-500'
  )}
  href={url.pathname + url.search}
>
  {#if $$slots.default}
    <div class="h-5 w-5">
      <slot />
    </div>
  {/if}
  {service}
</a>
