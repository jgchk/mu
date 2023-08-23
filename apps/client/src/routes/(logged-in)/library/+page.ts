import { redirect } from '@sveltejs/kit'

import type { PageLoad } from './$types'

export const load: PageLoad = ({ url }) => {
  const newUrl = new URL(url)

  if (newUrl.searchParams.has('q')) {
    newUrl.pathname = '/library/all'
  } else {
    newUrl.pathname = '/library/tracks'
  }

  throw redirect(301, newUrl.toString())
}
