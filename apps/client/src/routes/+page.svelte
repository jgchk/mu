<script lang="ts">
  import Button from '$lib/atoms/Button.svelte'
  import { createRestartSoulseekMutation } from '$lib/services/system'
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const restartSoulseekMutation = createRestartSoulseekMutation(trpc)
</script>

<div>hi :)</div>
<Button on:click={() => $restartSoulseekMutation.mutate()}>Restart Soulseek</Button>
