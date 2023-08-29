import { makeDb } from 'context'
import type { Artist, InsertTrack, Release } from 'db'
import { inArray, trackArtists, tracks } from 'db'
import { env } from 'env'
import { fileTypeFromFile } from 'file-type'
import fs from 'fs/promises'
import { ImageManager } from 'image-manager'
import { log } from 'log'
import type { Metadata } from 'music-metadata'
import { readTrackMetadata } from 'music-metadata'
import path from 'path'
import { chunk, isAudio, isFulfillfed, isRejected } from 'utils'
import { dirExists, walkDir } from 'utils/node'
import { parentPort } from 'worker_threads'

import { getCoverArtImage } from '../utils'

const db = makeDb()
const imageManager = new ImageManager({ imagesDir: env.IMAGES_DIR, db })

const main = async () => {
  const filePaths: string[] = []
  for await (const filePath of walkDir(env.MUSIC_DIR)) {
    filePaths.push(filePath)
  }

  const audioFilePaths = (
    await Promise.all(
      filePaths.map(async (filePath) => {
        const fileType = await fileTypeFromFile(filePath)
        const isAudioFile = fileType !== undefined && isAudio(fileType.mime)
        return [filePath, isAudioFile] as const
      })
    )
  )
    .filter(([, isAudioFile]) => isAudioFile)
    .map(([filePath]) => filePath)

  const BATCH_SIZE = 100
  const batchedAudioFilePaths = chunk(audioFilePaths, BATCH_SIZE)

  let successes = 0
  let rejections = 0
  for (const [i, batch] of batchedAudioFilePaths.entries()) {
    log.info(`Starting batch ${i + 1} of ${batchedAudioFilePaths.length}`)
    const results = await handleFileBatch(batch)
    log.info(`Batch ${i + 1} of ${batchedAudioFilePaths.length} complete`)
    successes += results.successes.length
    rejections += results.rejections.length
  }

  log.info(`Imported ${successes} tracks`)
  log.info(`Skipped ${filePaths.length - audioFilePaths.length} non-audio files`)
  log.info(`Encountered ${rejections} errors`)
}

const handleFileBatch = async (filePaths: string[]) => {
  const existingTracks = db.db.query.tracks.findMany({
    where: inArray(tracks.path, filePaths),
  })
  const existingFilePaths = new Set(existingTracks.map((t) => t.path))
  const newFilePaths = filePaths.filter((filePath) => !existingFilePaths.has(filePath))

  const promiseResults = await Promise.allSettled(
    newFilePaths.map(async (filePath) => {
      const [metadata, image] = await Promise.all([
        readTrackMetadata(filePath),
        getCoverArtImage(imageManager, filePath),
      ])

      const albumArtists = metadata.albumArtists.map((name) => getArtist(name))
      const artists = metadata.artists.map((name) => getArtist(name))
      const albumTitle = getAlbumTitle(metadata, filePath)
      const release = getRelease(
        albumTitle,
        albumArtists.map((a) => a.id)
      )

      const order = await getOrder(metadata, filePath)

      const insertTrack: InsertTrack = {
        title: metadata.title,
        path: filePath,
        releaseId: release.id,
        order,
        imageId: image?.id,
        duration: metadata.length,
        favorite: false,
      }

      return {
        track: insertTrack,
        artistIds: artists.map((artist) => artist.id),
      }
    })
  )

  const insertTracksData = promiseResults.filter(isFulfillfed).map((p) => p.value)
  const rejections = promiseResults.filter(isRejected)

  if (insertTracksData.length > 0) {
    const dbTracks = db.db
      .insert(tracks)
      .values(insertTracksData.map((i) => i.track))
      .returning({ id: tracks.id })
      .all()

    const trackArtistsData = dbTracks.flatMap((dbTrack, i) =>
      insertTracksData[i].artistIds.map((artistId, order) => ({
        trackId: dbTrack.id,
        artistId,
        order,
      }))
    )

    if (trackArtistsData.length > 0) {
      db.db.insert(trackArtists).values(trackArtistsData)
    }
  }

  return { successes: insertTracksData, rejections }
}

const cache = {
  artists: new Map<string, Artist>(),
  releases: new Map<string, Release>(),
}

const getArtist = (name: string) => {
  let existingArtist = cache.artists.get(name.toLowerCase())

  if (existingArtist) {
    return existingArtist
  }

  existingArtist = db.artists.getByNameCaseInsensitive(name).at(0)
  if (existingArtist) {
    cache.artists.set(name.toLowerCase(), existingArtist)
    return existingArtist
  }

  const newArtist = db.artists.insert({ name })
  cache.artists.set(name.toLowerCase(), newArtist)
  return newArtist
}

const getRelease = (title: string, albumArtists: number[]) => {
  const cacheKey = title.toLowerCase() + albumArtists.join(',')
  let existingRelease = cache.releases.get(cacheKey)

  if (existingRelease) {
    return existingRelease
  }

  existingRelease = db.releases.findByTitleCaseInsensitiveAndArtists(title, albumArtists)
  if (existingRelease) {
    cache.releases.set(cacheKey, existingRelease)
    return existingRelease
  }

  const newRelease = db.releases.insert({ title })
  db.releaseArtists.insertManyByReleaseId(newRelease.id, albumArtists)
  cache.releases.set(cacheKey, newRelease)
  return newRelease
}

const getAlbumTitle = (metadata: Metadata, filePath: string) => {
  if (metadata.album !== null) {
    return metadata.album
  }

  const dirPath = path.dirname(filePath)
  const dirName = path.basename(dirPath)
  return dirName
}

const getOrder = async (metadata: Metadata, filePath: string) => {
  if (metadata.track !== null) {
    return metadata.track
  }

  // get file number in directory
  const dirPath = path.dirname(filePath)
  const dirFiles = await fs.readdir(dirPath)
  const dirFilesSorted = dirFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  const fileIndex = dirFilesSorted.indexOf(path.basename(filePath))
  return fileIndex
}

if (!(await dirExists(env.MUSIC_DIR))) {
  process.exit(0)
}

await main()

// signal to parent that the job is done
if (parentPort) {
  parentPort.postMessage('done')
} else {
  process.exit(0)
}
