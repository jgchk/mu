import { derived } from 'svelte/store'

import type { PlayerState } from './now-playing'
import { player } from './now-playing'

export const createListenedDuration = () => {
  let startTime: Date | undefined = undefined
  let previousTime = 0
  let listenedDuration = 0

  return derived(player, (data) => {
    if (!data.track) return 0

    if (data.track.startTime !== startTime) {
      // reset
      previousTime = 0
      listenedDuration = 0
      startTime = data.track.startTime
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

export const createNowPlayer = (
  onNowPlaying: (data: NonNullable<PlayerState['track']>) => void
) => {
  let startTime: Date | undefined = undefined
  let nowPlayingSent = false

  const unsubscribe = player.subscribe((data) => {
    if (!data.track) return

    if (data.track.startTime !== startTime) {
      nowPlayingSent = false
      startTime = data.track.startTime
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
  onScrobble: (data: Pick<NonNullable<PlayerState['track']>, 'id' | 'startTime'>) => void
) => {
  const startTime: Date | undefined = undefined
  let scrobbled = false
  const listenedDuration = createListenedDuration()

  const combined = derived([player, listenedDuration], ([np, ld]) => ({
    id: np.track?.id,
    startTime: np.track?.startTime,
    duration: np.track?.duration,
    listenedDuration: ld,
  }))

  const unsubscribe = combined.subscribe((data) => {
    if (data.startTime !== startTime) {
      scrobbled = false
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
