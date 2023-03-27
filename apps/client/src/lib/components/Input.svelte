<script lang="ts">
  import { cn } from '$lib/utils/classes'

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
  let class_: string | undefined = undefined
  export { class_ as class }
  export let errors: string[] | undefined = undefined
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
  data-invalid={errors}
  class={cn(
    'focus:ring-primary-500 rounded bg-gray-700 px-2 py-1 text-white outline-none transition-all focus:ring-1',
    class_
  )}
/>
