<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { superForm } from 'sveltekit-superforms/client'

  import Button from '$lib/atoms/Button.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import { formErrors } from '$lib/strings'
  import { getContextToast } from '$lib/toast/toast'
  import type { StoreType } from '$lib/utils/svelte'

  import type { PageServerData } from './$types'

  export let formData: PageServerData['form']

  const dispatch = createEventDispatcher<{
    success: { data: StoreType<typeof form> }
    failure: { reason: unknown }
    error: { error: unknown }
  }>()

  const toast = getContextToast()
  const { form, enhance, errors, constraints, delayed } = superForm(formData, {
    dataType: 'json',
    onResult: ({ result }) => {
      if (result.type === 'redirect' || result.type === 'success') {
        dispatch('success', { data: $form })
      } else if (result.type === 'failure') {
        if (result.data?.reason) {
          dispatch('failure', { reason: result.data.reason })
        } else {
          toast.error(formErrors())
        }
      } else if (result.type === 'error') {
        dispatch('error', { error: result.error })
      }
    },
  })
</script>

<form class="space-y-1 p-1" method="POST" use:enhance>
  <InputGroup errors={$errors.lastFmKey}>
    <Label for="last-fm-key">Last.fm API Key</Label>
    <Input id="last-fm-key" bind:value={$form.lastFmKey} {...$constraints.lastFmKey} />
  </InputGroup>

  <InputGroup errors={$errors.lastFmSecret}>
    <Label for="last-fm-secret">Last.fm API Secret</Label>
    <Input id="last-fm-secret" bind:value={$form.lastFmSecret} {...$constraints.lastFmSecret} />
  </InputGroup>

  <InputGroup errors={$errors.lastFmUsername}>
    <Label for="last-fm-username">Last.fm Username</Label>
    <Input
      id="last-fm-username"
      bind:value={$form.lastFmUsername}
      {...$constraints.lastFmUsername}
    />
  </InputGroup>

  <InputGroup errors={$errors.lastFmPassword}>
    <Label for="last-fm-password">Last.fm Password</Label>
    <Input
      id="last-fm-password"
      bind:value={$form.lastFmPassword}
      {...$constraints.lastFmPassword}
    />
  </InputGroup>

  <Button type="submit" kind="solid" loading={$delayed} class="mt-4">Submit</Button>
</form>
