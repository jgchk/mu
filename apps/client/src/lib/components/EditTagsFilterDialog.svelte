<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import type { BoolLang } from 'bool-lang'
  import { decode, encode } from 'bool-lang'
  import { createEventDispatcher } from 'svelte'
  import { pipe, tryOr } from 'utils'
  import { toRelativeUrl } from 'utils/browser'

  import Button from '$lib/atoms/Button.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import { getContextToast } from '$lib/toast/toast'

  import TagsFilterEditor from './TagsFilterEditor.svelte'

  export let filter: BoolLang | undefined

  let text = filter ? encode(filter) : ''
  $: parsed = tryOr(() => decode(text), undefined)

  const toast = getContextToast()
  const handleSubmit = () => {
    if (parsed === undefined) {
      toast.error('Filter is invalid :(')
      return
    }

    const url = new URL($page.url)

    const trimmed = text.trim()
    if (trimmed.length === 0) {
      url.searchParams.delete('tags')
    } else {
      const reencoded = encode(parsed)
      url.searchParams.set('tags', reencoded)
    }

    const urlString = pipe(url, toRelativeUrl, decodeURIComponent)
    void goto(urlString, { keepFocus: true, replaceState: true })

    close()
  }

  const dispatch = createEventDispatcher<{ close: undefined }>()
  const close = () => dispatch('close')
</script>

<form on:submit|preventDefault={handleSubmit}>
  <Dialog title="Edit filter" on:close={close}>
    <TagsFilterEditor bind:text />

    <svelte:fragment slot="buttons">
      <Button type="submit">Save</Button>
      <Button kind="outline" on:click={close}>Cancel</Button>
    </svelte:fragment>
  </Dialog>
</form>
