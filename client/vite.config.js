import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: '[https://footwear-api-sf29.onrender.com](https://footwear-api-sf29.onrender.com):5001',
        changeOrigin: true,
      },
    },
  },
});
