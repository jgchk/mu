import type { Track } from '../db/schema'
import { execa } from 'execa'

type Metadata = {
  title?: string
}

export const parseFile = async (path: string): Promise<Metadata | undefined> => {
  const { stdout } = await execa('python', ['./scripts/read-metadata.py', path])

  if (stdout === 'No metadata found') {
    return undefined
  }

  const lines = stdout.split('\n')
  const fileInfo = lines[0]
  const tags = lines.slice(1)

  if (fileInfo.startsWith('MPEG 1 layer 3')) {
    return parseId3Tags(tags)
  } else if (fileInfo.startsWith('FLAC') || fileInfo.startsWith('Ogg Vorbis')) {
    return parseVorbisTags(tags)
  } else {
    return undefined
  }
}

const parseId3Tags = async (lines: string[]) => {
  const metadata: Metadata = {}

  for (const line of lines) {
    const [tag, value] = line.split('=')
    if (tag === 'TIT2') {
      metadata.title = value
    }
  }

  return metadata
}

const parseVorbisTags = async (lines: string[]) => {
  const metadata: Metadata = {}

  for (const line of lines) {
    const [tag, value] = line.split('=')
    if (tag === 'TITLE') {
      metadata.title = value
    }
  }

  return metadata
}

export const isMetadataChanged = (track: Track, metadata: Metadata) => {
  if ((track.title ?? undefined) !== metadata.title) {
    return true
  }

  return false
}

export const getMetadataFromDatabaseTrack = (track: Track): Metadata => {
  return {
    title: track.title ?? undefined,
  }
}
