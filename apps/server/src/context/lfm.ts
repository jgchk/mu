import { LastFM } from 'last-fm'

import { env } from '../env'

export const makeLastFm = async () =>
  new LastFM({ apiKey: env.LASTFM_KEY }).login({
    username: env.LASTFM_USERNAME,
    password: env.LASTFM_PASSWORD,
    apiSecret: env.LASTFM_SECRET,
  })
