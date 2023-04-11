<script lang="ts">
  import IconButton from '$lib/atoms/IconButton.svelte'
  import HeartIcon from '$lib/icons/HeartIcon.svelte'
  import { cn } from '$lib/utils/classes'

  export let favorite: boolean
</script>

<IconButton
  kind="text"
  tooltip={favorite ? 'Unfavorite' : 'Favorite'}
  class="text-gray-400 hover:bg-gray-600 hover:text-gray-300"
  on:click
>
  <HeartIcon class={cn(favorite && 'text-error-600')} />
</IconButton>
