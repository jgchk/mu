import type { InferModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Constructor } from 'utils'
import { ifDefined } from 'utils'

import type { UpdateData } from '../utils'
import { makeUpdate } from '../utils'
import type { DatabaseBase } from './base'
import type { ReleaseTag } from './release-tags'
import { releaseTags } from './release-tags'
import type { TrackTag } from './track-tags'
import { trackTags } from './track-tags'

export type Tag = InferModel<typeof tags>
export type InsertTag = InferModel<typeof tags, 'insert'> & {
  parents?: Tag['id'][]
  children?: Tag['id'][]
}
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  taggable: integer('taggable').notNull(),
})

export type TagRelationship = InferModel<typeof tagRelationships>
export type InsertTagRelationship = InferModel<typeof tagRelationships, 'insert'>
export const tagRelationships = sqliteTable(
  'tag_relationships',
  {
    parentId: integer('parent_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
    childId: integer('child_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (tagRelationships) => ({
    tagRelationshipsPrimaryKey: primaryKey(tagRelationships.parentId, tagRelationships.childId),
  })
)

export type TagPretty = Omit<Tag, 'taggable'> & {
  taggable: boolean
}
export type InsertTagPretty = Omit<InsertTag, 'taggable'> & {
  taggable?: boolean
}

const convertInsertTag = (tag: InsertTagPretty): InsertTag => ({
  ...tag,
  taggable: tag.taggable ? 1 : 0,
})
const convertTag = (tag: Tag): TagPretty => ({
  ...tag,
  taggable: tag.taggable !== 0,
})

export type TagsMixin = {
  tags: {
    insert: (tag: InsertTagPretty) => TagPretty
    update: (id: Tag['id'], data: UpdateData<InsertTagPretty>) => TagPretty
    get: (id: Tag['id']) => TagPretty
    getAll: (filter?: { taggable?: boolean }) => TagPretty[]
    getParents: (id: Tag['id']) => TagPretty[]
    getChildren: (id: Tag['id']) => TagPretty[]
    getDescendants: (id: Tag['id']) => TagPretty[]
    getByRelease: (releaseId: ReleaseTag['releaseId']) => TagPretty[]
    getByTrack: (trackId: TrackTag['trackId']) => TagPretty[]
    delete: (id: Tag['id']) => void
    checkLoop: (
      newTag?: Partial<Pick<InsertTag, 'parents' | 'children' | 'id' | 'name'>>
    ) => string | false
  }
}

export const TagsMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<TagsMixin> & TBase =>
  class extends Base implements TagsMixin {
    tags: TagsMixin['tags'] = {
      insert: ({ parents, children, ...tag }) => {
        const result = this.db.insert(tags).values(convertInsertTag(tag)).returning().get()
        if (parents?.length) {
          this.db
            .insert(tagRelationships)
            .values(parents.map((parentId) => ({ parentId, childId: result.id })))
            .run()
        }
        if (children?.length) {
          this.db
            .insert(tagRelationships)
            .values(children.map((childId) => ({ parentId: result.id, childId })))
            .run()
        }
        return convertTag(result)
      },
      update: (id, { parents, children, ...data }) => {
        const result = this.db
          .update(tags)
          .set(
            makeUpdate({
              ...data,
              taggable: ifDefined(data.taggable, (taggable) => (taggable ? 1 : 0)),
            })
          )
          .where(eq(tags.id, id))
          .returning()
          .get()

        if (parents) {
          this.db.delete(tagRelationships).where(eq(tagRelationships.childId, id)).run()
          if (parents.length) {
            this.db
              .insert(tagRelationships)
              .values(parents.map((parentId) => ({ parentId, childId: id })))
              .run()
          }
        }
        if (children) {
          this.db.delete(tagRelationships).where(eq(tagRelationships.parentId, id)).run()
          if (children.length) {
            this.db
              .insert(tagRelationships)
              .values(children.map((childId) => ({ parentId: id, childId })))
              .run()
          }
        }

        return convertTag(result)
      },
      get: (id) => {
        return convertTag(this.db.select().from(tags).where(eq(tags.id, id)).get())
      },
      getAll: ({ taggable } = {}) => {
        let query = this.db.select().from(tags)

        if (taggable !== undefined) {
          query = query.where(eq(tags.taggable, taggable ? 1 : 0))
        }

        return query.all().map(convertTag)
      },
      getParents: (id) => {
        return this.db
          .select()
          .from(tagRelationships)
          .where(eq(tagRelationships.childId, id))
          .innerJoin(tags, eq(tags.id, tagRelationships.parentId))
          .all()
          .map((tag) => convertTag(tag.tags))
      },
      getChildren: (id) => {
        return this.db
          .select()
          .from(tagRelationships)
          .where(eq(tagRelationships.parentId, id))
          .innerJoin(tags, eq(tags.id, tagRelationships.childId))
          .all()
          .map((tag) => convertTag(tag.tags))
      },
      getDescendants: (id) => {
        // bfs
        const descendants: TagPretty[] = []
        const visited = new Set<number>()
        const queue = this.tags.getChildren(id)
        while (queue.length) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const current = queue.shift()!
          if (visited.has(current.id)) {
            continue
          }
          descendants.push(current)
          visited.add(current.id)
          queue.push(...this.tags.getChildren(current.id))
        }

        return descendants
      },
      getByRelease: (releaseId) => {
        return this.db
          .select()
          .from(releaseTags)
          .where(eq(releaseTags.releaseId, releaseId))
          .innerJoin(tags, eq(releaseTags.tagId, tags.id))
          .all()
          .map((t) => convertTag(t.tags))
      },
      getByTrack: (trackId) => {
        return this.db
          .select()
          .from(trackTags)
          .where(eq(trackTags.trackId, trackId))
          .innerJoin(tags, eq(trackTags.tagId, tags.id))
          .all()
          .map((t) => convertTag(t.tags))
      },
      delete: (id) => {
        return this.db.delete(tags).where(eq(tags.id, id)).run()
      },
      checkLoop: (newTag) => {
        const nodes: Pick<Tag, 'id' | 'name'>[] = this.db.select().from(tags).all()
        let edges = this.db.select().from(tagRelationships).all()

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
          nodes.map((node) => [
            node.id,
            { parents: new Set(), children: new Set(), name: node.name },
          ])
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
            const formattedCycle = cycle
              .map((id) => tagsMap.get(id)?.name ?? '[unknown]')
              .join(' → ')
            return formattedCycle
          }
        }

        return false
      },
    }
  }
