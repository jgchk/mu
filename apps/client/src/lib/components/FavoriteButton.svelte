<script lang="ts">
  import type { ComponentProps } from 'svelte'

  import IconButton from '$lib/atoms/IconButton.svelte'
  import HeartIcon from '$lib/icons/HeartIcon.svelte'
  import { cn } from '$lib/utils/classes'

  export let favorite: boolean
  export let layer: ComponentProps<IconButton>['layer'] = undefined
</script>

<IconButton kind="text" tooltip={favorite ? 'Unfavorite' : 'Favorite'} on:click {layer}>
  <HeartIcon class={cn(favorite && 'text-error-600')} />
</IconButton>
