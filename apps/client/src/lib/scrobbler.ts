import type { PlayerState } from './now-playing'

export const createNowPlayer = (
  onNowPlaying: (data: NonNullable<PlayerState['track']>) => void
) => {
  let startTime: Date | undefined = undefined
  let nowPlayingSent = false

  return {
    update: (data: PlayerState['track']) => {
      // console.log('UPDATE NOW PLAYER', data)
      if (!data) {
        return
      }

      if (data.startTime !== startTime) {
        startTime = data.startTime
        nowPlayingSent = false
      }

      if (!nowPlayingSent) {
        nowPlayingSent = true
        onNowPlaying({ id: data.id, startTime: data.startTime })
      }
    },
  }
}

export const createScrobbler = (
  onScrobble: (data: Pick<NonNullable<PlayerState['track']>, 'id' | 'startTime'>) => void
) => {
  let startTime: Date | undefined = undefined
  let scrobbled = false

  return {
    update: (data: PlayerState['track']) => {
      if (!data) {
        return
      }

      if (data.startTime !== startTime) {
        startTime = data.startTime
        scrobbled = false
      }

      console.log('SCROBBLER', data.durationMs, data.currentTimeMs ?? 0)

      if (
        !scrobbled &&
        data.durationMs !== undefined &&
        shouldScrobble(data.durationMs, data.currentTimeMs ?? 0)
      ) {
        scrobbled = true
        onScrobble({ id: data.id, startTime: data.startTime })
      }
    },
  }
}

function shouldScrobble(durationMs: number, listenedDurationMs: number) {
  const halfDuration = durationMs / 2
  const minimumPlayTime = Math.min(halfDuration, 4 * 60 * 1000)
  return listenedDurationMs >= minimumPlayTime
}
