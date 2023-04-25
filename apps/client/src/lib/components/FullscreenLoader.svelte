<script lang="ts">
  import { fade } from 'svelte/transition'

  import Loader from '$lib/atoms/Loader.svelte'
  import { tw } from '$lib/utils/classes'

  import Delay from './Delay.svelte'

  let class_: string | undefined = undefined
  export { class_ as class }
</script>

<Delay>
  <div class={tw('flex h-full max-h-72 items-center justify-center', class_)} in:fade|local>
    <Loader class="h-10 w-10 text-gray-600" />
  </div>
</Delay>
