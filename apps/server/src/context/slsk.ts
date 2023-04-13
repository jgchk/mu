import { SlskClient } from 'soulseek-ts'

import { env } from '../env'

export const makeSlsk = async () => {
  const slsk = new SlskClient()
  try {
    await slsk.login(env.SOULSEEK_USERNAME, env.SOULSEEK_PASSWORD)
  } catch (e) {
    slsk.destroy()
    throw e
  }
  slsk
    .on('listen-error', (error) => console.error('SLSK listen error', error))
    .on('server-error', (error) => console.error('SLSK server error', error))
    .on('client-error', (error) => console.error('SLSK client error', error))
  return slsk
}
