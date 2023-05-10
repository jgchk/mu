import { defineConfig } from 'tsup'

import baseConfig from './tsup.config.base'

export default defineConfig({
  ...baseConfig,
  watch: [
    'src',
    '../../packages/context',
    '../../packages/db',
    '../../packages/downloader',
    '../../packages/env',
    '../../packages/image-manager',
    '../../packages/last-fm',
    '../../packages/log',
    '../../packages/music-metadata',
    '../../packages/soundcloud',
    '../../packages/spotify',
    '../../packages/trpc',
    '../../packages/utils',
  ],
  ignoreWatch: [
    '../../**/node_modules/**/*',
    '../../**/.turbo/**/*',
    '../../packages/spotify/downloader/**/*',
    '../../packages/spotify/credentials_cache/**/*',
    '../../packages/music-metadata/**/__pycache__',
    '../../packages/music-metadata/**/__pycache__/**/*',
  ],
  onSuccess: 'node dist/server.js',
})
