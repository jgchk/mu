import { error } from '@sveltejs/kit'

import { numberInString } from '$lib/utils/validators'

import type { PageLoad } from './$types'

export const load = (async ({ parent, params }) => {
  const idResult = numberInString.safeParse(params.id)
  if (!idResult.success) {
    throw error(400, 'Track ID must be a number')
  }
  const id = idResult.data

  const { trpc } = await parent()
  await trpc.releases.getById.prefetchQuery({ id })
  await trpc.tracks.getByReleaseId.prefetchQuery({ releaseId: id })

  return { id }
}) satisfies PageLoad
