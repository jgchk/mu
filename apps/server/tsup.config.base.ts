import fs from 'fs'
import path from 'path'
import type { Options } from 'tsup'

type Plugin = NonNullable<Options['esbuildPlugins']>[number]
type Loader = NonNullable<
  NonNullable<
    Awaited<ReturnType<Parameters<Parameters<Plugin['setup']>[0]['onLoad']>[1]>>
  >['loader']
>

const dirnamePlugin: Plugin = {
  name: 'dirname',

  setup(build) {
    build.onLoad({ filter: /.*/ }, ({ path: absoluteFilePath }) => {
      let contents = fs.readFileSync(absoluteFilePath, 'utf8')
      let loader = path.extname(absoluteFilePath).substring(1)
      if (loader === 'mjs') {
        loader = 'js'
      }

      const filePath = path.relative(__dirname, absoluteFilePath)
      const dirname = path.dirname(filePath)

      contents = contents
        .replaceAll('__dirname', `"${dirname}"`)
        .replaceAll('__filename', `"${filePath}"`)
      return {
        contents,
        loader: loader as Loader,
      }
    })
  },
}

const config: Options = {
  entry: ['src/server.ts', 'src/jobs/*.ts'],
  format: ['esm'],
  platform: 'node',
  noExternal: [
    'context',
    'db',
    'downloader',
    'duckduckgo',
    'env',
    'image-manager',
    'last-fm',
    'log',
    'music-metadata',
    'musicbrainz',
    'soundcloud',
    'spotify',
    'trpc',
    'utils',
  ],
  esbuildOptions(options) {
    options.banner = {
      ...options.banner,
      js: `
        import { createRequire } from 'module';
        const require = createRequire(import.meta.url);
      `,
    }
  },
  esbuildPlugins: [dirnamePlugin],
  clean: true,
}

export default config
