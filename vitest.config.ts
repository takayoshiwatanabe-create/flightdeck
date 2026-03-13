import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom', // Use 'jsdom' for React Native components
    setupFiles: ['./vitest.setup.ts'], // Path to your setup file
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'app/e2e'],
    alias: {
      '@/': resolve(__dirname, './') + '/', // Adjust if your root is different
    },
  },
});

