<script lang="ts">
  import type { ComponentProps } from 'svelte'

  import LoaderIcon from '$lib/icons/LoaderIcon.svelte'
  import { cn } from '$lib/utils/classes'

  type $$Props = ComponentProps<LoaderIcon>

  let class_: $$Props['class'] = undefined
  export { class_ as class }
</script>

<LoaderIcon class={cn('animate-spin', class_)} {...$$restProps} />
