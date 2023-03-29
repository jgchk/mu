import { writable } from 'svelte/store'

export type NowPlaying = {
  id: number
  __symbol: symbol
}

export const nowPlaying = writable<NowPlaying | undefined>(undefined)

export const play = (id: number) => {
  nowPlaying.set({ id, __symbol: Symbol() })
}
