import { error } from '@sveltejs/kit'

import { getReleaseById } from '$lib/server/db/operations/releases'
import { getTracksByReleaseId } from '$lib/server/db/operations/tracks'
import { readTrackCoverArt } from '$lib/server/utils/music-metadata'
import { numberInString } from '$lib/utils/validators'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
  const idResult = numberInString.safeParse(params.id)
  if (!idResult.success) {
    throw error(400, 'Release ID must be a number')
  }
  const id = idResult.data

  try {
    getReleaseById(id)
  } catch {
    throw error(404, 'Release does not exist')
  }

  const tracks = getTracksByReleaseId(id)

  for (const track of tracks) {
    if (track.hasCoverArt) {
      const coverArt = await readTrackCoverArt(track.path)
      if (coverArt !== undefined) {
        return new Response(coverArt)
      }
    }
  }

  throw error(404, 'Release does not have cover art')
}
