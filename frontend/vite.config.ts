// Website_Monitoring_Project/frontend/vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // 允許所有域名，避免 Host 檢查阻擋
    allowedHosts: true,
    proxy: {
      // 開發環境下，將 /api 請求代理到後端 NestJS
      '/api': {
        target: 'http://api:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '') // 修正正則表達式
      }
    }
  }
});