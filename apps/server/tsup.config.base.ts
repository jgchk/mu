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
    build.onLoad({ filter: /.*/ }, ({ path: filePath }) => {
      let contents = fs.readFileSync(filePath, 'utf8')
      let loader = path.extname(filePath).substring(1)
      if (loader === 'mjs') {
        loader = 'js'
      }
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
  entry: ['src/server.ts'],
  format: ['esm'],
  platform: 'node',
  noExternal: ['trpc', 'downloader', 'db', 'music-metadata', 'soundcloud', 'spotify', 'last-fm'],
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
}

export default config
