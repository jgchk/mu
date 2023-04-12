<script lang="ts">
  import IconButton from '$lib/atoms/IconButton.svelte'
  import HeartIcon from '$lib/icons/HeartIcon.svelte'
  import { cn, tw } from '$lib/utils/classes'

  export let favorite: boolean

  let class_: string | undefined = undefined
  export { class_ as class }
</script>

<IconButton
  kind="text"
  tooltip={favorite ? 'Unfavorite' : 'Favorite'}
  class={tw('text-gray-400 hover:bg-gray-600 hover:text-gray-300', class_)}
  on:click
>
  <HeartIcon class={cn(favorite && 'text-error-600')} />
</IconButton>
