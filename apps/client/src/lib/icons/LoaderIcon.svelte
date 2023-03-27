<script lang="ts">
  export let size: number | undefined = undefined
  let class_: string | undefined = undefined
  export { class_ as class }
</script>

<svg
  role="img"
  viewBox="0 0 24 24"
  width={size ?? '100%'}
  height={size ?? '100%'}
  fill="currentColor"
  xmlns="http://www.w3.org/2000/svg"
  class={class_}
>
  <path
    fill="currentColor"
    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
  />
</svg>
