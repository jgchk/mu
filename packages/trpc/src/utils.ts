import fs from 'fs/promises'
import path from 'path'

import type { Context } from './context'

export const getImagePath = (ctx: Context, id: number) =>
  path.resolve(path.join(ctx.imagesDir, id.toString()))

export const cleanupImage = async (ctx: Context, id: number) => {
  const numUses = ctx.db.images.getNumberOfUses(id)
  if (numUses === 0) {
    await fs.rm(getImagePath(ctx, id))
    ctx.db.images.delete(id)
  }
}
