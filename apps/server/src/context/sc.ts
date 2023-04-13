import { Soundcloud } from 'soundcloud'

import { env } from '../env'

export const makeSoundcloud = () =>
  new Soundcloud({
    clientId: env.SOUNDCLOUD_CLIENT_ID,
    authToken: env.SOUNDCLOUD_AUTH_TOKEN,
  })
