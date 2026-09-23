import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // The browser uses the relative /api/v1 base. During development Vite
  // proxies that path to the backend origin, preventing a CORS request.
  // If an absolute URL is provided only use its origin: the incoming request
  // already contains /api/v1 and must not receive the prefix twice.
  const configuredBackend = env.VITE_BACKEND_API_URL || env.VITE_BACKEND_TARGET || '';
  const backendTarget = configuredBackend.startsWith('http')
    ? new URL(configuredBackend).origin
    : (configuredBackend ? `http://${configuredBackend}` : '');

  const proxyConfig = backendTarget ? {
    '/api': {
      target: backendTarget,
      changeOrigin: true,
      secure: false,
      rewrite: (path) => {
        if (path.startsWith('/api/v1')) return path;
        return path.replace(/^\/api/, '/api/v1');
      }
    }
  } : {};

  return {
    plugins: [react()],
    define: {
      'process.env': {}
    },
    server: {
      port: 5173,
      proxy: proxyConfig
    },
    preview: {
      port: 4173,
      proxy: proxyConfig
    }
  };
});
