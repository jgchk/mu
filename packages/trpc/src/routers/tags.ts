import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { publicProcedure, router } from '../trpc'

export const tagsRouter = router({
  add: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().nullable(),
        parents: z.number().array().optional(),
        children: z.number().array().optional(),
        taggable: z.boolean().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const loop = ctx.db.tags.checkLoop(input)
      if (loop) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Loop detected: ${loop}`,
        })
      }
      return ctx.db.tags.insert(input)
    }),
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => ctx.db.tags.get(input.id)),
  getAll: publicProcedure
    .input(z.object({ taggable: z.boolean().optional() }))
    .query(({ input, ctx }) => ctx.db.tags.getAll(input)),
  getAllTree: publicProcedure.query(({ ctx }) =>
    ctx.db.tags.getAll().map((tag) => ({
      ...tag,
      parents: ctx.db.tags.getParents(tag.id).map((t) => t.id),
      children: ctx.db.tags.getChildren(tag.id).map((t) => t.id),
    }))
  ),

  getByRelease: publicProcedure
    .input(z.object({ releaseId: z.number() }))
    .query(({ ctx, input }) => ctx.db.tags.getByRelease(input.releaseId)),
  tagRelease: publicProcedure
    .input(
      z.object({
        releaseId: z.number(),
        tagId: z.number(),
        tagged: z.boolean(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (input.tagged) {
        const existingTag = ctx.db.releaseTags.find(input.releaseId, input.tagId)
        if (!existingTag) {
          ctx.db.releaseTags.addTag(input.releaseId, input.tagId)
        }
      } else {
        ctx.db.releaseTags.delete(input.releaseId, input.tagId)
      }
      return ctx.db.tags.getByRelease(input.releaseId)
    }),

  getByTrack: publicProcedure
    .input(z.object({ trackId: z.number() }))
    .query(({ ctx, input }) => ctx.db.tags.getByTrack(input.trackId)),
  tagTrack: publicProcedure
    .input(
      z.object({
        trackId: z.number(),
        tagId: z.number(),
        tagged: z.boolean(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (input.tagged) {
        const existingTag = ctx.db.trackTags.find(input.trackId, input.tagId)
        if (!existingTag) {
          ctx.db.trackTags.addTag(input.trackId, input.tagId)
        }
      } else {
        ctx.db.trackTags.delete(input.trackId, input.tagId)
      }
      return ctx.db.tags.getByTrack(input.trackId)
    }),
})
