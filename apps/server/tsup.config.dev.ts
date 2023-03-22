import { defineConfig } from 'tsup'

import baseConfig from './tsup.config.base'

export default defineConfig({
  ...baseConfig,
  watch: [
    'src',
    '../../packages/trpc',
    '../../packages/downloader',
    '../../packages/db',
    '../../packages/music-metadata',
    '../../packages/spotify',
    '../../packages/soundcloud',
  ],
  ignoreWatch: [
    '../../**/node_modules/**/*',
    '../../**/.turbo/**/*',
    '../../packages/spotify/downloader/**/*',
    '../../packages/spotify/credentials_cache/**/*',
  ],
  onSuccess: 'node dist/server.js',
})
