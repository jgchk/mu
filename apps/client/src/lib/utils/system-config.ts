import { browser } from '$app/environment'
import { goto } from '$app/navigation'
import { page } from '$app/stores'
import { onDestroy } from 'svelte'
import { derived } from 'svelte/store'

export const createEditLink = (service?: string | string[]) =>
  derived(page, (page) => {
    const editUrl = new URL(page.url)
    if (editUrl.pathname !== '/system') {
      editUrl.pathname = '/system'
      editUrl.search = ''
    }
    if (service !== undefined) {
      if (Array.isArray(service)) {
        for (const s of service) {
          editUrl.searchParams.set(s, 'true')
        }
      } else {
        editUrl.searchParams.set(service, 'true')
      }
    }
    return `${editUrl.pathname}${editUrl.search}`
  })

export const useEditLink = (service: string, onShowConfig: () => void) => {
  const unsubscribe = page.subscribe((page) => {
    if (page.url.searchParams.has(service)) {
      onShowConfig()

      if (browser) {
        const searchParams = new URLSearchParams(page.url.search)
        searchParams.delete(service)
        let search = searchParams.toString()
        if (search) {
          search = `?${search}`
        }
        void goto(`${page.url.pathname}${search}`, { replaceState: true })
      }
    }
  })
  onDestroy(() => unsubscribe())
}
