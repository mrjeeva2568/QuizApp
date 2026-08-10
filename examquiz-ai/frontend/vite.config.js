import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    // No sourcemaps in the production artifact by default - they'd map
    // minified code straight back to original source, which is useful for
    // debugging but also hands an attacker a readable copy of the app.
    // Flip to true temporarily (or via a separate build profile) if you need
    // to debug a production issue with real stack traces.
    sourcemap: false,
    // Split the biggest stable dependency (React itself) into its own chunk
    // so it's cached independently of app code - app updates don't force
    // browsers to re-download React on every deploy.
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
