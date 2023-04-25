<script lang="ts">
  import { pipe } from 'utils'
  import { toRelativeUrl, withUrlUpdate } from 'utils/browser'

  import { page } from '$app/stores'
  import Checkbox from '$lib/atoms/Checkbox.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'

  $: favoritesOnly = $page.url.searchParams.get('favorites') !== null
</script>

<a
  data-sveltekit-keepfocus
  data-sveltekit-replacestate
  class="group/favorites flex h-10 w-full cursor-pointer items-center px-4"
  href={pipe(
    withUrlUpdate($page.url, (url) => {
      if (favoritesOnly) {
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
    {#key favoritesOnly}
      <Checkbox id="filter-favorites-only" checked={favoritesOnly} tabindex={-1} />
    {/key}
    <Label
      for="filter-favorites-only"
      class="cursor-pointer transition group-hover/favorites:text-white">Favorites only</Label
    >
  </InputGroup>
</a>
