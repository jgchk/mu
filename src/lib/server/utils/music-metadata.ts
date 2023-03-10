import { execa } from 'execa'

import { deepEquals } from '$lib/utils/types'

import type { TrackWithArtists } from '../db/operations/tracks'
import type { Artist, TrackArtist } from '../db/schema'

export type Metadata = {
  title: string | undefined
  artists: string[]
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

  const metadata: Metadata = {
    title: undefined,
    artists: [],
  }

  for (const line of tags) {
    const [tag, value] = line.split('=')
    switch (tag.toLowerCase()) {
      case 'title': {
        metadata.title = value
        break
      }
      case 'artist': {
        metadata.artists = [...(metadata.artists ?? []), value]
      }
    }
  }

  return metadata
}

export const isMetadataChanged = (track: TrackWithArtists, metadata: Metadata) => {
  const trackMetadata = getMetadataFromTrack(track)
  return !deepEquals(trackMetadata, metadata)
}

export const getMetadataFromTrack = (track: TrackWithArtists): Metadata => ({
  title: track.title ?? undefined,
  artists: track.artists.sort(compareArtists).map((artist) => artist.name),
})

type ComparableArtist = { order: TrackArtist['order']; name: Artist['name'] }
export const compareArtists = (a: ComparableArtist, b: ComparableArtist) =>
  a.order - b.order || a.name.localeCompare(b.name)

export const parseArtistTitle = (
  title_: string
): { title: string; artists: string[] | undefined } => {
  let artists: string[] | undefined = undefined
  let title = title_

  const dashes = [' - ', ' − ', ' – ', ' — ', ' ― ']
  for (const dash of dashes) {
    if (title.includes(dash)) {
      const artistTitle = title.split(dash)
      artists = [artistTitle[0].trim()]
      title = artistTitle.slice(1).join(dash).trim()
    }
  }

  return {
    title,
    artists,
  }
}
