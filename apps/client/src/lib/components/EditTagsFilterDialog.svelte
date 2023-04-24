<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { pipe, tryOr } from 'utils'
  import { toRelativeUrl } from 'utils/browser'

  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import Button from '$lib/atoms/Button.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import TextArea from '$lib/atoms/TextArea.svelte'
  import type { TrackTagsFilter } from '$lib/tag-filter'
  import { AND_SYMBOL, decodeTagsFilterUrl, encodeTagsFilterUrl, OR_SYMBOL } from '$lib/tag-filter'
  import { getContextToast } from '$lib/toast/toast'
  import { cn } from '$lib/utils/classes'

  import EditTagsFilterPlaintext from './EditTagsFilterPlaintext.svelte'
  import TagSelect from './TagSelect.svelte'

  export let filter: TrackTagsFilter | undefined
  let text = filter ? encodeTagsFilterUrl(filter) : ''
  $: parsed = tryOr(() => decodeTagsFilterUrl(text), undefined)
  $: isValid = text.length === 0 || parsed !== undefined

  const toast = getContextToast()
  const handleSubmit = () => {
    if (!isValid || parsed === undefined) {
      toast.error('Filter is invalid :(')
      return
    }

    const url = new URL($page.url)

    const trimmed = text.trim()
    if (trimmed.length === 0) {
      url.searchParams.delete('tags')
    } else {
      const reencoded = encodeTagsFilterUrl(parsed)
      url.searchParams.set('tags', reencoded)
    }

    const urlString = pipe(url, toRelativeUrl, decodeURIComponent)
    void goto(urlString, { keepFocus: true, replaceState: true })

    close()
  }

  const dispatch = createEventDispatcher<{ close: undefined }>()
  const close = () => dispatch('close')

  let selectedTag: number | undefined = undefined

  let textArea: TextArea | undefined = undefined

  /* eslint-disable */
  const handleInsertText = (value: string) => {
    if (!textArea) return

    // get current textarea position
    const sel = textArea.getSelectionRange()

    // if range is selected, replace range
    if (sel.start !== sel.end) {
      text = text.slice(0, sel.start) + value + text.slice(sel.end)
    } else {
      // otherwise, insert at current position
      text = text.slice(0, sel.start) + value + text.slice(sel.end)
    }

    const newPos = sel.start + value.length
    textArea.focus()
    setTimeout(() => textArea?.setSelectionRange(newPos, newPos), 1)
  }
  /* eslint-enable */
</script>

<form on:submit|preventDefault={handleSubmit}>
  <Dialog title="Edit filter" on:close={close}>
    <div class="space-y-1">
      <div class="relative">
        <div class={cn('text-sm', isValid ? 'opacity-100' : 'opacity-0')}>
          <span class="text-success-500">Valid</span>{#if parsed}: {/if}<EditTagsFilterPlaintext
            filter={parsed}
          />
        </div>
        <div
          class={cn(
            'text-error-500 absolute left-0 top-0 text-sm',
            isValid ? 'opacity-0' : 'opacity-100'
          )}
        >
          Invalid
        </div>
      </div>

      <div class="flex gap-1">
        <TextArea bind:value={text} class="flex-1 font-mono" bind:this={textArea} />
        <div class="space-y-1">
          <Button on:click={() => handleInsertText(AND_SYMBOL)}>And</Button>
          <Button on:click={() => handleInsertText(OR_SYMBOL)}>Or</Button>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <TagSelect bind:value={selectedTag} class="flex-1" />
        <Button
          on:click={() => {
            if (selectedTag === undefined) return
            handleInsertText(selectedTag.toString())
          }}
        >
          Add
        </Button>
      </div>
    </div>

    <svelte:fragment slot="buttons">
      <Button type="submit">Save</Button>
      <Button kind="outline" on:click={close}>Cancel</Button>
    </svelte:fragment>
  </Dialog>
</form>
