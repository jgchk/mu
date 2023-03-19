import { execa } from 'execa';
import got from 'got';
import path from 'path';
import stream from 'stream';
import { z } from 'zod';

import { env } from './env';
import {
  FullAlbum,
  FullTrack,
  Pager,
  SearchTracks,
  SearchTracksAndAlbums,
  SimplifiedTrack
} from './model';

const SCRIPT_PATH =
  env.NODE_ENV === 'development'
    ? path.join(__dirname, '../downloader/target/debug/spotify-download')
    : path.join(__dirname, '../downloader/target/release/spotify-download');

const CREDENTIALS_CACHE_PATH = path.join(__dirname, '../credentials_cache');

export const downloadSpotifyTrack = (trackId: string) => {
  const res = execa(
    SCRIPT_PATH,
    [
      '--username',
      env.SPOTIFY_USERNAME,
      '--password',
      env.SPOTIFY_PASSWORD,
      '--credentials-cache',
      CREDENTIALS_CACHE_PATH,
      trackId
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

const SpotifyAuthorizationResponse = z.object({
  access_token: z.string()
});

export const getAccessToken = async () => {
  const res = await got
    .post('https://accounts.spotify.com/api/token', {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      form: { grant_type: 'client_credentials' }
    })
    .json()
    .then((res) => SpotifyAuthorizationResponse.parse(res));

  return res.access_token;
};

type SpotifyId = {
  kind: string;
  id: string;
};

export const parseUri = (uri: string): SpotifyId => {
  if (uri.startsWith('spotify:')) {
    const splitUri = uri.split(':');
    if (splitUri.length < 3) {
      throw new Error('Invalid Spotify URI');
    }
    return {
      kind: splitUri[1],
      id: splitUri[2]
    };
  }

  const url = new URL(uri);
  if (url.host !== 'open.spotify.com') {
    throw new Error('Invalid Spotify URL');
  }

  const path = url.pathname.split('/');
  if (path.length < 2) {
    throw new Error('Invalid Spotify URL');
  }

  return {
    kind: path[1],
    id: path[2]
  };
};

export const getSpotifyTrack = async (trackId: string) => {
  const token = await getAccessToken();
  const res = await got
    .get(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .json()
    .then((res) => FullTrack.parse(res));
  return res;
};

export const getSpotifyAlbum = async (albumId: string) => {
  const token = await getAccessToken();
  const res = await got
    .get(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .json()
    .then((res) => FullAlbum.parse(res));
  return res;
};

export const getSpotifyAlbumTracks = async (albumId: string) => {
  const token = await getAccessToken();

  const results: SimplifiedTrack[] = [];

  let next: string | null = `https://api.spotify.com/v1/albums/${albumId}/tracks`;
  while (next) {
    const res: Pager<SimplifiedTrack> = await got
      .get(next, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .json()
      .then((res) => Pager(SimplifiedTrack).parse(res));
    results.push(...res.items);
    next = res.next;
  }

  return results;
};

export const searchTracks = async (query: string) => {
  const token = await getAccessToken();
  const res = await got
    .get('https://api.spotify.com/v1/search', {
      searchParams: {
        q: query,
        type: 'track'
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .json()
    .then((res) => SearchTracks.parse(res));
  return res.tracks.items;
};

export const searchTracksAndAlbums = async (query: string) => {
  const token = await getAccessToken();
  const res = await got
    .get('https://api.spotify.com/v1/search', {
      searchParams: {
        q: query,
        type: 'track,album'
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .json()
    .then((res) => SearchTracksAndAlbums.parse(res));
  return res;
};
