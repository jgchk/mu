<script lang="ts">
  import { fly, slide } from 'svelte/transition'

  import { getContextToast } from './toast'
  import Toast from './Toast.svelte'

  export let toast = getContextToast()

  const IN_DURATION = 200
  const OUT_DURATION = 175
  const FLY_SIZE = 50
</script>

<ul class="absolute right-2 top-2 flex flex-col items-end">
  {#each $toast as item (item.id)}
    <li
      in:fly={{ x: FLY_SIZE, duration: IN_DURATION }}
      out:fly={{ x: FLY_SIZE, duration: OUT_DURATION }}
      class="group"
    >
      <div
        in:slide={{ duration: IN_DURATION }}
        out:slide={{ duration: OUT_DURATION }}
        class="mb-1.5 !overflow-visible group-last:mb-0"
      >
        <Toast {item} {toast} />
      </div>
    </li>
  {/each}
</ul>
