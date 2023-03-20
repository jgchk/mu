import { execa } from 'execa';
import gotDefault from 'got';
import stream from 'stream';

import { env } from './env';
import type { Transcoding } from './model';
import { DownloadResponse, Pager, Playlist, Track, TranscodingResponse } from './model';
import { isDefined } from './utils/types';

const DEFAULT_HEADERS = {
  Authorization: `OAuth ${env.SOUNDCLOUD_AUTH_TOKEN}`
} as const;
const got = gotDefault.extend({
  headers: DEFAULT_HEADERS
});

const getScriptUrls = async () => {
  const response = await got('https://soundcloud.com').text();
  return [
    ...response.matchAll(
      /<script crossorigin src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[\da-z-]+\.js)"><\/script>/gm
    )
  ]
    .map((match) => match[1])
    .filter(isDefined);
};

const getClientIdFromScript = async (url: string) => {
  const response = await got(url).text();
  const clientIdMatch = /client_id:"([\dA-Za-z]+)"/.exec(response);
  if (!clientIdMatch) {
    throw new Error('Client ID not found');
  }
  return clientIdMatch[1];
};

export const getClientId = async () => {
  const scriptUrls = await getScriptUrls();
  return Promise.any(scriptUrls.map((url) => getClientIdFromScript(url)));
};

export const searchTracks = (query: string) =>
  got('https://api-v2.soundcloud.com/search/tracks', {
    searchParams: {
      q: query,
      client_id: env.SOUNDCLOUD_CLIENT_ID
    }
  })
    .json()
    .then((res) => Pager(Track).parse(res))
    .then((res) => res.collection);

export const searchAlbums = (query: string) =>
  got('https://api-v2.soundcloud.com/search/albums', {
    searchParams: {
      q: query,
      client_id: env.SOUNDCLOUD_CLIENT_ID
    }
  })
    .json()
    .then((res) => Pager(Playlist).parse(res))
    .then((res) => res.collection);

export const getTrack = (id: number) =>
  got(`https://api-v2.soundcloud.com/tracks/${id}`, {
    searchParams: {
      client_id: env.SOUNDCLOUD_CLIENT_ID
    }
  })
    .json()
    .then((res) => Track.parse(res));

export const getPlaylist = (id: number) =>
  got(`https://api-v2.soundcloud.com/playlists/${id}`, {
    searchParams: {
      client_id: env.SOUNDCLOUD_CLIENT_ID
    }
  })
    .json()
    .then((res) => Playlist.parse(res));

export const soundcloudImageSizes = [
  20,
  40,
  47,
  50,
  60,
  67,
  80,
  120,
  200,
  240,
  250,
  300,
  500,
  2480,
  3000,
  'original'
] as const;
export type SoundcloudImageSize = typeof soundcloudImageSizes[number];

export const soundcloudImageFormats = ['png', 'jpg'] as const;
export type SoundcloudImageFormat = typeof soundcloudImageFormats[number];

export const getSoundcloudImageUrl = (
  url: string,
  size: SoundcloudImageSize,
  extension?: SoundcloudImageFormat
) => {
  let output = url.replace('large', size === 'original' ? size : `t${size}x${size}`);
  if (extension !== undefined) {
    output = output.replace('.jpg', `.${extension}`);
  }
  return output;
};

export const getLargestAvailableImage = async (originalUrl: string) => {
  for (const size of soundcloudImageSizes.slice().reverse()) {
    for (const extension of soundcloudImageFormats) {
      try {
        const url = getSoundcloudImageUrl(originalUrl, size, extension);
        const res = await got(url).buffer();
        return res;
      } catch {
        // ignore, try next
      }
    }
  }
};

export const downloadTrack = async (track: Track, secretToken?: string) => {
  if (!track.streamable) {
    throw new Error('Track is not streamable');
  }

  if (track.policy === 'BLOCK') {
    throw new Error('Track is not available in your location');
  }

  const pipe = track.downloadable
    ? await downloadOriginalFile(track.id, secretToken)
    : await downloadHls(track);

  return pipe;
};

const downloadOriginalFile = async (trackId: number, secretToken?: string) => {
  const url = await getTrackOriginalDownload(trackId, secretToken);

  const output = new stream.PassThrough();

  const res = got.stream(url);
  res.pipe(output);

  return output;
};

const downloadHls = async (track: Track) => {
  if (track.media.transcodings.length === 0) {
    throw new Error(`Track ${track.id} has no transcodings`);
  }

  const transcoding = track.media.transcodings.sort(compareTranscodings)[0];

  const url = await getTranscodingMp3(transcoding);

  const res = execa(
    'ffmpeg',
    [
      '-headers',
      `Authorization: OAuth ${env.SOUNDCLOUD_AUTH_TOKEN}`,
      '-i',
      url,
      '-c',
      'copy',
      '-loglevel',
      'error',
      'pipe:1'
    ],
    { encoding: null }
  );
  const piper = res.pipeStdout?.bind(res);
  if (!piper) {
    throw new Error('Could not pipe stdout');
  }

  const pipe = new stream.PassThrough();
  void piper(pipe);

  return pipe;
};

/**
 * aac_1_0: MP4 257kbps
 * mp3_1_0: MP3 128kbps
 * mp3_0_0: MP3 128kbps
 * opus_0_0: Opus 65kbps
 */
const compareTranscodings = (a: Transcoding, b: Transcoding) => {
  const order = ['aac_1_0', 'mp3_1_0', 'mp3_0_0', 'opus_0_0'];
  return order.indexOf(a.preset) - order.indexOf(b.preset);
};

const getTranscodingMp3 = async (transcoding: Transcoding) => {
  const res = await got(transcoding.url, {
    searchParams: { client_id: env.SOUNDCLOUD_CLIENT_ID }
  })
    .json()
    .then((res) => TranscodingResponse.parse(res));
  return res.url;
};

const getTrackOriginalDownload = async (trackId: number, secretToken?: string) => {
  const result = await got(`https://api-v2.soundcloud.com/tracks/${trackId}/download`, {
    searchParams: {
      client_id: env.SOUNDCLOUD_CLIENT_ID,
      secret_token: secretToken
    }
  })
    .json()
    .then((res) => DownloadResponse.parse(res));

  return result.redirectUri;
};
