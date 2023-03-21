import { execa } from 'execa';
import got from 'got';
import path from 'path';
import stream from 'stream';
import { z } from 'zod';

import {
  AuthResponse,
  FullAlbum,
  FullTrack,
  Pager,
  SimplifiedAlbum,
  SimplifiedTrack
} from './model';

export * from './model';

const CREDENTIALS_CACHE_PATH = path.join(__dirname, '../credentials_cache');

export class Spotify {
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;
  devMode: boolean;

  constructor({
    username,
    password,
    clientId,
    clientSecret,
    devMode = false
  }: {
    username: string;
    password: string;
    clientId: string;
    clientSecret: string;
    devMode?: boolean;
  }) {
    this.username = username;
    this.password = password;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.devMode = devMode;
    console.log({ devMode });
  }

  async getAccessToken() {
    const res = await got
      .post('https://accounts.spotify.com/api/token', {
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
            'base64'
          )}`
        },
        form: { grant_type: 'client_credentials' }
      })
      .json()
      .then((res) => AuthResponse.parse(res));
    return res.access_token;
  }

  async getTrack(trackId: string) {
    const token = await this.getAccessToken();
    const res = await got
      .get(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .json()
      .then((res) => FullTrack.parse(res));
    return res;
  }

  async getAlbum(albumId: string) {
    const token = await this.getAccessToken();
    const res = await got
      .get(`https://api.spotify.com/v1/albums/${albumId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .json()
      .then((res) => FullAlbum.parse(res));
    return res;
  }

  async getAlbumTracks(albumId: string) {
    const token = await this.getAccessToken();

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
  }

  async search<T extends SearchType[]>(query: string, types: T): Promise<SearchResults<T>> {
    const token = await this.getAccessToken();
    const res = await got
      .get('https://api.spotify.com/v1/search', {
        searchParams: {
          q: query,
          type: types.join(',')
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .json();

    const parser = z.object({
      tracks: types.includes('track') ? Pager(FullTrack) : z.undefined(),
      albums: types.includes('album') ? Pager(SimplifiedAlbum) : z.undefined()
    });

    const parsed = parser.parse(res);
    return parsed as SearchResults<T>;
  }

  downloadTrack(trackId: string) {
    const scriptPath = this.devMode
      ? path.join(__dirname, '../downloader/target/debug/spotify-download')
      : path.join(__dirname, '../downloader/target/release/spotify-download');
    const res = execa(
      scriptPath,
      [
        '--username',
        this.username,
        '--password',
        this.password,
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
  }

  static parseUri(uri: string): SpotifyId {
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
  }
}

export type SpotifyId = {
  kind: string;
  id: string;
};

export type SearchType = 'track' | 'album';
export type SearchResults<T extends SearchType[]> = {
  [K in T[number] as `${K}s`]: K extends 'track' ? Pager<FullTrack> : Pager<SimplifiedAlbum>;
};
