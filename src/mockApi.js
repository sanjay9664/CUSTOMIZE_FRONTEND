// Standalone Frontend UI Mock API Interceptor
// Intercepts network calls to /api/* and /sochiot-* to prevent ERR_CONNECTION_REFUSED errors in browser console.

const originalFetch = window.fetch;

window.fetch = async function (input, init) {
  const urlStr = typeof input === 'string' ? input : (input?.url || '');

  // Check if request is directed to backend API or localhost or sochiot
  const isBackendApi = 
    urlStr.includes('/api/') || 
    urlStr.includes('/sochiot-') || 
    urlStr.includes('localhost:5000') ||
    urlStr.includes('app.sochiot.com');

  if (!isBackendApi) {
    return originalFetch.apply(this, arguments);
  }

  // Helper mock Response generator
  const createMockResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  // 1. Auth Login / Register (Pass through to real backend)
  if (urlStr.includes('/auth/login') || urlStr.includes('/sochiot-auth/login') || urlStr.includes('/auth/register')) {
    return originalFetch.apply(this, arguments);
  }

  // 2. User Me
  if (urlStr.includes('/user/me')) {
    return createMockResponse({ id: 1, name: 'System Administrator', email: 'admin@sochiot.com', role: 'SUPER_ADMIN' });
  }

  // 3. Super Admin & Admin Config
  if (urlStr.includes('/super-admin/config') || urlStr.includes('/super-admin/admin-config')) {
    return createMockResponse({
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
      showAC: true,
      submoduleVisibility: {}
    });
  }

  // 4. Super Admin Tenants
  if (urlStr.includes('/super-admin/tenants')) {
    return createMockResponse([
      { id: 1, name: 'Main Plant Facility', adminEmail: 'admin@sochiot.com', userCount: 5, createdAt: new Date().toISOString() },
      { id: 2, name: 'Secondary Hub', adminEmail: 'hub@sochiot.com', userCount: 3, createdAt: new Date().toISOString() }
    ]);
  }

  // 5. Admin Users
  if (urlStr.includes('/admin/users')) {
    return createMockResponse([
      { id: 1, name: 'Main Admin', email: 'admin@sochiot.com', role: 'ADMIN', tenantId: 1, createdAt: new Date().toISOString() },
      { id: 2, name: 'Operator 1', email: 'operator1@sochiot.com', role: 'USER', tenantId: 1, createdAt: new Date().toISOString() }
    ]);
  }

  // 6. Templates & Telemetry Stats
  if (urlStr.includes('/api/templates/stats')) {
    const mockStats = {
      "AG Tank": { agLevel: 78, temperature: 26.5, pressure: 2.4, status: "RUNNING" },
      "UG Tank": { ugLevel: 82, temperature: 24.1, pressure: 3.1, status: "RUNNING" },
      "DG Set": { voltage: 415, current: 120, frequency: 50.1, status: "STANDBY" },
      "VRV": { temp: 22.0, humidity: 48, status: "OPTIMAL" },
      "AQI": { aqi: 45, pm25: 12, pm10: 28, temp: 24, humidity: 50 },
      "Energy": { mainMeter: 450.5, subMeter: 120.2, powerFactor: 0.98 }
    };
    return createMockResponse(mockStats);
  }

  if (urlStr.includes('/api/templates/energy-meter-groups')) {
    return createMockResponse([]);
  }

  if (urlStr.includes('/api/templates')) {
    try {
      const saved = localStorage.getItem('scada_templates');
      if (saved) return createMockResponse(JSON.parse(saved));
    } catch (e) {}
    return createMockResponse([]);
  }

  // 7. Command Push / Rule Engine
  if (urlStr.includes('/api/command/push') || urlStr.includes('/api/rule-engine/apply')) {
    return createMockResponse({ status: 'OK', success: true, message: 'Action executed successfully in UI preview mode.' });
  }

  // 8. Default fallback for any other backend endpoint
  return createMockResponse({ status: 'OK', online: true, active: true, list: [], content: [], data: [] });
};
