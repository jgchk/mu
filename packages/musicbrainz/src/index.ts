import got from 'got'

import { version } from '../package.json'
import { Images, SearchReleaseResults } from './model'

const USER_AGENT = `jgchk-mu/${version} ( jake@f-m.fm )`

export const searchRelease = async (query: string) => {
  const res = await got(`http://musicbrainz.org/ws/2/release`, {
    searchParams: { query: `release:${query}` },
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  }).json()
  return SearchReleaseResults.parse(res).releases
}

export const getCoverArt = async (mbid: string) => {
  const res = await got(`http://coverartarchive.org/release/${mbid}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  }).json()
  return Images.parse(res).images
}

export const getFrontCoverArt = (mbid: string) =>
  got(`http://coverartarchive.org/release/${mbid}/front`, {
    headers: { 'User-Agent': USER_AGENT },
  }).buffer()
