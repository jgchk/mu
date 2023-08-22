import { error, fail, redirect } from '@sveltejs/kit'
import { makeImageUrl } from 'mutils'
import { superValidate } from 'sveltekit-superforms/server'
import { ifDefined, isDefined } from 'utils'
import { isFile } from 'utils/browser'
import { z } from 'zod'

import { albumArtSchema } from '$lib/components/ReleaseForm'
import { mutateReleaseWithTracksAndArtists } from '$lib/services/releases'
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
    })
    .array(),
})

export const load: PageServerLoad = async ({ params, fetch }) => {
  const id = paramNumber(params.id, 'Release ID must be a number')

  const trpc = createClient(fetch)
  const release = await trpc.releases.get.fetchQuery({ id })
  const tracks = await trpc.tracks.getByReleaseId.fetchQuery({ releaseId: id })

  const form = await superValidate(
    {
      id,
      createArtists: new Map(),
      album: {
        title: release.title ?? undefined,
        artists: release.artists.map((artist) => ({ action: 'connect', id: artist.id } as const)),
      },
      tracks: tracks.map((track) => ({
        id: track.id,
        title: track.title ?? undefined,
        artists: track.artists.map((artist) => ({ action: 'connect', id: artist.id } as const)),
      })),
    },
    schema
  )

  return { form, artUrl: ifDefined(release.imageId ?? undefined, makeImageUrl) }
}

export const actions: Actions = {
  default: async ({ request, fetch }) => {
    const formData = await request.formData()
    const form = await superValidate(formData, schema)

    if (!form.valid) {
      return fail(400, { form })
    }

    const albumArtRaw = formData.get('albumArt')
    let albumArt: string | null | undefined = undefined
    if (isFile(albumArtRaw)) {
      const buffer = await albumArtRaw.arrayBuffer()
      albumArt = Buffer.from(buffer).toString('base64')
    } else if (albumArtRaw === null) {
      albumArt = null
    } else {
      const albumArtData = albumArtSchema.parse(JSON.parse(albumArtRaw))
      switch (albumArtData.kind) {
        case 'default': {
          albumArt = undefined
          break
        }
        case 'none': {
          albumArt = null
          break
        }
        case 'upload': {
          throw error(400, 'Uploads should be submitted as raw files')
        }
      }
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

    throw redirect(303, `/library/releases/${result.id}`)
  },
}
