/**
 * RBAC (Role-Based Access Control) Utility for BMS Platform
 * 
 * Complete definitions aligned with backend permissions.registry.ts & OpenAPI spec.
 * 
 * Core Rules:
 * 1. If no permission or feature is required, access is PERMITTED TO ALL.
 * 2. SUPER_ADMIN, isRootUser, or wildcard ('*') grants unconditional access to all tabs/actions.
 * 3. If a user has a permission, any permissions implied by it (via 'implies') are also granted.
 * 4. Tabs/features requiring permissions are visible only if the user has that permission.
 */

export const PERMISSION_DEFINITIONS = [
  // User & Role Management
  {
    code: 'user:read',
    name: 'Read Users',
    category: 'user',
    description: 'View user profiles, search users, and list tenant users',
    implies: [],
  },
  {
    code: 'user:write',
    name: 'Manage Users',
    category: 'user',
    description: 'Create, update, delete users, reset passwords, and toggle active status',
    implies: ['user:read'],
  },
  {
    code: 'role:manage',
    name: 'Manage Custom Roles',
    category: 'role',
    description: 'Create, edit, delete, and clone custom tenant roles and permission mappings',
    implies: ['user:write', 'user:read'],
  },

  // Device & Telemetry Management
  {
    code: 'device:read',
    name: 'Read Devices & Telemetry',
    category: 'device',
    description: 'View device telemetry, device profiles, sensors, and status',
    implies: [],
  },
  {
    code: 'device:write',
    name: 'Manage Devices',
    category: 'device',
    description: 'Create, edit, calibrate devices, configure thresholds/settings/rules, and resync telemetry',
    implies: ['device:read'],
  },
  {
    code: 'device:control',
    name: 'Send Device Commands',
    category: 'device',
    description: 'Send actuator commands, toggle relays, reboot, and dispatch control signals to devices',
    implies: ['device:read'],
  },
  {
    code: 'device:delete',
    name: 'Delete Devices',
    category: 'device',
    description: 'Soft delete or permanently remove devices from the system',
    implies: ['device:write'],
  },
  {
    code: 'profile:manage',
    name: 'Manage Device Profiles',
    category: 'device',
    description: 'Create, update, and delete hardware device profiles and registers',
    implies: ['device:read'],
  },

  // Ticketing
  {
    code: 'ticket:read',
    name: 'Read Tickets',
    category: 'ticket',
    description: 'View incident and maintenance tickets and comments',
    implies: [],
  },
  {
    code: 'ticket:write',
    name: 'Create & Update Tickets',
    category: 'ticket',
    description: 'Create new tickets and add status comments',
    implies: ['ticket:read'],
  },
  {
    code: 'ticket:manage',
    name: 'Manage & Assign Tickets',
    category: 'ticket',
    description: 'Update ticket priority, assign tickets to technicians, and delete tickets',
    implies: ['ticket:write', 'ticket:read'],
  },

  // Reports
  {
    code: 'report:read',
    name: 'Read Reports',
    category: 'report',
    description: 'View saved and historical system reports',
    implies: [],
  },
  {
    code: 'report:generate',
    name: 'Generate Reports',
    category: 'report',
    description: 'Trigger ad-hoc report generation and export CSV/PDF',
    implies: ['report:read'],
  },
  {
    code: 'report:manage',
    name: 'Manage Report Templates',
    category: 'report',
    description: 'Save custom report configurations and delete saved reports',
    implies: ['report:generate', 'report:read'],
  },

  // Site, Building, Area & Zone Management
  {
    code: 'site:read',
    name: 'Read Sites & Hierarchy',
    category: 'site',
    description: 'View physical sites, buildings, floor areas, and zones',
    implies: [],
  },
  {
    code: 'site:manage',
    name: 'Manage Sites & Areas',
    category: 'site',
    description: 'Create, update, and delete sites, buildings, and physical floor areas',
    implies: ['site:read'],
  },
  {
    code: 'zone:manage',
    name: 'Manage Zones',
    category: 'site',
    description: 'Create, update, and delete geographic zones',
    implies: ['site:read'],
  },
  {
    code: 'area:manage',
    name: 'Manage Tenant Areas',
    category: 'site',
    description: 'Create, update, and delete logical tenant areas',
    implies: ['site:read'],
  },

  // Alarm System
  {
    code: 'alarm:read',
    name: 'Read Alarms',
    category: 'alarm',
    description: 'View active and historical system alarms',
    implies: [],
  },
  {
    code: 'alarm:write',
    name: 'Configure Alarms',
    category: 'alarm',
    description: 'Create and update alert thresholds and automation rules',
    implies: ['alarm:read'],
  },
  {
    code: 'alarm:ack',
    name: 'Acknowledge Alarms',
    category: 'alarm',
    description: 'Acknowledge, silence, and clear alarms',
    implies: ['alarm:read'],
  },

  // Dashboard & Widgets
  {
    code: 'dashboard:read',
    name: 'View Dashboards',
    category: 'dashboard',
    description: 'View dashboard metrics, charts, and telemetry widgets',
    implies: [],
  },
  {
    code: 'dashboard:write',
    name: 'Manage Dashboards',
    category: 'dashboard',
    description: 'Customize layout, add/edit widgets, and configure dashboard templates',
    implies: ['dashboard:read'],
  },

  // DG (Diesel Generator)
  {
    code: 'dg:read',
    name: 'Read DG Telemetry',
    category: 'dg',
    description: 'View DG operational parameters, run hours, and fuel levels',
    implies: [],
  },
  {
    code: 'dg:write',
    name: 'Control DG (UI)',
    category: 'dg',
    description: 'UI-level DG operations and parameter views',
    implies: ['dg:read'],
  },
  {
    code: 'dg:manage',
    name: 'Manage DG Operations',
    category: 'dg',
    description: 'Record DG run hours, fuel delivery logs, and battery maintenance',
    implies: ['dg:write', 'dg:read'],
  },

  // Energy & Power Metering
  {
    code: 'energy:read',
    name: 'Read Energy Meters',
    category: 'energy',
    description: 'View energy consumption, active power, and demand profiles',
    implies: [],
  },
  {
    code: 'energy:write',
    name: 'Configure Energy (UI)',
    category: 'energy',
    description: 'UI-level energy configurations and views',
    implies: ['energy:read'],
  },
  {
    code: 'energy:manage',
    name: 'Manage Energy Groups',
    category: 'energy',
    description: 'Create, update, and delete logical energy aggregation groups',
    implies: ['energy:write', 'energy:read'],
  },

  // HVAC, VRV & AC
  {
    code: 'hvac:read',
    name: 'Read HVAC & Climate',
    category: 'hvac',
    description: 'View chillers, AHUs, cooling towers, VRV, and AC status',
    implies: [],
  },
  {
    code: 'hvac:write',
    name: 'Control HVAC & Setpoints',
    category: 'hvac',
    description: 'Adjust temperature setpoints, fan speeds, and chiller schedules',
    implies: ['hvac:read'],
  },

  // Water Management
  {
    code: 'water:read',
    name: 'Read Water Systems',
    category: 'water',
    description: 'View underground / overhead tank levels, flow rates, and water quality',
    implies: [],
  },
  {
    code: 'water:write',
    name: 'Control Water Systems',
    category: 'water',
    description: 'Operate water pumps and motorized valves',
    implies: ['water:read'],
  },

  // Motors
  {
    code: 'motor:read',
    name: 'Read Motors',
    category: 'motor',
    description: 'View motor status, vibration, current, and run hours',
    implies: [],
  },
  {
    code: 'motor:write',
    name: 'Control Motors',
    category: 'motor',
    description: 'Start/stop motors and set operational modes',
    implies: ['motor:read'],
  },

  // LT Panel
  {
    code: 'ltpanel:read',
    name: 'Read LT Panels',
    category: 'ltpanel',
    description: 'View breaker status, bus voltage, and feeder load',
    implies: [],
  },
  {
    code: 'ltpanel:write',
    name: 'Control LT Panels',
    category: 'ltpanel',
    description: 'Configure breakers and feeder thresholds',
    implies: ['ltpanel:read'],
  },

  // Transformer
  {
    code: 'transformer:read',
    name: 'Read Transformers',
    category: 'transformer',
    description: 'View winding/oil temperatures, tap positions, and loading',
    implies: [],
  },
  {
    code: 'transformer:write',
    name: 'Configure Transformers',
    category: 'transformer',
    description: 'Set temperature alert limits and transformer parameters',
    implies: ['transformer:read'],
  },

  // Fire Safety
  {
    code: 'fire:read',
    name: 'Read Fire Systems',
    category: 'fire',
    description: 'View fire alarm panels, smoke detectors, and jockey pumps',
    implies: [],
  },
  {
    code: 'fire:write',
    name: 'Control Fire Panels',
    category: 'fire',
    description: 'Silence, reset, and test fire alarm systems',
    implies: ['fire:read'],
  },

  // Daily DPR
  {
    code: 'dpr:read',
    name: 'Read Daily DPR',
    category: 'dpr',
    description: 'View daily plant progress reports and checklists',
    implies: [],
  },
  {
    code: 'dpr:write',
    name: 'Submit Daily DPR',
    category: 'dpr',
    description: 'Fill, submit, and approve daily plant operational reports',
    implies: ['dpr:read'],
  },

  // Service History
  {
    code: 'service:read',
    name: 'Read Service History',
    category: 'service',
    description: 'View equipment servicing, breakdown history, and repair logs',
    implies: [],
  },
  {
    code: 'service:write',
    name: 'Record Service History',
    category: 'service',
    description: 'Log vendor service visits, part replacements, and repairs',
    implies: ['service:read'],
  },

  // Maintenance
  {
    code: 'maintenance:read',
    name: 'Read Maintenance Schedules',
    category: 'maintenance',
    description: 'View scheduled preventive maintenance and calibration routines',
    implies: [],
  },
  {
    code: 'maintenance:write',
    name: 'Configure Maintenance',
    category: 'maintenance',
    description: 'Create and update preventive maintenance tasks and schedules',
    implies: ['maintenance:read'],
  },

  // AQI (Air Quality)
  {
    code: 'aqi:read',
    name: 'Read AQI Monitors',
    category: 'aqi',
    description: 'View PM2.5, PM10, CO2, TVOC, temperature, and humidity sensors',
    implies: [],
  },
  {
    code: 'aqi:write',
    name: 'Configure AQI Ranges',
    category: 'aqi',
    description: 'Configure AQI warning thresholds and acceptable ranges',
    implies: ['aqi:read'],
  },

  // Asset Tree
  {
    code: 'asset:read',
    name: 'Read Asset Hierarchy',
    category: 'asset',
    description: 'View physical and logical asset tree',
    implies: [],
  },
  {
    code: 'asset:write',
    name: 'Manage Asset Hierarchy',
    category: 'asset',
    description: 'Create, move, update, and delete equipment in the asset hierarchy',
    implies: ['asset:read'],
  },
];

