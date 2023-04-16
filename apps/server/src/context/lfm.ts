import { LastFM } from 'last-fm'
import type { ContextLastFm } from 'trpc/src/context'
import { withProps } from 'utils'

export const makeLastFm = async (opts: {
  apiKey: string
  username?: string | null
  password?: string | null
  apiSecret?: string | null
}): Promise<ContextLastFm> => {
  const lfm = new LastFM({ apiKey: opts.apiKey })

  try {
    await lfm.getTrackInfo({ artist: 'test', track: 'test' })
  } catch (e) {
    return { available: false, error: new Error('API key is invalid') }
  }

  if (opts.username && opts.password && opts.apiSecret) {
    try {
      const lfmAuthed = await lfm.login({
        username: opts.username,
        password: opts.password,
        apiSecret: opts.apiSecret,
      })
      return withProps(lfmAuthed, { available: true } as const)
    } catch (e) {
      return withProps(lfm, { available: true, error: e } as const)
    }
  } else {
    return withProps(lfm, { available: true } as const)
  }
}
