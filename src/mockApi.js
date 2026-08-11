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

  // 4. Tenants Endpoint (/api/tenants, /super-admin/tenants)
  if (urlStr.includes('/api/tenants') || urlStr.includes('/super-admin/tenants') || urlStr.includes('/tenants')) {
    return createMockResponse([
      { id: 'cmshedsk40002zsvnhajul18y', name: 'Sochiot', code: 'SOCHIOT' },
      { id: 'c2a8b410-449e-11ee-be56-0242ac120002', name: 'SAAS Headquarters', code: 'SAAS' },
      { id: 'cmshedske0003zsvnysjzt2ap', name: 'Tata Org', code: 'TATA' },
      { id: 'cmshedskq0005zsvnrc1mcrg4', name: 'Siemens Org', code: 'SIEMENS' }
    ]);
  }

  // 5. Users API Endpoint (/api/users, /users)
  if (urlStr.includes('/api/users') || urlStr.includes('/users') || urlStr.includes('/admin/users')) {
    let savedUsers = [];
    try {
      savedUsers = JSON.parse(localStorage.getItem('scada_users_db') || '[]');
    } catch(e) {}

    if (!savedUsers || savedUsers.length === 0) {
      savedUsers = [
        { id: 'usr-101', name: 'Rajesh Padhi', email: 'rajesh@sochiot.com', role: 'SUPER_ADMIN', status: 'ACTIVE', scopeType: 'TENANT', scopeId: 'cmsfq874j0002bsiaumzb92j7', permissions: ['*'], createdAt: '2026-08-01T10:00:00Z' },
        { id: 'usr-102', name: 'Sanjay Gupta', email: 'sanjay@sochiot.com', role: 'ADMIN', status: 'ACTIVE', scopeType: 'TENANT', scopeId: 'tenant-sub-01', permissions: ['users:read', 'users:write'], createdAt: '2026-08-05T12:30:00Z' },
        { id: 'usr-103', name: 'Priya Sharma', email: 'priya@sochiot.com', role: 'OPERATOR', status: 'ACTIVE', scopeType: 'ZONE', scopeId: 'zone-north-04', permissions: ['telemetry:read'], createdAt: '2026-08-08T09:15:00Z' },
        { id: 'usr-104', name: 'Amit Verma', email: 'amit.verma@sochiot.com', role: 'USER', status: 'INACTIVE', scopeType: 'SITE', scopeId: 'site-bms-02', permissions: ['reports:read'], createdAt: '2026-08-10T14:20:00Z' }
      ];
      localStorage.setItem('scada_users_db', JSON.stringify(savedUsers));
    }

    const method = (init?.method || 'GET').toUpperCase();
    
    // Perform original fetch so API request hits the network across the wire
    try {
      const realResp = await originalFetch.apply(this, arguments);
      if (realResp && realResp.ok) return realResp;
      if (realResp && realResp.status === 401) {
        console.warn('[mockApi] Backend returned 401 Unauthorized (expired token). Falling back to mock response.');
      }
    } catch (e) {}

    if (method === 'GET') {
      const parts = urlStr.split('/users');
      const pathSuffix = parts[1] || '';
      const idMatch = pathSuffix.match(/^\/([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1] && idMatch[1] !== 'all' && idMatch[1] !== 'roles' && idMatch[1] !== 'me') {
        const found = savedUsers.find(u => String(u.id) === String(idMatch[1]));
        if (found) return createMockResponse(found);
        return createMockResponse({ error: 'User not found' }, 404);
      }
      return createMockResponse({ data: savedUsers, total: savedUsers.length, page: 1, limit: 10 });
    }

    if (method === 'POST') {
      try {
        const body = typeof init?.body === 'string' ? JSON.parse(init.body) : (init?.body || {});
        
        // Duplicate email validation
        const reqEmail = (body.email || '').trim().toLowerCase();
        if (reqEmail) {
          const duplicate = savedUsers.find(u => (u.email || '').trim().toLowerCase() === reqEmail);
          if (duplicate) {
            return createMockResponse({
              success: false,
              message: `User with email "${body.email}" already exists!`
            }, 400);
          }
        }

        const roleIdMap = { SUPER_ADMIN: 1, ADMIN: 2, OPERATOR: 3, VIEWER: 4, MANAGER: 5 };
        const validRole = body.role === 'USER' ? 'VIEWER' : (body.role || 'VIEWER');
        const selectedTenant = body.tenantId || 'cmshedsk40002zsvnhajul18y';
        const nowIso = new Date().toISOString();

        const newUser = {
          id: `cmsoj${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`,
          companyId: body.companyId || null,
          tenantId: selectedTenant,
          sochiotUserId: null,
          name: body.name || 'New User',
          email: body.email || 'user@sochiot.com',
          phone: null,
          employeeId: null,
          role: validRole,
          scopeType: body.scopeType || 'ZONE',
          scopeId: body.scopeId !== undefined ? body.scopeId : '',
          scopedRoles: null,
          access: 'BOTH',
          features: {},
          zoneLocations: body.zoneLocations || [
            { zoneNodeId: '', zoneNodeType: 'ZONE' },
            { zoneNodeId: '1', zoneNodeType: 'SITE' },
            { zoneNodeId: 'room_101', zoneNodeType: 'ASSET' }
          ],
          preferredView: null,
          status: body.status || 'ACTIVE',
          lastLoginAt: null,
          lastLoginIP: null,
          lastLoginUserAgent: null,
          mfaEnabled: false,
          createdAt: nowIso,
          updatedAt: nowIso,
          deletedAt: null,
          createdBy: 'cmshedshe0000zsvn9i9r03n5'
        };

        savedUsers = savedUsers.filter(u => u.id !== newUser.id);
        savedUsers.unshift(newUser);
        localStorage.setItem('scada_users_db', JSON.stringify(savedUsers));

        return createMockResponse({
          success: true,
          data: newUser
        }, 200);
      } catch (e) {
        return createMockResponse({ success: false, error: 'Invalid user payload' }, 400);
      }
    }

    if (method === 'PUT' || method === 'PATCH') {
      try {
        const body = typeof init?.body === 'string' ? JSON.parse(init.body) : (init?.body || {});
        const parts = urlStr.split('/users/');
        const targetId = parts[1]?.split('?')[0];
        const idx = savedUsers.findIndex(u => String(u.id) === String(targetId));
        if (idx !== -1) {
          savedUsers[idx] = {
            ...savedUsers[idx],
            ...body,
            role: body.role === 'USER' ? 'VIEWER' : (body.role || savedUsers[idx].role),
            tenantId: body.tenantId || savedUsers[idx].tenantId,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('scada_users_db', JSON.stringify(savedUsers));
          return createMockResponse({ success: true, data: savedUsers[idx] }, 200);
        }
      } catch(e) {}
      return createMockResponse({ success: true, message: 'User updated successfully' }, 200);
    }

    if (method === 'DELETE') {
      const parts = urlStr.split('/users/');
      const targetId = parts[1]?.split('?')[0];
      savedUsers = savedUsers.filter(u => String(u.id) !== String(targetId));
      localStorage.setItem('scada_users_db', JSON.stringify(savedUsers));
      return createMockResponse({ success: true, message: 'User deleted successfully' }, 200);
    }

    return createMockResponse({ success: true, data: savedUsers });
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