// Direct implies lookup
const DIRECT_IMPLIES = {};
PERMISSION_DEFINITIONS.forEach(def => {
  if (def.implies && def.implies.length > 0) {
    DIRECT_IMPLIES[def.code] = def.implies;
  }
});

/**
 * Recursively resolves all implied permissions from an input list of permission codes.
 * E.g., ['water:write'] -> ['water:write', 'water:read']
 * E.g., ['role:manage'] -> ['role:manage', 'user:write', 'user:read']
 * @param {string[]} permissions 
 * @returns {string[]} Transitive closure of permission codes
 */
export const resolveImpliedPermissions = (permissions) => {
  if (!Array.isArray(permissions)) return [];
  const result = new Set();
  const queue = [...permissions];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || result.has(current)) continue;
    result.add(current);

    const implied = DIRECT_IMPLIES[current];
    if (implied && Array.isArray(implied)) {
      for (const imp of implied) {
        if (!result.has(imp)) {
          queue.push(imp);
        }
      }
    }
  }

  return Array.from(result);
};

/**
 * Cross-mapping of standard permissions to alternate forms & Sochiot authority strings.
 */
export const PERMISSION_MAPPINGS = {
  // User Management
  'user:read': ['user:read', 'user:write', 'role:manage', 'user:*', 'PERM_ORG_MANAGE_ORGANIZATION_USERS', 'PERM_MANAGE_ADMINISTRATORS'],
  'user:write': ['user:write', 'role:manage', 'user:*', 'PERM_ORG_MANAGE_ORGANIZATION_USERS', 'PERM_MANAGE_ADMINISTRATORS'],
  'role:manage': ['role:manage', 'role:*', 'PERM_ORG_MANAGE_ORGANIZATION_ROLES', 'PERM_MANAGE_SYSTEM_ROLES'],

  // Device & Gateway Management
  'device:read': ['device:read', 'device:write', 'device:control', 'device:delete', 'profile:manage', 'device:*', 'PERM_INST_MANAGE_DEVICE', 'PERM_INST_MANAGE_DEVICE_TEMPLATE', 'PERM_INST_MANAGE_GATEWAY'],
  'device:write': ['device:write', 'device:delete', 'device:*', 'PERM_INST_MANAGE_DEVICE', 'PERM_INST_MANAGE_DEVICE_TEMPLATE'],
  'device:control': ['device:control', 'device:*', 'PERM_INST_MANAGE_DEVICE'],
  'device:delete': ['device:delete', 'device:*', 'PERM_INST_MANAGE_DEVICE'],
  'profile:manage': ['profile:manage', 'device:*', 'PERM_INST_MANAGE_DEVICE_TEMPLATE'],

  // Ticketing
  'ticket:read': ['ticket:read', 'ticket:write', 'ticket:manage', 'ticket:*'],
  'ticket:write': ['ticket:write', 'ticket:manage', 'ticket:*'],
  'ticket:manage': ['ticket:manage', 'ticket:*'],

  // Reports & Analytics
  'report:read': ['report:read', 'report:generate', 'report:manage', 'report:*', 'PERM_MANAGE_REPORTS_ANALYTICS'],
  'report:generate': ['report:generate', 'report:manage', 'report:*', 'PERM_MANAGE_REPORTS_ANALYTICS'],
  'report:manage': ['report:manage', 'report:*', 'PERM_MANAGE_REPORTS_ANALYTICS'],

  // Site, Building, Area & Zone Management
  'site:read': ['site:read', 'site:manage', 'zone:manage', 'area:manage', 'site:*', 'location:read', 'location:manage', 'location:*', 'PERM_MANAGE_LOCATIONS'],
  'site:manage': ['site:manage', 'site:*', 'location:write', 'location:manage', 'location:*', 'PERM_MANAGE_LOCATIONS'],
  'zone:manage': ['zone:manage', 'location:write', 'location:manage', 'location:*', 'PERM_MANAGE_LOCATIONS'],
  'area:manage': ['area:manage', 'location:write', 'location:manage', 'location:*', 'PERM_MANAGE_LOCATIONS'],

  // Alarm System
  'alarm:read': ['alarm:read', 'alarm:write', 'alarm:ack', 'alarm:*', 'PERM_ORG_MANAGE_CHECK_ACCESS_LOG', 'PERM_INST_SYSTEM_EVENTS'],
  'alarm:write': ['alarm:write', 'alarm:*', 'PERM_ORG_MANAGE_CHECK_ACCESS_LOG', 'PERM_INST_SYSTEM_EVENTS'],
  'alarm:ack': ['alarm:ack', 'alarm:*', 'PERM_ORG_MANAGE_CHECK_ACCESS_LOG', 'PERM_INST_SYSTEM_EVENTS'],

  // Dashboard & Widgets
  'dashboard:read': ['dashboard:read', 'dashboard:write', 'dashboard:*'],
  'dashboard:write': ['dashboard:write', 'dashboard:*'],

  // DG (Diesel Generator)
  'dg:read': ['dg:read', 'dg:write', 'dg:manage', 'dg:*'],
  'dg:write': ['dg:write', 'dg:manage', 'dg:*'],
  'dg:manage': ['dg:manage', 'dg:*'],

  // Energy & Power Metering
  'energy:read': ['energy:read', 'energy:write', 'energy:manage', 'energy:*'],
  'energy:write': ['energy:write', 'energy:manage', 'energy:*'],
  'energy:manage': ['energy:manage', 'energy:*'],

  // HVAC, VRV & AC
  'hvac:read': ['hvac:read', 'hvac:write', 'hvac:*'],
  'hvac:write': ['hvac:write', 'hvac:*'],

  // Water Management
  'water:read': ['water:read', 'water:write', 'water:*'],
  'water:write': ['water:write', 'water:*'],

  // Motors
  'motor:read': ['motor:read', 'motor:write', 'motor:*'],
  'motor:write': ['motor:write', 'motor:*'],

  // LT Panel
  'ltpanel:read': ['ltpanel:read', 'ltpanel:write', 'ltpanel:*'],
  'ltpanel:write': ['ltpanel:write', 'ltpanel:*'],

  // Transformer
  'transformer:read': ['transformer:read', 'transformer:write', 'transformer:*'],
  'transformer:write': ['transformer:write', 'transformer:*'],

  // Fire Safety
  'fire:read': ['fire:read', 'fire:write', 'fire:*'],
  'fire:write': ['fire:write', 'fire:*'],

  // Daily DPR
  'dpr:read': ['dpr:read', 'dpr:write', 'dpr:*', 'PERM_MANAGE_REPORTS_ANALYTICS'],
  'dpr:write': ['dpr:write', 'dpr:*', 'PERM_MANAGE_REPORTS_ANALYTICS'],

  // Service History
  'service:read': ['service:read', 'service:write', 'service:*'],
  'service:write': ['service:write', 'service:*'],

  // Maintenance
  'maintenance:read': ['maintenance:read', 'maintenance:write', 'maintenance:*'],
  'maintenance:write': ['maintenance:write', 'maintenance:*'],

  // AQI (Air Quality)
  'aqi:read': ['aqi:read', 'aqi:write', 'aqi:*'],
  'aqi:write': ['aqi:write', 'aqi:*'],

  // Asset Tree
  'asset:read': ['asset:read', 'asset:write', 'asset:*', 'location:read', 'PERM_MANAGE_LOCATIONS'],
  'asset:write': ['asset:write', 'asset:*', 'location:write', 'PERM_MANAGE_LOCATIONS'],

  // Audit Logs
  'audit:read': ['audit:read', 'audit:manage', 'audit:*', 'PERM_MANAGE_AUDIT_TRAIL'],

  // Settings & Configuration
  'settings:read': ['settings:read', 'settings:manage', 'settings:*', 'PERM_ORG_MANAGE_MODULE_SETTINGS'],
  'settings:write': ['settings:write', 'settings:manage', 'settings:*', 'PERM_ORG_MANAGE_MODULE_SETTINGS'],

  // Organization Management
  'organization:read': ['organization:read', 'organization:manage', 'organization:*', 'PERM_MANAGE_SAAS_ORG', 'PERM_MANAGE_COMPANY_ORG', 'PERM_MANAGE_CLIENT_ORG'],
  'organization:write': ['organization:write', 'organization:manage', 'organization:*', 'PERM_MANAGE_SAAS_ORG', 'PERM_MANAGE_COMPANY_ORG', 'PERM_MANAGE_CLIENT_ORG'],
};

