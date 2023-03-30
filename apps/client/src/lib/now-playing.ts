import { writable } from 'svelte/store'

export type NowPlaying = {
  trackId: number
  __playSignal: symbol

  queuedTrackIds: number[]
}

export const nowPlaying = writable<NowPlaying | undefined>(undefined)

export const playTrack = (id: number, queuedTrackIds?: number[]) => {
  nowPlaying.set({ trackId: id, __playSignal: Symbol(), queuedTrackIds: queuedTrackIds ?? [] })
}

export const nextTrack = () => {
  nowPlaying.update((data) => {
    if (data && data.queuedTrackIds.length > 0) {
      const nextTrackId = data.queuedTrackIds[0]
      return {
        trackId: nextTrackId,
        __playSignal: Symbol(),
        queuedTrackIds: data.queuedTrackIds.slice(1),
      }
    } else {
      return data
    }
  })
}
