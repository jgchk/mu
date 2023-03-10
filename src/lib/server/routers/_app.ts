import untildify from 'untildify'
import { z } from 'zod'

import { fileExists, walkDir } from '$lib/utils/fs'

import { getArtistsByName, insertArtist } from '../db/operations/artists'
import {
  deleteTrackById,
  getAllTracks,
  getTrackWithArtistsByPath,
  insertTrack,
  updateTrackWithArtists,
} from '../db/operations/tracks'
import { env } from '../env'
import { search } from '../services/soundcloud'
import { publicProcedure, router } from '../trpc'
import { isMetadataChanged, parseFile } from '../utils/music-metadata'
import { artistsRouter } from './artists'
import { downloadsRouter } from './downloads'
import { tracksRouter } from './tracks'

export const appRouter = router({
  ping: publicProcedure.query(() => 'pong!'),
  tracks: tracksRouter,
  artists: artistsRouter,
  downloads: downloadsRouter,
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input: { query } }) => {
      const soundcloudResults = await search(query)
      return soundcloudResults
    }),
  sync: publicProcedure.mutation(async () => {
    const musicDir = untildify(env.MUSIC_DIR)

    const allExistingTracks = getAllTracks()
    await Promise.all(
      allExistingTracks.map(async (track) => {
        const exists = await fileExists(track.path)
        if (!exists) {
          deleteTrackById(track.id)
        }
      })
    )

    const tracks = []
    for await (const path of walkDir(musicDir)) {
      const metadata = await parseFile(path)

      // returns undefined if no metadata available
      if (!metadata) {
        continue
      }

      const existingTrack = getTrackWithArtistsByPath(path)
      if (existingTrack) {
        // check metadata for changes
        if (isMetadataChanged(existingTrack, metadata)) {
          // update the metadata in the db if the file metdata has changed

          // convert artist names to artist ids
          // - if artist with name exists, use that
          // - if not, create new artist
          const artists = metadata.artists.map((name) => {
            const matchingArtists = getArtistsByName(name)
            if (matchingArtists.length > 0) {
              return matchingArtists[0]
            } else {
              return insertArtist({ name })
            }
          })

          const updatedTrack = updateTrackWithArtists(existingTrack.id, {
            ...metadata,
            artists: artists.map((artist) => artist.id),
          })
          tracks.push(updatedTrack)
        } else {
          tracks.push(existingTrack)
        }
      } else {
        // add track to db
        tracks.push(insertTrack({ title: metadata.title, path }))
      }
    }

    return tracks
  }),
})

export type AppRouter = typeof appRouter
