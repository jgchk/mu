import { TRPCError } from '@trpc/server'
import { and, asc, eq, inArray, sql, tags, trackTags, tracks } from 'db'
import { isNotNull, uniq } from 'utils'
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
      return ctx.sys().db.tags.insert({ ...input, taggable: input.taggable ?? false })
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
      const tag = ctx.sys().db.tags.update(input.id, input.data)

      if (tag === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tag not found',
        })
      }

      return tag
    }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => {
    ctx.sys().db.tags.delete(input.id)
    return true
  }),
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => ctx.sys().db.tags.get(input.id)),
  getAll: protectedProcedure
    .input(z.object({ taggable: z.boolean().optional(), name: z.string().optional() }))
    .query(({ input, ctx }) => {
      const where = []

      if (input.taggable !== undefined) {
        where.push(eq(tags.taggable, input.taggable))
      }
      if (input.name !== undefined) {
        where.push(sql`lower(${tags.name}) like ${'%' + input.name.toLowerCase() + '%'}`)
      }

      const results = ctx.sys().db.db.query.tags.findMany({
        where: and(...where),
        orderBy: asc(tags.name),
        with: {
          trackTags: {
            with: {
              track: true,
            },
          },
          releaseTags: {
            with: {
              release: {
                with: {
                  tracks: true,
                },
              },
            },
          },
        },
      })

      return results.map(({ trackTags, releaseTags, ...result }) => {
        const trackImageIds = trackTags.map(({ track }) => track.imageId).filter(isNotNull)

        const releaseImageIds = releaseTags
          .map(
            ({ release }) => release.tracks.find((track) => track.imageId !== null)?.imageId ?? null
          )
          .filter(isNotNull)

        return {
          ...result,
          imageIds: uniq([...releaseImageIds, ...trackImageIds]),
        }
      })
    }),
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
      const trackIds = ctx
        .sys()
        .db.db.select({ trackId: tracks.id })
        .from(tracks)
        .where(eq(tracks.releaseId, input.releaseId))
        .all()
        .map((t) => t.trackId)

      if (input.tagged) {
        const existingTag = ctx.sys().db.releaseTags.find(input.releaseId, input.tagId)
        if (!existingTag) {
          ctx.sys().db.releaseTags.addTag(input.releaseId, input.tagId)
        }

        ctx
          .sys()
          .db.db.insert(trackTags)
          .values(trackIds.map((trackId) => ({ trackId, tagId: input.tagId })))
          .onConflictDoNothing()
          .run()
      } else {
        ctx.sys().db.releaseTags.delete(input.releaseId, input.tagId)

        ctx
          .sys()
          .db.db.delete(trackTags)
          .where(and(inArray(trackTags.trackId, trackIds), eq(trackTags.tagId, input.tagId)))
          .run()
      }

      return {
        releaseTags: ctx.sys().db.tags.getByRelease(input.releaseId),
        trackIds,
      }
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
