import { fail, redirect } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'

import {
  fetchReleaseCoverArtQuery,
  fetchReleaseWithTracksAndArtistsQuery,
  mutateReleaseWithTracksAndArtists,
} from '$lib/services/releases'
import { createClient } from '$lib/trpc'
import { isFile } from '$lib/utils/file'
import { paramNumber } from '$lib/utils/params'
import { isDefined } from '$lib/utils/types'

import type { Actions, PageServerLoad } from './$types'

const schema = z.object({
  id: z.number(),
  artists: z.map(z.number(), z.string()),
  album: z.object({
    title: z.string().min(1).optional(),
    artists: z
      .object({ action: z.enum(['create', 'connect']), id: z.number() })
      .optional()
      .array(),
  }),
  tracks: z
    .object({
      id: z.number(),
      title: z.string().optional(),
      artists: z
        .object({ action: z.enum(['create', 'connect']), id: z.number() })
        .optional()
        .array(),
      track: z.number().optional(),
    })
    .array(),
})

export const load: PageServerLoad = async (event) => {
  const id = paramNumber(event.params.id, 'Release ID must be a number')

  const trpc = createClient(event.fetch)
  const data = await fetchReleaseWithTracksAndArtistsQuery(trpc, id)
  const art = await fetchReleaseCoverArtQuery(trpc, id)

  const form = await superValidate(
    {
      id,
      artists: new Map(),
      album: {
        title: data.title ?? undefined,
        artists: data.artists
          .sort((a, b) => a.order - b.order)
          .map((artist) => ({ action: 'connect', id: artist.id } as const)),
      },
      tracks: data.tracks.map((track) => ({
        id: track.id,
        title: track.title ?? undefined,
        artists: data.artists
          .sort((a, b) => a.order - b.order)
          .map((artist) => ({ action: 'connect', id: artist.id } as const)),
        track: track.trackNumber ?? undefined,
      })),
    },
    schema
  )

  return { form, art }
}

export const actions: Actions = {
  default: async ({ request, fetch }) => {
    const formData = await request.formData()
    const form = await superValidate(formData, schema)

    // Convenient validation check:
    if (!form.valid) {
      // Again, always return { form } and things will just work.
      return fail(400, { form })
    }

    const albumArtRaw = formData.get('albumArt')
    let albumArt
    if (albumArtRaw) {
      if (!isFile(albumArtRaw)) {
        return fail(400, { form, reason: 'Album art must be a File' })
      } else {
        const buffer = await albumArtRaw.arrayBuffer()
        albumArt = Buffer.from(buffer).toString('base64')
      }
    } else {
      albumArt = undefined
    }

    const trpc = createClient(fetch)
    const result = await mutateReleaseWithTracksAndArtists(trpc, {
      ...form.data,
      album: {
        ...form.data.album,
        artists: form.data.album.artists.filter(isDefined),
        art: albumArt,
      },
      tracks: form.data.tracks.map((track) => ({
        ...track,
        artists: track.artists.filter(isDefined),
      })),
    })

    throw redirect(303, `/releases/${result.id}`)
  },
}
