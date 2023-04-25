<script lang="ts">
  import Button from '$lib/atoms/Button.svelte'
  import { getContextDialogs } from '$lib/dialogs/dialogs'

  const dialogs = getContextDialogs()
</script>

<div class="flex h-full gap-2">
  <div class="flex w-48 flex-col overflow-auto rounded bg-gray-900 p-2">
    <div class="flex-1">
      <slot name="sidebar" />
    </div>
    <Button kind="outline" on:click={() => dialogs.open('new-tag')} class="mt-1">New Tag</Button>
  </div>

  <div class="h-full flex-1 overflow-auto">
    <slot />
  </div>
</div>
