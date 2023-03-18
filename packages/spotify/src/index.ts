import { execa } from 'execa';
import path from 'path';
import stream from 'stream';

import { env } from './env';

const SCRIPT_PATH =
  env.NODE_ENV === 'development'
    ? path.join(__dirname, '../downloader/target/debug/spotify-download')
    : path.join(__dirname, '../downloader/target/release/spotify-download');

const CREDENTIALS_CACHE_PATH = path.join(__dirname, '../credentials_cache');

export const downloadSpotifyTrack = (url: string) => {
  const res = execa(
    SCRIPT_PATH,
    [
      '--client-id',
      env.SPOTIFY_CLIENT_ID,
      '--client-secret',
      env.SPOTIFY_CLIENT_SECRET,
      '--username',
      env.SPOTIFY_USERNAME,
      '--password',
      env.SPOTIFY_PASSWORD,
      '--credentials-cache',
      CREDENTIALS_CACHE_PATH,
      url
    ],
    { encoding: null }
  );
  const piper = res.pipeStdout?.bind(res);
  if (!piper) {
    throw new Error('No stdout pipe');
  }

  const pipe = new stream.PassThrough();
  void piper(pipe);

  return pipe;
};
