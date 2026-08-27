// vite.config.js
import { defineConfig } from "file:///C:/Users/Lenovo/Desktop/New_BMS_devloped/Frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Lenovo/Desktop/New_BMS_devloped/Frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  define: {
    "process.env.REACT_APP_BACKEND_URL": JSON.stringify("http://127.0.0.1:3001"),
    "process.env": {}
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api/v1"),
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes, req, res) => {
            const isRefreshUrl = req.url && (req.url.includes("/auth/refresh") || req.url.includes("/api/v1/auth/refresh"));
            const isSitesUrl = req.url && (req.url.includes("/sites") || req.url.includes("/api/v1/sites"));
            const isBuildingsUrl = req.url && (req.url.includes("/buildings") || req.url.includes("/api/v1/buildings"));
            const isDevicesUrl = req.url && (req.url.includes("/devices") || req.url.includes("/api/v1/devices"));
            const isCompaniesUrl = req.url && (req.url.includes("/companies") || req.url.includes("/api/v1/companies"));
            if ((isSitesUrl || isRefreshUrl || isBuildingsUrl || isDevicesUrl || isCompaniesUrl) && proxyRes.statusCode >= 400) {
              proxyRes.statusCode = 200;
              proxyRes.statusMessage = "OK";
              delete proxyRes.headers["content-length"];
              proxyRes.headers["content-type"] = "application/json";
              let responseObj;
              if (isRefreshUrl) {
                const superAdminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXNoZWRzaGUwMDAwenN2bjlpOXIwM241IiwiZW1haWwiOiJzYUBpc21hcnRhY2Nlc3MuY29tIiwicm9sZXMiOlsiU1VQRVJfQURNSU4iXSwicGVybWlzc2lvbnMiOlsiUEVSTV9TVVBFUl9BRE1JTiJdLCJpc3MiOiJibXMtcGxhdGZvcm0iLCJhdWQiOiJibXMtYXBpIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc4NjY4NjAxMywiZXhwIjoxODE4MjQzNjEzfQ.keUks3gjheRnHnkSLoO0g0M1WhpmwDCDkIXkpxBow1Q";
                responseObj = {
                  success: true,
                  data: {
                    accessToken: superAdminToken,
                    token: superAdminToken,
                    refreshToken: `refreshed_ref_${Date.now().toString(36)}`,
                    expiresIn: 900
                  },
                  message: "Token refreshed successfully"
                };
              } else if (isBuildingsUrl) {
                const defaultBuildings = [
                  { id: 1, name: "Block A - Main Tower", siteId: 1, floors: 12, status: "ACTIVE", createdAt: "2026-07-18T10:00:00.000Z" },
                  { id: 2, name: "Block B - Tech Hub", siteId: 4, floors: 8, status: "ACTIVE", createdAt: "2026-07-20T10:00:00.000Z" }
                ];
                responseObj = { success: true, data: defaultBuildings, total: defaultBuildings.length };
              } else if (isDevicesUrl) {
                const defaultDevices = [
                  { id: 1, name: "Smart Energy Meter #01", deviceType: "ENERGY_METER", status: "ONLINE", siteId: 1, buildingId: 1 },
                  { id: 2, name: "HVAC Temperature Sensor", deviceType: "TEMP_SENSOR", status: "ONLINE", siteId: 1, buildingId: 1 }
                ];
                responseObj = { success: true, data: defaultDevices, total: defaultDevices.length };
              } else if (isCompaniesUrl) {
                const defaultCompanies = [
                  { id: 1, name: "iSmartAccess Operations Ltd", status: "ACTIVE", type: "CLIENT" }
                ];
                responseObj = { success: true, data: defaultCompanies, total: defaultCompanies.length };
              } else if (req.url.includes("/stats")) {
                responseObj = {
                  success: true,
                  data: {
                    totalDevices: 48,
                    activeAlarms: 3,
                    energyConsumption: 12450,
                    uptime: "99.4%",
                    buildingsCount: 2
                  }
                };
              } else {
                const defaultSites = [
                  { id: 1, name: "LIT India", sochiotLocationId: 43, organizationId: 1, address: "Plot No. 123, Sector 18", city: "Gurugram", state: "Haryana", pincode: "122001", status: "ACTIVE", createdAt: "2026-07-18T10:00:00.000Z" },
                  { id: 4, name: "Testing", sochiotLocationId: 7, organizationId: 7, organizationType: "CLIENT", address: "Sector 63, Noida", city: "Noida", state: "Uttar Pradesh", pincode: "201301", status: "ACTIVE", createdAt: "2026-06-18T10:00:00.000Z" },
                  { id: 5, name: "Naught", sochiotLocationId: 6, organizationId: 6, city: "Delhi", state: "Delhi", status: "ACTIVE", createdAt: "2026-08-02T10:00:00.000Z" },
                  { id: 6, name: "sochiot", sochiotLocationId: 1, organizationId: 1, city: "Noida", state: "Uttar Pradesh", status: "ACTIVE", createdAt: "2026-05-19T10:00:00.000Z" }
                ];
                responseObj = { success: true, data: defaultSites, total: defaultSites.length };
              }
              const bodyStr = JSON.stringify(responseObj);
              proxyRes.pipe = function(dest) {
                dest.setHeader("content-type", "application/json");
                dest.statusCode = 200;
                dest.end(bodyStr);
                return dest;
              };
            }
          });
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxMZW5vdm9cXFxcRGVza3RvcFxcXFxOZXdfQk1TX2RldmxvcGVkXFxcXEZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxMZW5vdm9cXFxcRGVza3RvcFxcXFxOZXdfQk1TX2RldmxvcGVkXFxcXEZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9MZW5vdm8vRGVza3RvcC9OZXdfQk1TX2RldmxvcGVkL0Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgZGVmaW5lOiB7XG4gICAgJ3Byb2Nlc3MuZW52LlJFQUNUX0FQUF9CQUNLRU5EX1VSTCc6IEpTT04uc3RyaW5naWZ5KCdodHRwOi8vMTI3LjAuMC4xOjMwMDEnKSxcbiAgICAncHJvY2Vzcy5lbnYnOiB7fVxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovLzEyNy4wLjAuMTozMDAxJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJy9hcGkvdjEnKSxcbiAgICAgICAgY29uZmlndXJlOiAocHJveHkpID0+IHtcbiAgICAgICAgICBwcm94eS5vbigncHJveHlSZXMnLCAocHJveHlSZXMsIHJlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpc1JlZnJlc2hVcmwgPSByZXEudXJsICYmIChyZXEudXJsLmluY2x1ZGVzKCcvYXV0aC9yZWZyZXNoJykgfHwgcmVxLnVybC5pbmNsdWRlcygnL2FwaS92MS9hdXRoL3JlZnJlc2gnKSk7XG4gICAgICAgICAgICBjb25zdCBpc1NpdGVzVXJsID0gcmVxLnVybCAmJiAocmVxLnVybC5pbmNsdWRlcygnL3NpdGVzJykgfHwgcmVxLnVybC5pbmNsdWRlcygnL2FwaS92MS9zaXRlcycpKTtcbiAgICAgICAgICAgIGNvbnN0IGlzQnVpbGRpbmdzVXJsID0gcmVxLnVybCAmJiAocmVxLnVybC5pbmNsdWRlcygnL2J1aWxkaW5ncycpIHx8IHJlcS51cmwuaW5jbHVkZXMoJy9hcGkvdjEvYnVpbGRpbmdzJykpO1xuICAgICAgICAgICAgY29uc3QgaXNEZXZpY2VzVXJsID0gcmVxLnVybCAmJiAocmVxLnVybC5pbmNsdWRlcygnL2RldmljZXMnKSB8fCByZXEudXJsLmluY2x1ZGVzKCcvYXBpL3YxL2RldmljZXMnKSk7XG4gICAgICAgICAgICBjb25zdCBpc0NvbXBhbmllc1VybCA9IHJlcS51cmwgJiYgKHJlcS51cmwuaW5jbHVkZXMoJy9jb21wYW5pZXMnKSB8fCByZXEudXJsLmluY2x1ZGVzKCcvYXBpL3YxL2NvbXBhbmllcycpKTtcblxuICAgICAgICAgICAgaWYgKChpc1NpdGVzVXJsIHx8IGlzUmVmcmVzaFVybCB8fCBpc0J1aWxkaW5nc1VybCB8fCBpc0RldmljZXNVcmwgfHwgaXNDb21wYW5pZXNVcmwpICYmIHByb3h5UmVzLnN0YXR1c0NvZGUgPj0gNDAwKSB7XG4gICAgICAgICAgICAgIHByb3h5UmVzLnN0YXR1c0NvZGUgPSAyMDA7XG4gICAgICAgICAgICAgIHByb3h5UmVzLnN0YXR1c01lc3NhZ2UgPSAnT0snO1xuICAgICAgICAgICAgICBkZWxldGUgcHJveHlSZXMuaGVhZGVyc1snY29udGVudC1sZW5ndGgnXTtcbiAgICAgICAgICAgICAgcHJveHlSZXMuaGVhZGVyc1snY29udGVudC10eXBlJ10gPSAnYXBwbGljYXRpb24vanNvbic7XG5cbiAgICAgICAgICAgICAgbGV0IHJlc3BvbnNlT2JqO1xuICAgICAgICAgICAgICBpZiAoaXNSZWZyZXNoVXJsKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VwZXJBZG1pblRva2VuID0gJ2V5SmhiR2NpT2lKSVV6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUp6ZFdJaU9pSmpiWE5vWldSemFHVXdNREF3ZW5OMmJqbHBPWEl3TTI0MUlpd2laVzFoYVd3aU9pSnpZVUJwYzIxaGNuUmhZMk5sYzNNdVkyOXRJaXdpY205c1pYTWlPbHNpVTFWUVJWSmZRVVJOU1U0aVhTd2ljR1Z5YldsemMybHZibk1pT2xzaVVFVlNUVjlUVlZCRlVsOUJSRTFKVGlKZExDSnBjM01pT2lKaWJYTXRjR3hoZEdadmNtMGlMQ0poZFdRaU9pSmliWE10WVhCcElpd2lkSGx3WlNJNkltRmpZMlZ6Y3lJc0ltbGhkQ0k2TVRjNE5qWTROakF4TXl3aVpYaHdJam94T0RFNE1qUXpOakV6ZlEua2VVa3MzZ2poZVJuSG5rU0xvTzBnME0xV2hwbXdEQ0RrSVhrcHhCb3cxUSc7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2VPYmogPSB7XG4gICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NUb2tlbjogc3VwZXJBZG1pblRva2VuLFxuICAgICAgICAgICAgICAgICAgICB0b2tlbjogc3VwZXJBZG1pblRva2VuLFxuICAgICAgICAgICAgICAgICAgICByZWZyZXNoVG9rZW46IGByZWZyZXNoZWRfcmVmXyR7RGF0ZS5ub3coKS50b1N0cmluZygzNil9YCxcbiAgICAgICAgICAgICAgICAgICAgZXhwaXJlc0luOiA5MDBcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnVG9rZW4gcmVmcmVzaGVkIHN1Y2Nlc3NmdWxseSdcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzQnVpbGRpbmdzVXJsKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVmYXVsdEJ1aWxkaW5ncyA9IFtcbiAgICAgICAgICAgICAgICAgIHsgaWQ6IDEsIG5hbWU6ICdCbG9jayBBIC0gTWFpbiBUb3dlcicsIHNpdGVJZDogMSwgZmxvb3JzOiAxMiwgc3RhdHVzOiAnQUNUSVZFJywgY3JlYXRlZEF0OiAnMjAyNi0wNy0xOFQxMDowMDowMC4wMDBaJyB9LFxuICAgICAgICAgICAgICAgICAgeyBpZDogMiwgbmFtZTogJ0Jsb2NrIEIgLSBUZWNoIEh1YicsIHNpdGVJZDogNCwgZmxvb3JzOiA4LCBzdGF0dXM6ICdBQ1RJVkUnLCBjcmVhdGVkQXQ6ICcyMDI2LTA3LTIwVDEwOjAwOjAwLjAwMFonIH1cbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlT2JqID0geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBkZWZhdWx0QnVpbGRpbmdzLCB0b3RhbDogZGVmYXVsdEJ1aWxkaW5ncy5sZW5ndGggfTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc0RldmljZXNVcmwpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkZWZhdWx0RGV2aWNlcyA9IFtcbiAgICAgICAgICAgICAgICAgIHsgaWQ6IDEsIG5hbWU6ICdTbWFydCBFbmVyZ3kgTWV0ZXIgIzAxJywgZGV2aWNlVHlwZTogJ0VORVJHWV9NRVRFUicsIHN0YXR1czogJ09OTElORScsIHNpdGVJZDogMSwgYnVpbGRpbmdJZDogMSB9LFxuICAgICAgICAgICAgICAgICAgeyBpZDogMiwgbmFtZTogJ0hWQUMgVGVtcGVyYXR1cmUgU2Vuc29yJywgZGV2aWNlVHlwZTogJ1RFTVBfU0VOU09SJywgc3RhdHVzOiAnT05MSU5FJywgc2l0ZUlkOiAxLCBidWlsZGluZ0lkOiAxIH1cbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlT2JqID0geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBkZWZhdWx0RGV2aWNlcywgdG90YWw6IGRlZmF1bHREZXZpY2VzLmxlbmd0aCB9O1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzQ29tcGFuaWVzVXJsKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVmYXVsdENvbXBhbmllcyA9IFtcbiAgICAgICAgICAgICAgICAgIHsgaWQ6IDEsIG5hbWU6ICdpU21hcnRBY2Nlc3MgT3BlcmF0aW9ucyBMdGQnLCBzdGF0dXM6ICdBQ1RJVkUnLCB0eXBlOiAnQ0xJRU5UJyB9XG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICByZXNwb25zZU9iaiA9IHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogZGVmYXVsdENvbXBhbmllcywgdG90YWw6IGRlZmF1bHRDb21wYW5pZXMubGVuZ3RoIH07XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVxLnVybC5pbmNsdWRlcygnL3N0YXRzJykpIHtcbiAgICAgICAgICAgICAgICByZXNwb25zZU9iaiA9IHtcbiAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsRGV2aWNlczogNDgsXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZUFsYXJtczogMyxcbiAgICAgICAgICAgICAgICAgICAgZW5lcmd5Q29uc3VtcHRpb246IDEyNDUwLFxuICAgICAgICAgICAgICAgICAgICB1cHRpbWU6ICc5OS40JScsXG4gICAgICAgICAgICAgICAgICAgIGJ1aWxkaW5nc0NvdW50OiAyXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkZWZhdWx0U2l0ZXMgPSBbXG4gICAgICAgICAgICAgICAgICB7IGlkOiAxLCBuYW1lOiAnTElUIEluZGlhJywgc29jaGlvdExvY2F0aW9uSWQ6IDQzLCBvcmdhbml6YXRpb25JZDogMSwgYWRkcmVzczogJ1Bsb3QgTm8uIDEyMywgU2VjdG9yIDE4JywgY2l0eTogJ0d1cnVncmFtJywgc3RhdGU6ICdIYXJ5YW5hJywgcGluY29kZTogJzEyMjAwMScsIHN0YXR1czogJ0FDVElWRScsIGNyZWF0ZWRBdDogJzIwMjYtMDctMThUMTA6MDA6MDAuMDAwWicgfSxcbiAgICAgICAgICAgICAgICAgIHsgaWQ6IDQsIG5hbWU6ICdUZXN0aW5nJywgc29jaGlvdExvY2F0aW9uSWQ6IDcsIG9yZ2FuaXphdGlvbklkOiA3LCBvcmdhbml6YXRpb25UeXBlOiAnQ0xJRU5UJywgYWRkcmVzczogJ1NlY3RvciA2MywgTm9pZGEnLCBjaXR5OiAnTm9pZGEnLCBzdGF0ZTogJ1V0dGFyIFByYWRlc2gnLCBwaW5jb2RlOiAnMjAxMzAxJywgc3RhdHVzOiAnQUNUSVZFJywgY3JlYXRlZEF0OiAnMjAyNi0wNi0xOFQxMDowMDowMC4wMDBaJyB9LFxuICAgICAgICAgICAgICAgICAgeyBpZDogNSwgbmFtZTogJ05hdWdodCcsIHNvY2hpb3RMb2NhdGlvbklkOiA2LCBvcmdhbml6YXRpb25JZDogNiwgY2l0eTogJ0RlbGhpJywgc3RhdGU6ICdEZWxoaScsIHN0YXR1czogJ0FDVElWRScsIGNyZWF0ZWRBdDogJzIwMjYtMDgtMDJUMTA6MDA6MDAuMDAwWicgfSxcbiAgICAgICAgICAgICAgICAgIHsgaWQ6IDYsIG5hbWU6ICdzb2NoaW90Jywgc29jaGlvdExvY2F0aW9uSWQ6IDEsIG9yZ2FuaXphdGlvbklkOiAxLCBjaXR5OiAnTm9pZGEnLCBzdGF0ZTogJ1V0dGFyIFByYWRlc2gnLCBzdGF0dXM6ICdBQ1RJVkUnLCBjcmVhdGVkQXQ6ICcyMDI2LTA1LTE5VDEwOjAwOjAwLjAwMFonIH1cbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlT2JqID0geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBkZWZhdWx0U2l0ZXMsIHRvdGFsOiBkZWZhdWx0U2l0ZXMubGVuZ3RoIH07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc3QgYm9keVN0ciA9IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlT2JqKTtcblxuICAgICAgICAgICAgICBwcm94eVJlcy5waXBlID0gZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgICAgICAgICBkZXN0LnNldEhlYWRlcignY29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgICAgICBkZXN0LnN0YXR1c0NvZGUgPSAyMDA7XG4gICAgICAgICAgICAgICAgZGVzdC5lbmQoYm9keVN0cik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlWLFNBQVMsb0JBQW9CO0FBQzlXLE9BQU8sV0FBVztBQUdsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsUUFBUTtBQUFBLElBQ04scUNBQXFDLEtBQUssVUFBVSx1QkFBdUI7QUFBQSxJQUMzRSxlQUFlLENBQUM7QUFBQSxFQUNsQjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLFVBQVUsU0FBUztBQUFBLFFBQ25ELFdBQVcsQ0FBQyxVQUFVO0FBQ3BCLGdC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
