<script lang="ts">
  type T = $$Generic

  export let items: T[]

  let class_: string | undefined = undefined
  export { class_ as class }

  export let separator = ', '
  export let separatorClass: string | undefined = undefined
</script>

<span class={class_}
  >{#each items as item, i}{#if $$slots.default}<slot
        {item}
        {i}
      />{:else}{item}{/if}{#if i < items.length - 1}<span class={separatorClass}>{separator}</span
      >{/if}{/each}</span
>
