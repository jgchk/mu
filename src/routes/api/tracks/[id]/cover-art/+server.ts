import { error } from '@sveltejs/kit'
import sharp from 'sharp'

import { getTrackById } from '$lib/server/db/operations/tracks'
import { readTrackCoverArt } from '$lib/server/utils/music-metadata'
import { ifNotNull } from '$lib/utils/types'
import { numberInString } from '$lib/utils/validators'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, url }) => {
  const idResult = numberInString.safeParse(params.id)
  if (!idResult.success) {
    throw error(400, 'Track ID must be a number')
  }
  const id = idResult.data

  const width = ifNotNull(url.searchParams.get('width'), (w) => {
    const widthResult = numberInString.safeParse(w)
    if (!widthResult.success) {
      throw error(400, 'Width must be a number')
    }
    return widthResult.data
  })
  const height = ifNotNull(url.searchParams.get('height'), (h) => {
    const heightResult = numberInString.safeParse(h)
    if (!heightResult.success) {
      throw error(400, 'Height must be a number')
    }
    return heightResult.data
  })

  const track = getTrackById(id)
  const coverArt = await readTrackCoverArt(track.path)

  if (coverArt === undefined) {
    throw error(404, 'Track does not have cover art')
  }

  if (width !== null || height !== null) {
    const resizedBuffer = await sharp(coverArt).resize(width, height).png().toBuffer()
    return new Response(resizedBuffer)
  } else {
    return new Response(coverArt)
  }
}
