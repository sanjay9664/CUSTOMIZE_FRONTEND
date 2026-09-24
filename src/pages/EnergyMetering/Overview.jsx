import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Row, Col, Card, Container, Button, Spinner, Alert } from 'react-bootstrap';
import { Zap, RefreshCw, AlertTriangle, Clock, Layers, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageContextBanner from '../../components/PageContextBanner';
import { useSiteStore } from '../../context/SiteContext';
import { useDeviceStatus } from '../../services/DeviceStatusContext';
import { useTheme } from '../../context/ThemeContext';
import { bmsService } from '../../services/bmsService';
import { apiClient, getAuthHeaders, normalizeList } from '../../services/apiClient';
import { getApiUrl } from '../../utils/apiConfig';
import { mapLatestEventsToTelemetry } from './utils/energyTelemetry';
import SolarDashboard from './SolarDashboard';

/**
 * Categorize raw device list into the 5 core SCADA energy categories:
 * 1. MAIN_ENERGY_METER
 * 2. SUB_METER / SUB_ENERGY_METER
 * 3. SOLAR_SYSTEM / INVERTER
 * 4. UPS
 * 5. DG_SET / GENERATOR
 */
const categorizeDevices = (devices = []) => {
  const mainMeters = [];
  const subMeters = [];
  const solarDevices = [];
  const upsDevices = [];
  const dgDevices = [];

  devices.forEach(d => {
    const cat = String(d.category || '').toUpperCase().trim();
    const name = String(d.name || d.deviceName || d.title || '').toUpperCase().trim();
    const moduleName = String(d.module || '').toUpperCase().trim();

    if (
      cat === 'MAIN_ENERGY_METER' ||
      moduleName.includes('MAIN METER') ||
      name.includes('MAIN METER') ||
      name.includes('MAIN INCOMER') ||
      name.includes('GRID INCOMER')
    ) {
      mainMeters.push(d);
    } else if (
      cat === 'SOLAR_SYSTEM' ||
      cat === 'INVERTER' ||
      cat === 'SOLAR' ||
      cat === 'SOLAR_PLANT' ||
      name.includes('SOLAR') ||
      name.includes('PV PLANT')
    ) {
      solarDevices.push(d);
    } else if (
      cat === 'UPS' ||
      name.includes('UPS') ||
      name.includes('BATTERY BANK')
    ) {
      upsDevices.push(d);
    } else if (
      cat === 'GENERATOR' ||
      cat === 'DG_SET' ||
      cat === 'DG' ||
      name.includes('DG SET') ||
      name.includes('GENERATOR') ||
      name.includes('DIESEL')
    ) {
      dgDevices.push(d);
    } else if (
      cat === 'SUB_ENERGY_METER' ||
      cat === 'ENERGY_METER'
    ) {
      // Sub-meters / Feeders — strict category match only
      subMeters.push(d);
    }
    // All other categories (sensors, controllers, etc.) are ignored in this view
  });

  return {
    mainMeter: mainMeters[0] || null,
    solarDevice: solarDevices[0] || null,
    upsDevice: upsDevices[0] || null,
    dgDevice: dgDevices[0] || null,
    subMeters
  };
};

/**
 * Format and normalize device telemetry updates
 */
const extractDeviceMetrics = (device, telemetryUpdates = {}) => {
  if (!device) {
    return {
      name: '',
      powerW: 0,
      vR: 0,
      iR: 0,
      voltage: '—',
      current: '—',
      freq: '—',
      todayKwh: '0.00',
      soc: 0,
      chargingStatus: 'Not Configured',
      todayCharge: '—',
      status: 'Not Configured',
      isOnline: false,
      isConfigured: false
    };
  }

  const updates = telemetryUpdates || {};

  // Active Power (kW or W)
  const rawPower =
    updates.totalKw ??
    updates.activePower ??
    updates.solarGenerationPower ??
    updates.outputPower ??
    updates.totalActivePower;

  let powerW = 0;
  if (rawPower !== undefined && rawPower !== null) {
    const num = Number(rawPower);
    if (!isNaN(num)) {
      // If < 500, assumed in kW (e.g. 0.926 kW -> 926 W)
      powerW = num < 500 ? Math.round(num * 1000) : Math.round(num);
    }
  }

  // Voltages
  const vR =
    updates.vR ??
    updates.acOutputVoltage ??
    updates.dcInputVoltage ??
    updates.voltage ??
    updates.batteryVoltage;

  const voltage = vR !== undefined && vR !== null ? Number(vR).toFixed(1) : '0.0';

  // Currents
  const iR =
    updates.iR ??
    updates.acOutputCurrent ??
    updates.dcInputCurrent ??
    updates.current ??
    updates.batteryCurrent;

  const current = iR !== undefined && iR !== null ? Number(iR).toFixed(2) : '0.00';

  // Frequency
  const freq =
    updates.freq !== undefined && updates.freq !== null
      ? Number(updates.freq).toFixed(1)
      : '50.0';

  // Energy
  const rawKwh =
    updates.ebKwh ??
    updates.dailyEnergyGeneration ??
    updates.dgKwh ??
    updates.cumulativekWh ??
    updates.kwh;

  let todayKwh = '0.00';
  if (rawKwh !== undefined && rawKwh !== null) {
    const numKwh = Number(rawKwh);
    if (!isNaN(numKwh)) todayKwh = numKwh.toFixed(2);
  }

  // Battery SoC for UPS
  const rawSoc =
    updates.batteryStateOfCharge ??
    updates.batterySoc ??
    updates.upsLoad ??
    updates.batteryCapacity;

  let soc = 0;
  if (rawSoc !== undefined && rawSoc !== null) {
    const numSoc = Number(rawSoc);
    if (!isNaN(numSoc)) soc = Math.min(100, Math.max(0, numSoc));
  }

  // Status
  const isOnline = Boolean(
    device.status === 'ONLINE' ||
    device.isActive ||
    updates.commStatus === 1 ||
    powerW > 0 ||
    (vR && Number(vR) > 50)
  );

  return {
    id: String(device.id || device.deviceId || ''),
    name: device.name || device.deviceName || device.title || 'Device',
    category: device.category,
    powerW,
    vR: vR !== undefined ? Number(vR) : undefined,
    iR: iR !== undefined ? Number(iR) : undefined,
    voltage,
    current,
    freq,
    todayKwh,
    soc,
    chargingStatus: updates.batteryChargingStatus || (Number(current) > 0 ? 'Charging' : 'Normal'),
    todayCharge: updates.batteryRuntimeRemaining
      ? `${updates.batteryRuntimeRemaining} min`
      : `${todayKwh} kWh`,
    status: updates.runStatus || (powerW > 50 ? 'RUNNING' : 'STANDBY'),
    isOnline,
    isConfigured: true,
    rawDevice: device
  };
};

const EnergyMeteringOverview = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { sites: allSites, selectedSite, setSelectedSite } = useSiteStore();
  const { getOverallStatus } = useDeviceStatus();

  // Site selection state
  const [selectedSiteId, setSelectedSiteId] = useState(() => {
    return (
      localStorage.getItem('selected_energy_overview_site_id') ||
      localStorage.getItem('selected_main_meter_site_id') ||
      (selectedSite?.id ? String(selectedSite.id) : '') ||
      ''
    );
  });

  // Devices & Telemetry states
  const [siteDevices, setSiteDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [telemetryMap, setTelemetryMap] = useState(new Map());
  const [fetchError, setFetchError] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Active request tracking to prevent race conditions during rapid site changes
  const activeRequestIdRef = useRef(0);

  // Synchronize selected site with available sites
  useEffect(() => {
    if (Array.isArray(allSites) && allSites.length > 0) {
      const match = allSites.find(s => String(s.id || s.siteId || s._id) === String(selectedSiteId));
      if (!match) {
        const firstId = String(allSites[0].id || allSites[0].siteId || allSites[0]._id);
        setSelectedSiteId(firstId);
        localStorage.setItem('selected_energy_overview_site_id', firstId);
        if (setSelectedSite) setSelectedSite(allSites[0]);
      } else {
        if (setSelectedSite && selectedSite?.id !== match.id) {
          setSelectedSite(match);
        }
      }
    }
  }, [allSites, selectedSiteId, setSelectedSite, selectedSite]);

  // Site selector configuration for the PageContextBanner
  const siteSelector = useMemo(() => {
    const siteOptions = (allSites && allSites.length > 0)
      ? allSites.map(s => ({
          value: String(s.id || s._id || s.siteId),
          label: s.name || s.siteName || s.title || `Site ${s.id}`
        }))
      : [{ value: '1', label: 'Main Facility Site' }];

    const currentVal = selectedSiteId || siteOptions[0]?.value;

    return {
      value: currentVal,
      options: siteOptions,
      onChange: (newId) => {
        if (!newId || String(newId) === String(selectedSiteId)) return;
        setSelectedSiteId(String(newId));
        localStorage.setItem('selected_energy_overview_site_id', String(newId));
        const found = allSites?.find(s => String(s.id || s._id || s.siteId) === String(newId));
        if (found && setSelectedSite) {
          setSelectedSite(found);
        }
      },
      ariaLabel: 'Select Site'
    };
  }, [allSites, selectedSiteId, setSelectedSite]);

  // Fetch devices for the selected site
  useEffect(() => {
    if (!selectedSiteId) {
      setSiteDevices([]);
      setTelemetryMap(new Map());
      return;
    }

    const currentRequestId = ++activeRequestIdRef.current;
    let isMounted = true;
    setDevicesLoading(true);
    setFetchError(null);

    const fetchAllSiteDevices = async () => {
      try {
        const targetSite = String(selectedSiteId);
        const deviceMap = new Map();

        // Parallel category and site-scoped queries to guarantee all devices are discovered
        const fetchTasks = [
          // 1. Generic site device list
          bmsService.getSiteDevices(targetSite, { include: 'settings,rules,profile', limit: 200 }).catch(() => null),
          // 2. Unfiltered /devices endpoint fallback
          apiClient.get('/devices', { siteId: targetSite, include: 'settings,rules,profile', limit: 200 }).catch(() => null),
          // 3. Category-specific queries
          apiClient.get('/devices', { siteId: targetSite, category: 'MAIN_ENERGY_METER', include: 'settings,rules,profile' }).catch(() => null),
          apiClient.get('/devices', { siteId: targetSite, category: 'SUB_ENERGY_METER', include: 'settings,rules,profile' }).catch(() => null),
          apiClient.get('/devices', { siteId: targetSite, category: 'ENERGY_METER', include: 'settings,rules,profile' }).catch(() => null),
          apiClient.get('/devices', { siteId: targetSite, category: 'SOLAR_SYSTEM', include: 'settings,rules,profile' }).catch(() => null),
          apiClient.get('/devices', { siteId: targetSite, category: 'INVERTER', include: 'settings,rules,profile' }).catch(() => null),
          apiClient.get('/devices', { siteId: targetSite, category: 'UPS', include: 'settings,rules,profile' }).catch(() => null),
          apiClient.get('/devices', { siteId: targetSite, category: 'GENERATOR', include: 'settings,rules,profile' }).catch(() => null)
        ];

        const results = await Promise.allSettled(fetchTasks);

        // Ensure this request hasn't been superseded by another site switch
        if (currentRequestId !== activeRequestIdRef.current || !isMounted) return;

        results.forEach(res => {
          if (res.status === 'fulfilled' && res.value) {
            const list = normalizeList(res.value, 'devices');
            if (Array.isArray(list)) {
              list.forEach(item => {
                const id = String(item.id || item.deviceId || '');
                if (id && !deviceMap.has(id)) {
                  deviceMap.set(id, item);
                }
              });
            }
          }
        });

        const combinedDevices = Array.from(deviceMap.values());
        setSiteDevices(combinedDevices);
      } catch (err) {
        console.warn('Error fetching devices for overview site:', err);
        if (isMounted && currentRequestId === activeRequestIdRef.current) {
          setFetchError(err.message || 'Failed to load site devices');
          setSiteDevices([]);
        }
      } finally {
        if (isMounted && currentRequestId === activeRequestIdRef.current) {
          setDevicesLoading(false);
        }
      }
    };

    fetchAllSiteDevices();

    return () => {
      isMounted = false;
    };
  }, [selectedSiteId, refreshIndex]);

  // Categorize site devices
  const categorized = useMemo(() => {
    return categorizeDevices(siteDevices);
  }, [siteDevices]);

  // Batch telemetry polling effect
  useEffect(() => {
    if (!siteDevices || siteDevices.length === 0) {
      setTelemetryMap(new Map());
      return;
    }

    const currentRequestId = activeRequestIdRef.current;
    let isMounted = true;

    // Collect all device IDs for batch telemetry
    // Use ?? not || so numeric id=0 isn't treated as falsy
    const deviceIds = Array.from(
      new Set(
        siteDevices
          .map(d => {
            const id = d.bmsDeviceId ?? d.deviceId ?? d.id;
            return (id !== undefined && id !== null) ? String(id) : '';
          })
          .filter(Boolean)
      )
    );

    if (deviceIds.length === 0) return;

    const fetchLatestBatchTelemetry = async () => {
      try {
        const batchRes = await bmsService.getDeviceEventsLatestBatch(deviceIds);
        if (currentRequestId !== activeRequestIdRef.current || !isMounted) return;

        const results = batchRes?.data?.results || batchRes?.results || [];
        if (Array.isArray(results) && results.length > 0) {
          setTelemetryMap(prev => {
            const next = new Map(prev);
            results.forEach(item => {
              const devId = String(
                item.deviceId ?? item.bmsDeviceId ?? item.id ?? ''
              ).trim();
              if (devId) {
                // Find matching device — also match by bmsDeviceId and name for cross-key safety
                const devObj = siteDevices.find(d => {
                  const dId = String(d.id ?? d.deviceId ?? '');
                  const bmsId = String(d.bmsDeviceId ?? '');
                  const dName = String(d.name || d.deviceName || '').trim().toUpperCase();
                  const rName = String(item.name || item.deviceName || '').trim().toUpperCase();
                  return dId === devId || bmsId === devId || (dName && rName && dName === rName);
                }) || null;
                const mapped = mapLatestEventsToTelemetry(item, devObj);
                const updates = mapped.updates || {};
                next.set(devId, updates);
                if (devObj) {
                  const dId = String(devObj.id ?? devObj.deviceId ?? '');
                  const bmsId = String(devObj.bmsDeviceId ?? '');
                  if (dId) next.set(dId, updates);
                  if (bmsId) next.set(bmsId, updates);
                }
              }
            });
            return next;
          });
        }
      } catch (err) {
        console.warn('Error polling batch telemetry for overview:', err);
      }
    };

    // Initial fetch
    fetchLatestBatchTelemetry();

    // Recurring poll every 25 seconds
    const interval = setInterval(fetchLatestBatchTelemetry, 25000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [siteDevices]);

  // Transform devices and telemetry into presentation-ready props
  const scadaData = useMemo(() => {
    const getTelemetry = (dev) => {
      if (!dev) return {};
      // Use ?? so id=0 (falsy) still resolves correctly
      const devId = String(dev.id ?? dev.deviceId ?? '');
      const bmsId = String(dev.bmsDeviceId ?? '');
      return telemetryMap.get(devId) || telemetryMap.get(bmsId) || {};
    };

    const mainMeterMetrics = categorized.mainMeter
      ? extractDeviceMetrics(categorized.mainMeter, getTelemetry(categorized.mainMeter))
      : null;

    const solarMetrics = categorized.solarDevice
      ? extractDeviceMetrics(categorized.solarDevice, getTelemetry(categorized.solarDevice))
      : null;

    const upsMetrics = categorized.upsDevice
      ? extractDeviceMetrics(categorized.upsDevice, getTelemetry(categorized.upsDevice))
      : null;

    const dgMetrics = categorized.dgDevice
      ? extractDeviceMetrics(categorized.dgDevice, getTelemetry(categorized.dgDevice))
      : null;

    const subMeterMetrics = categorized.subMeters.map(sm =>
      extractDeviceMetrics(sm, getTelemetry(sm))
    );

    const hasAnyDevice = Boolean(
      categorized.mainMeter ||
      categorized.solarDevice ||
      categorized.upsDevice ||
      categorized.dgDevice ||
      categorized.subMeters.length > 0
    );

    const isAnyOnline = Boolean(
      mainMeterMetrics?.isOnline ||
      solarMetrics?.isOnline ||
      upsMetrics?.isOnline ||
      dgMetrics?.isOnline ||
      subMeterMetrics.some(sm => sm.isOnline)
    );

    return {
      mainMeter: mainMeterMetrics,
      solarDevice: solarMetrics,
      upsDevice: upsMetrics,
      dgDevice: dgMetrics,
      subMeters: subMeterMetrics,
      hasAnyDevice,
      isAnyOnline
    };
  }, [categorized, telemetryMap]);

  const selectedSiteObj = useMemo(() => {
    return allSites?.find(s => String(s.id || s._id || s.siteId) === String(selectedSiteId));
  }, [allSites, selectedSiteId]);

  const selectedSiteName = selectedSiteObj?.name || selectedSiteObj?.siteName || 'Selected Site';

  return (
    <div className="energy-overview-page p-3 p-md-4" style={{ background: isDark ? '#0a101d' : '#f8fafc', minHeight: '100vh', color: isDark ? '#e2e8f0' : '#1e293b' }}>
      {/* ── 1. Reusable PageContextBanner (Header Ribbon - Site Selector Only) ── */}
      <PageContextBanner
        title="Energy Metering Overview"
        subtitle={selectedSiteName ? `Site: ${selectedSiteName}` : undefined}
        icon={<Zap className={scadaData.hasAnyDevice ? "text-warning" : "text-secondary"} size={22} />}
        status={devicesLoading ? 'LOADING' : (scadaData.hasAnyDevice ? (scadaData.isAnyOnline ? 'ONLINE' : 'OFFLINE') : 'NOT CONFIGURED')}
        siteSelector={siteSelector}
        metadata={[
          {
            icon: <Clock size={15} />,
            label: 'Realtime SCADA Flow'
          },
          {
            icon: <Layers size={15} />,
            label: `${scadaData.subMeters.length} Feeders`
          }
        ]}
        actions={[
          <Button
            key="refresh-btn"
            variant="outline-secondary"
            size="sm"
            className="context-banner-action-btn p-1.5 border-0 text-secondary"
            title="Refresh Overview"
            onClick={() => setRefreshIndex(prev => prev + 1)}
          >
            <RefreshCw size={15} className={devicesLoading ? 'spin' : ''} />
          </Button>
        ]}
        enableFullscreen={true}
        variant="scada"
        className="main-meter-context-banner"
      />

      {/* ── 2. Error State with Retry ── */}
      {fetchError && !devicesLoading && (
        <Alert variant="danger" className="mt-3 rounded-4 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2.5">
            <AlertTriangle size={20} className="text-danger" />
            <div>
              <strong>Error Loading Energy Overview:</strong> {fetchError}
            </div>
          </div>
          <Button
            variant="outline-danger"
            size="sm"
            className="rounded-pill px-3"
            onClick={() => setRefreshIndex(prev => prev + 1)}
          >
            <RefreshCw size={13} className="me-1" /> Retry
          </Button>
        </Alert>
      )}

      {/* ── 3. Loading Skeleton (Preserving SCADA Layout) ── */}
      {devicesLoading && siteDevices.length === 0 ? (
        <div className="mt-3 p-4 rounded-4" style={{ background: isDark ? '#131b2c' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`, minHeight: '680px' }}>
          <div className="d-flex align-items-center justify-content-center py-5 flex-column gap-3">
            <Spinner animation="border" variant="info" style={{ width: '40px', height: '40px' }} />
            <div className="text-secondary fs-14 fw-medium">
              Loading dynamic energy distribution for {selectedSiteName}...
            </div>
          </div>
        </div>
      ) : !scadaData.hasAnyDevice && !devicesLoading ? (
        /* ── 4. Empty State (No Devices Configured on Site) ── */
        <div
          className="mt-3 p-5 rounded-4 text-center"
          style={{
            background: isDark ? 'linear-gradient(135deg, rgba(19, 27, 44, 0.8), rgba(15, 23, 42, 0.9))' : '#ffffff',
            border: `1px dashed ${isDark ? 'rgba(56, 189, 248, 0.3)' : '#cbd5e1'}`,
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            className="d-inline-flex p-3 rounded-circle mb-3"
            style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8'
            }}
          >
            <Zap size={40} />
          </div>
          <h5 className={`fw-bold mb-1 text-${isDark ? 'white' : 'dark'}`}>No Energy Devices Configured</h5>
          <p className="text-secondary fs-13 mb-4 mx-auto" style={{ maxWidth: '440px' }}>
            No main incomer, solar system, UPS, DG set, or submeters have been mapped to <strong>{selectedSiteName}</strong> yet.
          </p>
          <Button
            variant="info"
            className="rounded-pill px-4 py-2 fw-semibold text-white shadow-sm"
            onClick={() => navigate('/settings/device-management')}
          >
            Register Devices in Organization Hub
          </Button>
        </div>
      ) : (
        /* ── 5. SCADA Visualization Flow Canvas ── */
        <div className="mt-2">
          <SolarDashboard
            mainMeter={scadaData.mainMeter}
            solarDevice={scadaData.solarDevice}
            upsDevice={scadaData.upsDevice}
            dgDevice={scadaData.dgDevice}
            subMeters={scadaData.subMeters}
            loading={devicesLoading}
            error={fetchError}
            onRetry={() => setRefreshIndex(prev => prev + 1)}
          />
        </div>
      )}
    </div>
  );
};

export default EnergyMeteringOverview;