/**
 * Extracts and normalizes all permissions, authorities, and implied permissions from a user object.
 * @param {Object} user 
 * @returns {string[]} Normalized list of user permission codes
 */
export const extractUserPermissions = (user) => {
  if (!user || typeof user !== 'object') return [];

  const rawList = [
    ...(Array.isArray(user.permissions) ? user.permissions : []),
    ...(Array.isArray(user.resolvedPermissions) ? user.resolvedPermissions : []),
    ...(Array.isArray(user.authorities) ? user.authorities : []),
    ...(Array.isArray(user.permissionCodes) ? user.permissionCodes : [])
  ];

  const filtered = rawList
    .filter(p => typeof p === 'string' && p.trim() !== '')
    .map(p => p.trim());

  return resolveImpliedPermissions(filtered);
};

/**
 * Determines whether the user has a specific permission.
 * 
 * Rules:
 * 1. If requiredPermission is null/undefined/empty, returns TRUE (permitted to all).
 * 2. If user is Super Admin or root user, returns TRUE.
 * 3. If requiredFeature is provided, verifies user.features[requiredFeature] !== false.
 * 4. Checks user permissions against required permission, wildcards (module:*), and authority mappings.
 * 
 * @param {Object} user Current authenticated user profile
 * @param {string|string[]} [requiredPermission] Permission code or array of alternate codes
 * @param {string} [requiredFeature] Optional feature flag key from user.features
 * @returns {boolean} Whether access is granted
 */
