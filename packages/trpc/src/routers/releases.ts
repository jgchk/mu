import { TRPCError } from '@trpc/server'
import type { BoolLang } from 'bool-lang'
import type { Filter } from 'bool-lang/src/ast'
import type { Database, SQL } from 'db'
import {
  and,
  artists,
  asc,
  eq,
  getTableColumns,
  inArray,
  not,
  or,
  releaseArtists,
  releaseTags,
  releases,
  sql,
  tracks,
} from 'db'
import { search } from 'duckduckgo'
import { env } from 'env'
import filenamify from 'filenamify'
import fs from 'fs/promises'
import type { Metadata } from 'music-metadata'
import { deleteTrackCoverArt, writeTrackCoverArt, writeTrackMetadata } from 'music-metadata'
import path from 'path'
import { ifDefined, isDefined, numDigits } from 'utils'
import { ensureDir } from 'utils/node'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'
import { BoolLangString, Pagination, injectDescendants } from '../utils'

export type ReleasesFilters = z.infer<typeof ReleasesFilters>
export const ReleasesFilters = z.object({
  artistId: z.number().optional(),
  title: z.string().optional(),
  tags: BoolLangString.optional(),
})

export type ReleasesOptions = z.infer<typeof ReleasesOptions>
export const ReleasesOptions = ReleasesFilters.and(Pagination)

const getAllReleases = (
  db: Database,
  input: ReleasesFilters & { skip?: number; limit?: number }
) => {
  const where = []

  if (input.title) {
    where.push(sql`lower(${releases.title}) like ${'%' + input.title.toLowerCase() + '%'}`)
  }
  if (input.artistId !== undefined) {
    where.push(
      inArray(
        releases.id,
        db.db
          .select({ data: releaseArtists.releaseId })
          .from(releaseArtists)
          .where(eq(releaseArtists.artistId, input.artistId))
      )
    )
  }

  if (input.tags) {
    const tagsWithDescendants = injectDescendants(db)(input.tags)
    const tagsWhere = generateWhereClause(tagsWithDescendants)
    if (tagsWhere) {
      where.push(tagsWhere)
    }
  }

  let query = db.db
    .select()
    .from(releases)
    .where(and(...where))
    .orderBy(asc(releases.title))

  if (input.skip !== undefined) {
    query = query.offset(input.skip)
  }
  if (input.limit !== undefined) {
    query = query.limit(input.limit)
  }

  const results = query.all().map((release) => {
    const tracks_ = db.db
      .select()
      .from(tracks)
      .where(eq(tracks.releaseId, release.id))
      .orderBy(asc(tracks.order))
      .all()
    return {
      ...release,
      artists: db.db
        .select(getTableColumns(artists))
        .from(releaseArtists)
        .innerJoin(artists, eq(releaseArtists.artistId, artists.id))
        .where(eq(releaseArtists.releaseId, release.id))
        .orderBy(asc(releaseArtists.order))
        .all(),
      tracks: tracks_,
      imageId: tracks_.find((track) => track.imageId !== null)?.imageId ?? null,
    }
  })

  return results
}

