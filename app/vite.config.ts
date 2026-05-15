import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: true,
      allowedHosts: true,
      // Proxy all /api and /socket.io requests to the backend on port 5000
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err: any) => {
              if (err.code !== 'ECONNREFUSED') console.log('proxy error', err);
            });
          }
        },
        '/socket.io': {
          target: 'http://127.0.0.1:5000',
          ws: true,
          changeOrigin: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err: any) => {
              if (err.code !== 'ECONNREFUSED') console.log('proxy error', err);
            });
          }
        },
        '/uploads': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err: any) => {
              if (err.code !== 'ECONNREFUSED') console.log('proxy error', err);
            });
          }
        },
        '/__/auth': {
          target: 'https://gen-lang-client-0267172098.firebaseapp.com',
          changeOrigin: true,
          secure: false,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
