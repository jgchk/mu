<script lang="ts">
  export let size: number | undefined = undefined
  let class_: string | undefined = undefined
  export { class_ as class }
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 20 20"
  fill="currentColor"
  height={size ?? '100%'}
  width={size ?? '100%'}
  class={class_}
>
  <path
    fill-rule="evenodd"
    clip-rule="even-odd"
    d="M 10 18 a 8 8 0 1 0 0 -16 a 8 8 0 0 0 0 16 z m 0 -5 a 1 1 0 1 1 0 -6 a 1 1 0 0 1 0 6 z"
  />
</svg>
