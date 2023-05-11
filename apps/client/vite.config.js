import { sveltekit } from '@sveltejs/kit/vite'

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [sveltekit()],
  server: {
    host: process.env.SERVER_HOST,
    port: process.env.DEV_PORT,
    proxy: {
      '/api': {
        target: `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`,
        changeOrigin: true,
        ws: true,
      },
    },
  },
}

export default config
