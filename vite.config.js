import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  build: {
    outDir: 'docs',
  },
  resolve: {
    alias: {
      'mqtt': 'mqtt/dist/mqtt.min.js'
    }
  }
});
