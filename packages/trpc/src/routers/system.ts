import { z } from 'zod'

import { publicProcedure, router } from '../trpc'

export const systemRouter = router({
  status: publicProcedure.query(({ ctx }) => ctx.getStatus()),
  config: publicProcedure.query(({ ctx }) => ctx.db.config.get()),
  updateConfig: publicProcedure
    .input(
      z.object({
        lastFmKey: z.string().nullish(),
        lastFmSecret: z.string().nullish(),
        lastFmUsername: z.string().nullish(),
        lastFmPassword: z.string().nullish(),
        soulseekUsername: z.string().nullish(),
        soulseekPassword: z.string().nullish(),
        spotifyClientId: z.string().nullish(),
        spotifyClientSecret: z.string().nullish(),
        spotifyUsername: z.string().nullish(),
        spotifyPassword: z.string().nullish(),
        spotifyDcCookie: z.string().nullish(),
        soundcloudAuthToken: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = ctx.db.config.update(input)

      if (
        input.lastFmKey !== undefined ||
        input.lastFmSecret !== undefined ||
        input.lastFmUsername !== undefined ||
        input.lastFmPassword !== undefined
      ) {
        await ctx.startLastFm()
      }

      if (input.soulseekUsername !== undefined || input.soulseekPassword !== undefined) {
        await ctx.startSoulseek()
      }

      if (
        input.spotifyClientId !== undefined ||
        input.spotifyClientSecret !== undefined ||
        input.spotifyUsername !== undefined ||
        input.spotifyPassword !== undefined ||
        input.spotifyDcCookie !== undefined
      ) {
        await ctx.startSpotify()
      }

      if (input.soundcloudAuthToken !== undefined) {
        await ctx.startSoundcloud()
      }

      const status = await ctx.getStatus()
      return { config: updated, status }
    }),
  startSoulseek: publicProcedure.mutation(({ ctx }) => ctx.startSoulseek()),
  stopSoulseek: publicProcedure.mutation(({ ctx }) => ctx.stopSoulseek()),
  startLastFm: publicProcedure.mutation(({ ctx }) => ctx.startLastFm()),
  stopLastFm: publicProcedure.mutation(({ ctx }) => ctx.stopLastFm()),
  startSpotify: publicProcedure.mutation(({ ctx }) => ctx.startSpotify()),
  stopSpotify: publicProcedure.mutation(({ ctx }) => ctx.stopSpotify()),
  startSoundcloud: publicProcedure.mutation(({ ctx }) => ctx.startSoundcloud()),
  stopSoundcloud: publicProcedure.mutation(({ ctx }) => ctx.stopSoundcloud()),
})
