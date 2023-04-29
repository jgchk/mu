<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import { createEventDispatcher } from 'svelte'

  import type { Option } from '$lib/atoms/Select'
  import Select from '$lib/atoms/Select.svelte'
  import { createTagsQuery } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  type Opt = Option<{ value: number }>

  interface $$Props extends Omit<ComponentProps<Select<Opt>>, 'value' | 'options'> {
    value?: number
  }

  export let value: $$Props['value'] = undefined

  const trpc = getContextClient()
  const tagsQuery = createTagsQuery(trpc)

  $: options = $tagsQuery.data?.map((tag) => ({ value: tag.id, label: tag.name })) ?? []
  $: valueOption = options?.find((opt) => opt.value === value)

  const dispatch = createEventDispatcher<{
    change: { value: number | undefined }
  }>()
</script>

<Select
  value={valueOption}
  {options}
  on:change={(e) => {
    value = e.detail.value?.value
    dispatch('change', { value })
  }}
  on:blur
  {...$$restProps}
/>
