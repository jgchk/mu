import { writable } from 'svelte/store'
import { ifDefined } from 'utils'

export type NowPlaying = {
  track?: {
    id: number
    __playSignal: symbol
    startTime: Date
    currentTime?: number
    duration?: number
  }

  previousTracks: number[]
  nextTracks: number[]
}

export const nowPlaying = writable<NowPlaying>({
  previousTracks: [],
  nextTracks: [],
})

export const playTrack = (
  id: number,
  {
    previousTracks = [],
    nextTracks = [],
  }: { previousTracks?: number[]; nextTracks?: number[] } = {}
) => {
  window.Android?.playTrack(id, previousTracks.toString(), nextTracks.toString())
  nowPlaying.set({
    track: {
      id,
      __playSignal: Symbol(),
      startTime: new Date(),
    },
    previousTracks,
    nextTracks,
  })
}

export const nextTrack = () => {
  nowPlaying.update((data) => {
    if (data.nextTracks.length > 0) {
      const nextTrackId = data.nextTracks[0]
      return {
        track: {
          id: nextTrackId,
          __playSignal: Symbol(),
          startTime: new Date(),
          currentTime: 0,
        },
        previousTracks: [...data.previousTracks, ...(data.track ? [data.track.id] : [])],
        nextTracks: data.nextTracks.slice(1),
      }
    } else {
      return {
        ...data,
      }
    }
  })
}

export const previousTrack = () => {
  nowPlaying.update((data) => {
    if (data.previousTracks.length > 0) {
      const previousTrackId = data.previousTracks[data.previousTracks.length - 1]
      return {
        track: {
          id: previousTrackId,
          __playSignal: Symbol(),
          startTime: new Date(),
          currentTime: 0,
        },
        previousTracks: data.previousTracks.slice(0, data.previousTracks.length - 1),
        nextTracks: [...(data.track ? [data.track.id] : []), ...data.nextTracks],
      }
    } else {
      // if no previous tracks, just restart the current track
      return {
        ...data,
        track: ifDefined(data.track, (track) => ({
          id: track.id,
          __playSignal: Symbol(),
          startTime: new Date(),
        })),
      }
    }
  })
}
