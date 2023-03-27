<script lang="ts">
  import type { Readable } from 'svelte/store'
  import { superForm } from 'sveltekit-superforms/client'

  import { dev } from '$app/environment'
  import Input from '$lib/components/Input.svelte'

  import type { PageServerData } from './$types'
  import ArtistSelect from './ArtistSelect.svelte'

  export let data: PageServerData

  const { form, enhance, errors, constraints } = superForm(data.form, { dataType: 'json' })

  type StoreType<T extends Readable<unknown>> = T extends Readable<infer U> ? U : never

  const removeIfUnused = (artist: StoreType<typeof form>['album']['artists'][number]) => {
    if (artist?.action !== 'create') return

    const artist_ = artist

    const isUsedElsewhere =
      $form.album.artists.some(
        (artist) => artist?.action === 'create' && artist.id === artist_.id
      ) ||
      $form.tracks.some((track) =>
        track.artists.some((artist) => artist?.action === 'create' && artist.id === artist_.id)
      )

    if (!isUsedElsewhere) {
      $form.artists.delete(artist.id)
    }
  }
</script>

{#if dev}
  {#await import('./Debug.svelte')}
    <div class="absolute left-0 bottom-0 flex w-full justify-center p-1 text-gray-400">
      Loading Debug...
    </div>
  {:then Debug}
    <Debug.default data={$form} />
  {/await}
{/if}

<form class="space-y-1 p-4" method="POST" use:enhance>
  <Input
    bind:value={$form.album.title}
    errors={$errors.album?.title}
    {...$constraints.album?.title}
  />
  {#if $errors.album?.title}<span class="text-error-500">{$errors.album.title}</span>{/if}

  <div class="space-y-1">
    {#each $form.album.artists as artist}
      <ArtistSelect
        value={artist}
        artists={$form.artists}
        on:create={({ detail }) => {
          const id = $form.artists.size + 1
          $form.artists.set(id, detail)
          artist = {
            action: 'create',
            id,
          }
          removeIfUnused(artist)
        }}
        on:created={({ detail }) => {
          artist = {
            action: 'create',
            id: detail,
          }
          removeIfUnused(artist)
        }}
        on:connect={({ detail }) => {
          artist = {
            action: 'connect',
            id: detail,
          }
          removeIfUnused(artist)
        }}
      />
    {/each}
    <button
      type="button"
      on:click={() => ($form.album.artists = [...$form.album.artists, undefined])}
      >Add Artist</button
    >
  </div>
  <button type="submit">Submit</button>

  {#if $form.artists.size > 0}
    <pre>{JSON.stringify(Object.fromEntries($form.artists), null, 2)}</pre>
  {/if}
</form>
