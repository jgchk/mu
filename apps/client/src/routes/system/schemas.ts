import { z } from 'zod'

import type { RouterInput, RouterOutput } from '$lib/trpc'

export type LastFmSchema = typeof lastFmSchema
type LastFmData = z.infer<LastFmSchema>
export const lastFmSchema = z.object({
  lastFmKey: z.string(),
  lastFmSecret: z.string(),
  lastFmUsername: z.string(),
  lastFmPassword: z.string(),
})

export const lastFmFromServerData = (data: RouterOutput['system']['config']): LastFmData => ({
  lastFmKey: data.lastFmKey ?? '',
  lastFmSecret: data.lastFmSecret ?? '',
  lastFmUsername: data.lastFmUsername ?? '',
  lastFmPassword: data.lastFmPassword ?? '',
})

export const lastFmToServerData = (data: LastFmData): RouterInput['system']['updateConfig'] => ({
  lastFmKey: data.lastFmKey || null,
  lastFmSecret: data.lastFmSecret || null,
  lastFmUsername: data.lastFmUsername || null,
  lastFmPassword: data.lastFmPassword || null,
})

export type SlskSchema = typeof slskSchema
type SlskData = z.infer<SlskSchema>
export const slskSchema = z.object({
  soulseekUsername: z.string(),
  soulseekPassword: z.string(),
})

export const slskFromServerData = (data: RouterOutput['system']['config']): SlskData => ({
  soulseekUsername: data.soulseekUsername ?? '',
  soulseekPassword: data.soulseekPassword ?? '',
})

export const slskToServerData = (data: SlskData): RouterInput['system']['updateConfig'] => ({
  soulseekUsername: data.soulseekUsername || null,
  soulseekPassword: data.soulseekPassword || null,
})
