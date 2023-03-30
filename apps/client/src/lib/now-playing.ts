import { writable } from 'svelte/store'

export type NowPlaying = {
  trackId: number
  __playSignal: symbol

  previousTracks: number[]
  nextTracks: number[]
}

export const nowPlaying = writable<NowPlaying | undefined>(undefined)

export const playTrack = (
  id: number,
  {
    previousTracks = [],
    nextTracks = [],
  }: { previousTracks?: number[]; nextTracks?: number[] } = {}
) => {
  nowPlaying.set({ trackId: id, __playSignal: Symbol(), previousTracks, nextTracks })
}

export const nextTrack = () => {
  nowPlaying.update((data) => {
    if (!data) return

    if (data.nextTracks.length > 0) {
      const nextTrackId = data.nextTracks[0]
      return {
        trackId: nextTrackId,
        __playSignal: Symbol(),
        previousTracks: [...data.previousTracks, data.trackId],
        nextTracks: data.nextTracks.slice(1),
      }
    } else {
      return data
    }
  })
}

export const previousTrack = () => {
  nowPlaying.update((data) => {
    if (!data) return

    if (data.previousTracks.length > 0) {
      const previousTrackId = data.previousTracks[data.previousTracks.length - 1]
      return {
        trackId: previousTrackId,
        __playSignal: Symbol(),
        previousTracks: data.previousTracks.slice(0, data.previousTracks.length - 1),
        nextTracks: [data.trackId, ...data.nextTracks],
      }
    } else {
      // if no previous tracks, just restart the current track
      return {
        ...data,
        __playSignal: Symbol(),
      }
    }
  })
}
