import { fail, redirect } from '@sveltejs/kit'
import { TRPCClientError } from '@trpc/client'
import { superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'

import { createClient } from '$lib/trpc'

import type { Actions, PageServerLoad } from './$types'

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const load: PageServerLoad = async ({ fetch, locals }) => {
  if (locals.session) {
    throw redirect(302, '/')
  }

  const trpc = createClient(fetch)
  const hasNoAccounts = await trpc.accounts.isEmpty.fetchQuery()

  if (hasNoAccounts) {
    throw redirect(302, '/register')
  }

  const form = await superValidate(schema)
  return { form }
}

export const actions: Actions = {
  default: async ({ request, fetch, cookies }) => {
    const formData = await request.formData()
    const form = await superValidate(formData, schema)

    if (!form.valid) {
      return fail(400, { form })
    }

    const trpc = createClient(fetch)

    try {
      const result = await trpc.accounts.login.mutate(form.data)

      cookies.set('session_token', result.token, { maxAge: result.maxAge, secure: false })

      throw redirect(302, '/')
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error instanceof TRPCClientError && error.data.code === 'UNAUTHORIZED') {
        return fail(401, { form, reason: error.message })
      } else {
        throw error
      }
    }
  },
}
