import { eq } from 'drizzle-orm/expressions';

import { db } from '..';
import { artists, type InsertTrackArtist, type TrackArtist, trackArtists } from '../schema';

export const insertTrackArtists = (trackArtists_: InsertTrackArtist[]) =>
  db
    .insert(trackArtists)
    .values(...trackArtists_)
    .returning()
    .get();

export const getTrackArtistsByTrackId = (trackId: TrackArtist['trackId']) =>
  db.select().from(trackArtists).where(eq(trackArtists.trackId, trackId)).all();

export const getArtistsByTrackId = (trackId: TrackArtist['trackId']) => {
  const results = db
    .select()
    .from(trackArtists)
    .innerJoin(artists, eq(trackArtists.artistId, artists.id))
    .where(eq(trackArtists.trackId, trackId))
    .all();
  return results.map((result) => ({ ...result.artists, order: result.track_artists.order }));
};

export const deleteTrackArtistsByTrackId = (trackId: TrackArtist['trackId']) =>
  db.delete(trackArtists).where(eq(trackArtists.trackId, trackId)).run();
