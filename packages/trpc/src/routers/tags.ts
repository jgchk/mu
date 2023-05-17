import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

export const tagsRouter = router({
  add: protectedProcedure
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
      const loop = ctx.sys().db.tags.checkLoop(input)
      if (loop) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Loop detected: ${loop}`,
        })
      }
      return ctx.sys().db.tags.insert(input)
    }),
  edit: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().nullish(),
          parents: z.number().array().optional(),
          children: z.number().array().optional(),
          taggable: z.boolean().optional(),
        }),
      })
    )
    .mutation(({ ctx, input }) => {
      const loop = ctx.sys().db.tags.checkLoop({ id: input.id, ...input.data })
      if (loop) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Loop detected: ${loop}`,
        })
      }
      return ctx.sys().db.tags.update(input.id, input.data)
    }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => {
    ctx.sys().db.tags.delete(input.id)
    return true
  }),
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => ctx.sys().db.tags.get(input.id)),
  getAll: protectedProcedure
    .input(z.object({ taggable: z.boolean().optional() }))
    .query(({ input, ctx }) => ctx.sys().db.tags.getAll(input)),
  getAllTree: protectedProcedure.query(({ ctx }) =>
    ctx
      .sys()
      .db.tags.getAll()
      .map((tag) => ({
        ...tag,
        parents: ctx
          .sys()
          .db.tags.getParents(tag.id)
          .map((t) => t.id),
        children: ctx
          .sys()
          .db.tags.getChildren(tag.id)
          .map((t) => t.id),
      }))
  ),

  getByRelease: protectedProcedure
    .input(z.object({ releaseId: z.number() }))
    .query(({ ctx, input }) => ctx.sys().db.tags.getByRelease(input.releaseId)),
  tagRelease: protectedProcedure
    .input(
      z.object({
        releaseId: z.number(),
        tagId: z.number(),
        tagged: z.boolean(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (input.tagged) {
        const existingTag = ctx.sys().db.releaseTags.find(input.releaseId, input.tagId)
        if (!existingTag) {
          ctx.sys().db.releaseTags.addTag(input.releaseId, input.tagId)
        }
      } else {
        ctx.sys().db.releaseTags.delete(input.releaseId, input.tagId)
      }
      return ctx.sys().db.tags.getByRelease(input.releaseId)
    }),

  getByTrack: protectedProcedure
    .input(z.object({ trackId: z.number() }))
    .query(({ ctx, input }) => ctx.sys().db.tags.getByTrack(input.trackId)),
  tagTrack: protectedProcedure
    .input(
      z.object({
        trackId: z.number(),
        tagId: z.number(),
        tagged: z.boolean(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (input.tagged) {
        const existingTag = ctx.sys().db.trackTags.find(input.trackId, input.tagId)
        if (!existingTag) {
          ctx.sys().db.trackTags.addTag(input.trackId, input.tagId)
        }
      } else {
        ctx.sys().db.trackTags.delete(input.trackId, input.tagId)
      }
      return ctx.sys().db.tags.getByTrack(input.trackId)
    }),
})
