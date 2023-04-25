<script lang="ts">
  import { AND_SYMBOL, decode, NOT_SYMBOL, OR_SYMBOL } from 'bool-lang'
  import { tryOr } from 'utils'

  import Button from '$lib/atoms/Button.svelte'
  import TextArea from '$lib/atoms/TextArea.svelte'
  import { cn } from '$lib/utils/classes'

  import EditTagsFilterPlaintext from './EditTagsFilterPlaintext.svelte'
  import TagSelect from './TagSelect.svelte'

  export let text: string
  export let required = false

  $: parsed = tryOr(() => decode(text), undefined)
  $: isValid = (required ? false : text.length === 0) || parsed !== undefined

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

<div class="space-y-1">
  <div class="relative">
    <div class={cn('text-sm', isValid ? 'opacity-100' : 'opacity-0')}>
      <span class="text-success-500">Valid</span>{#if parsed}: {/if}<EditTagsFilterPlaintext
        filter={parsed}
        newTab
      />
    </div>
    <div
      class={cn(
        'text-error-500 absolute left-0 top-0 text-sm',
        isValid ? 'opacity-0' : 'opacity-100'
      )}
    >
      {#if required && text.length === 0}
        Required
      {:else}
        Invalid
      {/if}
    </div>
  </div>

  <div class="flex gap-1">
    <TextArea bind:value={text} class="flex-1 font-mono" bind:this={textArea} {required} />
    <div class="space-y-1">
      <Button on:click={() => handleInsertText(AND_SYMBOL)}>And</Button>
      <Button on:click={() => handleInsertText(OR_SYMBOL)}>Or</Button>
      <Button on:click={() => handleInsertText(NOT_SYMBOL)}>Not</Button>
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
