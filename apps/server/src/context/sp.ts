import { Spotify } from 'spotify'

import { env } from '../env'

export const sp = new Spotify({
  devMode: env.NODE_ENV === 'development',
  clientId: env.SPOTIFY_CLIENT_ID,
  clientSecret: env.SPOTIFY_CLIENT_SECRET,
  username: env.SPOTIFY_USERNAME,
  password: env.SPOTIFY_PASSWORD,
  dcCookie: env.SPOTIFY_DC_COOKIE,
})
