import { eq } from 'drizzle-orm'
import { withProps } from 'utils'

import type { ReleaseTag } from '../schema/release-tags'
import { releaseTags } from '../schema/release-tags'
import type { InsertTag, Tag } from '../schema/tags'
import { tagRelationships, tags } from '../schema/tags'
import type { TrackTag } from '../schema/track-tags'
import { trackTags } from '../schema/track-tags'
import type { UpdateData } from '../utils'
import { hasUpdate, makeUpdate } from '../utils'
import type { DatabaseBase } from './base'

export type TagsMixin = {
  tags: {
    insert: (tag: InsertTag) => Tag
    update: (id: Tag['id'], data: UpdateData<InsertTag>) => Tag | undefined
    get: (id: Tag['id']) => Tag | undefined
    getAll: (filter?: { taggable?: boolean }) => Tag[]
    getParents: (id: Tag['id']) => Tag[]
    getChildren: (id: Tag['id']) => Tag[]
    getDescendants: (id: Tag['id']) => Tag[]
    getByRelease: (releaseId: ReleaseTag['releaseId']) => Tag[]
    getByTrack: (trackId: TrackTag['trackId']) => Tag[]
    delete: (id: Tag['id']) => void
    checkLoop: (
      newTag?: Partial<Pick<InsertTag, 'parents' | 'children' | 'id' | 'name'>>
    ) => string | false
  }
}

export const TagsMixin = <T extends DatabaseBase>(base: T): T & TagsMixin => {
  const tagsMixin: TagsMixin['tags'] = {
    insert: ({ parents, children, ...tag }) => {
      const result = base.db.insert(tags).values(tag).returning().get()
      if (parents?.length) {
        base.db
          .insert(tagRelationships)
          .values(parents.map((parentId) => ({ parentId, childId: result.id })))
          .run()
      }
      if (children?.length) {
        base.db
          .insert(tagRelationships)
          .values(children.map((childId) => ({ parentId: result.id, childId })))
          .run()
      }
      return result
    },
    update: (id, { parents, children, ...data }) => {
      const update = makeUpdate(data)
      const result = hasUpdate(update)
        ? base.db.update(tags).set(update).where(eq(tags.id, id)).returning().get()
        : tagsMixin.get(id)

      if (parents) {
        base.db.delete(tagRelationships).where(eq(tagRelationships.childId, id)).run()
        if (parents.length) {
          base.db
            .insert(tagRelationships)
            .values(parents.map((parentId) => ({ parentId, childId: id })))
            .run()
        }
      }
      if (children) {
        base.db.delete(tagRelationships).where(eq(tagRelationships.parentId, id)).run()
        if (children.length) {
          base.db
            .insert(tagRelationships)
            .values(children.map((childId) => ({ parentId: id, childId })))
            .run()
        }
      }

      return result
    },
    get: (id) => {
      return base.db.select().from(tags).where(eq(tags.id, id)).get()
    },
    getAll: ({ taggable } = {}) => {
      let query = base.db.select().from(tags)

      if (taggable !== undefined) {
        query = query.where(eq(tags.taggable, taggable))
      }

      return query.orderBy(tags.name).all()
    },
    getParents: (id) => {
      return base.db
        .select()
        .from(tagRelationships)
        .where(eq(tagRelationships.childId, id))
        .innerJoin(tags, eq(tags.id, tagRelationships.parentId))
        .all()
        .map((tag) => tag.tags)
    },
    getChildren: (id) => {
      return base.db
        .select()
        .from(tagRelationships)
        .where(eq(tagRelationships.parentId, id))
        .innerJoin(tags, eq(tags.id, tagRelationships.childId))
        .all()
        .map((tag) => tag.tags)
    },
    getDescendants: (id) => {
      // bfs
      const descendants: Tag[] = []
      const visited = new Set<number>()
      const queue = tagsMixin.getChildren(id)
      while (queue.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const current = queue.shift()!
        if (visited.has(current.id)) {
          continue
        }
        descendants.push(current)
        visited.add(current.id)
        queue.push(...tagsMixin.getChildren(current.id))
      }

      return descendants
    },
    getByRelease: (releaseId) => {
      return base.db
        .select()
        .from(releaseTags)
        .where(eq(releaseTags.releaseId, releaseId))
        .innerJoin(tags, eq(releaseTags.tagId, tags.id))
        .all()
        .map((t) => t.tags)
    },
    getByTrack: (trackId) => {
      return base.db
        .select()
        .from(trackTags)
        .where(eq(trackTags.trackId, trackId))
        .innerJoin(tags, eq(trackTags.tagId, tags.id))
        .all()
        .map((t) => t.tags)
    },
    delete: (id) => {
      return base.db.delete(tags).where(eq(tags.id, id)).run()
    },
    checkLoop: (newTag) => {
      const nodes: Pick<Tag, 'id' | 'name'>[] = base.db.select().from(tags).all()
      let edges = base.db.select().from(tagRelationships).all()

      if (newTag?.id !== undefined) {
        const newTagId = newTag.id

        // replace old node
        const index = nodes.findIndex((node) => node.id === newTagId)
        if (index !== -1) {
          nodes[index] = { id: newTagId, name: newTag.name ?? '[new tag]' }
        }

        // remove old edges
        edges = edges.filter((edge) => edge.parentId !== newTagId && edge.childId !== newTagId)

        // add new edges
        if (newTag.parents) {
          edges.push(...newTag.parents.map((parentId) => ({ parentId, childId: newTagId })))
        }
        if (newTag.children) {
          edges.push(...newTag.children.map((childId) => ({ parentId: newTagId, childId })))
        }
      } else {
        const newTagId = Infinity

        // add new node
        nodes.push({ id: newTagId, name: newTag?.name ?? '[new tag]' })

        // add new edges
        if (newTag?.parents) {
          edges.push(...newTag.parents.map((parentId) => ({ parentId, childId: newTagId })))
        }
        if (newTag?.children) {
          edges.push(...newTag.children.map((childId) => ({ parentId: newTagId, childId })))
        }
      }

      type TagData = {
        name: string
        parents: Set<number>
        children: Set<number>
      }
      const tagsMap: Map<number, TagData> = new Map(
        nodes.map((node) => [node.id, { parents: new Set(), children: new Set(), name: node.name }])
      )
      for (const edge of edges) {
        tagsMap.get(edge.parentId)?.children.add(edge.childId)
        tagsMap.get(edge.childId)?.parents.add(edge.parentId)
      }

      const detectCycleInner = (id: number, stack: number[]): number[] | false => {
        if (stack.includes(id)) {
          return [...stack, id]
        }

        const tag = tagsMap.get(id)
        const parentIds = tag?.parents ?? []

        for (const parentId of parentIds) {
          const cycle = detectCycleInner(parentId, [...stack, id])
          if (cycle) {
            return cycle
          }
        }

        return false
      }

      for (const node of nodes) {
        const cycle = detectCycleInner(node.id, [])
        if (cycle) {
          const formattedCycle = cycle.map((id) => tagsMap.get(id)?.name ?? '[unknown]').join(' → ')
          return formattedCycle
        }
      }

      return false
    },
  }

  return withProps(base, { tags: tagsMixin })
}
