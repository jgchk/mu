import crypto from 'crypto';
import { execa } from 'execa';
import { fileTypeStream } from 'file-type';
import fs from 'fs';
import gotDefault from 'got';
import os from 'os';
import path from 'path';
import stream from 'stream';

import { env } from './env';
import type { Transcoding } from './model';
import { DownloadResponse, FullTrack, Pager, Playlist, TranscodingResponse } from './model';
import { isDefined } from './utils/types';

export * from './model';

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
    .then((res) => Pager(FullTrack).parse(res))
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
    .then((res) => FullTrack.parse(res));

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

export type DownloadResult = { pipe: stream.Readable; extension: string };

export const downloadTrack = async (
  track: FullTrack,
  secretToken?: string
): Promise<DownloadResult> => {
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

const downloadOriginalFile = async (
  trackId: number,
  secretToken?: string
): Promise<DownloadResult> => {
  const url = await getTrackOriginalDownload(trackId, secretToken);

  const res = got.stream(url);
  const fts = await fileTypeStream(res);
  const extension = fts.fileType?.ext;
  if (!extension) {
    throw new Error('Could not determine file extension');
  }

  const output = new stream.PassThrough();
  fts.pipe(output);

  return { pipe: output, extension };
};

const downloadHls = async (track: FullTrack): Promise<DownloadResult> => {
  if (track.media.transcodings.length === 0) {
    throw new Error(`Track ${track.id} has no transcodings`);
  }

  const transcoding = track.media.transcodings.sort(compareTranscodings)[0];

  const url = await getTranscodingData(transcoding);

  const fileTypeMap = {
    aac_1_0: { muxer: 'mp4', extension: 'm4a' },
    mp3_1_0: { muxer: 'mp3', extension: 'mp3' },
    mp3_0_0: { muxer: 'mp3', extension: 'mp3' },
    opus_0_0: { muxer: 'ogg', extension: 'ogg' }
  };
  const fileTypeData = (
    fileTypeMap as Record<string, typeof fileTypeMap[keyof typeof fileTypeMap] | undefined>
  )[transcoding.preset];
  if (!fileTypeData) {
    throw new Error(`Unsupported preset ${transcoding.preset}`);
  }
  const { extension } = fileTypeData;

  const tempFile = path.join(
    os.tmpdir(),
    `sc-${track.id}-${Date.now()}-${crypto.randomBytes(4).readUInt32LE(0)}.${extension}`
  );

  try {
    await execa('ffmpeg', [
      '-headers',
      `Authorization: OAuth ${env.SOUNDCLOUD_AUTH_TOKEN}`,
      '-i',
      url,
      '-c',
      'copy',
      '-loglevel',
      'error',
      tempFile
    ]);
  } catch (e) {
    await fs.promises.rm(tempFile);
    throw e;
  }

  const readPipe = fs.createReadStream(tempFile);
  readPipe.on('close', () => {
    void fs.promises.rm(tempFile);
  });

  return { pipe: readPipe, extension };
};

/**
 * aac_1_0: MP4 257kbps
 * mp3_1_0: MP3 128kbps
 * mp3_0_1: MP3 128kbps
 * mp3_0_0: MP3 128kbps
 * opus_0_0: Opus 65kbps
 */
const compareTranscodings = (a: Transcoding, b: Transcoding) => {
  const order = ['aac_1_0', 'mp3_1_0', 'mp3_0_1', 'mp3_0_0', 'opus_0_0'];
  return order.indexOf(a.preset) - order.indexOf(b.preset);
};

const getTranscodingData = async (transcoding: Transcoding) => {
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
