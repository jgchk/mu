<script lang="ts">
  import AddToPlaylistConfimDuplicateDialog from '$lib/components/AddToPlaylistConfimDuplicateDialog.svelte'
  import DeletePlaylistDialog from '$lib/components/DeletePlaylistDialog.svelte'
  import DeleteTagDialog from '$lib/components/DeleteTagDialog.svelte'
  import EditArtistDialog from '$lib/components/EditArtistDialog.svelte'
  import EditAutoPlaylistDialog from '$lib/components/EditAutoPlaylistDialog.svelte'
  import EditPlaylistDialog from '$lib/components/EditPlaylistDialog.svelte'
  import EditTagDialog from '$lib/components/EditTagDialog.svelte'
  import EditTagsFilterDialog from '$lib/components/EditTagsFilterDialog.svelte'
  import NewAutoPlaylistDialog from '$lib/components/NewAutoPlaylistDialog.svelte'
  import NewPlaylistDialog from '$lib/components/NewPlaylistDialog.svelte'
  import NewTagDialog from '$lib/components/NewTagDialog.svelte'

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
  {:else if dialog._tag === 'new-auto-playlist'}
    <NewAutoPlaylistDialog {...dialog} on:close={() => dialogs.close('new-auto-playlist')} />
  {:else if dialog._tag === 'confirm-duplicate-playlist-track'}
    <AddToPlaylistConfimDuplicateDialog
      playlistId={dialog.playlistId}
      trackId={dialog.trackId}
      on:close={() => dialogs.close('confirm-duplicate-playlist-track')}
    />
  {:else if dialog._tag === 'edit-playlist'}
    <EditPlaylistDialog
      playlist={dialog.playlist}
      on:close={() => dialogs.close('edit-playlist')}
    />
  {:else if dialog._tag === 'edit-auto-playlist'}
    <EditAutoPlaylistDialog {...dialog} on:close={() => dialogs.close('edit-auto-playlist')} />
  {:else if dialog._tag === 'delete-playlist'}
    <DeletePlaylistDialog
      playlist={dialog.playlist}
      on:close={() => dialogs.close('delete-playlist')}
    />
  {:else if dialog._tag === 'edit-artist'}
    <EditArtistDialog artist={dialog.artist} on:close={() => dialogs.close('edit-artist')} />
  {:else if dialog._tag === 'new-tag'}
    <NewTagDialog on:close={() => dialogs.close('new-tag')} />
  {:else if dialog._tag === 'edit-tag'}
    <EditTagDialog tag={dialog.tag} on:close={() => dialogs.close('edit-tag')} />
  {:else if dialog._tag === 'delete-tag'}
    <DeleteTagDialog tag={dialog.tag} on:close={() => dialogs.close('delete-tag')} />
  {:else if dialog._tag === 'edit-tags-filter'}
    <EditTagsFilterDialog {...dialog} on:close={() => dialogs.close('edit-tags-filter')} />
  {/if}
{/if}
