import { log } from 'log'
import { SlskClient } from 'soulseek-ts'
import { withProps } from 'utils'

import type { Getter, Setter } from '../context'
import type { Context } from '../types'

export const makeSoulseekContext = (
  set: Setter,
  get: Getter
): Pick<Context, 'slsk' | 'startSoulseek' | 'stopSoulseek'> => ({
  slsk: { status: 'stopped' },

  startSoulseek: async () => {
    log.debug('startSoulseek: Stopping soulseek')
    get().stopSoulseek()

    log.debug('startSoulseek: Getting config')
    const { soulseekUsername: username, soulseekPassword: password } = get().db.config.get()

    if (!username) {
      if (!password) {
        log.debug('startSoulseek: Username & password are not configured')
        set({
          slsk: {
            status: 'errored',
            error: new Error('Soulseek username & password are not configured'),
          },
        })
        return get().slsk
      } else {
        log.debug('startSoulseek: Username is not configured')
        set({
          slsk: {
            status: 'errored',
            error: new Error('Soulseek username is not configured'),
          },
        })
        return get().slsk
      }
    } else {
      if (!password) {
        log.debug('startSoulseek: Password is not configured')
        set({
          slsk: {
            status: 'errored',
            error: new Error('Soulseek password is not configured'),
          },
        })
        return get().slsk
      }
    }

    log.debug('startSoulseek: Creating client')
    const slsk = new SlskClient()
    log.debug('startSoulseek: Constructed client')
    set({ slsk: withProps(slsk, { status: 'logging-in' } as const) })

    try {
      log.debug('startSoulseek: Logging in')
      await slsk.login(username, password)
      log.debug('startSoulseek: Logged in')
    } catch (e) {
      log.debug('startSoulseek: Failed to log in')
      slsk.destroy()
      log.debug('startSoulseek: Destroyed client')
      let error = e
      if (e instanceof Error && e.message.includes('INVALIDPASS')) {
        log.debug('startSoulseek: Invalid password')
        error = new Error('Invalid password')
      }
      log.debug('startSoulseek: Setting error')
      set({ slsk: { status: 'errored', error } })
      return get().slsk
    }

    log.debug('startSoulseek: Setting status')
    set({ slsk: withProps(slsk, { status: 'logged-in' } as const) })
    log.debug('startSoulseek: Setting listeners')
    slsk
      .on('listen-error', (error) => log.error(error, 'SLSK listen error'))
      .on('server-error', (error) => log.error(error, 'SLSK server error'))
      .on('client-error', (error) => log.error(error, 'SLSK client error'))
    log.debug('startSoulseek: Done')
    return get().slsk
  },

  stopSoulseek: () => {
    const slsk = get().slsk
    if (slsk.status === 'logging-in' || slsk.status === 'logged-in') {
      slsk.destroy()
    }
    set({ slsk: { status: 'stopped' } })
    return get().slsk
  },
})
