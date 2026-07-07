import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const exampleRoot = fileURLToPath(new URL('.', import.meta.url))
  const env = loadEnv(mode, exampleRoot, '')

  return {
    base: env.VITE_ADMIN_BASE || '/',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5300,
    },
  }
})
