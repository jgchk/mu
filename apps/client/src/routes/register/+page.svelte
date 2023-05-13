<script lang="ts">
  import { fade } from 'svelte/transition'
  import { superForm } from 'sveltekit-superforms/client'
  import { toErrorString } from 'utils'

  import Button from '$lib/atoms/Button.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import { formErrors } from '$lib/strings'
  import { getContextToast } from '$lib/toast/toast'

  import type { PageServerData } from './$types'

  export let data: PageServerData

  const toast = getContextToast()

  let error: string | undefined = undefined
  const { form, enhance, errors, constraints, delayed } = superForm(data.form, {
    dataType: 'json',
    onResult: ({ result }) => {
      if (result.type === 'redirect' || result.type === 'success') {
        toast.success('Registered!')
      } else if (result.type === 'failure') {
        if (result.data?.reason) {
          error = result.data.reason as string
        } else {
          error = formErrors()
        }
      } else if (result.type === 'error') {
        error = toErrorString(result.error)
      }
    },
  })
</script>

<div class="center flex h-full w-full gap-2 bg-gray-900 p-2 text-white">
  <div class="relative flex flex-col items-center">
    <div class="rounded-lg border border-gray-700 bg-gray-800 p-4 pb-[17px] shadow-lg">
      <form method="POST" use:enhance class="flex flex-col gap-2">
        <InputGroup errors={$errors.username}>
          <Label for="username">Username</Label>
          <Input
            id="username"
            autofocus
            bind:value={$form.username}
            on:input={() => (error = undefined)}
            {...$constraints.username}
          />
        </InputGroup>

        <InputGroup errors={$errors.password}>
          <Label for="password">Password</Label>
          <Input
            id="password"
            type="password"
            bind:value={$form.password}
            on:input={() => (error = undefined)}
            {...$constraints.password}
          />
        </InputGroup>

        <InputGroup errors={$errors.confirmPassword}>
          <Label for="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            bind:value={$form.confirmPassword}
            on:input={() => (error = undefined)}
            {...$constraints.confirmPassword}
          />
        </InputGroup>

        <Button type="submit" kind="solid" loading={$delayed} class="mt-2">Register</Button>
      </form>
    </div>
    {#if error}
      <div class="text-error-500 absolute top-full pt-2" transition:fade={{ duration: 35 }}>
        {error}
      </div>
    {/if}
  </div>
</div>
