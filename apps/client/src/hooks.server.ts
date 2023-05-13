import { redirect } from '@sveltejs/kit'
import type { Handle, HandleFetch } from '@sveltejs/kit'
import { DEV } from 'esm-env'

import { createClient } from '$lib/trpc'

export const handle: Handle = async ({ event, resolve }) => {
  const { cookies } = event

  const sessionToken = cookies.get('session_token')
  event.locals.token = sessionToken
  if (sessionToken) {
    const trpc = createClient(event.fetch)
    const session = await trpc.accounts.getSession.fetchQuery({ token: sessionToken })
    if (session) {
      event.locals.session = session
    } else {
      cookies.delete('session_token')
    }
  }

  if (
    event.locals.session === undefined &&
    !(event.url.pathname === '/login' || event.url.pathname === '/register')
  ) {
    throw redirect(302, '/login')
  }

  return resolve(event)
}

const serverHost = process.env.SERVER_HOST
const serverPort = process.env.SERVER_PORT
if (!serverHost) {
  throw new Error('SERVER_HOST not set')
}
if (!serverPort) {
  throw new Error('SERVER_PORT not set')
}
const host = `${serverHost}:${serverPort}`
const devHost = DEV && process.env.DEV_PORT ? `${serverHost}:${process.env.DEV_PORT}` : undefined

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
  const url = new URL(request.url)
  if (url.host === host || url.host === devHost) {
    const cookie = event.request.headers.get('cookie')
    if (cookie) {
      request.headers.set('cookie', cookie)
    }
  }

  return fetch(request)
}
