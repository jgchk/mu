<script lang="ts">
  import { tw } from '$lib/utils/classes'

  let class_: string | undefined = undefined
  export { class_ as class }
</script>

<svg class={tw('spinner h-full w-full stroke-[10%]', class_)} viewBox="0 0 50 50">
  <circle class="path stroke-current" cx="25" cy="25" r="20" fill="none" />
</svg>

<style>
  .spinner {
    animation: rotate 2s linear infinite;
  }

  .spinner .path {
    stroke: currentColor;
    stroke-linecap: round;
    animation: dash 1.5s ease-in-out infinite;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes dash {
    0% {
      stroke-dasharray: 1, 150;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -35;
    }
    100% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -124;
    }
  }
</style>
