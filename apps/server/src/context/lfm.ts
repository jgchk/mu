import { LastFM } from 'last-fm'
import type { ContextLastFm } from 'trpc/src/context'

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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      lfmAuthed.available = true
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return lfmAuthed
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      lfm.available = true
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      lfm.error = e
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return lfm
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    lfm.available = true
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return lfm
  }
}
