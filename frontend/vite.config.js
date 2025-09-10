import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import prismjs from 'vite-plugin-prismjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    prismjs({
      languages: ['yaml', 'css'],
      plugins: ['line-numbers'],
      theme: 'twilight',
      css: true,
    }),
  ],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
