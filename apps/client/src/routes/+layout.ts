import { createClient } from '$lib/trpc'

import type { LayoutLoad } from './$types'

export const load: LayoutLoad = ({ fetch }) => {
  const trpc = createClient(fetch)
  return { trpc }
}
