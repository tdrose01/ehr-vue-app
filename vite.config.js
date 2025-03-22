import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        rewrite: (path) => {
          console.log('Original path:', path);
          const newPath = path.replace(/^\/api/, '');
          console.log('Rewritten path:', newPath);
          return newPath;
        }
      }
    }
  }
});