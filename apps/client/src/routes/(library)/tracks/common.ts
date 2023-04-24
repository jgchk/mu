import type { RouterInput } from '$lib/trpc'

import type { AST } from './parser'
import { AND_SYMBOL, OR_SYMBOL, parse } from './parser'

export const baseTracksQueryInput = { limit: 100 }
export const makeTracksQueryInput = (opts?: {
  favoritesOnly?: boolean
  tags?: TrackTagsFilter
}): RouterInput['tracks']['getAllWithArtistsAndRelease'] => ({
  ...baseTracksQueryInput,
  ...(opts?.favoritesOnly ? { favorite: true } : {}),
  ...(opts?.tags !== undefined ? { tags: opts.tags } : {}),
})

export type TrackTagsFilter =
  | number
  | {
      kind: 'and'
      tags: TrackTagsFilter[]
    }
  | {
      kind: 'or'
      tags: TrackTagsFilter[]
    }

export const encodeTagsFilterUrl = (filter: TrackTagsFilter): string => {
  if (typeof filter === 'number') {
    return filter.toString()
  } else if (filter.kind === 'and') {
    return `(${filter.tags.join(AND_SYMBOL)})`
  } else if (filter.kind === 'or') {
    return `(${filter.tags.join(OR_SYMBOL)})`
  } else {
    throw new Error(`Invalid filter: ${JSON.stringify(filter)}}`)
  }
}

export const decodeTagsFilterUrl = (filter: string): TrackTagsFilter => {
  const parsedAst = parse(filter)

  if (parsedAst.length === 0) {
    throw new Error(`Invalid filter: ${filter}`)
  } else if (parsedAst.length > 1) {
    throw new Error(`Invalid filter: ${filter}`)
  }

  return convertASTNode(parsedAst[0])
}

const convertASTNode = (node: AST): TrackTagsFilter => {
  if (node.kind === 'id') {
    return node.value
  } else if (node.kind === 'and') {
    return {
      kind: 'and',
      tags: node.children.map(convertASTNode),
    }
  } else if (node.kind === 'or') {
    return {
      kind: 'or',
      tags: node.children.map(convertASTNode),
    }
  } else {
    throw new Error(`Invalid node: ${JSON.stringify(node)}`)
  }
}
