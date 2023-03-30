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
  createArtists: z.map(z.number(), z.string()),
  title: z.string().min(1).optional(),
  artists: z
    .object({ action: z.enum(['create', 'connect']), id: z.number() })
    .optional()
    .array(),
  track: z.number().optional(),
})

export const load: PageServerLoad = async (event) => {
  const service = paramService(event.params.service)
  const id = paramNumber(event.params.id, 'Download ID must be a number')

  const trpc = createClient(event.fetch)
  const data = await trpc.import.trackDownloadData.fetchQuery({ service, id })

  const createArtists: Map<number, string> = new Map()
  const getArtistIdByName = (name: string) => {
    return [...createArtists.entries()].find(([, artistName]) => artistName === name)?.[0]
  }

  const artists = data.metadata.artists.map((name) => {
    const id = getArtistIdByName(name)
    if (id !== undefined) {
      return id
    } else {
      const id = createArtists.size + 1
      createArtists.set(id, name)
      return id
    }
  })

  const form = await superValidate(
    {
      service,
      id,
      createArtists: createArtists,
      title: data.metadata.title ?? undefined,
      artists: artists.map((id) => ({ action: 'create', id } as const)),
      track: data.metadata.track ?? undefined,
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

    const trpc = createClient(event.fetch)
    const result = await trpc.import.trackDownloadManual.mutate({
      ...form.data,
      artists: form.data.artists.filter(isDefined),
    })

    throw redirect(303, `/releases/${result.release.id}`)
  },
}