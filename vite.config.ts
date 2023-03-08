import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = getEnvironmentVariables(mode)
  const port = getPort(env)

  return {
    plugins: [sveltekit()],
    test: {
      include: ['src/**/*.{test,spec}.{js,ts}'],
    },
    server: { port },
    preview: { port },
    envPrefix: 'PUBLIC_',
  }
})

function getEnvironmentVariables(mode: string) {
  return { ...process.env, ...loadEnv(mode, process.cwd(), '') }
}

function getPort(envVars: Record<string, string | undefined>) {
  const rawPort = envVars.SERVER_PORT
  if (rawPort === undefined) {
    console.error('❌ Missing PORT environment variable')
    process.exit(1)
  }
  const port = parseInt(rawPort)
  if (isNaN(port)) {
    console.error('❌ Invalid PORT environment variable')
    process.exit(1)
  }
  return port
}
