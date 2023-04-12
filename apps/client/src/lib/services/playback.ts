import type { TRPCClient } from '$lib/trpc'

export const createUpdateNowPlayingMutation = (trpc: TRPCClient) =>
  trpc.playback.updateNowPlaying.mutation()

export const createScrobbleMutation = (trpc: TRPCClient) => trpc.playback.scrobble.mutation()
