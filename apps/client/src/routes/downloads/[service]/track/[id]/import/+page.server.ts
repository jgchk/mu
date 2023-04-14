import { fail, redirect } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms/server'
import { isDefined } from 'utils'
import { z } from 'zod'

import { fetchTrackDownloadDataQuery, mutateTrackDownloadManual } from '$lib/services/import'
import { createClient } from '$lib/trpc'
import { paramNumber, paramService } from '$lib/utils/params'

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
  const data = await fetchTrackDownloadDataQuery(trpc, { service, id })

  const form = await superValidate(
    {
      service,
      id,
      createArtists: data.createArtists,
      title: data.title,
      artists: data.artists,
      track: data.track,
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
    const result = await mutateTrackDownloadManual(trpc, {
      ...form.data,
      artists: form.data.artists.filter(isDefined),
    })

    throw redirect(303, `/releases/${result.release.id}`)
  },
}
