import mitt from 'mitt'
import type { Emitter } from 'mitt'
import { writable } from 'svelte/store'
import type { Writable } from 'svelte/store'

export type PlayerState = {
  track?: {
    id: number
    startTime: Date
    currentTime?: number
    duration?: number
  }

  paused: boolean
  volume?: number

  previousTracks: number[]
  nextTracks: number[]
}

export type NowPlayingEvents = {
  playTrack: { trackId: number; previousTracks: number[]; nextTracks: number[] }
  nextTrack: { trackId: number }
  previousTrack: { trackId: number }
  play: undefined
  pause: undefined
  seek: { time: number }
}

const createPlayerController = (): Writable<PlayerState> & {
  events: Emitter<NowPlayingEvents>
  playTrack: (id: number, queue?: { previousTracks?: number[]; nextTracks?: number[] }) => void
  nextTrack: () => void
  previousTrack: () => void
  play: () => void
  pause: () => void
  seek: (time: number) => void
} => {
  const nowPlaying = writable<PlayerState>({
    paused: true,
    previousTracks: [],
    nextTracks: [],
  })

  const events = mitt<NowPlayingEvents>()

  return {
    ...nowPlaying,
    events,

    playTrack: (id, queue) => {
      const previousTracks = queue?.previousTracks ?? []
      const nextTracks = queue?.nextTracks ?? []
      nowPlaying.update((data) => ({
        ...data,
        track: {
          id,
          startTime: new Date(),
        },
        paused: false,
        previousTracks,
        nextTracks,
      }))
      events.emit('playTrack', { trackId: id, previousTracks, nextTracks })
    },

    nextTrack: () => {
      nowPlaying.update((data) => {
        if (data.nextTracks.length > 0) {
          const nextTrackId = data.nextTracks[0]
          events.emit('nextTrack', { trackId: nextTrackId })
          return {
            ...data,
            track: {
              id: nextTrackId,
              startTime: new Date(),
              currentTime: 0,
            },
            paused: false,
            previousTracks: [...data.previousTracks, ...(data.track ? [data.track.id] : [])],
            nextTracks: data.nextTracks.slice(1),
          }
        } else {
          return {
            ...data,
          }
        }
      })
    },

    previousTrack: () => {
      nowPlaying.update((data) => {
        if (data.previousTracks.length > 0) {
          const previousTrackId = data.previousTracks[data.previousTracks.length - 1]
          events.emit('previousTrack', { trackId: previousTrackId })
          return {
            ...data,
            track: {
              id: previousTrackId,
              startTime: new Date(),
              currentTime: 0,
            },
            paused: false,
            previousTracks: data.previousTracks.slice(0, data.previousTracks.length - 1),
            nextTracks: [...(data.track ? [data.track.id] : []), ...data.nextTracks],
          }
        } else if (data.track) {
          // if no previous tracks, just restart the current track
          events.emit('previousTrack', { trackId: data.track.id })
          return {
            ...data,
            track: {
              ...data.track,
              startTime: new Date(),
              currentTime: 0,
            },
            paused: false,
          }
        } else {
          return {
            ...data,
          }
        }
      })
    },

    play: () => {
      nowPlaying.update((data) => ({
        ...data,
        paused: true,
      }))
      events.emit('play')
    },

    pause: () => {
      nowPlaying.update((data) => ({
        ...data,
        paused: true,
      }))
      events.emit('pause')
    },

    seek: (time) => {
      events.emit('seek', { time })
    },
  }
}

export const player = createPlayerController()
