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
  getAll: publicProcedure.query(({ ctx }) => ctx.db.tags.getAll()),
  getAllTree: publicProcedure.query(({ ctx }) =>
    ctx.db.tags.getAll().map((tag) => ({
      ...tag,
      parents: ctx.db.tags.getParents(tag.id).map((t) => t.id),
      children: ctx.db.tags.getChildren(tag.id).map((t) => t.id),
    }))
  ),
})
