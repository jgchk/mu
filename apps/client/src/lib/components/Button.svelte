<script lang="ts">
  import { cn } from '$lib/utils/classes'

  export let disabled = false
  export let type: 'button' | 'submit' = 'button'
  export let kind: 'solid' | 'outline' | 'text' = 'solid'
  let class_: string | undefined = undefined
  export { class_ as class }
</script>

<button
  on:click
  {disabled}
  {type}
  class={cn(
    'rounded px-2 py-1 text-sm font-medium outline-none transition focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800',
    kind === 'solid' && 'bg-primary-500 hover:bg-primary-600 focus:ring-primary-500 text-black',
    kind === 'text' && 'focus:ring-primary-500 bg-transparent text-gray-300 hover:bg-gray-700',
    kind === 'outline' &&
      'focus:ring-primary-500 border-primary-500 text-primary-500 border bg-transparent hover:bg-gray-700',
    class_
  )}
>
  <slot />
</button>
