<script lang="ts">
  import { ifDefined } from 'utils'

  import { createTagsQuery } from '$lib/services/tags'
  import type { TrackTagsFilter } from '$lib/tag-filter'
  import { getContextClient } from '$lib/trpc'

  export let filter: TrackTagsFilter | undefined

  const trpc = getContextClient()
  const tagsQuery = createTagsQuery(trpc)
  $: tagsMap_ = ifDefined($tagsQuery.data, (tags) => new Map(tags.map((tag) => [tag.id, tag])))
  $: plainText = ifDefined(filter, (filter) =>
    ifDefined(tagsMap_, (tagsMap) => toPlainText(tagsMap, filter))
  )

  const toPlainText = (tagsMap: NonNullable<typeof tagsMap_>, filter: TrackTagsFilter): string => {
    if (typeof filter === 'number') {
      const tag = tagsMap.get(filter)
      return tag ? tag.name : '[unknown]'
    } else if (filter.kind === 'and') {
      return `(${filter.tags.map((tag) => toPlainText(tagsMap, tag)).join(' and ')})`
    } else if (filter.kind === 'or') {
      return `(${filter.tags.map((tag) => toPlainText(tagsMap, tag)).join(' or ')})`
    } else {
      throw new Error(`Invalid filter: ${JSON.stringify(filter)}`)
    }
  }
</script>

{#if plainText?.length}: {plainText}{/if}
