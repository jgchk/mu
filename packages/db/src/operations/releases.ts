import { eq } from 'drizzle-orm/expressions';
import { db } from '..';

import { type InsertRelease, type Release, type ReleaseArtist, releases } from '../schema';
import {
  deleteReleaseArtistsByReleaseId,
  getArtistsByReleaseId,
  insertReleaseArtists
} from './release-artists';

export const insertRelease = (release: InsertRelease) =>
  db.insert(releases).values(release).returning().get();

export const insertReleaseWithArtists = (
  data: InsertRelease & { artists?: ReleaseArtist['artistId'][] }
) => {
  const { artists: artistsData, ...releaseData } = data;
  const release = insertRelease(releaseData);
  if (artistsData !== undefined) {
    insertReleaseArtists(
      artistsData.map((artistId, order) => ({ releaseId: release.id, artistId, order }))
    );
  }
  const artists = getArtistsByReleaseId(release.id);
  return { ...release, artists };
};

export const updateRelease = (id: Release['id'], data: Partial<Omit<InsertRelease, 'id'>>) => {
  const update = {
    ...(data.title !== undefined ? { title: data.title } : {})
  };
  return db.update(releases).set(update).where(eq(releases.id, id)).returning().get();
};

export const updateReleaseWithArtists = (
  id: Release['id'],
  data: Partial<Omit<InsertRelease, 'id'>> & { artists?: ReleaseArtist['artistId'][] }
) => {
  const release = updateRelease(id, data);
  if (data.artists !== undefined) {
    deleteReleaseArtistsByReleaseId(id);
    insertReleaseArtists(
      data.artists.map((artistId, order) => ({ releaseId: id, artistId, order }))
    );
  }
  const artists = getArtistsByReleaseId(id);
  return { ...release, artists };
};

export const getAllReleases = () => db.select().from(releases).all();

export const getReleaseById = (id: Release['id']) =>
  db.select().from(releases).where(eq(releases.id, id)).get();

export type ReleaseWithArtists = ReturnType<typeof getReleaseWithArtistsById>;
export const getReleaseWithArtistsById = (id: Release['id']) => {
  const release = getReleaseById(id);
  const artists = getArtistsByReleaseId(id);
  return { ...release, artists };
};

export const deleteReleaseById = (id: number) =>
  db.delete(releases).where(eq(releases.id, id)).run();