export const releasesRouter = router({
  getAll: protectedProcedure.input(ReleasesOptions).query(({ input, ctx }) => {
    const skip = input.cursor ?? 0
    const limit = input.limit ?? 50

    const items = getAllReleases(ctx.sys().db, { ...input, skip, limit: limit + 1 })

    let nextCursor: number | undefined = undefined
    if (items.length > limit) {
      items.pop()
      nextCursor = skip + limit
    }

    return { items, nextCursor }
  }),

  getByArtistId: protectedProcedure
    .input(z.object({ artistId: z.number() }))
    .query(({ input, ctx }) => getAllReleases(ctx.sys().db, input)),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(({ input: { id }, ctx }) => {
    const result = ctx.sys().db.db.query.releases.findFirst({
      where: eq(releases.id, id),
      with: {
        tracks: {
          orderBy: asc(tracks.order),
        },
        releaseArtists: {
          orderBy: asc(releaseArtists.order),
          with: {
            artist: true,
          },
        },
      },
    })

    if (result === undefined) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Release not found',
      })
    }

    const { releaseArtists: releaseArtists_, ...release } = result

    return {
      ...release,
      imageId: release.tracks.find((track) => track.imageId !== null)?.imageId ?? null,
      artists: releaseArtists_.map((releaseArtist) => releaseArtist.artist),
    }
  }),

  getByTag: protectedProcedure
    .input(z.object({ tagId: z.number(), filter: ReleasesFilters.omit({ tags: true }).optional() }))
    .query(({ input: { tagId, filter }, ctx }) => {
      const tagFilter: Filter = { kind: 'id', value: tagId }
      return getAllReleases(ctx.sys().db, { ...filter, tags: tagFilter })
    }),

  updateWithTracksAndArtists: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        createArtists: z.map(z.number(), z.string()),
        album: z.object({
          title: z.string().min(1).optional(),
          artists: z.object({ action: z.enum(['create', 'connect']), id: z.number() }).array(),
          art: z.string().nullish(),
        }),
        tracks: z
          .object({
            id: z.number(),
            title: z.string().optional(),
            artists: z.object({ action: z.enum(['create', 'connect']), id: z.number() }).array(),
          })
          .array(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const artistMap = new Map(
        [...input.createArtists.entries()].map(([id, name]) => [
          id,
          ctx.sys().db.artists.insert({ name }),
        ])
      )

      const albumTitle = input.album.title
      const albumArtists = input.album.artists
        .map((artist) => {
          if (artist.action === 'create') {
            const dbArtist = artistMap.get(artist.id)
            if (!dbArtist) {
              throw new Error(`Artist ${artist.id} missing from input.artists`)
            }
            return dbArtist
          } else {
            return ctx.sys().db.artists.get(artist.id)
          }
        })
        .filter(isDefined)

      const dbRelease = ctx.sys().db.releases.update(input.id, {
        title: albumTitle,
      })

      if (dbRelease === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Release not found',
        })
      }

      ctx.sys().db.releaseArtists.updateByReleaseId(
        input.id,
        albumArtists.map((a) => a.id)
      )

      const existingDbTracks = ctx.sys().db.db.query.tracks.findMany({
        where: eq(tracks.releaseId, dbRelease.id),
        orderBy: asc(tracks.order),
      })

      let image: { data: Buffer; id: number } | null | undefined = undefined
      if (input.album.art) {
        const data = Buffer.from(input.album.art, 'base64')
        image = {
          data,
          id: (await ctx.sys().img.getImage(data)).id,
        }
      } else if (input.album.art === null) {
        image = null
      } else {
        image = undefined
      }

      if (input.tracks) {
        await Promise.all(
          input.tracks.map(async (track, i) => {
            const existingDbTrack = ctx.sys().db.tracks.get(track.id)

            if (existingDbTrack === undefined) {
              throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Track not found',
              })
            }

            const trackNumber = i + 1

            let filename = ''
            const numDigitsInTrackNumber = numDigits(existingDbTracks.length)
            filename += trackNumber.toString().padStart(numDigitsInTrackNumber, '0')
            filename += ' '
            filename += track.title ?? '[untitled]'
            filename += path.extname(existingDbTrack.path)

            const newPath = path.resolve(
              path.join(
                env.MUSIC_DIR,
                filenamify(
                  albumArtists.length > 0
                    ? albumArtists.map((artist) => artist.name).join(', ')
                    : '[unknown]'
                ),
                filenamify(albumTitle || '[untitled]'),
                filenamify(filename)
              )
            )

            if (existingDbTrack.path !== newPath) {
              await ensureDir(path.dirname(newPath))
              await fs.rename(existingDbTrack.path, newPath)
            }

            const artists = track.artists
              .map((artist) => {
                if (artist.action === 'create') {
                  const dbArtist = artistMap.get(artist.id)
                  if (!dbArtist) {
                    throw new Error(`Artist ${artist.id} missing from input.artists`)
                  }
                  return dbArtist
                } else {
                  return ctx.sys().db.artists.get(artist.id)
                }
              })
              .filter(isDefined)

            const metadata: Metadata = {
              title: track.title ?? null,
              artists: artists.map((artist) => artist.name),
              track: trackNumber,
              album: albumTitle ?? null,
              albumArtists: albumArtists.map((artist) => artist.name),
            }
            await writeTrackMetadata(newPath, metadata)

            const oldImageId = existingDbTrack.imageId

            if (image) {
              try {
                await writeTrackCoverArt(newPath, image.data)
              } catch {
                // OGG Files sometimes fail the first time then work the second time
                await writeTrackCoverArt(newPath, image.data)
              }
            } else if (image === null) {
              try {
                await deleteTrackCoverArt(newPath)
              } catch {
                // OGG Files sometimes fail the first time then work the second time
                await deleteTrackCoverArt(newPath)
              }
            }

            ctx.sys().db.tracks.update(existingDbTrack.id, {
              title: metadata.title,
              path: newPath,
              releaseId: dbRelease.id,
              order: i,
              imageId: image ? image.id : image === null ? null : undefined,
            })
            ctx.sys().db.trackArtists.updateByTrackId(
              existingDbTrack.id,
              artists.map((a) => a.id)
            )

            if (oldImageId !== null && image !== undefined) {
              await ctx.sys().img.cleanupImage(oldImageId)
            }
          })
        )
      }

      const result = ctx.sys().db.db.query.releases.findFirst({
        where: eq(releases.id, dbRelease.id),
        with: {
          tracks: {
            orderBy: asc(tracks.order),
          },
          releaseArtists: {
            orderBy: asc(releaseArtists.order),
            with: {
              artist: true,
            },
          },
        },
      })

      if (result === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Release not found',
        })
      }

      const { releaseArtists: releaseArtists_, ...release } = result

      return {
        ...release,
        imageId: release.tracks.find((track) => track.imageId !== null)?.imageId ?? null,
        artists: releaseArtists_.map((releaseArtist) => releaseArtist.artist),
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input: { id }, ctx }) => {
      const result = ctx.sys().db.db.query.releases.findFirst({
        where: eq(releases.id, id),
        with: {
          tracks: true,
        },
      })

      if (result === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Release not found',
        })
      }

      ctx.sys().db.db.delete(releases).where(eq(releases.id, id)).run()

      await Promise.all(
        result.tracks.map(async (track) => {
          ctx.sys().db.db.delete(tracks).where(eq(tracks.id, track.id)).run()
          await fs.rm(track.path, { force: true })
        })
      )

      // TODO: cleanup empty directories

      return { success: true }
    }),

  getRymLinks: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input: { id }, ctx }) => {
      const release = ctx.sys().db.db.query.releases.findFirst({
        where: eq(releases.id, id),
        with: {
          releaseArtists: {
            orderBy: asc(releaseArtists.order),
            with: {
              artist: true,
            },
          },
        },
      })

      if (release === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Release not found',
        })
      }

      const artistText = release.releaseArtists.map(({ artist }) => artist.name).join(', ')
      const searchText = `site:rateyourmusic.com/release ${
        release.title ?? 'untitled'
      } by ${artistText}`

      const { results } = await search(searchText)

      return results
    }),
})

export const generateWhereClause = (node: BoolLang, index = 0): SQL | undefined => {
  switch (node.kind) {
    case 'id':
      return sql`exists(select 1 from ${releaseTags} where ${releases.id} = ${releaseTags.releaseId} and ${releaseTags.tagId} = ${node.value})`

    case 'not':
      return ifDefined(generateWhereClause(node.child, index + 1), not)

    case 'and':
      return and(...node.children.map((child, idx) => generateWhereClause(child, index + idx + 1)))

    case 'or':
      return or(...node.children.map((child, idx) => generateWhereClause(child, index + idx + 1)))
  }
}
