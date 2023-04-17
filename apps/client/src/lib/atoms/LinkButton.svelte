<script lang="ts">
  import { cn } from '$lib/utils/classes'

  export let href: string | undefined = undefined
  export let kind: 'solid' | 'outline' | 'text' = 'solid'
  let class_: string | undefined = undefined
  export { class_ as class }
</script>

<a
  {href}
  class={cn(
    'focus:ring-primary-500 flex w-fit items-center rounded border px-2 py-1 text-sm font-medium outline-none transition focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800',
    kind === 'solid' && 'bg-primary-500 hover:bg-primary-600 border-transparent text-black',
    kind === 'outline' && 'border-primary-500 text-primary-500 bg-transparent hover:bg-gray-700',
    kind === 'text' &&
      'text-primary-500 focus:border-primary-500 border-transparent bg-transparent hover:bg-gray-700',
    class_
  )}
  on:click
>
  <slot />
</a>
