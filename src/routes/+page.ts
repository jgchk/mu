import { trpc } from '$lib/trpc'
import type { PageLoad } from './$types'

export const load = (async ({ fetch }) => {
  return { res: trpc(fetch).ping.query() }
}) satisfies PageLoad
