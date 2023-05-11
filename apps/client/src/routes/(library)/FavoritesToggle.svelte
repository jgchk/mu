<script lang="ts">
  import { page } from '$app/stores'
  import { pipe } from 'utils'
  import { toRelativeUrl, withUrlUpdate } from 'utils/browser'

  import Checkbox from '$lib/atoms/Checkbox.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import { cn } from '$lib/utils/classes'

  $: favorites = $page.url.searchParams.get('favorites') !== null
</script>

<a
  data-sveltekit-keepfocus
  data-sveltekit-replacestate
  class="group/favorites flex h-8 w-full cursor-pointer items-center px-4 md:h-10"
  href={pipe(
    withUrlUpdate($page.url, (url) => {
      if (favorites) {
        url.searchParams.delete('favorites')
      } else {
        url.searchParams.set('favorites', 'true')
      }
    }),
    toRelativeUrl,
    decodeURIComponent
  )}
  on:keydown={(e) => {
    // trigger link on space
    if (e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.click()
    }
  }}
>
  <InputGroup layout="horizontal" class="pointer-events-none">
    {#key favorites}
      <Checkbox id="filter-favorites-only" checked={favorites} tabindex={-1} />
    {/key}
    <Label
      for="filter-favorites-only"
      class={cn(
        'cursor-pointer transition group-hover/favorites:text-white',
        favorites ? 'text-white' : 'text-gray-400'
      )}
    >
      Favorites
    </Label>
  </InputGroup>
</a>
