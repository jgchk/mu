<script lang="ts">
  import type { Readable } from 'svelte/store'
  import { superForm } from 'sveltekit-superforms/client'

  import { dev } from '$app/environment'
  import Button from '$lib/atoms/Button.svelte'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import ArtistSelect from '$lib/components/ArtistSelect.svelte'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
  import { getContextToast } from '$lib/toast/toast'
  import { cn } from '$lib/utils/classes'

  import type { PageServerData } from './$types'

  export let data: PageServerData

  const toast = getContextToast()
  const { form, enhance, errors, constraints, delayed } = superForm(data.form, {
    dataType: 'json',
    onResult: ({ result }) => {
      if (result.type === 'redirect' || result.type === 'success') {
        toast.success(`Imported ${$form.title || 'track'}!`)
      } else if (result.type === 'failure') {
        toast.error('Check the form for errors')
      } else if (result.type === 'error') {
        toast.error('Failed to import release')
      }
    },
  })

  type StoreType<T extends Readable<unknown>> = T extends Readable<infer U> ? U : never

  const removeIfUnused = (artist: StoreType<typeof form>['artists'][number]) => {
    if (artist?.action !== 'create') return

    const artist_ = artist

    const isUsedElsewhere = $form.artists.some(
      (artist) => artist?.action === 'create' && artist.id === artist_.id
    )

    if (!isUsedElsewhere) {
      $form.createArtists.delete(artist.id)
    }
  }
</script>

<div class="h-full overflow-auto">
  <form class={cn('p-4', dev && 'mb-8')} method="POST" use:enhance>
    <h2 class="mb-2 text-2xl font-bold">Track</h2>
    <div class="space-y-1">
      <Input bind:value={$form.title} errors={$errors.title} {...$constraints.title} />
      {#if $errors.title}<span class="text-error-500">{$errors.title}</span>{/if}

      <div class="space-y-1">
        {#each $form.artists as artist}
          <div class="flex gap-1">
            <ArtistSelect
              value={artist}
              createArtists={$form.createArtists}
              on:create={({ detail }) => {
                const id = $form.createArtists.size + 1
                $form.createArtists.set(id, detail)
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
            <IconButton
              tooltip="Remove"
              kind="text"
              on:click={() => {
                $form.artists = $form.artists.filter((artist_) => artist_ !== artist)
                removeIfUnused(artist)
              }}
            >
              <DeleteIcon />
            </IconButton>
          </div>
        {/each}

        <Button kind="outline" on:click={() => ($form.artists = [...$form.artists, undefined])}>
          Add Artist
        </Button>
      </div>
    </div>

    <Button type="submit" kind="solid" loading={$delayed} class="mt-4">Submit</Button>
  </form>
</div>

{#if dev}
  {#await import('$lib/components/SuperformDebug.svelte')}
    <div class="absolute bottom-0 left-0 flex w-full justify-center p-1 text-gray-400">
      Loading Debug...
    </div>
  {:then Debug}
    <Debug.default data={$form} />
  {/await}
{/if}
