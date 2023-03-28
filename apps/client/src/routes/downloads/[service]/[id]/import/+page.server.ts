import { fail, redirect } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'

import { createClient } from '$lib/trpc'
import { paramNumber, paramService } from '$lib/utils/params'
import { isDefined } from '$lib/utils/types'

import type { Actions, PageServerLoad } from './$types'

const schema = z.object({
  service: z.enum(['soundcloud', 'spotify', 'soulseek']),
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
  const service = paramService(event.params.service)
  const id = paramNumber(event.params.id, 'Download ID must be a number')

  const trpc = createClient(event.fetch)
  const data = await trpc.import.groupDownloadData.fetchQuery({ service, id })

  const artists: Map<number, string> = new Map()
  const getArtistIdByName = (name: string) => {
    return [...artists.entries()].find(([, artistName]) => artistName === name)?.[0]
  }

  const albumArtists = data.album.artists.map((name) => {
    const id = getArtistIdByName(name)
    if (id !== undefined) {
      return id
    } else {
      const id = artists.size + 1
      artists.set(id, name)
      return id
    }
  })

  const tracks = data.tracks.map((track) => {
    const trackArtists = track.metadata.artists.map((name) => {
      const id = getArtistIdByName(name)
      if (id !== undefined) {
        return id
      } else {
        const id = artists.size + 1
        artists.set(id, name)
        return id
      }
    })

    return {
      id: track.id,
      title: track.metadata.title ?? undefined,
      artists: trackArtists.map((id) => ({ action: 'create', id } as const)),
      track: track.metadata.track ?? undefined,
    }
  })

  const form = await superValidate(
    {
      service,
      id,
      artists: artists,
      album: {
        title: data.album.title ?? undefined,
        artists: albumArtists.map((id) => ({ action: 'create', id } as const)),
      },
      tracks,
    },
    schema
  )

  return { form }
}

export const actions: Actions = {
  default: async (event) => {
    // Same syntax as in the load function
    const form = await superValidate(event, schema)

    // Convenient validation check:
    if (!form.valid) {
      // Again, always return { form } and things will just work.
      return fail(400, { form })
    }

    // TODO: Do something with the validated data
    const trpc = createClient(event.fetch)
    const result = await trpc.import.groupDownloadManual.mutate({
      ...form.data,
      album: {
        ...form.data.album,
        artists: form.data.album.artists.filter(isDefined),
      },
      tracks: form.data.tracks.map((track) => ({
        ...track,
        artists: track.artists.filter(isDefined),
      })),
    })

    throw redirect(303, `/releases/${result.release.id}`)
  },
}
