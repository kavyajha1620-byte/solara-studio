import { defineConfig } from 'vite';
import { resolve } from 'path';

// Multi-page build: every page is an independent entry point.
// publicDir points at src/public (single source of truth for self-hosted images).
export default defineConfig({
  publicDir: 'src/public',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        classes: resolve(__dirname, 'classes.html'),
        yoga: resolve(__dirname, 'yoga.html'),
        fitness: resolve(__dirname, 'fitness.html'),
        meditation: resolve(__dirname, 'meditation.html'),
        instructors: resolve(__dirname, 'instructors.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        contact: resolve(__dirname, 'contact.html'),
        booking: resolve(__dirname, 'booking.html'),
      },
    },
  },
});
