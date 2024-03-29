import type { BoolLang } from 'bool-lang'
import { decode } from 'bool-lang'
import type { Database } from 'db'
import { toErrorString } from 'utils'
import { z } from 'zod'

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

export type SortDirection = z.infer<typeof SortDirection>
export const SortDirection = z.enum(['asc', 'desc'])

export type Pagination = z.infer<typeof Pagination>
export const Pagination = z.object({
  limit: z.number().min(1).max(100).optional(),
  cursor: z.number().optional(),
})

export const injectDescendants =
  (db: Database) =>
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
