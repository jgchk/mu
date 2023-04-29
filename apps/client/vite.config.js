import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [sveltekit()],
  server: {
    port: process.env.DEV_PORT,
    proxy: {
      '/api': {
        target: `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`,
        changeOrigin: true,
      }
    }
  }
};

export default config;
