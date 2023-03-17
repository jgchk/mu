import { writable } from 'svelte/store';

export type NowPlaying = {
  id: number;
};

export const nowPlaying = writable<NowPlaying | undefined>(undefined);
