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

export type TracksSortColumn = z.infer<typeof TracksSortColumn>
export const TracksSortColumn = z.enum(['title', 'artists', 'release', 'duration'])

export type TracksSort = z.infer<typeof TracksSort>
export const TracksSort = z.object({
  column: TracksSortColumn,
  direction: SortDirection,
})

export type TracksFilters = z.infer<typeof TracksFilters>
export const TracksFilters = z.object({
  artistId: z.number().optional(),
  releaseId: z.number().optional(),
  title: z.string().optional(),
  favorite: z.boolean().optional(),
  tags: BoolLangString.optional(),
  sort: TracksSort.optional(),
})

export type Pagination = z.infer<typeof Pagination>
export const Pagination = z.object({
  limit: z.number().min(1).max(100).optional(),
  cursor: z.number().optional(),
})

export type TracksOptions = z.infer<typeof TracksOptions>
export const TracksOptions = TracksFilters.and(Pagination)

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
