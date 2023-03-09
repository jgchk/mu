import { numberInString } from '$lib/utils/validators'
import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, params }) => {
  const idResult = numberInString.safeParse(params.id)
  if (!idResult.success) {
    throw error(400, 'Track ID must be a number')
  }
  const id = idResult.data

  const { trpc } = await parent()
  await trpc.tracks.getById.prefetchQuery({ id })

  return { id }
}
