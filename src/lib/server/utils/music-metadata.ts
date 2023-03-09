import type { Track } from '../db/schema'
import { execa } from 'execa'

type Metadata = {
  title?: string
}

export const writeFile = async (path: string, metadata: Metadata) => {
  await execa('python', ['./scripts/write-metadata.py', path, JSON.stringify(metadata)])
}

export const parseFile = async (path: string): Promise<Metadata | undefined> => {
  const { stdout } = await execa('python', ['./scripts/read-metadata.py', path])

  if (stdout === 'No metadata found') {
    return undefined
  }

  const lines = stdout.split('\n')
  // const fileInfo = lines[0]
  const tags = lines.slice(1)

  const metadata: Metadata = {}

  for (const line of tags) {
    const [tag, value] = line.split('=')
    if (tag.toLowerCase() === 'title') {
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
