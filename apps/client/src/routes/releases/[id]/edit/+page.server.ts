import { fail, redirect } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms/server'
import { isDefined } from 'utils'
import { isFile } from 'utils/browser'
import { z } from 'zod'

import { makeImageUrl } from '$lib/cover-art'
import {
  fetchReleaseWithTracksAndArtistsQuery,
  mutateReleaseWithTracksAndArtists,
} from '$lib/services/releases'
import { createClient } from '$lib/trpc'
import { paramNumber } from '$lib/utils/params'

import type { Actions, PageServerLoad } from './$types'

const schema = z.object({
  id: z.number(),
  createArtists: z.map(z.number(), z.string()),
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

export const load: PageServerLoad = async ({ params, fetch }) => {
  const id = paramNumber(params.id, 'Release ID must be a number')

  const trpc = createClient(fetch)
  const data = await fetchReleaseWithTracksAndArtistsQuery(trpc, id)

  let art: string | undefined = undefined
  if (data.imageId !== null && data.imageId !== undefined) {
    const artBuffer = await fetch(makeImageUrl(data.imageId))
      .then((res) => res.blob())
      .then((blob) => blob.arrayBuffer())
    art = Buffer.from(artBuffer).toString('base64')
  }

  const form = await superValidate(
    {
      id,
      createArtists: new Map(),
      album: {
        title: data.title ?? undefined,
        artists: data.artists.map((artist) => ({ action: 'connect', id: artist.id } as const)),
      },
      tracks: data.tracks.map((track) => ({
        id: track.id,
        title: track.title ?? undefined,
        artists: data.artists.map((artist) => ({ action: 'connect', id: artist.id } as const)),
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

    if (!form.valid) {
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
