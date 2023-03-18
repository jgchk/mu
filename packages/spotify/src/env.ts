import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']),
  SPOTIFY_CLIENT_ID: z.string(),
  SPOTIFY_CLIENT_SECRET: z.string(),
  SPOTIFY_USERNAME: z.string(),
  SPOTIFY_PASSWORD: z.string()
});

const envRes = envSchema.safeParse(process.env);

if (!envRes.success) {
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(envRes.error.format(), null, 4)
  );
  process.exit(1);
}

export const env = envRes.data;
