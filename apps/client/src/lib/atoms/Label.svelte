<script lang="ts">
  let for_: string | undefined = undefined
  export { for_ as for }
</script>

<label class="text-sm text-gray-400" for={for_}>
  <slot />
</label>
