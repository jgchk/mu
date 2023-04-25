<script lang="ts">
  import { fade } from 'svelte/transition'

  import Loader from '$lib/atoms/Loader.svelte'

  import Delay from './Delay.svelte'
</script>

<Delay>
  <div class="flex h-full max-h-72 items-center justify-center" in:fade|local>
    <Loader class="h-10 w-10 text-gray-600" />
  </div>
</Delay>
