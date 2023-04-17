import { derived } from 'svelte/store'

import { page } from '$app/stores'

export const createEditLink = (service: string) =>
  derived(page, (page) => {
    const editUrl = new URL(page.url)
    editUrl.pathname = '/system'
    editUrl.searchParams.set(service, 'true')
    return `${editUrl.pathname}${editUrl.search}`
  })
