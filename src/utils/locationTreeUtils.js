/**
 * Location Tree Utilities
 * Transforms hierarchical location and gateway/device data from both:
 * 1. Sochiot userZoneLocationVO (/auth-engine/user/me & /config-engine/entity)
 * 2. BMS REST entities (companies, tenants, zones, areas, sites)
 * into standardized multi-level Cascader tree data.
 */

/**
 * Parses a string value into entity type and numeric ID.
 * e.g. "ZONE-30" -> { type: 'ZONE', id: '30' }
 *      "CLUSTER@501@uuid" -> { type: 'CLUSTER', id: '501', uuid: 'uuid' }
 */
export const parseLocationValue = (val) => {
  if (!val) return null;
  if (typeof val === 'object') return val;
  if (val.includes('@')) {
    const parts = val.split('@');
    return { type: parts[0], id: parts[1], uuid: parts[2] };
  }
  if (val.includes('-')) {
    const parts = val.split('-');
    return { type: parts[0], id: parts[1] };
  }
  return { type: 'UNKNOWN', id: val };
};

/**
 * Builds cascader tree from Sochiot userZoneLocationVO (matching ismartaccess-frontend-v2).
 */
export const generateTreeFromSochiot = (userZoneLocationVO) => {
  if (!userZoneLocationVO) return [];

  const {
    companyList = [],
    clientList = [],
    zoneList = [],
    locationList = []
  } = userZoneLocationVO;

  const buildSubTree = (items, zoneNodeType) => {
    if (!Array.isArray(items) || items.length === 0) return [];

    return items.map((node) => {
      let children = [];
      if (node.consumers && node.consumers.length) {
        children.push(...buildSubTree(node.consumers, 'CLIENT'));
      }
      if (node.clientList && node.clientList.length) {
        children.push(...buildSubTree(node.clientList, 'CLIENT'));
      }
      if (node.zoneVOS && node.zoneVOS.length) {
        children.push(...buildSubTree(node.zoneVOS, 'ZONE'));
      }
      if (node.subZones && node.subZones.length) {
        children.push(...buildSubTree(node.subZones, 'ZONE'));
      }
      if (node.locations && node.locations.length) {
        children.push(...buildSubTree(node.locations, 'LOCATION'));
      }
      if (node.locationList && node.locationList.length) {
        children.push(...buildSubTree(node.locationList, 'LOCATION'));
      }

      const nodeVal = `${zoneNodeType}-${node.id}`;
      return {
        label: node.name || `Node #${node.id}`,
        value: nodeVal,
        key: nodeVal,
        id: String(node.id),
        type: zoneNodeType,
        data: node,
        children: children.length ? children : null
      };
    });
  };

  const companyTree = buildSubTree(companyList, 'COMPANY');
  const clientTree = buildSubTree(clientList, 'CLIENT');
  const zoneTree = buildSubTree(zoneList, 'ZONE');
  const locationTree = buildSubTree(locationList, 'LOCATION');

  return [...companyTree, ...clientTree, ...zoneTree, ...locationTree];
};

/**
 * Builds cascader tree from local BMS entities:
 * Company -> Tenant (Organization) -> Zone -> Area -> Site
 */
export const generateTreeFromBmsEntities = ({
  companies = [],
  tenants = [],
  zones = [],
  areas = [],
  sites = []
}) => {
  const safeCompanies = Array.isArray(companies) ? companies : [];
  const safeTenants = Array.isArray(tenants) ? tenants : [];
  const safeZones = Array.isArray(zones) ? zones : [];
  const safeAreas = Array.isArray(areas) ? areas : [];
  const safeSites = Array.isArray(sites) ? sites : [];

  // Helper to map sites
  const mapSiteNode = (s) => ({
    label: s.name || `Site #${s.id}`,
    value: `LOCATION-${s.id}`,
    key: `LOCATION-${s.id}`,
    id: String(s.id),
    type: 'LOCATION',
    siteId: String(s.id),
    data: s,
    children: null
  });

  // Helper to map areas
  const mapAreaNode = (a) => {
    const areaSites = safeSites.filter(s => String(s.areaId) === String(a.id));
    return {
      label: a.name || `Area #${a.id}`,
      value: `AREA-${a.id}`,
      key: `AREA-${a.id}`,
      id: String(a.id),
      type: 'AREA',
      data: a,
      children: areaSites.length ? areaSites.map(mapSiteNode) : null
    };
  };

  // Helper to map zones
  const mapZoneNode = (z) => {
    const zoneAreas = safeAreas.filter(a => String(a.zoneId) === String(z.id));
    const directSites = safeSites.filter(s => String(s.zoneId) === String(z.id) && !s.areaId);

    const children = [
      ...zoneAreas.map(mapAreaNode),
      ...directSites.map(mapSiteNode)
    ];

    return {
      label: z.name || `Zone #${z.id}`,
      value: `ZONE-${z.id}`,
      key: `ZONE-${z.id}`,
      id: String(z.id),
      type: 'ZONE',
      data: z,
      children: children.length ? children : null
    };
  };

  // Helper to map tenants
  const mapTenantNode = (t) => {
    const tenantZones = safeZones.filter(z => String(z.tenantId) === String(t.id));
    const directSites = safeSites.filter(s => String(s.tenantId) === String(t.id) && !s.zoneId && !s.areaId);

    const children = [
      ...tenantZones.map(mapZoneNode),
      ...directSites.map(mapSiteNode)
    ];

    return {
      label: t.name || `Org #${t.id}`,
      value: `CLIENT-${t.id}`,
      key: `CLIENT-${t.id}`,
      id: String(t.id),
      type: 'CLIENT',
      data: t,
      children: children.length ? children : null
    };
  };

  // If we have companies, group tenants under companies
  if (safeCompanies.length > 0) {
    return safeCompanies.map((c) => {
      const companyTenants = safeTenants.filter(t => String(t.companyId) === String(c.id));
      const orphanTenants = !c.id && companyTenants.length === 0 ? safeTenants : companyTenants;

      return {
        label: c.name || `Company #${c.id}`,
        value: `COMPANY-${c.id}`,
        key: `COMPANY-${c.id}`,
        id: String(c.id),
        type: 'COMPANY',
        data: c,
        children: orphanTenants.length ? orphanTenants.map(mapTenantNode) : null
      };
    });
  }

  // If no companies, root starts at Tenants
  if (safeTenants.length > 0) {
    return safeTenants.map(mapTenantNode);
  }

  // Fallback: flat zones or sites
  if (safeZones.length > 0) {
    return safeZones.map(mapZoneNode);
  }

  return safeSites.map(mapSiteNode);
};

