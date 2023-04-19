<script lang="ts">
  import { cn, tw } from '$lib/utils/classes'

  export let href: string | undefined = undefined
  export let kind: 'solid' | 'outline' | 'text' = 'solid'
  let class_: string | undefined = undefined
  export { class_ as class }

  export let layer: 700 | 800 = 800
</script>

<a
  {href}
  class={tw(
    'focus-visible:ring-primary-500 flex w-fit items-center rounded border px-2 py-1 text-sm font-medium outline-none transition focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-800',
    kind === 'solid' && 'bg-primary-500 hover:bg-primary-600 border-transparent text-black',
    kind === 'outline' &&
      cn(
        'border-primary-500 text-primary-500 bg-transparent',
        layer === 700 && 'hover:bg-gray-600',
        layer === 800 && 'hover:bg-gray-700'
      ),
    kind === 'text' &&
      cn(
        'text-primary-500 focus-visible:border-primary-500 border-transparent bg-transparent',
        layer === 700 && 'hover:bg-gray-600',
        layer === 800 && 'hover:bg-gray-700'
      ),
    class_
  )}
  on:click
>
  <slot />
</a>
