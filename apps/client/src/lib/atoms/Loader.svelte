<script lang="ts">
  import { tw } from '$lib/utils/classes'

  let class_: string | undefined = undefined
  export { class_ as class }
</script>

<div
  class={tw(
    'h-full w-full animate-spin rounded-full border-2 border-transparent border-t-current',
    class_
  )}
  {...$$restProps}
/>
