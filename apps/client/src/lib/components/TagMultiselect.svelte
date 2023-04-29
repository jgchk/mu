<script lang="ts">
  import type { ComponentProps } from 'svelte'

  import Multiselect from '$lib/atoms/Multiselect.svelte'
  import type { Option } from '$lib/atoms/Select'
  import { createTagsQuery } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  type Opt = Option<{ value: number }>

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Props extends Omit<ComponentProps<Multiselect<Opt>>, 'value' | 'options'> {
    value: number[]
  }

  export let value: $$Props['value'] = []

  const trpc = getContextClient()
  const tagsQuery = createTagsQuery(trpc)

  $: values = value.map(
    (id): Opt => ({
      value: id,
      label: $tagsQuery.data?.find((tag) => tag.id === id)?.name ?? 'Unknown',
    })
  )
  $: options =
    $tagsQuery.data?.map((tag) => ({
      value: tag.id,
      label: tag.name,
    })) ?? []
</script>

<Multiselect
  value={values}
  {options}
  on:change={(e) => (value = e.detail.value.map((v) => v.value))}
  on:change
  on:blur
  {...$$restProps}
/>