/**
 * Transforms gateway and device hierarchy from /config-engine/entity response.
 * Matches ismartaccess-frontend-v2 getGatewayDeviceHierarchy.
 */
export const transformGatewayDeviceHierarchy = (locationVOS = []) => {
  if (!Array.isArray(locationVOS)) return [];

  const transformGateways = (gateways = [], orphanDevices = []) => {
    const list = gateways.map((node) => {
      const gType = node.gatewayType?.name || 'CLUSTER';
      const hasConn = !!node.hasDeviceConnectivity;

      let children = [];
      if (hasConn && Array.isArray(node.deviceEntityVOS)) {
        children = node.deviceEntityVOS.map((d) => ({
          id: String(d.id),
          label: d.name || `Device #${d.id}`,
          value: `DEVICE@${d.id}@${d.uuid || d.id}`,
          key: `DEVICE@${d.id}@${d.uuid || d.id}`,
          type: 'DEVICE',
          data: d,
          children: null
        }));
      } else if (Array.isArray(node.subGatewayVOS) && node.subGatewayVOS.length) {
        children = transformGateways(node.subGatewayVOS, []);
      }

      const val = `${gType}@${node.id}@${node.gatewayUuid || node.id}`;
      return {
        id: String(node.id),
        label: node.name || `${gType} #${node.id}`,
        value: val,
        key: val,
        type: gType,
        data: node,
        children: children.length ? children : null
      };
    });

    if (Array.isArray(orphanDevices) && orphanDevices.length) {
      orphanDevices.forEach((d) => {
        list.push({
          id: String(d.id),
          label: d.name || `Device #${d.id}`,
          value: `DEVICE@${d.id}@${d.uuid || d.id}`,
          key: `DEVICE@${d.id}@${d.uuid || d.id}`,
          type: 'DEVICE',
          data: d,
          children: null
        });
      });
    }

    return list;
  };

  const results = [];
  locationVOS.forEach((loc) => {
    const gwList = loc.gatewayVOList || [];
    const orphanList = loc.orphanDeviceVOList || [];
    results.push(...transformGateways(gwList, orphanList));
  });

  return results;
};

/**
 * Finds the path of nodes in a cascader tree matching a given value or ID.
 */
export const findPathInTree = (tree, predicate) => {
  if (!Array.isArray(tree)) return null;

  for (const node of tree) {
    if (predicate(node)) {
      return [node];
    }
    if (node.children && node.children.length) {
      const sub = findPathInTree(node.children, predicate);
      if (sub) {
        return [node, ...sub];
      }
    }
  }
  return null;
};

/**
 * Resolves a hierarchy path by target siteId or areaId or zoneId.
 */
export const resolveLocationPath = (tree, { siteId, areaId, zoneId }) => {
  if (!tree || !tree.length) return [];

  // Try finding by siteId first
  if (siteId) {
    const bySite = findPathInTree(tree, (n) => 
      (n.type === 'LOCATION' || n.type === 'SITE') && (String(n.id) === String(siteId) || String(n.data?.id) === String(siteId))
    );
    if (bySite) return bySite;
  }

  // Try by areaId
  if (areaId) {
    const byArea = findPathInTree(tree, (n) =>
      n.type === 'AREA' && (String(n.id) === String(areaId) || String(n.data?.id) === String(areaId))
    );
    if (byArea) return byArea;
  }

  // Try by zoneId
  if (zoneId) {
    const byZone = findPathInTree(tree, (n) =>
      n.type === 'ZONE' && (String(n.id) === String(zoneId) || String(n.data?.id) === String(zoneId))
    );
    if (byZone) return byZone;
  }

  return [];
};

/**
 * Formats a path of nodes into a human-readable display string.
 */
export const formatDisplayBreadcrumb = (pathNodes = [], displayOnlyChild = false) => {
  if (!Array.isArray(pathNodes) || pathNodes.length === 0) return '';
  if (displayOnlyChild) {
    return pathNodes[pathNodes.length - 1].label;
  }
  return pathNodes.map((n) => n.label).join(' > ');
};

export default {
  parseLocationValue,
  generateTreeFromSochiot,
  generateTreeFromBmsEntities,
  transformGatewayDeviceHierarchy,
  findPathInTree,
  resolveLocationPath,
  formatDisplayBreadcrumb
};
