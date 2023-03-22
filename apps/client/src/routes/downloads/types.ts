import type { RouterOutput } from '$lib/trpc'

export type Downloads = RouterOutput['downloads']['getAll']
export type GroupDownload = Downloads['groups'][number]
export type TrackDownload = Downloads['tracks'][number]
