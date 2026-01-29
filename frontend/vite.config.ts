import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Allow access from network (mobile devices)
    port: 8050,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Optimize build output
    target: 'esnext',
    // Aggressive minification with esbuild (fastest and most efficient)
    minify: 'esbuild',
    // Minify CSS - Vite uses esbuild for CSS minification by default
    cssMinify: 'esbuild',
    // Enable code splitting
    rollupOptions: {
      output: {
        // Compact output
        compact: true,
        // Minify chunk file names
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion'],
          'chart-vendor': ['recharts'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Disable source maps for smaller bundle (production)
    sourcemap: false,
    // Report compressed size
    reportCompressedSize: true,
    // Split CSS code for better caching
    cssCodeSplit: true,
  },
  // CSS preprocessing options
  css: {
    devSourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },
})