export const checkPermission = (user, requiredPermission, requiredFeature = null) => {
  // If nothing is required, permit to all
  if (!requiredPermission && !requiredFeature) {
    return true;
  }

  if (!user) return false;

  const role = String(user.role || user.userRole || '').toUpperCase();
  const isSuper = role === 'SUPER_ADMIN' || user.isRootUser === true;

  // Super admin always has full access
  if (isSuper) {
    return true;
  }

  // Feature flag check (from user.features in OpenAPI schema)
  if (requiredFeature) {
    if (user.features && typeof user.features === 'object') {
      if (user.features[requiredFeature] === false) {
        return false;
      }
    }
  }

  // If only feature flag was required and not blocked, grant access
  if (!requiredPermission) {
    return true;
  }

  const userPerms = extractUserPermissions(user);

  // Wildcard permissions
  if (userPerms.includes('*') || userPerms.includes('PERM_SUPER_ADMIN')) {
    return true;
  }

  // Collect target permission candidates to check
  const requiredList = Array.isArray(requiredPermission)
    ? requiredPermission
    : [requiredPermission];

  for (const perm of requiredList) {
    if (!perm) continue;

    // Direct match (including implied matches since extractUserPermissions resolved them)
    if (userPerms.includes(perm)) return true;

    // Case-insensitive direct match
    const permLower = perm.toLowerCase();
    if (userPerms.some(p => p.toLowerCase() === permLower)) return true;

    // Wildcard matching (e.g. user has 'device:*', required is 'device:read')
    const [module] = perm.split(':');
    if (module && userPerms.includes(`${module}:*`)) return true;

    // Mappings / Synonyms match
    const mappedSynonyms = PERMISSION_MAPPINGS[perm] || [];
    for (const syn of mappedSynonyms) {
      if (userPerms.includes(syn)) return true;
      if (userPerms.some(p => p.toLowerCase() === syn.toLowerCase())) return true;
    }
  }

  return false;
};

