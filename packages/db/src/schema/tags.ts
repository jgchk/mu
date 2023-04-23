import type { InferModel } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Constructor } from 'utils'

import type { DatabaseBase } from './base'

export type Tag = InferModel<typeof tags>
export type InsertTag = InferModel<typeof tags, 'insert'> & {
  parents?: Tag['id'][]
  children?: Tag['id'][]
}
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
})

export type TagRelationship = InferModel<typeof tagRelationships>
export type InsertTagRelationship = InferModel<typeof tagRelationships, 'insert'>
export const tagRelationships = sqliteTable(
  'tag_relationships',
  {
    parentId: integer('parent_id')
      .references(() => tags.id)
      .notNull(),
    childId: integer('child_id')
      .references(() => tags.id)
      .notNull(),
  },
  (tagRelationships) => ({
    tagRelationshipsPrimaryKey: primaryKey(tagRelationships.parentId, tagRelationships.childId),
  })
)

export type TagsMixin = {
  tags: {
    insert: (tag: InsertTag) => Tag
    getAll: () => Tag[]
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
        const result = this.db.insert(tags).values(tag).returning().get()
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
        return result
      },
      getAll: () => {
        return this.db.select().from(tags).all()
      },
      checkLoop: (newTag) => {
        const nodes: Pick<Tag, 'id' | 'name'>[] = this.db.select().from(tags).all()
        const edges = this.db.select().from(tagRelationships).all()
        if (newTag) {
          const newTagId = newTag.id ?? Infinity
          nodes.push({ id: newTagId, name: newTag.name ?? '[new tag]' })
          if (newTag.parents) {
            edges.push(...newTag.parents.map((parentId) => ({ parentId, childId: newTagId })))
          }
          if (newTag.children) {
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
          const previousParent = tagsMap.get(edge.parentId)
          if (!previousParent) {
            throw new Error('Invalid parent id')
          } else {
            previousParent.children.add(edge.childId)
          }

          const previousChild = tagsMap.get(edge.childId)
          if (!previousChild) {
            throw new Error('Invalid child id')
          } else {
            previousChild.parents.add(edge.parentId)
          }
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
