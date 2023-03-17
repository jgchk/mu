import { eq } from 'drizzle-orm/expressions';

import { db } from '..';
import { artists, type InsertArtist } from '../schema';

export const insertArtist = (artist: InsertArtist) =>
  db.insert(artists).values(artist).returning().get();

export const getAllArtists = () => db.select().from(artists).all();

export const getArtistsByName = (name: string) =>
  db.select().from(artists).where(eq(artists.name, name)).all();
