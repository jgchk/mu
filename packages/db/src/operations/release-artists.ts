import { eq } from 'drizzle-orm/expressions';
import { db } from '..';

import { artists, type InsertReleaseArtist, type ReleaseArtist, releaseArtists } from '../schema';

export const insertReleaseArtists = (releaseArtists_: InsertReleaseArtist[]) =>
  db
    .insert(releaseArtists)
    .values(...releaseArtists_)
    .returning()
    .get();

export const getReleaseArtistsByReleaseId = (releaseId: ReleaseArtist['releaseId']) =>
  db.select().from(releaseArtists).where(eq(releaseArtists.releaseId, releaseId)).all();

export const getArtistsByReleaseId = (releaseId: ReleaseArtist['releaseId']) => {
  const results = db
    .select()
    .from(releaseArtists)
    .innerJoin(artists, eq(releaseArtists.artistId, artists.id))
    .where(eq(releaseArtists.releaseId, releaseId))
    .all();
  return results.map((result) => ({ ...result.artists, order: result.release_artists.order }));
};

export const deleteReleaseArtistsByReleaseId = (releaseId: ReleaseArtist['releaseId']) =>
  db.delete(releaseArtists).where(eq(releaseArtists.releaseId, releaseId)).run();
