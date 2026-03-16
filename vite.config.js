import { defineConfig } from 'vite';

export default defineConfig({
  // Use relative paths for assets so they work on GitHub Pages subfolders
  base: './',
  build: {
    // Some users prefer the 'docs' folder for GitHub Pages hosting
    outDir: 'docs',
  }
});
