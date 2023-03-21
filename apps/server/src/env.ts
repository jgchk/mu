import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string(),
  DOWNLOAD_DIR: z.string(),
  SOUNDCLOUD_AUTH_TOKEN: z.string(),
  SOUNDCLOUD_CLIENT_ID: z.string()
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
