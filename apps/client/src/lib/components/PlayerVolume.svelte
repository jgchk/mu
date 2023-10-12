<script lang="ts">
  import IconButton from '$lib/atoms/IconButton.svelte'
  import Range from '$lib/atoms/Range.svelte'
  import VolumeOffIcon from '$lib/icons/VolumeOffIcon.svelte'
  import VolumeOnIcon from '$lib/icons/VolumeOnIcon.svelte'

  export let volume: number
  let previousVolume = 1
</script>

<div class="flex items-center gap-1">
  <IconButton
    kind="text"
    layer="black"
    tooltip={volume === 0 ? 'Unmute' : 'Mute'}
    on:click={() => {
      if (volume === 0) {
        volume = previousVolume
      } else {
        previousVolume = volume
        volume = 0
      }
    }}
  >
    {#if volume === 0}
      <VolumeOffIcon />
    {:else}
      <VolumeOnIcon />
    {/if}
  </IconButton>

  <div class="mr-4 hidden w-[125px] lg:block">
    <Range bind:value={volume} min={0} max={1} />
  </div>
</div>
