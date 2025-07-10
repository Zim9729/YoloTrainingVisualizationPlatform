import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ["prismjs", {
      "languages": ["yaml", "css"],
      "plugins": ["line-numbers"],
      "theme": "twilight",
      "css": true
    }]
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
