import type { BoolLang } from 'bool-lang'
import { decode } from 'bool-lang'
import { toErrorString } from 'utils'
import { z } from 'zod'

import type { Context } from './context'

export const BoolLangString = z.string().transform((val, ctx) => {
  try {
    const parsed = decode(val)
    return parsed
  } catch (e) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid BoolLang: ${toErrorString(e)}`,
    })
    return z.NEVER
  }
})

export type TracksFilter = z.infer<typeof TracksFilter>
export const TracksFilter = z.object({
  favorite: z.boolean().optional(),
  tags: BoolLangString.optional(),
  limit: z.number().min(1).max(100).optional(),
  cursor: z.number().optional(),
})

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
