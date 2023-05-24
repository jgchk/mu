<script lang="ts">
  import FileDrop from '$lib/atoms/FileDrop.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import TextArea from '$lib/atoms/TextArea.svelte'
  import { makeImageUrl } from '$lib/cover-art'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'

  import CoverArt from './CoverArt.svelte'
  import TagsFilterEditor from './TagsFilterEditor.svelte'

  export let data: {
    name: string
    description: string | undefined
    art: Blob | null | undefined
    filter: string
  }
  export let imageId: number | null = null
</script>

<div class="space-y-2">
  <div class="flex items-center gap-3">
    <div class="h-44 w-44">
      {#if data.art === undefined && imageId !== null}
        <button
          type="button"
          class="relative h-full w-full"
          on:click={() => {
            if (data) {
              data.art = null
            }
          }}
        >
          <CoverArt src={makeImageUrl(imageId, { size: 512 })} alt="Album Art">
            <DeleteIcon />
          </CoverArt>
        </button>
      {:else if data.art}
        <button
          type="button"
          class="relative h-full w-full"
          on:click={() => {
            if (data) {
              data.art = undefined
            }
          }}
        >
          <CoverArt src={URL.createObjectURL(data.art)} alt="Album Art">
            <DeleteIcon />
          </CoverArt>
        </button>
      {:else}
        <FileDrop
          class="h-full w-full text-xs"
          on:drop={(e) => {
            if (data) {
              data.art = e.detail.at(0) ?? null
            }
          }}
        />
      {/if}
    </div>

    <div class="flex-1 space-y-2">
      <InputGroup>
        <Label for="playlist-edit-name">Name</Label>
        <Input id="playlist-edit-name" class="w-full" bind:value={data.name} autofocus />
      </InputGroup>
      <InputGroup>
        <Label for="playlist-edit-description">Description</Label>
        <TextArea
          id="playlist-edit-description"
          class="w-full"
          bind:value={data.description}
          rows={3}
          placeholder="Optional"
        />
      </InputGroup>
    </div>
  </div>

  <TagsFilterEditor bind:text={data.filter} required />
</div>
