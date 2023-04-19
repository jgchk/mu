<script lang="ts">
  import NewPlaylistDialog from '$lib/components/NewPlaylistDialog.svelte'

  import { getContextDialogs } from './dialogs'

  const dialogs = getContextDialogs()
</script>

{#if $dialogs.currentDialog}
  {@const dialog = $dialogs.currentDialog}
  {#if dialog._tag === 'new-playlist'}
    <NewPlaylistDialog
      name={dialog.name}
      tracks={dialog.tracks}
      on:close={() => dialogs.close('new-playlist')}
    />
  {/if}
{/if}
