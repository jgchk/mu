import { Soundcloud } from 'soundcloud'
import { withProps } from 'utils'

import type { Getter, Setter } from '../context'
import type { Context } from '../types'

export const makeSoundcloudContext = (
  set: Setter,
  get: Getter
): Pick<Context, 'sc' | 'startSoundcloud' | 'stopSoundcloud'> => ({
  sc: { status: 'stopped' },

  startSoundcloud: async () => {
    set({ sc: { status: 'stopped' } })

    const config = get().db.config.get()

    if (config.soundcloudAuthToken) {
      set({ sc: { status: 'starting' } })
      const sc = new Soundcloud(config.soundcloudAuthToken)
      try {
        await sc.checkAuthToken()
        set({ sc: withProps(sc, { status: 'running' } as const) })
      } catch (e) {
        set({ sc: { status: 'errored', error: e } })
      }
    }

    return get().sc
  },

  stopSoundcloud: () => {
    set({ sc: { status: 'stopped' } })
    return get().sc
  },
})
