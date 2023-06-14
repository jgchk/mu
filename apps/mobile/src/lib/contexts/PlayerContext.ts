import { create } from 'zustand'

export type PlayerContext = {
  track?: TrackState
  nextTracks: number[]
  previousTracks: number[]

  playTrack: (track: TrackState) => void
}
export type TrackState = {
  id: number
}

export const usePlayer = create<PlayerContext>((set) => ({
  track: undefined,
  nextTracks: [],
  previousTracks: [],

  playTrack: (track) => set({ track }),
}))
