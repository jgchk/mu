import { LastFM } from 'last-fm'
import type { ContextLastFm } from 'trpc/src/context'
import { withProps } from 'utils'

export const makeLastFm = async (
  opts: {
    apiKey: string
    username?: string | null
    password?: string | null
    apiSecret?: string | null
  },
  cb?: {
    onAuthenticating?: (lfm: LastFM) => void
    onLoggingIn?: (lfm: LastFM) => void
  }
): Promise<ContextLastFm> => {
  const lfm = new LastFM({ apiKey: opts.apiKey })

  try {
    cb?.onAuthenticating?.(lfm)
    await lfm.getTrackInfo({ artist: 'test', track: 'test' })
  } catch (e) {
    return { status: 'errored', error: new Error('API key is invalid') }
  }

  if (opts.username && opts.password && opts.apiSecret) {
    try {
      cb?.onLoggingIn?.(lfm)
      const lfmAuthed = await lfm.login({
        username: opts.username,
        password: opts.password,
        apiSecret: opts.apiSecret,
      })
      return withProps(lfmAuthed, { status: 'logged-in' } as const)
    } catch (e) {
      return withProps(lfm, { status: 'degraded', error: e } as const)
    }
  } else {
    return withProps(lfm, { status: 'authenticated' } as const)
  }
}
