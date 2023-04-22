<script lang="ts">
  import { tw } from '$lib/utils/classes'

  export let checked = false

  export let id: string | undefined = undefined
  let class_: string | undefined = undefined
  export { class_ as class }
  export let tabindex: number | undefined = undefined

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Events {
    change: Event & {
      currentTarget: EventTarget & HTMLInputElement
    }
  }
</script>

<input
  {id}
  {tabindex}
  type="checkbox"
  bind:checked
  on:change
  class={tw('accent-secondary-600 h-5 w-5 cursor-pointer', class_)}
/>
