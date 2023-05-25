import { createQuery } from '@tanstack/svelte-query'
import { fetcher } from 'utils/browser'

import type { TRPCClient } from '$lib/trpc'

export const createUpdateNowPlayingMutation = (trpc: TRPCClient) =>
  trpc.playback.updateNowPlaying.mutation()

export const createScrobbleMutation = (trpc: TRPCClient) => trpc.playback.scrobble.mutation()

export const createDashManifestQuery = (trackId: number) =>
  createQuery(['tracks', trackId, 'stream', 'dash'], () =>
    fetcher(fetch)(`/api/tracks/${trackId}/stream/dash`)
  )
