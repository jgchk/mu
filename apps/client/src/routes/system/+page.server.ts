import { fail } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'

import { fetchConfigQuery, fetchSystemStatusQuery, mutateConfig } from '$lib/services/system'
import type { RouterInput, RouterOutput } from '$lib/trpc'
import { createClient } from '$lib/trpc'

import type { Actions, PageServerLoad } from './$types'

type Schema = z.infer<typeof schema>
const schema = z.object({
  lastFmKey: z.string(),
  lastFmSecret: z.string(),
  lastFmUsername: z.string(),
  lastFmPassword: z.string(),
})

const fromServerData = (data: RouterOutput['system']['config']): Schema => ({
  lastFmKey: data.lastFmKey ?? '',
  lastFmSecret: data.lastFmSecret ?? '',
  lastFmUsername: data.lastFmUsername ?? '',
  lastFmPassword: data.lastFmPassword ?? '',
})

const toServerData = (data: Schema): RouterInput['system']['updateConfig'] => ({
  lastFmKey: data.lastFmKey || null,
  lastFmSecret: data.lastFmSecret || null,
  lastFmUsername: data.lastFmUsername || null,
  lastFmPassword: data.lastFmPassword || null,
})

export const load: PageServerLoad = async ({ fetch }) => {
  const trpc = createClient(fetch)
  const data = await fetchConfigQuery(trpc)
  const form = await superValidate(fromServerData(data), schema)
  return { form }
}

export const actions: Actions = {
  default: async ({ request, fetch }) => {
    const formData = await request.formData()
    const form = await superValidate(formData, schema)

    if (!form.valid) {
      return fail(400, { form })
    }

    const trpc = createClient(fetch)
    const result = await mutateConfig(trpc, toServerData(form.data))

    form.data = fromServerData(result)
    const status = await fetchSystemStatusQuery(trpc)

    return { form, status }
  },
}
