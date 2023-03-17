import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [sveltekit()],
  server: {
    port: process.env.DEV_PORT,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.SERVER_PORT}`,
        changeOrigin: true,
      }
    }
  }
};

export default config;
