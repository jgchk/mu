<script lang="ts">
  export let size: number | string | undefined = undefined
  let class_: string | undefined = undefined
  export { class_ as class }
</script>

<svg
  stroke="currentColor"
  fill="currentColor"
  stroke-width="0"
  viewBox="0 0 20 20"
  aria-hidden="true"
  height={size ?? '100%'}
  width={size ?? '100%'}
  class={class_}
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
    clip-rule="evenodd"
  />
</svg>
