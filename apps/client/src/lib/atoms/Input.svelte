<script lang="ts">
  import { tw } from '$lib/utils/classes'

  import { getInputGroupErrors } from './InputGroup'

  export let value = ''
  export let type: 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url' = 'text'
  export let name: string | undefined = undefined
  export let id: string | undefined = undefined
  export let disabled = false
  export let placeholder: string | undefined = undefined
  export let autofocus = false
  export let pattern: string | undefined = undefined
  export let min: string | number | undefined = undefined
  export let max: string | number | undefined = undefined
  export let required = false
  export let step: number | string | undefined = undefined
  export let minlength: number | undefined = undefined
  export let maxlength: number | undefined = undefined
  export let autocomplete: string | undefined = 'off'
  let class_: string | undefined = undefined
  export { class_ as class }
  export let layer: 700 | 800 = 800

  let propErrors: string[] | undefined = undefined
  export { propErrors as errors }
  const contextErrors = getInputGroupErrors()
  $: errors = propErrors || ($contextErrors && $contextErrors.length > 0)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Events {
    input: Event & {
      currentTarget: EventTarget & HTMLInputElement
    }
    focus: FocusEvent & {
      currentTarget: EventTarget & HTMLInputElement
    }
    keydown: KeyboardEvent & {
      currentTarget: EventTarget & HTMLInputElement
    }
    blur: FocusEvent & {
      currentTarget: EventTarget & HTMLInputElement
    }
  }
</script>

<!-- svelte-ignore a11y-autofocus -->
<input
  {value}
  on:input
  on:input={(e) => (value = e.currentTarget.value)}
  on:focus
  on:keydown
  on:blur
  {type}
  {name}
  {id}
  {disabled}
  {placeholder}
  {autofocus}
  {pattern}
  {min}
  {max}
  {required}
  {step}
  {minlength}
  {maxlength}
  {autocomplete}
  data-invalid={errors}
  class={tw(
    'rounded px-2 py-1 text-white transition-all',
    layer === 700 && 'bg-gray-600',
    layer === 800 && 'bg-gray-700',
    class_
  )}
/>
