import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/bt-prototype/',
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    // HMR: при dev из WSL и браузера на Windows websocket иногда падает → «Cannot read … send» в client.
    hmr: {
      host: 'localhost',
      port: 5173,
      clientPort: 5173,
      protocol: 'ws',
    },
    watch: {
      usePolling: true,
    },
  },
})
