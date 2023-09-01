<script lang="ts">
  export let size: number | string | undefined = undefined
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
    d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
  />
</svg>