/**
 * Checks whether user has one of the allowed roles.
 * @param {Object} user 
 * @param {string[]} allowedRoles 
 * @returns {boolean}
 */
export const checkRole = (user, allowedRoles = []) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!user) return false;

  const currentRole = String(user.role || user.userRole || '').toUpperCase();
  if (currentRole === 'SUPER_ADMIN' || user.isRootUser === true) return true;

  return allowedRoles.some(r => r.toUpperCase() === currentRole);
};

/**
 * Checks whether user has a specific feature enabled.
 * @param {Object} user 
 * @param {string} featureKey 
 * @returns {boolean}
 */
export const checkFeature = (user, featureKey) => {
  if (!featureKey) return true;
  if (!user) return false;

  if (user.role === 'SUPER_ADMIN' || user.isRootUser === true) return true;
  if (!user.features || typeof user.features !== 'object') return true;

  return user.features[featureKey] !== false;
};

/**
 * Determines the default landing route after login or when hitting '/' based on user permissions.
 * Prioritizes Dashboard, then operational modules according to user's permitted tabs.
 * @param {Object} user 
 * @returns {string} Route pathname
 */
export const getDefaultLandingRoute = (user) => {
  if (!user) return '/dashboard';

  const role = String(user.role || user.userRole || '').toUpperCase();
  if (role === 'SUPER_ADMIN' || user.isRootUser === true) {
    return '/dashboard';
  }

  const landingPriority = [
    { perm: 'dashboard:read', route: '/dashboard' },
    { perm: 'energy:read', route: '/energy-metering/overview' },
    { perm: 'dg:read', route: '/dg-set/overview' },
    { perm: 'water:read', route: '/water-management/overview' },
    { perm: 'hvac:read', route: '/hvac/chiller' },
    { perm: 'ltpanel:read', route: '/lt-panel/overview' },
    { perm: 'transformer:read', route: '/transformer/overview' },
    { perm: 'motor:read', route: '/motors/overview' },
    { perm: 'fire:read', route: '/fire-pumps/overview' },
    { perm: 'aqi:read', route: '/aqi-sensor/overview' },
    { perm: 'alarm:read', route: '/alarm-system/overview' },
    { perm: 'ticket:read', route: '/ticketing' },
    { perm: 'maintenance:read', route: '/maintenance/scheduled' },
    { perm: 'service:read', route: '/service/equipment' },
    { perm: 'dpr:read', route: '/daily-dpr/overview' },
    { perm: 'audit:read', route: '/audit-logs' },
    { perm: 'user:read', route: '/admin/manage-users' },
    { perm: 'settings:read', route: '/settings' },
  ];

  for (const item of landingPriority) {
    if (checkPermission(user, item.perm)) {
      return item.route;
    }
  }

  // Fallback for user without operational permissions
  return '/help/feedback';
};

export default {
  PERMISSION_DEFINITIONS,
  PERMISSION_MAPPINGS,
  resolveImpliedPermissions,
  extractUserPermissions,
  checkPermission,
  checkRole,
  checkFeature,
  getDefaultLandingRoute
};
