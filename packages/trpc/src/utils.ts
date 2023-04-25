import type { BoolLang } from 'bool-lang'
import fs from 'fs/promises'
import path from 'path'

import type { Context } from './context'

export const getImagePath = (ctx: Context, id: number) =>
  path.resolve(path.join(ctx.imagesDir, id.toString()))

export const cleanupImage = async (ctx: Context, id: number) => {
  const numUses = ctx.db.images.getNumberOfUses(id)
  if (numUses === 0) {
    ctx.db.images.delete(id)
    await fs.rm(getImagePath(ctx, id))
  }
}

export const injectDescendants =
  (db: Context['db']) =>
  (node: BoolLang): BoolLang => {
    switch (node.kind) {
      case 'id': {
        const descendants = db.tags.getDescendants(node.value)
        const ids = [node.value, ...descendants.map((t) => t.id)]
        return {
          kind: 'or',
          children: ids.map((id) => ({ kind: 'id', value: id })),
        }
      }
      case 'not': {
        return {
          kind: 'not',
          child: injectDescendants(db)(node.child),
        }
      }
      case 'and': {
        return {
          kind: 'and',
          children: node.children.map(injectDescendants(db)),
        }
      }
      case 'or': {
        return {
          kind: 'or',
          children: node.children.map(injectDescendants(db)),
        }
      }
    }
  }
