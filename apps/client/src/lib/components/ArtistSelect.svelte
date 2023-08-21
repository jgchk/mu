<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import { createEventDispatcher } from 'svelte'

  import type { Option } from '$lib/atoms/Select'
  import Select from '$lib/atoms/Select.svelte'
  import { getContextClient } from '$lib/trpc'

  type Opt = Option<{
    value: string
    data:
      | {
          id: number
          action: 'connect'
        }
      | {
          id: number
          action: 'create'
        }
      | {
          id?: undefined
          action: 'new'
          name: string
        }
  }>

  interface $$Props extends Omit<ComponentProps<Select<Opt>>, 'value' | 'options'> {
    value?: Opt['data']
    createArtists: Map<number, string>
  }

  let filter = ''

  const trpc = getContextClient()
  const artistsQuery = trpc.artists.getAll.query({})

  export let value: $$Props['value'] = undefined
  export let createArtists: $$Props['createArtists']

  let remoteOptions: Opt[]
  $: remoteOptions = (
    $artistsQuery.data?.map((artist) => ({ action: 'connect', ...artist } as const)) ?? []
  ).map((val) => ({ value: `${val.action}-${val.id}`, label: val.name, data: val }))

  let localOptions: Opt[]
  $: localOptions = [...createArtists.entries()].map(
    ([id, name]) =>
      ({ value: `create-${id}`, label: name, data: { action: 'create', id } } as const)
  )

  let createNewOption: Opt | undefined
  $: createNewOption =
    filter.length > 0
      ? {
          value: 'new',
          label: `Create new artist: ${filter}`,
          data: { action: 'new', name: filter },
        }
      : undefined

  let options: Opt[]
  $: options = [...remoteOptions, ...localOptions, ...(createNewOption ? [createNewOption] : [])]

  $: valueOption = options?.find(
    (opt) => opt.data.action === value?.action && opt.data.id === value?.id
  )

  const dispatch = createEventDispatcher<{ create: string; created: number; connect: number }>()
</script>

<Select
  class="w-64"
  bind:filter
  value={valueOption}
  {options}
  on:change={({ detail: { value } }) => {
    if (!value) return

    switch (value.data.action) {
      case 'new': {
        dispatch('create', value.data.name)
        break
      }
      case 'create': {
        dispatch('created', value.data.id)
        break
      }
      case 'connect': {
        dispatch('connect', value.data.id)
        break
      }
    }
  }}
  on:blur
  {...$$restProps}
/>
