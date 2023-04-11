import { execa } from 'execa'
import path from 'path'
import { z } from 'zod'

export * from './dependencies'

export type Metadata = z.infer<typeof Metadata>
export const Metadata = z.object({
  title: z.string().nullable(),
  artists: z.string().array(),
  album: z.string().nullable(),
  albumArtists: z.string().array(),
  track: z.number().nullable(),
})

export type ReadMetadata = z.infer<typeof ReadMetadata>
export const ReadMetadata = Metadata.extend({
  length: z.number(),
})

export const writeTrackMetadata = async (
  filePath: string,
  metadata: Partial<Metadata>
): Promise<ReadMetadata> => {
  const metadataArgs = []
  if (metadata.title !== null && metadata.title !== undefined) {
    metadataArgs.push('--title', metadata.title)
  }
  if (metadata.artists !== undefined && metadata.artists.length > 0) {
    metadataArgs.push('--artists', ...metadata.artists)
  }
  if (metadata.album !== null && metadata.album !== undefined) {
    metadataArgs.push('--album', metadata.album)
  }
  if (metadata.albumArtists !== undefined && metadata.albumArtists.length > 0) {
    metadataArgs.push('--album-artists', ...metadata.albumArtists)
  }
  if (metadata.track !== null && metadata.track !== undefined) {
    metadataArgs.push('--track', metadata.track.toString())
  }
  const { stdout } = await execa(
    'python3',
    ['-m', 'metadata', 'write', path.resolve(filePath), ...metadataArgs],
    {
      cwd: __dirname,
    }
  )
  return ReadMetadata.parse(JSON.parse(stdout))
}

export const readTrackMetadata = async (filePath: string): Promise<ReadMetadata> => {
  const { stdout } = await execa('python3', ['-m', 'metadata', 'read', path.resolve(filePath)], {
    cwd: __dirname,
  })
  return ReadMetadata.parse(JSON.parse(stdout))
}

export const writeTrackCoverArt = async (filePath: string, coverArt: Buffer) => {
  await execa('python3', ['-m', 'metadata', 'write-cover', path.resolve(filePath)], {
    cwd: __dirname,
    input: coverArt,
    encoding: null,
  })
}

export const readTrackCoverArt = async (filePath: string): Promise<Buffer | undefined> => {
  const { stdout } = await execa(
    'python3',
    ['-m', 'metadata', 'read-cover', path.resolve(filePath)],
    {
      cwd: __dirname,
      encoding: null,
    }
  )

  if (stdout.toString() === 'No cover art found') {
    return undefined
  }

  return stdout
}

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
