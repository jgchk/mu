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
    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
    clip-rule="evenodd"
  />
</svg>
