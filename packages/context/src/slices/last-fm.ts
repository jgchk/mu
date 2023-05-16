import { withProps } from 'utils'

import type { Getter, Setter } from '../context'
import type { Context } from '../types'
import { makeLastFm } from '../utils'

export const makeLastFmContext = (
  set: Setter,
  get: Getter
): Pick<Context, 'lfm' | 'startLastFm' | 'stopLastFm'> => ({
  lfm: { status: 'stopped' },

  startLastFm: async () => {
    set({ lfm: { status: 'stopped' } })

    const config = get().db.config.get()

    if (config.lastFmKey) {
      const lfm = await makeLastFm(
        {
          apiKey: config.lastFmKey,
          username: config.lastFmUsername,
          password: config.lastFmPassword,
          apiSecret: config.lastFmSecret,
        },
        {
          onAuthenticating: (lfm) => {
            set({ lfm: withProps(lfm, { status: 'authenticating' } as const) })
          },
          onLoggingIn: (lfm) => {
            set({ lfm: withProps(lfm, { status: 'logging-in' } as const) })
          },
        }
      )
      set({ lfm })
    }

    return get().lfm
  },

  stopLastFm: () => {
    set({ lfm: { status: 'stopped' } })
    return get().lfm
  },
})
