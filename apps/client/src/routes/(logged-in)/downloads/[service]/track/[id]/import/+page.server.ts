import { error, fail, redirect } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms/server'
import { isDefined } from 'utils'
import { fetcher, isFile } from 'utils/browser'
import { z } from 'zod'

import { albumArtSchema } from '$lib/components/ReleaseForm'
import { getHost } from '$lib/host'
import { fetchTrackDownloadDataQuery, mutateTrackDownloadManual } from '$lib/services/import'
import { createClient } from '$lib/trpc'
import { paramNumber, paramService } from '$lib/utils/params'

import type { Actions, PageServerLoad } from './$types'

const schema = z.object({
  service: z.enum(['soundcloud', 'spotify', 'soulseek']),
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

export const load: PageServerLoad = async (event) => {
  const service = paramService(event.params.service)
  const id = paramNumber(event.params.id, 'Download ID must be a number')

  const trpc = createClient(event.fetch)
  const data = await fetchTrackDownloadDataQuery(trpc, { service, id })

  const form = await superValidate(
    {
      service,
      id,
      createArtists: data.createArtists,
      album: {
        title: data.title,
        artists: data.artists,
      },
      tracks: [
        {
          id: data.id,
          title: data.title,
          artists: data.artists,
          track: 1,
        },
      ],
    },
    schema
  )

  return { form }
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
    let albumArt: string | undefined = undefined
    if (isFile(albumArtRaw)) {
      const buffer = await albumArtRaw.arrayBuffer()
      albumArt = Buffer.from(buffer).toString('base64')
    } else if (albumArtRaw === null) {
      albumArt = undefined
    } else {
      const albumArtData = albumArtSchema.parse(JSON.parse(albumArtRaw))
      switch (albumArtData.kind) {
        case 'default': {
          const buffer = await fetcher(fetch)(
            `${getHost()}/api/downloads/track/${form.data.service}/${form.data.id}/cover-art`
          ).then((res) => res.arrayBuffer())
          albumArt = Buffer.from(buffer).toString('base64')
          break
        }
        case 'none': {
          albumArt = undefined
          break
        }
        case 'upload': {
          throw error(400, 'Uploads should be submitted as raw files')
        }
      }
    }

    const trpc = createClient(fetch)
    const result = await mutateTrackDownloadManual(trpc, {
      ...form.data,
      album: {
        ...form.data.album,
        artists: form.data.album.artists.filter(isDefined),
        art: albumArt,
      },
      track: {
        ...form.data.tracks[0],
        artists: form.data.tracks[0].artists.filter(isDefined),
      },
    })

    throw redirect(303, `/releases/${result.release.id}`)
  },
}
