import { defineConfig } from 'tsup';

import baseConfig from './tsup.config.base';

export default defineConfig({
  ...baseConfig,
  watch: ['src', '../../packages/trpc', '../../packages/db', '../../packages/music-metadata'],
  ignoreWatch: ['../../**/node_modules/**/*', '../../**/.turbo/**/*'],
  onSuccess: 'node dist/server.js'
});
