<script lang="ts">
  export let size: number | undefined = undefined
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
    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
    clip-rule="evenodd"
  />
</svg>
