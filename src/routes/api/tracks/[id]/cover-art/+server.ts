import { error } from '@sveltejs/kit'

import { getTrackById } from '$lib/server/db/operations/tracks'
import { readTrackCoverArt } from '$lib/server/utils/music-metadata'
import { numberInString } from '$lib/utils/validators'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
  const idResult = numberInString.safeParse(params.id)
  if (!idResult.success) {
    throw error(400, 'Track ID must be a number')
  }
  const id = idResult.data

  const track = getTrackById(id)
  const coverArt = await readTrackCoverArt(track.path)

  if (coverArt === undefined) {
    throw error(404, 'Track does not have cover art')
  }

  return new Response(coverArt)
}
