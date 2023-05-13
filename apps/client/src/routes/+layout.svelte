<script lang="ts">
  import { page } from '$app/stores'
  import '@fontsource/inter/variable.css'
  import '@fontsource/noto-emoji'
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import { onMount } from 'svelte'
  import { toErrorString } from 'utils'

  import { setContextDialogs } from '$lib/dialogs/dialogs'
  import { notLoggedInError } from '$lib/strings'
  import Toaster from '$lib/toast/Toaster.svelte'
  import { createToast, setContextToast } from '$lib/toast/toast'
  import type { ErrorToastEvent } from '$lib/trpc'
  import { setContextClient } from '$lib/trpc'

  import '../app.css'
  import type { LayoutData } from './$types'

  export let data: LayoutData

  onMount(() => {
    const listener = (e: ErrorToastEvent) => {
      const errorString = toErrorString(e.detail.error)
      if (errorString === 'NetworkError when attempting to fetch resource.') {
        const offlineMessage = 'Cannot reach server. Are you offline?'
        if (!$toast.some((toast) => toast.msg === offlineMessage)) {
          toast.error(offlineMessage, { duration: Infinity })
        }
      } else if (errorString === notLoggedInError()) {
        if (!$toast.some((toast) => toast.msg === notLoggedInError())) {
          toast.error(notLoggedInError())
        }
      } else {
        toast.error(errorString)
      }
    }

    // @ts-expect-error custom event
    window.addEventListener('error-toast', listener)

    return () => {
      // @ts-expect-error custom event
      window.removeEventListener('error-toast', listener)
    }
  })

  setContextClient(data.trpc)

  const toast = createToast()
  setContextToast(toast)

  setContextDialogs()
</script>

<QueryClientProvider client={data.trpc.queryClient}>
  <slot />
  {#if $page.url.pathname === '/login'}
    <Toaster class="right-2 top-2" />
  {/if}
</QueryClientProvider>
