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
  <g transform="translate(0,20)">
    <g transform="scale(1,-1)">
      <rect x="2" y="3" rx="1.5" ry="1.5" width="3" height="11">
        <animate attributeName="height" values="10;12;10" dur="1.5s" repeatCount="indefinite" />
      </rect>
      <rect x="8" y="3" rx="1.5" ry="1.5" width="3" height="14">
        <animate attributeName="height" values="13;15;13" dur="2s" repeatCount="indefinite" />
      </rect>
      <rect x="14" y="3" rx="1.5" ry="1.5" width="3" height="7">
        <animate attributeName="height" values="6;8;6" dur="1s" repeatCount="indefinite" />
      </rect>
    </g>
  </g>
</svg>
