<script lang="ts">
  import Checkbox from '$lib/atoms/Checkbox.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import TextArea from '$lib/atoms/TextArea.svelte'

  import TagMultiselect from './TagMultiselect.svelte'

  export let data: {
    name: string
    description: string
    taggable: boolean
    parents: number[]
    children: number[]
  }
</script>

<div class="flex items-center gap-3">
  <div class="flex-1 space-y-2">
    <InputGroup>
      <Label for="tag-edit-name">Name</Label>
      <Input id="tag-edit-name" class="w-full" bind:value={data.name} autofocus required />
    </InputGroup>
    <InputGroup>
      <Label for="tag-edit-description">Description</Label>
      <TextArea
        id="tag-edit-description"
        class="w-full"
        bind:value={data.description}
        rows={3}
        placeholder="Optional"
      />
    </InputGroup>
    <InputGroup>
      <Label for="tag-edit-parents">Parents</Label>
      <TagMultiselect
        id="tag-edit-parents"
        bind:value={data.parents}
        class="w-full"
        placeholder="Optional"
      />
    </InputGroup>
    <InputGroup>
      <Label for="tag-edit-children">Children</Label>
      <TagMultiselect
        id="tag-edit-children"
        bind:value={data.children}
        class="w-full"
        placeholder="Optional"
      />
    </InputGroup>
    <InputGroup layout="horizontal">
      <Checkbox id="tag-edit-taggable" bind:checked={data.taggable} />
      <Label for="tag-edit-taggable">Taggable</Label>
    </InputGroup>
  </div>
</div>
