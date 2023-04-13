<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { derived } from 'svelte/store'
  import { fade } from 'svelte/transition'
  import { toErrorString } from 'utils'

  import Loader from '$lib/atoms/Loader.svelte'
  import Delay from '$lib/components/Delay.svelte'
  import { createSearchSoulseekSubscription } from '$lib/services/search'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'
  import SoulseekResults from './SoulseekResults.svelte'
  import type { SortedSoulseekResults } from './types'
  import type { FromWorkerMessage, ToWorkerMessage } from './worker-communication'

  export let data: PageData
  let oldQuery = data.query

  let soulseekData: SortedSoulseekResults = []
  let worker: Worker | undefined = undefined
  const loadWorker = () => {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'classic' })
    worker.onmessage = (e: MessageEvent<FromWorkerMessage>) => {
      const msg = e.data
      switch (msg.kind) {
        case 'results': {
          soulseekData = msg.results
          break
        }
      }
    }
  }
  onMount(() => {
    loadWorker()
  })
  onDestroy(() => {
    worker?.terminate()
  })
  const sendWorkerMessage = (msg: ToWorkerMessage) => {
    worker?.postMessage(msg)
  }

  const trpc = getContextClient()
  $: soulseekSubscription = createSearchSoulseekSubscription(trpc, data.query)
  onDestroy(() => {
    soulseekSubscription.unsubscribe()
  })

  $: {
    if (oldQuery !== data.query) {
      soulseekData = []
      sendWorkerMessage({ kind: 'reset' })
      soulseekSubscription.unsubscribe()
      soulseekSubscription = createSearchSoulseekSubscription(trpc, data.query)
      oldQuery = data.query
    }
  }

  const toast = getContextToast()

  let dataCleanup: (() => void) | undefined
  let errorCleanup: (() => void) | undefined
  $: {
    dataCleanup?.()
    errorCleanup?.()

    const { data, error } = soulseekSubscription

    dataCleanup = derived(data, (value) => value).subscribe((v) => {
      if (v) {
        sendWorkerMessage({ kind: 'result', result: v })
      }
    })

    errorCleanup = error.subscribe((e) => {
      if (e) {
        toast.error(toErrorString(e))
      }
    })
  }
  onDestroy(() => {
    dataCleanup?.()
    errorCleanup?.()
  })
</script>

{#if data.hasQuery}
  {#key data.query}
    {#if soulseekData.length === 0}
      <Delay>
        <div class="flex h-full max-h-72 items-center justify-center" in:fade>
          <Loader class="h-10 w-10 text-gray-600" />
        </div>
      </Delay>
    {:else}
      <SoulseekResults items={soulseekData} />
    {/if}
  {/key}
{:else}
  <div>Enter a search query</div>
{/if}
