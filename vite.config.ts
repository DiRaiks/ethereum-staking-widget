import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // SVG → React компоненты (заменяет @svgr/webpack)
    // Использование: import { ReactComponent as Icon } from './icon.svg?react'
    svgr({
      svgrOptions: { exportType: 'named', ref: true },
      include: '**/*.svg?react',
    }),
  ],

  resolve: {
    alias: {
      // Зеркалим paths из tsconfig.json
      config: path.resolve(__dirname, './config'),
      consts: path.resolve(__dirname, './consts'),
      utils: path.resolve(__dirname, './utils'),
      utilsApi: path.resolve(__dirname, './utilsApi'),
      features: path.resolve(__dirname, './features'),
      shared: path.resolve(__dirname, './shared'),
      providers: path.resolve(__dirname, './providers'),
      modules: path.resolve(__dirname, './modules'),
      styles: path.resolve(__dirname, './styles'),
      abi: path.resolve(__dirname, './abi'),
      types: path.resolve(__dirname, './types'),
      assets: path.resolve(__dirname, './assets'),
      networks: path.resolve(__dirname, './networks'),
      scripts: path.resolve(__dirname, './scripts'),
      // env-dynamics.mjs — runtime env module (читается server-side или window.__env__ browser-side)
      'env-dynamics.mjs': path.resolve(__dirname, './env-dynamics.mjs'),
      // JSON root files — resolvable via tsconfig baseUrl but need explicit Vite aliases
      'IPFS.json': path.resolve(__dirname, './IPFS.json'),
      'build-info.json': path.resolve(__dirname, './build-info.json'),
      // Заглушка для React Native AsyncStorage (используется MetaMask SDK)
      '@react-native-async-storage/async-storage': path.resolve(
        __dirname,
        './src/mocks/async-storage.ts',
      ),
    },
  },

  define: {
    // Позволяет библиотекам использующим process.env работать в браузере
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV ?? 'production',
    ),
    'process.env.IPFS_MODE': JSON.stringify(process.env.IPFS_MODE ?? ''),
  },

  build: {
    outDir: 'dist',
    // sourcemap disabled to reduce memory usage during build (can be enabled in CI with more RAM)
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },

  server: {
    port: 3001,
    // Проксируем API запросы к Fastify серверу в dev режиме
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/runtime': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
