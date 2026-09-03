import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_API_URL
    ? env.VITE_BACKEND_API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '')
    : 'http://localhost:3001';

  return {
    plugins: [
      react(),
      {
        name: 'bms-api-dev-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const urlStr = req.url || '';
            if (!urlStr.includes('/api/')) {
              return next();
            }

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', '*');
            res.setHeader('Access-Control-Allow-Methods', '*');

            if (req.method === 'OPTIONS') {
              res.statusCode = 204;
              return res.end();
            }

            // Forward to real backend using env.VITE_BACKEND_API_URL as single source of truth
            const targetPath = urlStr.startsWith('/api/v1') ? urlStr : urlStr.replace(/^\/api/, '/api/v1');
            const backendEndpoint = `${backendTarget}${targetPath}`;

            try {
              let reqBody = undefined;
              if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                reqBody = await new Promise((resolve) => {
                  let body = '';
                  req.on('data', chunk => body += chunk);
                  req.on('end', () => resolve(body));
                });
              }

              const backendRes = await fetch(backendEndpoint, {
                method: req.method,
                headers: {
                  'content-type': req.headers['content-type'] || 'application/json',
                  'authorization': req.headers['authorization'] || ''
                },
                body: reqBody
              });

              // Always forward the real backend response and HTTP status code
              if (backendRes) {
                const data = await backendRes.text();
                res.statusCode = backendRes.status;
                return res.end(data);
              }
            } catch (err) {
              // Backend offline or error
            }

            // If auth endpoint and backend is offline, return 503 error - NEVER return fake mock admin
            if (urlStr.includes('/auth/') || urlStr.includes('/login') || urlStr.includes('/sochiot-auth/') || urlStr.includes('/user/me')) {
              res.statusCode = 503;
              return res.end(JSON.stringify({
                success: false,
                message: `Authentication service unreachable at ${backendEndpoint}. Please ensure your backend is running.`
              }));
            }

          // Fallback for non-auth endpoints when backend is offline
          res.statusCode = 200;

          // Super Admin Config
          if (urlStr.includes('/super-admin/config') || urlStr.includes('/super-admin/admin-config')) {
            return res.end(JSON.stringify({
              showDashboard: true,
              showWaterManagement: true,
              showMotors: true,
              showDGSet: true,
              showSettingTemplates: true,
              showAlarms: true,
              showLTPanel: true,
              showTransformers: true,
              showFirePumps: true,
              showTicketing: true,
              showMaintenance: true,
              showServiceHistory: true,
              showDailyDPR: true,
              showEnergyMetering: true,
              showVRV: true,
              showAQISensor: true,
              showHVAC: true,
              showAC: true
            }));
          }

          // Generic 200 OK Fallback Payload
          return res.end(JSON.stringify({ success: true, status: 'OK', data: [] }));
        });
      }
    }
  ],
  define: {
    'process.env': {}
  },
  server: {
    port: 5173
  }
};
});
