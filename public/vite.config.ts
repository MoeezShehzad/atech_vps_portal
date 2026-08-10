import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true, // Optional: forces Vite to fail if port 5174 is busy instead of auto-incrementing
  },
});