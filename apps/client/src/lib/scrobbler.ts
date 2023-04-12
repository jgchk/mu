import { derived } from 'svelte/store'

import type { NowPlaying } from './now-playing'
import { nowPlaying } from './now-playing'

export const createListenedDuration = () => {
  let __playSignal: symbol | undefined = undefined
  let previousTime = 0
  let listenedDuration = 0

  return derived(nowPlaying, (data) => {
    if (!data.track) return 0

    if (data.track.__playSignal !== __playSignal) {
      // reset
      previousTime = 0
      listenedDuration = 0
      __playSignal = data.track.__playSignal
    }

    if (data.track.currentTime === undefined) return 0

    const timeDelta = data.track.currentTime - previousTime

    // only count listened time if the user didn't manually skip
    if (timeDelta > 0 && timeDelta < 2) {
      listenedDuration += timeDelta
    }

    previousTime = data.track.currentTime

    return listenedDuration
  })
}

export const createNowPlayer = (onNowPlaying: (data: NonNullable<NowPlaying['track']>) => void) => {
  let __playSignal: symbol | undefined = undefined
  let nowPlayingSent = false

  const unsubscribe = nowPlaying.subscribe((data) => {
    if (!data.track) return

    if (data.track.__playSignal !== __playSignal) {
      nowPlayingSent = false
      __playSignal = data.track.__playSignal
    }

    if (!nowPlayingSent) {
      // now playing
      onNowPlaying(data.track)
      nowPlayingSent = true
    }
  })

  return unsubscribe
}

export const createScrobbler = (
  onScrobble: (data: Pick<NonNullable<NowPlaying['track']>, 'id' | 'startTime'>) => void
) => {
  let __playSignal: symbol | undefined = undefined
  let scrobbled = false
  const listenedDuration = createListenedDuration()

  const combined = derived([nowPlaying, listenedDuration], ([np, ld]) => ({
    id: np.track?.id,
    startTime: np.track?.startTime,
    __playSignal: np.track?.__playSignal,
    duration: np.track?.duration,
    listenedDuration: ld,
  }))

  const unsubscribe = combined.subscribe((data) => {
    if (data.__playSignal !== __playSignal) {
      scrobbled = false
      __playSignal = data.__playSignal
    }

    if (
      !scrobbled &&
      data.duration !== undefined &&
      data.id !== undefined &&
      data.startTime !== undefined &&
      shouldScrobble(data.duration, data.listenedDuration)
    ) {
      // scrobble
      onScrobble({
        id: data.id,
        startTime: data.startTime,
      })
      scrobbled = true
    }
  })

  return unsubscribe
}

function shouldScrobble(duration: number, listenedDuration: number) {
  const halfDuration = duration / 2
  const minimumPlayTime = Math.min(halfDuration, 240)
  return listenedDuration >= minimumPlayTime
}
