import { execa } from 'execa';
import path from 'path';

const SCRIPTS_DIR = path.join(__dirname, './scripts');

export type Metadata = {
  title: string | undefined;
  artists: string[];
  album: string | undefined;
  albumArtists: string[];
  trackNumber: string | undefined;
};

export const writeTrackMetadata = async (filePath: string, metadata: Metadata) => {
  await execa('python3', [
    path.join(SCRIPTS_DIR, 'write-metadata.py'),
    filePath,
    JSON.stringify(metadata)
  ]);
};

export const readTrackMetadata = async (filePath: string): Promise<Metadata | undefined> => {
  const { stdout } = await execa('python3', [path.join(SCRIPTS_DIR, 'read-metadata.py'), filePath]);

  if (stdout === 'No metadata found') {
    return undefined;
  }

  const lines = stdout.split('\n');
  // const fileInfo = lines[0]
  const tags = lines.slice(1);

  const metadata: Metadata = {
    title: undefined,
    artists: [],
    album: undefined,
    albumArtists: [],
    trackNumber: undefined
  };

  for (const line of tags) {
    const [tag, value] = line.split('=');
    switch (tag.toLowerCase()) {
      case 'title': {
        metadata.title = value;
        break;
      }
      case 'artist': {
        metadata.artists = [...(metadata.artists ?? []), value];
        break;
      }
      case 'album': {
        metadata.album = value;
        break;
      }
      case 'albumartist': {
        metadata.albumArtists = [...(metadata.albumArtists ?? []), value];
        break;
      }
      case 'tracknumber': {
        metadata.trackNumber = value;
        break;
      }
    }
  }

  return metadata;
};

export const writeTrackCoverArt = async (filePath: string, coverArt: Buffer) => {
  await execa('python3', [path.join(SCRIPTS_DIR, 'write-cover-art.py'), filePath], {
    input: coverArt,
    encoding: null
  });
};

export const readTrackCoverArt = async (filePath: string): Promise<Buffer | undefined> => {
  const { stdout } = await execa(
    'python3',
    [path.join(SCRIPTS_DIR, 'read-cover-art.py'), filePath],
    {
      encoding: null
    }
  );

  if (stdout.toString() === 'No cover art found') {
    return undefined;
  }

  return stdout;
};

export const parseArtistTitle = (
  title_: string
): { title: string; artists: string[] | undefined } => {
  let artists: string[] | undefined = undefined;
  let title = title_;

  const dashes = [' - ', ' − ', ' – ', ' — ', ' ― '];
  for (const dash of dashes) {
    if (title.includes(dash)) {
      const artistTitle = title.split(dash);
      artists = [artistTitle[0].trim()];
      title = artistTitle.slice(1).join(dash).trim();
    }
  }

  return {
    title,
    artists
  };
};
