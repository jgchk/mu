import type { Artist } from 'db'
import { env } from 'env'
import { fileTypeFromFile } from 'file-type'
import fs from 'fs/promises'
import { ImageManager } from 'image-manager'
import { log } from 'log'
import type { Metadata } from 'music-metadata'
import { readTrackCoverArt, readTrackMetadata } from 'music-metadata'
import path from 'path'
import { makeDb, makeLastFm } from 'services'
import { isAudio, tryOr } from 'utils'
import { dirExists, fileExists, walkDir } from 'utils/node'

const musicDir = env.MUSIC_DIR
const imagesDir = env.IMAGES_DIR

const musicDirExists = await dirExists(musicDir)
if (!musicDirExists) {
  process.exit(0)
}

const db = makeDb()

const config = db.config.get()

const lfm = config.lastFmKey
  ? await makeLastFm({
      apiKey: config.lastFmKey,
      username: config.lastFmUsername,
      password: config.lastFmPassword,
      apiSecret: config.lastFmSecret,
    })
  : undefined

const imageManager = new ImageManager({ imagesDir, db })

const promises: Promise<boolean>[] = []
for await (const filePath of walkDir(musicDir)) {
  promises.push(handleFile(filePath))
}
const results = await Promise.all(promises)
const imported = results.filter(Boolean).length
log.info(`Imported ${imported} tracks`)

async function handleFile(filePath_: string) {
  const filePath = path.resolve(filePath_)
  const fileType = await fileTypeFromFile(filePath)
  if (!fileType || !isAudio(fileType.mime)) return false

  const existingTrack = db.tracks.getByPath(filePath)
  if (existingTrack) return false

  const metadata = await readTrackMetadata(filePath)
  const image = await getCoverArtImage(filePath)

  const albumArtists = metadata.albumArtists.map((name) => getArtist(name))
  const artists = metadata.artists.map((name) => getArtist(name))
  const albumTitle = getAlbumTitle(metadata, filePath)
  const release = getRelease(
    albumTitle,
    albumArtists.map((a) => a.id)
  )
  const order = await getOrder(metadata, filePath)
  const favorite = await getFavorite(metadata.title, artists)

  const dbTrack = db.tracks.insert({
    title: metadata.title,
    path: filePath,
    releaseId: release.id,
    order,
    imageId: image?.id,
    duration: metadata.length,
    favorite,
  })
  db.trackArtists.insertManyByTrackId(
    dbTrack.id,
    artists.map((a) => a.id)
  )

  return true
}

async function getCoverArtImage(filePath: string) {
  // check for embedded art
  const embeddedArt = await readTrackCoverArt(filePath)
  if (embeddedArt) {
    return imageManager.getImage(embeddedArt)
  }

  // check for art in the same directory
  const dirPath = path.dirname(filePath)

  const fileNames = ['cover', 'folder', 'album', 'front']
  const fileExtensions = ['jpg', 'jpeg', 'png', 'gif']

  const filePaths = fileNames.flatMap((fileName) =>
    fileExtensions.map((fileExtension) => path.join(dirPath, `${fileName}.${fileExtension}`))
  )

  const image = await tryOr(
    () =>
      Promise.any(
        filePaths.map(async (filePath) => {
          const exists = await fileExists(filePath)
          if (!exists) {
            throw new Error('No album art found')
          }

          return imageManager.getImageFromFile(filePath)
        })
      ),
    undefined
  )

  return image
}

function getArtist(name: string) {
  const existingArtist = db.artists.getByNameCaseInsensitive(name).at(0)
  if (existingArtist) {
    return existingArtist
  }

  const newArtist = db.artists.insert({ name })
  return newArtist
}

function getRelease(title: string, albumArtists: number[]) {
  const existingRelease = db.releases.findByTitleCaseInsensitiveAndArtists(title, albumArtists)
  if (existingRelease) {
    return existingRelease
  }

  const newRelease = db.releases.insert({ title })
  db.releaseArtists.insertManyByReleaseId(newRelease.id, albumArtists)
  return newRelease
}

function getAlbumTitle(metadata: Metadata, filePath: string) {
  if (metadata.album !== null) {
    return metadata.album
  }

  const dirPath = path.dirname(filePath)
  const dirName = path.basename(dirPath)
  return dirName
}

async function getOrder(metadata: Metadata, filePath: string) {
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

async function getFavorite(title: string | null, artists: Artist[]): Promise<boolean> {
  if (lfm?.status !== 'logged-in') return false
  if (title === null) return false
  if (artists.length === 0) return false

  try {
    return lfm.getLovedTrack({
      track: title,
      artist: artists.map((a) => a.name).join(', '),
    })
  } catch {
    return false
  }
}
