
// 1. Authentication & Token Management
export const AUTH_ENDPOINTS = {
  SOCHIOT_ACCESS_TOKEN: '/api/v1/auth/Access-token',
  USER_ME: '/auth-engine/user/me',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  SUPER_ADMIN_LOGIN: '/super-admin/auth/login',
  CHANGE_PASSWORD: '/auth-engine/user/changePassword',
  RESET_PASSWORD: '/auth-engine/user/resetPassword'
};

// 2. Configuration & Entity Hierarchy Engine
export const CONFIG_ENDPOINTS = {
  // Lazy entity query: /config-engine/entity/{NODE_TYPE}/{NODE_ID}
  ENTITY_HIERARCHY: (nodeType, nodeId) => `/config-engine/entity/${nodeType}/${nodeId}`,
  LAUNCHPAD_HIERARCHY: '/config-engine/launchpad/hierarchy/',
  UNLINKED_CLUSTERS: '/config-engine/cluster/unlinkedClusters',
  UNLINKED_PANELS: (uuid) => `/config-engine/gateway/unlinked/subgateways/uuid/${uuid}`,
  UNLINKED_DEVICES: '/config-engine/device/unlinked/gatewayUUID',
  LINK_DEVICE: (deviceUUID, hardwareId) => `/config-engine/launchpad/deviceUUID/${deviceUUID}/hardwareId/${hardwareId}`,
  APPLICATION_CONFIG: '/config-engine/application'
};

// 3. Event Engine & Telemetry Reporting
export const EVENT_ENDPOINTS = {
  SYSTEM_EVENTS: '/event-engine/system-events',
  SYSTEM_EVENTS_CSV: '/event-engine/system-events/csv',
  SYSTEM_EVENTS_XLSX: '/event-engine/system-events/xlsx',
  NOTIFICATIONS_PING: '/event-engine/notification/ping',
  NOTIFICATIONS_FETCH: '/event-engine/fetch/notification'
};

// 4. View Engine & Custom Widgets / Templates
export const VIEW_ENDPOINTS = {
  CUSTOM_WIDGET_LIST: '/view-engine/custom-widget/list',
  DEVICE_WIDGET_TEMPLATE_LIST: '/view-engine/device-widget/template/list',
  HISTORICAL_RECORD_OPTIONS: '/view-engine/historical-record/options'
};

// 5. Native BMS Core Relational Entities
export const BMS_ENDPOINTS = {
  SITES: '/sites',
  DEVICES: '/devices',
  ASSETS: '/assets',
  COMPANIES: '/companies',
  TENANTS: '/tenants',
  ZONES: '/zones',
  AREAS: '/areas',
  BUILDINGS: '/buildings',
  REPORTS: '/reports',
  ALARMS: '/alarms',
  AUDIT_LOGS: '/audit-logs'
};

export default {
  AUTH: AUTH_ENDPOINTS,
  CONFIG: CONFIG_ENDPOINTS,
  EVENT: EVENT_ENDPOINTS,
  VIEW: VIEW_ENDPOINTS,
  BMS: BMS_ENDPOINTS
};
