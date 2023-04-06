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
  <rect x="2" y="6" rx="1.5" ry="1.5" width="3" height="11" />
  <rect x="8" y="3" rx="1.5" ry="1.5" width="3" height="14" />
  <rect x="14" y="10" rx="1.5" ry="1.5" width="3" height="7" />
</svg>
