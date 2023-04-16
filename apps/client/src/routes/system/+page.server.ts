import { fail } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms/server'

import { fetchConfigQuery, fetchSystemStatusQuery, mutateConfig } from '$lib/services/system'
import { createClient } from '$lib/trpc'

import type { Actions, PageServerLoad } from './$types'
import {
  lastFmFromServerData,
  lastFmSchema,
  lastFmToServerData,
  slskFromServerData,
  slskSchema,
  slskToServerData,
} from './schemas'

export const load: PageServerLoad = async ({ fetch }) => {
  const trpc = createClient(fetch)
  const data = await fetchConfigQuery(trpc)
  const lastFmForm = await superValidate(lastFmFromServerData(data), lastFmSchema, {
    id: 'lastFmForm',
  })
  const slskForm = await superValidate(slskFromServerData(data), slskSchema, {
    id: 'slskForm',
  })
  return { lastFmForm, slskForm }
}

export const actions: Actions = {
  lastFm: async ({ request, fetch }) => {
    const formData = await request.formData()
    const lastFmForm = await superValidate(formData, lastFmSchema)

    if (!lastFmForm.valid) {
      return fail(400, { lastFmForm })
    }

    const trpc = createClient(fetch)
    const result = await mutateConfig(trpc, lastFmToServerData(lastFmForm.data))

    lastFmForm.data = lastFmFromServerData(result)
    const status = await fetchSystemStatusQuery(trpc)

    return { lastFmForm, status }
  },
  slsk: async ({ request, fetch }) => {
    const formData = await request.formData()
    const slskForm = await superValidate(formData, slskSchema)

    if (!slskForm.valid) {
      return fail(400, { slskForm })
    }

    const trpc = createClient(fetch)
    const result = await mutateConfig(trpc, slskToServerData(slskForm.data))

    slskForm.data = slskFromServerData(result)
    const status = await fetchSystemStatusQuery(trpc)

    return { slskForm, status }
  },
}
