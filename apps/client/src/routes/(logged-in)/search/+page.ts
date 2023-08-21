import { redirect } from '@sveltejs/kit'

import type { PageLoad } from './$types'

export const load: PageLoad = ({ url }) => {
  const newUrl = new URL(url)
  newUrl.pathname = '/search/all'
  throw redirect(301, newUrl.toString())
}
