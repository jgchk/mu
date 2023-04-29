import { sveltekit } from '@sveltejs/kit/vite';

process.env.VITE_SERVER_HOST = process.env.SERVER_HOST;
process.env.VITE_SERVER_PORT = process.env.SERVER_PORT;
process.env.VITE_WS_PORT = process.env.WS_PORT;

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
  },
};

export default config;
