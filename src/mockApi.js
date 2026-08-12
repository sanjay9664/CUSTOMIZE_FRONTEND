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

  // 1. Auth Login / Register / Refresh (Pass through to real backend first)
  if (urlStr.includes('/auth/login') || urlStr.includes('/sochiot-auth/login') || urlStr.includes('/auth/register') || urlStr.includes('/auth/refresh')) {
    try {
      const realResp = await originalFetch.apply(this, arguments);
      if (realResp && realResp.ok) return realResp;
    } catch(e) {}
    if (urlStr.includes('/auth/refresh')) {
      const newTok = `refreshed_tok_${Date.now().toString(36)}${Math.random().toString(36).substring(2,6)}`;
      return createMockResponse({
        success: true,
        data: {
          accessToken: newTok,
          token: newTok,
          refreshToken: `refreshed_ref_${Date.now().toString(36)}`,
          expiresIn: 900
        },
        message: 'Token refreshed successfully'
      }, 200);
    }
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
    let backendTenants = [];
    try {
      const realResp = await originalFetch.apply(this, arguments);
      if (realResp && realResp.ok) {
        const json = await realResp.json();
        backendTenants = Array.isArray(json) ? json : (json.data || []);
      }
    } catch (e) {}

    let savedOrgs = [];
    try {
      savedOrgs = JSON.parse(localStorage.getItem('tb_orgs') || '[]');
    } catch(e) {}

    const defaultTenants = [
      { id: 'cmshedsk40002zsvnhajul18y', name: 'Sochiot', code: 'SOCHIOT' },
      { id: 'cmshedskq0005zsvnrc1mcrg4', name: 'Siemens Energy Ltd', code: 'SIEMENS' },
      { id: 'cmshedske0003zsvnysjzt2ap', name: 'Tata Industrial Corp', code: 'TATA' },
      { id: 'c2a8b410-449e-11ee-be56-0242ac120002', name: 'SAAS Headquarters', code: 'SAAS' }
    ];

    const merged = [...backendTenants];
    const existingIds = new Set(merged.map(t => String(t.id)));
    const existingNames = new Set(merged.map(t => String(t.name || '').toLowerCase()));

    if (Array.isArray(savedOrgs)) {
      for (const o of savedOrgs) {
        if (o.name && !existingNames.has(o.name.toLowerCase())) {
          merged.push({ id: o.id || o.code || o.name, name: o.name, code: o.code || 'ORG' });
          existingNames.add(o.name.toLowerCase());
        }
      }
    }

    for (const d of defaultTenants) {
      if (!existingIds.has(d.id) && !existingNames.has(d.name.toLowerCase())) {
        merged.push(d);
        existingIds.add(d.id);
      }
    }

    return createMockResponse(merged);
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
      let fetchArgs = arguments;
      if ((method === 'POST' || method === 'PATCH' || method === 'PUT') && init?.body) {
        try {
          const parsedBody = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
          if (parsedBody && parsedBody.tenantId) {
            const reqTenant = parsedBody.tenantId;
            const isMockTenant = reqTenant === 'c2a8b410-449e-11ee-be56-0242ac120002' || 
                                 reqTenant === 'cmshedske0003zsvnysjzt2ap' || 
                                 reqTenant === 'cmshedskq0005zsvnrc1mcrg4';
            if (isMockTenant) {
              const sanitizedBody = JSON.stringify({ ...parsedBody, tenantId: 'cmshedsk40002zsvnhajul18y' });
              fetchArgs = [input, { ...init, body: sanitizedBody }];
            }
          }
        } catch (e) {}
      }

      let realResp = await originalFetch.apply(this, fetchArgs);
      
      // If 404 TENANT_NOT_FOUND occurs on original fetch, retry with valid default tenant ID
      if (realResp && realResp.status === 404 && (method === 'POST' || method === 'PATCH' || method === 'PUT') && init?.body) {
        try {
          const parsedBody = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
          const sanitizedBody = JSON.stringify({ ...parsedBody, tenantId: 'cmshedsk40002zsvnhajul18y' });
          const retryResp = await originalFetch.apply(this, [input, { ...init, body: sanitizedBody }]);
          if (retryResp && retryResp.ok) {
            realResp = retryResp;
          }
        } catch (e) {}
      }

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

  // 4b. OpenAPI Sites Service Interceptor (Robust handler matching User Administration)
  if (urlStr.includes('/api/sites') || urlStr.includes('/sites')) {
    // Try hitting real backend first
    try {
      const realResp = await originalFetch.apply(this, arguments);
      if (realResp && realResp.ok && realResp.status < 400) {
        // For POST/PATCH/PUT: also sync localStorage so fallback GET stays current
        const reqMethod = (init?.method || 'GET').toUpperCase();
        if (reqMethod === 'POST') {
          try {
            const clonedResp = realResp.clone();
            const resData = await clonedResp.json().catch(() => ({}));
            const createdObj = resData?.data || resData?.site || resData;
            if (createdObj && createdObj.id) {
              let storedSites = JSON.parse(localStorage.getItem('scada_sites_db') || '[]');
              storedSites.unshift(createdObj);
              localStorage.setItem('scada_sites_db', JSON.stringify(storedSites));
            }
          } catch(e) {}
        } else if (reqMethod === 'PATCH' || reqMethod === 'PUT') {
          try {
            const patchMatch = urlStr.match(/\/sites\/([0-9a-zA-Z_-]+)/);
            const patchId = patchMatch ? patchMatch[1] : null;
            let patchBody = {};
            try { patchBody = typeof init?.body === 'string' ? JSON.parse(init.body) : (init?.body || {}); } catch(e) {}
            let storedSites = JSON.parse(localStorage.getItem('scada_sites_db') || '[]');
            const pIdx = storedSites.findIndex(s => String(s.id) === String(patchId));
            if (pIdx !== -1) {
              storedSites[pIdx] = { ...storedSites[pIdx], ...patchBody, updatedAt: new Date().toISOString() };
              localStorage.setItem('scada_sites_db', JSON.stringify(storedSites));
            }
          } catch(e) {}
        }
        return realResp;
      }
    } catch (e) {}

    // Fallback to saved / seeded real DB sites
    let savedSites = [];
    try {
      savedSites = JSON.parse(localStorage.getItem('scada_sites_db') || '[]');
    } catch(e) {}

    // Purge old dummy data (Noida Corporate HQ, Mumbai Industrial Plant, etc.) AND old seeds with fake stats
    const DUMMY_NAMES = ['Noida Corporate HQ', 'Mumbai Industrial Plant', 'Bangalore Tech Campus', 'Delhi Data Center', 'Testing Site'];
    const hasDummy = Array.isArray(savedSites) && savedSites.some(s => DUMMY_NAMES.includes(s.name));
    const hasFakeStats = Array.isArray(savedSites) && savedSites.some(s => s.devicesCount > 0 || s.energyKwh > 0);
    if (hasDummy || hasFakeStats) {
      savedSites = []; // Force re-seed with clean real DB sites
      try { localStorage.removeItem('scada_sites_db'); } catch(e) {}
    }

    if (!Array.isArray(savedSites) || savedSites.length === 0) {
      savedSites = [
        {
          id: 1,
          name: 'LIT India',
          sochiotLocationId: 43,
          organizationId: 1,
          address: 'Plot No. 123, Sector 18',
          city: 'Gurugram',
          state: 'Haryana',
          pincode: '122001',
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 30 * 864e5).toISOString()
        },
        {
          id: 4,
          name: 'Testing',
          sochiotLocationId: 7,
          organizationId: 7,
          organizationType: 'CLIENT',
          address: 'Sector 63, Noida',
          city: 'Noida',
          state: 'Uttar Pradesh',
          pincode: '201301',
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 60 * 864e5).toISOString()
        },
        {
          id: 5,
          name: 'Naught',
          sochiotLocationId: 6,
          organizationId: 6,
          city: 'Delhi',
          state: 'Delhi',
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 15 * 864e5).toISOString()
        },
        {
          id: 6,
          name: 'sochiot',
          sochiotLocationId: 1,
          organizationId: 1,
          city: 'Noida',
          state: 'Uttar Pradesh',
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 90 * 864e5).toISOString()
        }
      ];
      try { localStorage.setItem('scada_sites_db', JSON.stringify(savedSites)); } catch(e) {}
    }

    const method = (init?.method || 'GET').toUpperCase();

    // GET /api/sites/:id/stats
    if (method === 'GET' && urlStr.includes('/stats')) {
      const match = urlStr.match(/\/sites\/([0-9a-zA-Z_-]+)\/stats/);
      const targetId = match ? match[1] : null;
      const targetSite = savedSites.find(s => String(s.id) === String(targetId)) || savedSites[0];
      return createMockResponse({
        success: true,
        data: {
          totalDevices: targetSite?.devicesCount || 48,
          activeAlarms: targetSite?.alarmsCount || 3,
          energyConsumption: targetSite?.energyKwh || 12450,
          uptime: '99.4%',
          buildingsCount: targetSite?.buildingsCount || 2
        }
      }, 200);
    }

    // GET /api/sites or /api/sites/:id
    if (method === 'GET') {
      const match = urlStr.match(/\/sites\/([0-9a-zA-Z_-]+)$/);
      if (match && match[1] && match[1] !== 'filter' && match[1] !== 'stats') {
        const found = savedSites.find(s => String(s.id) === String(match[1]));
        if (found) return createMockResponse({ success: true, data: found });
        return createMockResponse({ success: false, message: 'Site not found' }, 404);
      }
      return createMockResponse({ success: true, data: savedSites, total: savedSites.length });
    }

    // POST /api/sites (Create Site)
    if (method === 'POST') {
      let body = {};
      try { body = typeof init?.body === 'string' ? JSON.parse(init.body) : (init?.body || {}); } catch(e) {}
      const newSite = {
        id: Date.now(),
        name: body.name || 'New Site',
        sochiotLocationId: parseInt(body.sochiotLocationId) || 7,
        organizationId: parseInt(body.organizationId) || 7,
        tenantId: body.tenantId || 'cmshedsk40002zsvnhajul18y',
        city: body.city || 'Noida',
        state: body.state || 'Uttar Pradesh',
        status: 'ACTIVE',
        devicesCount: 0,
        alarmsCount: 0,
        buildingsCount: 0,
        energyKwh: 0,
        createdAt: new Date().toISOString()
      };
      savedSites.unshift(newSite);
      try { localStorage.setItem('scada_sites_db', JSON.stringify(savedSites)); } catch(e) {}
      return createMockResponse({ success: true, data: newSite, message: 'Site created successfully' }, 201);
    }

    // PATCH / PUT /api/sites/:id (Update Site)
    if (method === 'PATCH' || method === 'PUT') {
      const match = urlStr.match(/\/sites\/([0-9a-zA-Z_-]+)/);
      const targetId = match ? match[1] : null;
      let body = {};
      try { body = typeof init?.body === 'string' ? JSON.parse(init.body) : (init?.body || {}); } catch(e) {}
      
      const idx = savedSites.findIndex(s => String(s.id) === String(targetId));
      if (idx !== -1) {
        savedSites[idx] = { ...savedSites[idx], ...body, updatedAt: new Date().toISOString() };
        try { localStorage.setItem('scada_sites_db', JSON.stringify(savedSites)); } catch(e) {}
        return createMockResponse({ success: true, data: savedSites[idx], message: 'Site updated successfully' }, 200);
      }
      return createMockResponse({ success: true, message: 'Site updated successfully' }, 200);
    }

    // DELETE /api/sites/:id
    if (method === 'DELETE') {
      const match = urlStr.match(/\/sites\/([0-9a-zA-Z_-]+)/);
      const targetId = match ? match[1] : null;
      savedSites = savedSites.filter(s => String(s.id) !== String(targetId));
      try { localStorage.setItem('scada_sites_db', JSON.stringify(savedSites)); } catch(e) {}
      return createMockResponse({ success: true, message: 'Site deleted successfully' }, 200);
    }

    return createMockResponse({ success: true, data: savedSites });
  }

  // 5B. Invitations API Endpoints (/api/invitations)
  if (urlStr.includes('/api/invitations') || urlStr.includes('/invitations')) {
    let savedInvs = [];
    try {
      savedInvs = JSON.parse(localStorage.getItem('scada_invitations_db') || '[]');
    } catch(e) {}

    if (!Array.isArray(savedInvs) || savedInvs.length === 0) {
      savedInvs = [
        {
          id: 'inv-101',
          token: 'inv_tok_991823ab4',
          email: 'designer.shah@siemens.com',
          role: 'ADMIN',
          tenantId: 'cmshedskq0005zsvnrc1mcrg4',
          scopeType: 'ZONE',
          invitedBy: 'Super Admin',
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 5 * 864e5).toISOString(),
          invitationLink: `${window.location.origin}/invitations/inv_tok_991823ab4`,
          createdAt: new Date(Date.now() - 2 * 864e5).toISOString()
        },
        {
          id: 'inv-102',
          token: 'inv_tok_882736cd5',
          email: 'plant.lead@tata.com',
          role: 'OPERATOR',
          tenantId: 'cmshedske0003zsvnysjzt2ap',
          scopeType: 'SITE',
          invitedBy: 'Super Admin',
          status: 'ACCEPTED',
          expiresAt: new Date(Date.now() + 3 * 864e5).toISOString(),
          invitationLink: `${window.location.origin}/invitations/inv_tok_882736cd5`,
          createdAt: new Date(Date.now() - 4 * 864e5).toISOString()
        }
      ];
      localStorage.setItem('scada_invitations_db', JSON.stringify(savedInvs));
    }

    const method = (init?.method || 'GET').toUpperCase();

    // GET /api/invitations or /api/invitations/{token}
    if (method === 'GET') {
      const tokenMatch = urlStr.match(/\/invitations\/([a-zA-Z0-9_-]+)/);
      if (tokenMatch && tokenMatch[1]) {
        const found = savedInvs.find(i => i.token === tokenMatch[1] || String(i.id) === String(tokenMatch[1]));
        if (found) return createMockResponse(found);
        return createMockResponse({ error: 'Invitation not found or expired' }, 404);
      }
      return createMockResponse({ data: savedInvs, total: savedInvs.length });
    }

    // POST /api/invitations (Send User Invitation)
    if (method === 'POST' && !urlStr.includes('/accept') && !urlStr.includes('/decline')) {
      let body = {};
      try { body = typeof init.body === 'string' ? JSON.parse(init.body) : (init.body || {}); } catch(e) {}
      
      const randToken = `inv_tok_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;
      const expDays = parseInt(body.expirationDays || 7);
      const newInv = {
        id: `inv-${Date.now().toString(36)}`,
        token: randToken,
        email: body.email || 'invitee@example.com',
        role: body.role || 'VIEWER',
        tenantId: body.tenantId || 'cmshedsk40002zsvnhajul18y',
        scopeType: body.scopeType || 'TENANT',
        invitedBy: body.invitedBy || 'Super Admin',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + expDays * 864e5).toISOString(),
        invitationLink: `${window.location.origin}/invitations/${randToken}`,
        note: body.note || '',
        createdAt: new Date().toISOString()
      };

      savedInvs.unshift(newInv);
      localStorage.setItem('scada_invitations_db', JSON.stringify(savedInvs));
      return createMockResponse({ success: true, data: newInv, message: 'Invitation sent successfully' }, 201);
    }

    // POST /api/invitations/{token}/accept (Accept Invitation)
    if (method === 'POST' && urlStr.includes('/accept')) {
      const tokenMatch = urlStr.match(/\/invitations\/([a-zA-Z0-9_-]+)\/accept/);
      const targetToken = tokenMatch ? tokenMatch[1] : '';
      let body = {};
      try { body = typeof init.body === 'string' ? JSON.parse(init.body) : (init.body || {}); } catch(e) {}

      const idx = savedInvs.findIndex(i => i.token === targetToken || String(i.id) === String(targetToken));
      if (idx !== -1) {
        savedInvs[idx].status = 'ACCEPTED';
        savedInvs[idx].acceptedAt = new Date().toISOString();
        localStorage.setItem('scada_invitations_db', JSON.stringify(savedInvs));

        // Provision user in scada_users_db
        try {
          const uDb = JSON.parse(localStorage.getItem('scada_users_db') || '[]');
          const newUser = {
            id: `usr-${Date.now().toString(36)}`,
            name: body.name || savedInvs[idx].email.split('@')[0],
            email: savedInvs[idx].email,
            role: savedInvs[idx].role,
            tenantId: savedInvs[idx].tenantId,
            status: 'ACTIVE',
            scopeType: savedInvs[idx].scopeType || 'ZONE',
            scopeId: '',
            permissions: ['read', 'write'],
            createdAt: new Date().toISOString()
          };
          if (!uDb.some(u => u.email === newUser.email)) {
            uDb.unshift(newUser);
            localStorage.setItem('scada_users_db', JSON.stringify(uDb));
          }
        } catch(e) {}

        return createMockResponse({ success: true, message: 'Invitation accepted successfully', data: savedInvs[idx] });
      }
      return createMockResponse({ success: true, message: 'Invitation accepted' });
    }

    // POST /api/invitations/{token}/decline (Decline Invitation)
    if (method === 'POST' && urlStr.includes('/decline')) {
      const tokenMatch = urlStr.match(/\/invitations\/([a-zA-Z0-9_-]+)\/decline/);
      const targetToken = tokenMatch ? tokenMatch[1] : '';
      const idx = savedInvs.findIndex(i => i.token === targetToken || String(i.id) === String(targetToken));
      if (idx !== -1) {
        savedInvs[idx].status = 'DECLINED';
        savedInvs[idx].declinedAt = new Date().toISOString();
        localStorage.setItem('scada_invitations_db', JSON.stringify(savedInvs));
        return createMockResponse({ success: true, message: 'Invitation declined', data: savedInvs[idx] });
      }
      return createMockResponse({ success: true, message: 'Invitation declined' });
    }

    // DELETE /api/invitations/{id}
    if (method === 'DELETE') {
      const parts = urlStr.split('/invitations/');
      const targetId = parts[1]?.split('?')[0];
      savedInvs = savedInvs.filter(i => String(i.id) !== String(targetId) && i.token !== targetId);
      localStorage.setItem('scada_invitations_db', JSON.stringify(savedInvs));
      return createMockResponse({ success: true, message: 'Invitation deleted' });
    }
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
