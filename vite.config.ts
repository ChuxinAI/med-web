import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const defaultPort = mode === 'online' ? 8100 : 5174
  const envPort = Number(env.VITE_DEV_PORT || env.PORT)
  const port = Number.isFinite(envPort) && envPort > 0 ? envPort : defaultPort

  return {
    plugins: [react()],
    server: {
      host: true,
      port,
    },
  }
})
