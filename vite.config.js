import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/standard_financial_tools/',
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html')
      }
    }
  }
});
