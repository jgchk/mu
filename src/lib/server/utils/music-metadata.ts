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

  if (fileInfo.startsWith('FLAC')) {
    return parseFlacMetadata(tags)
  } else if (fileInfo.startsWith('MPEG 1 layer 3')) {
    return parseMp3Metadata(tags)
  } else {
    return undefined
  }
}

const parseMp3Metadata = async (lines: string[]) => {
  const metadata: Metadata = {}

  for (const line of lines) {
    const [tag, value] = line.split('=')
    if (tag === 'TIT2') {
      metadata.title = value
    }
  }

  return metadata
}

const parseFlacMetadata = async (lines: string[]) => {
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
