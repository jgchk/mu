<script lang="ts">
  import { tw } from '$lib/utils/classes'

  export let kind: string
  export let selected: boolean
</script>

<button
  type="button"
  class={tw(
    'rounded-full border border-gray-700 bg-transparent p-2 px-3 text-sm font-medium capitalize',
    selected && 'bg-primary-700 border-primary-600'
  )}
  on:click
>
  {kind}
</button>
