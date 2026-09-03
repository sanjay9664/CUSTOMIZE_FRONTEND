import { useState, useCallback, useRef } from 'react';
import { getAuthToken } from '../../../../utils/cookieUtils';

export const API_BASE_URL = '/api';

export const getAuthHeaders = () => {
  const token = getAuthToken() || '';

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const normalizeList = (raw, key) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.data && Array.isArray(raw.data.data)) return raw.data.data;
  if (raw.data && Array.isArray(raw.data[key])) return raw.data[key];
  if (Array.isArray(raw[key])) return raw[key];
  return [];
};

export const useOrganizationData = () => {
  const [companies, setCompanies] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [sites, setSites] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [devices, setDevices] = useState([]);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [alarmsList, setAlarmsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const isInitialMount = useRef(true);

  const showToast = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  // Active Entity Helpers
  const activeCompanies = normalizeList(companies, 'companies').filter(c => c.status !== 'INACTIVE' && !c.deletedAt);
  const activeTenants = normalizeList(tenants, 'tenants').filter(t => t.status !== 'INACTIVE' && !t.deletedAt);
  const activeZones = normalizeList(zones, 'zones').filter(z => z.status !== 'INACTIVE' && !z.deletedAt);
  const activeAreas = normalizeList(areas, 'areas').filter(a => a.status !== 'INACTIVE' && !a.deletedAt);
  const activeSites = normalizeList(sites, 'sites').filter(s => s.status !== 'INACTIVE' && s.status !== 'DISABLED' && s.isActive !== false && !s.deletedAt);
  const activeBuildings = normalizeList(buildings, 'buildings').filter(b => b.isActive !== false && !b.deletedAt);
  const activeAssets = normalizeList(assets, 'assets').filter(a => a.status !== 'INACTIVE' && !a.deletedAt);
  const activeDevices = normalizeList(devices, 'devices').filter(d => d.isActive !== false && d.status !== 'DISABLED');

  return {
    companies, setCompanies,
    tenants, setTenants,
    zones, setZones,
    areas, setAreas,
    sites, setSites,
    buildings, setBuildings,
    assets, setAssets,
    devices, setDevices,
    telemetryLogs, setTelemetryLogs,
    reportsList, setReportsList,
    alarmsList, setAlarmsList,
    loading, setLoading,
    message, setMessage,
    isInitialMount,
    showToast,
    activeCompanies,
    activeTenants,
    activeZones,
    activeAreas,
    activeSites,
    activeBuildings,
    activeAssets,
    activeDevices,
    API_BASE_URL,
    getAuthHeaders
  };
};

export default useOrganizationData;
