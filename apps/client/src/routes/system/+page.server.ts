import { fail } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms/server'

import { fetchConfigQuery, mutateConfig } from '$lib/services/system'
import { createClient } from '$lib/trpc'

import type { Actions, PageServerLoad } from './$types'
import {
  lastFmFromServerData,
  lastFmSchema,
  lastFmToServerData,
  slskFromServerData,
  slskSchema,
  slskToServerData,
  soundcloudFromServerData,
  soundcloudSchema,
  soundcloudToServerData,
  spotifyFromServerData,
  spotifySchema,
  spotifyToServerData,
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
  const spotifyForm = await superValidate(spotifyFromServerData(data), spotifySchema, {
    id: 'spotifyForm',
  })
  const soundcloudForm = await superValidate(soundcloudFromServerData(data), soundcloudSchema, {
    id: 'soundcloudForm',
  })
  return { lastFmForm, slskForm, spotifyForm, soundcloudForm }
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

    lastFmForm.data = lastFmFromServerData(result.config)

    return { lastFmForm, status: result.status }
  },
  slsk: async ({ request, fetch }) => {
    const formData = await request.formData()
    const slskForm = await superValidate(formData, slskSchema)

    if (!slskForm.valid) {
      return fail(400, { slskForm })
    }

    const trpc = createClient(fetch)
    const result = await mutateConfig(trpc, slskToServerData(slskForm.data))

    slskForm.data = slskFromServerData(result.config)

    return { slskForm, status: result.status }
  },
  spotify: async ({ request, fetch }) => {
    const formData = await request.formData()
    const spotifyForm = await superValidate(formData, spotifySchema)

    if (!spotifyForm.valid) {
      return fail(400, { spotifyForm })
    }

    const trpc = createClient(fetch)
    const result = await mutateConfig(trpc, spotifyToServerData(spotifyForm.data))

    spotifyForm.data = spotifyFromServerData(result.config)

    return { spotifyForm, status: result.status }
  },
  soundcloud: async ({ request, fetch }) => {
    const formData = await request.formData()
    const soundcloudForm = await superValidate(formData, soundcloudSchema)

    if (!soundcloudForm.valid) {
      return fail(400, { soundcloudForm })
    }

    const trpc = createClient(fetch)
    const result = await mutateConfig(trpc, soundcloudToServerData(soundcloudForm.data))

    soundcloudForm.data = soundcloudFromServerData(result.config)

    return { soundcloudForm, status: result.status }
  },
}
