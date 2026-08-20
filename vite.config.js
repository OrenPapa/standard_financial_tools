import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.VITE_BASE_PATH || '/',
    server: {
      proxy: {
        '/api': {
          target: `http://${env.API_HOST || '127.0.0.1'}:${env.API_PORT || '3000'}`,
          changeOrigin: true
        }
      }
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html'),
          login: resolve(__dirname, 'login.html')
        }
      }
    }
  };
});
