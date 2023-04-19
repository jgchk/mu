<script lang="ts">
  import AddToPlaylistConfimDuplicateDialog from '$lib/components/AddToPlaylistConfimDuplicateDialog.svelte'
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
  {:else if dialog._tag === 'confirm-duplicate-playlist-track'}
    <AddToPlaylistConfimDuplicateDialog
      playlistId={dialog.playlistId}
      trackId={dialog.trackId}
      on:close={() => dialogs.close('confirm-duplicate-playlist-track')}
    />
  {/if}
{/if}
