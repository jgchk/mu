import { makeDb, makeLastFm } from 'context'
import type { Artist } from 'db'
import { distance } from 'fastest-levenshtein'
import { log } from 'log'
import { groupBy, toErrorString } from 'utils'
import { parentPort } from 'worker_threads'

const db = makeDb()
const config = db.config.get()

if (!config.lastFmKey) {
  throw new Error('Last.fm API key is not configured')
}

const lfm = await makeLastFm({
  apiKey: config.lastFmKey,
  username: config.lastFmUsername,
  password: config.lastFmPassword,
  apiSecret: config.lastFmSecret,
})

if (lfm.status === 'stopped') {
  throw new Error('Last.fm is not running')
} else if (lfm.status === 'errored') {
  throw new Error(`Last.fm ran into an error: ${toErrorString(lfm.error)}`, { cause: lfm.error })
} else if (lfm.status === 'authenticating') {
  throw new Error('Last.fm is authenticating')
} else if (lfm.status === 'authenticated') {
  throw new Error('Last.fm is authenticated, but not logged in')
} else if (lfm.status === 'logging-in') {
  throw new Error('Last.fm is logging in')
} else if (lfm.status === 'degraded') {
  throw new Error(`Last.fm is authenticated, but login failed: ${toErrorString(lfm.error)}`)
}

log.debug('Fetching loved tracks...')
const lovedTracks = await lfm.getAllLovedTracks()
log.info(`Loved tracks: ${lovedTracks.length}`)

const groupedTracks = groupBy(lovedTracks, (track) => track.artist.mbid)

const tryMatchTrack = (dbArtists: Artist[], lfmTrack: (typeof lovedTracks)[number]) => {
  for (const dbArtist of dbArtists) {
    const dbTrack = db.tracks
      .getByArtistAndTitleCaseInsensitive(dbArtist.id, lfmTrack.name)
      .map((dbMatch) => ({
        dbMatch,
        distance: distance((dbMatch.title ?? '').toLowerCase(), lfmTrack.name.toLowerCase()),
      }))
      .sort((a, b) => a.distance - b.distance)
      .at(0)?.dbMatch

    if (!dbTrack) {
      continue
    }

    db.tracks.update(dbTrack.id, {
      favorite: true,
    })

    return true
  }

  return false
}

let numMatches = 0
for (const tracks of groupedTracks.values()) {
  const artist = tracks[0].artist

  const dbArtists = db.artists
    .getBySimilarName(artist.name)
    .map((dbMatch) => ({
      dbMatch,
      distance: distance(dbMatch.name.toLowerCase(), artist.name.toLowerCase()),
    }))
    .sort((a, b) => a.distance - b.distance)
    .map((a) => a.dbMatch)

  if (dbArtists.length === 0) {
    continue
  }

  for (const track of tracks) {
    const matched = tryMatchTrack(dbArtists, track)
    if (matched) {
      numMatches += 1
    }
  }
}

log.info(`Matches: ${numMatches}`)

// signal to parent that the job is done
if (parentPort) parentPort.postMessage('done')
else process.exit(0)
