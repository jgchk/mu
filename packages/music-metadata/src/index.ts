import { execa } from 'execa'
import path from 'path'
import { z } from 'zod'

export * from './utils/dependencies'

const SCRIPTS_DIR = path.join(__dirname, './scripts')

export type Metadata = z.infer<typeof Metadata>
export const Metadata = z.object({
  title: z.string().nullable(),
  artists: z.string().array(),
  album: z.string().nullable(),
  albumArtists: z.string().array(),
  trackNumber: z.string().nullable(),
})

export const writeTrackMetadata = async (filePath: string, metadata: Metadata) => {
  await execa('python3', [
    path.join(SCRIPTS_DIR, 'write-metadata.py'),
    filePath,
    JSON.stringify(metadata),
  ])
}

export const readTrackMetadata = async (filePath: string): Promise<Metadata | undefined> => {
  const { stdout } = await execa('python3', [path.join(SCRIPTS_DIR, 'read-metadata.py'), filePath])

  if (stdout === 'No metadata found') {
    return undefined
  }

  return Metadata.parse(JSON.parse(stdout))
}

export const writeTrackCoverArt = async (filePath: string, coverArt: Buffer) => {
  await execa('python3', [path.join(SCRIPTS_DIR, 'write-cover-art.py'), filePath], {
    input: coverArt,
    encoding: null,
  })
}

export const readTrackCoverArt = async (filePath: string): Promise<Buffer | undefined> => {
  const { stdout } = await execa(
    'python3',
    [path.join(SCRIPTS_DIR, 'read-cover-art.py'), filePath],
    {
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
