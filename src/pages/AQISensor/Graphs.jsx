import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Row, Col, Card, Button, Form, Modal, Spinner, InputGroup } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  Search,
  RefreshCw,
  Sliders,
  Cpu,
  AlertTriangle,
  Grid,
  Columns,
  Maximize2,
  X,
  LayoutDashboard,
  Calendar,
  FileText
} from 'lucide-react';
import PageContextBanner from '../../components/PageContextBanner';
import { useSiteStore } from '../../context/SiteContext';
import { useDeviceStatus } from '../../services/DeviceStatusContext';
import { bmsService } from '../../services/bmsService';
import { getApiUrl } from '../../utils/apiConfig';
import { getAuthHeaders, normalizeList } from '../../services/apiClient';
import {
  SAMPLING_INTERVALS,
  RANGE_PRESETS,
  GRAPH_PALETTES,
  parseUtcDate,
  calculateDateRange,
  formatVal
} from '../../utils/scadaGraphUtils';
import TelemetryGraphCard from '../../components/graphs/TelemetryGraphCard';
import { resolveAqiGraphSettings, downsampleSnapsTo30Min } from './utils/aqiTelemetryAdapter';
import '../EnergyMetering/EnergyGraphs.css';
import './AQIOverview.css';

// Extended sampling intervals with 30-Min client downsampling option
const AQI_SAMPLING_INTERVALS = [
  { label: '15-Min', value: 'MIN_15' },
  { label: '30-Min', value: 'MIN_30' },
  { label: 'Hourly', value: 'HOURLY' },
  { label: 'Daily', value: 'DAILY' }
];

const AQIGraphs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sites, selectedSite, setSelectedSite } = useSiteStore();
  const { getOverallStatus } = useDeviceStatus();

  // Parse query params (e.g., ?deviceId=... or ?siteId=...)
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const queryDeviceId = queryParams.get('deviceId');
  const querySiteId = queryParams.get('siteId');

  // Site state
  const [selectedSiteId, setSelectedSiteId] = useState(() => {
    return querySiteId || selectedSite?.id || sites?.[0]?.id || '1';
  });

  // Devices state
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    return queryDeviceId || localStorage.getItem(`selected_aqi_device_id_${selectedSiteId}`) || '';
  });

  // Filter & view states
  const [activeInterval, setActiveInterval] = useState('HOURLY');
  const [rangePreset, setRangePreset] = useState('last24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [gridColumns, setGridColumns] = useState(2); // 1 = wide, 2 = grid

  // Telemetry API state
  const [telemetryData, setTelemetryData] = useState(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [telemetryError, setTelemetryError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Modal Expand state
  const [expandedSetting, setExpandedSetting] = useState(null);
  const [expandedChartType, setExpandedChartType] = useState('area');
  const [expandedColorScheme, setExpandedColorScheme] = useState(GRAPH_PALETTES[0]);
  const [modalInterval, setModalInterval] = useState('HOURLY');
  const [modalRangePreset, setModalRangePreset] = useState('last24h');
  const [modalSnapshots, setModalSnapshots] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Stale request race condition prevention token
  const requestIdRef = useRef(0);

  // Synchronize site with SiteContext if changed from outside
  useEffect(() => {
    if (selectedSite?.id && String(selectedSite.id) !== String(selectedSiteId)) {
      setSelectedSiteId(String(selectedSite.id));
    }
  }, [selectedSite?.id]);

  // 1. Lifecycle: Fetch AQI devices whenever selectedSiteId changes
  useEffect(() => {
    if (!selectedSiteId) {
      setDevices([]);
      setSelectedDeviceId('');
      setTelemetryData(null);
      setTelemetryError(null);
      return;
    }

    let isMounted = true;
    const currentRequestId = ++requestIdRef.current;

    // Immediately clear stale device and telemetry data on site change
    setDevicesLoading(true);
    setDevices([]);
    setSelectedDeviceId('');
    setTelemetryData(null);
    setTelemetryError(null);

    const fetchAqiDevices = async () => {
      try {
        let items = [];

        // Primary: site-scoped devices endpoint for category=AQI_SENSOR
        try {
          const res = await bmsService.getSiteDevices(selectedSiteId, {
            category: 'AQI_SENSOR',
            include: 'settings,rules,profile',
            limit: 100
          });
          items = normalizeList(res, 'devices');
        } catch (err) {
          console.warn('[AQIGraphs] getSiteDevices notice:', err);
        }

        // Fallback: cross-site /devices with category & siteId filter
        if (!items || items.length === 0) {
          try {
            const params = new URLSearchParams({
              siteId: String(selectedSiteId),
              category: 'AQI_SENSOR',
              include: 'settings,rules,profile',
              limit: '100'
            });
            const url = getApiUrl(`/devices?${params.toString()}`);
            const res = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
            if (res && res.ok) {
              const json = await res.json();
              items = normalizeList(json, 'devices');
            }
          } catch (fallbackErr) {
            console.warn('[AQIGraphs] Fallback /devices error:', fallbackErr);
          }
        }

        if (!isMounted || requestIdRef.current !== currentRequestId) return;

        // Strictly keep devices with category AQI_SENSOR
        const aqiDevices = items.filter(d => {
          const cat = String(d.category || '').toUpperCase();
          return cat === 'AQI_SENSOR' || cat.includes('AQI');
        });

        setDevices(aqiDevices);

        if (aqiDevices.length > 0) {
          // Validate persisted or query device ID against returned list
          const persistedId = queryDeviceId || localStorage.getItem(`selected_aqi_device_id_${selectedSiteId}`);
          const matched = aqiDevices.find(d => String(d.id || d._id) === String(persistedId));
          const targetId = matched ? String(matched.id || matched._id) : String(aqiDevices[0].id || aqiDevices[0]._id);

          setSelectedDeviceId(targetId);
          localStorage.setItem(`selected_aqi_device_id_${selectedSiteId}`, targetId);
        } else {
          setSelectedDeviceId('');
          localStorage.removeItem(`selected_aqi_device_id_${selectedSiteId}`);
        }
      } catch (err) {
        if (!isMounted || requestIdRef.current !== currentRequestId) return;
        console.error('[AQIGraphs] Error fetching AQI devices:', err);
        setDevices([]);
        setSelectedDeviceId('');
      } finally {
        if (isMounted && requestIdRef.current === currentRequestId) {
          setDevicesLoading(false);
        }
      }
    };

    fetchAqiDevices();

    return () => {
      isMounted = false;
    };
  }, [selectedSiteId, queryDeviceId]);

  // Selected device object
  const selectedDevice = useMemo(() => {
    if (!selectedDeviceId || !devices || devices.length === 0) return null;
    return devices.find(d => String(d.id || d._id) === String(selectedDeviceId)) || null;
  }, [devices, selectedDeviceId]);

  // 2. Fetch Telemetry Snapshots
  const fetchTelemetrySnapshots = useCallback(async () => {
    if (!selectedSiteId || !selectedDeviceId) {
      setTelemetryData(null);
      setTelemetryLoading(false);
      setTelemetryError(null);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setTelemetryLoading(true);
    setTelemetryError(null);

    try {
      const { from, to } = calculateDateRange(rangePreset);
      // Map MIN_30 to MIN_15 for backend API contract (backend only accepts MIN_15 | HOURLY | DAILY | MONTHLY)
      const backendInterval = activeInterval === 'MIN_30' ? 'MIN_15' : activeInterval;

      const params = {
        interval: backendInterval,
        from,
        to,
        limit: 1000
      };

      const res = await bmsService.getDeviceTelemetrySnapshots(selectedSiteId, selectedDeviceId, params);

      if (requestIdRef.current !== currentRequestId) return;

      if (res && (res.success !== false)) {
        const payload = res?.data || res;
        setTelemetryData(payload);
        setLastSyncTime(new Date());
      } else {
        setTelemetryData({ settings: [], settingsCount: 0 });
      }
    } catch (err) {
      if (requestIdRef.current !== currentRequestId) return;
      console.error('[AQIGraphs] Error retrieving telemetry snapshots:', err);
      setTelemetryError(err?.message || 'Failed to retrieve telemetry snapshots for this AQI sensor.');
      setTelemetryData(null);
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setTelemetryLoading(false);
      }
    }
  }, [selectedSiteId, selectedDeviceId, activeInterval, rangePreset]);

  // Trigger telemetry fetch on dependencies change
  useEffect(() => {
    fetchTelemetrySnapshots();
  }, [fetchTelemetrySnapshots]);

  // 3. Resolve Graph Settings dynamically using adapter
  const eligibleSettings = useMemo(() => {
    if (!selectedDevice) return [];
    return resolveAqiGraphSettings(selectedDevice, telemetryData, activeInterval);
  }, [selectedDevice, telemetryData, activeInterval]);

  // Filter settings by search query
  const filteredSettings = useMemo(() => {
    if (!searchTerm.trim()) return eligibleSettings;
    const q = searchTerm.toLowerCase().trim();
    return eligibleSettings.filter(s =>
      (s.displayName && s.displayName.toLowerCase().includes(q)) ||
      (s.fieldKey && s.fieldKey.toLowerCase().includes(q)) ||
      (s.unit && s.unit.toLowerCase().includes(q))
    );
  }, [eligibleSettings, searchTerm]);

  // 4. Modal Individual Telemetry Fetch
  const handleOpenExpandModal = useCallback((setting, chartType, colorScheme) => {
    setExpandedSetting(setting);
    setExpandedChartType(chartType);
    setExpandedColorScheme(colorScheme);
    setModalInterval(activeInterval);
    setModalRangePreset(rangePreset);
    setModalSnapshots(setting.snapshots || []);
    setModalError(null);
  }, [activeInterval, rangePreset]);

  const handleCloseExpandModal = useCallback(() => {
    setExpandedSetting(null);
    setModalSnapshots([]);
    setModalError(null);
  }, []);

  const fetchModalSnapshots = useCallback(async (targetInterval, targetRange) => {
    if (!selectedSiteId || !selectedDeviceId || !expandedSetting) return;

    setModalLoading(true);
    setModalError(null);

    try {
      const { from, to } = calculateDateRange(targetRange);
      const backendInterval = targetInterval === 'MIN_30' ? 'MIN_15' : targetInterval;

      const params = {
        interval: backendInterval,
        from,
        to,
        limit: 1000
      };

      if (expandedSetting.settingId && !isNaN(Number(expandedSetting.settingId))) {
        params.settingId = Number(expandedSetting.settingId);
      } else if (expandedSetting.fieldKey) {
        params.fieldKey = expandedSetting.fieldKey;
      }

      const res = await bmsService.getDeviceTelemetrySnapshots(selectedSiteId, selectedDeviceId, params);
      const dataObj = res?.data || res || {};
      let snaps = dataObj.snapshots || (Array.isArray(dataObj.settings) && dataObj.settings[0]?.snapshots) || [];

      if (targetInterval === 'MIN_30' && Array.isArray(snaps)) {
        snaps = downsampleSnapsTo30Min(snaps);
      }

      setModalSnapshots(snaps);
    } catch (err) {
      console.error('[AQIGraphs] Modal telemetry fetch error:', err);
      setModalError(err?.message || 'Failed to update graph data.');
    } finally {
      setModalLoading(false);
    }
  }, [selectedSiteId, selectedDeviceId, expandedSetting]);

  // Modal setting data combining active setting and latest modal snapshots
  const modalSettingData = useMemo(() => {
    if (!expandedSetting) return null;
    return {
      ...expandedSetting,
      snapshots: modalSnapshots,
      interval: modalInterval,
      rangePreset: modalRangePreset
    };
  }, [expandedSetting, modalSnapshots, modalInterval, modalRangePreset]);

  // Context Banner Selectors
  const siteSelector = useMemo(() => {
    const siteOptions = (sites && sites.length > 0)
      ? sites.map(s => ({
          value: String(s.id || s._id || s.siteId),
          label: s.name || s.siteName || `Site ${s.id}`
        }))
      : [{ value: '1', label: 'Main Facility' }];

    return {
      value: selectedSiteId,
      options: siteOptions,
      onChange: (newId) => {
        if (!newId || newId === selectedSiteId) return;
        setSelectedSiteId(newId);
        const match = sites?.find(s => String(s.id || s._id || s.siteId) === String(newId));
        if (match && setSelectedSite) setSelectedSite(match);
      },
      ariaLabel: 'Select Site'
    };
  }, [sites, selectedSiteId, setSelectedSite]);

  const deviceSelector = useMemo(() => {
    if (devicesLoading) {
      return {
        value: '',
        options: [{ value: '', label: 'Loading sensors...' }],
        disabled: true,
        ariaLabel: 'Loading sensors'
      };
    }

    if (!devices || devices.length === 0) {
      return {
        value: '',
        options: [{ value: '', label: 'No AQI sensors found' }],
        disabled: true,
        ariaLabel: 'No AQI sensors'
      };
    }

    const deviceOptions = devices.map(d => ({
      value: String(d.id || d._id),
      label: d.name || d.deviceName || `Sensor #${d.id}`
    }));

    return {
      value: selectedDeviceId,
      options: deviceOptions,
      onChange: (newDevId) => {
        if (!newDevId || newDevId === selectedDeviceId) return;
        setSelectedDeviceId(newDevId);
        localStorage.setItem(`selected_aqi_device_id_${selectedSiteId}`, newDevId);
      },
      ariaLabel: 'Select AQI Sensor'
    };
  }, [devicesLoading, devices, selectedDeviceId, selectedSiteId]);

  return (
    <div className="energy-graphs-container fade-in aqi-graphs-wrapper">
      {/* ── 1. BMS Context Banner ── */}
      <PageContextBanner
        title="AQI Sensor Telemetry Graphs"
        subtitle="Multi-parameter air quality analysis, environmental trends & high-resolution SCADA telemetry"
        icon={<Activity size={24} className="text-info" />}
        siteSelector={siteSelector}
        deviceSelector={deviceSelector}
        lastSync={lastSyncTime}
        quickActions={
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              className="d-flex align-items-center gap-1.5 py-1 px-2.5 fs-8"
              onClick={() => navigate('/aqi-sensor/overview')}
              title="Return to AQI Overview"
            >
              <LayoutDashboard size={14} />
              <span className="d-none d-md-inline">Overview</span>
            </Button>
            <Button
              variant="outline-info"
              size="sm"
              className="d-flex align-items-center gap-1.5 py-1 px-2.5 fs-8"
              onClick={() => navigate('/aqi-sensor/reports')}
              title="View AQI Reports"
            >
              <FileText size={14} />
              <span className="d-none d-md-inline">Reports</span>
            </Button>
            <Button
              variant="info"
              size="sm"
              className="d-flex align-items-center gap-1.5 py-1 px-3 fs-8 fw-semibold"
              onClick={fetchTelemetrySnapshots}
              disabled={telemetryLoading || !selectedDeviceId}
              title="Refresh telemetry snapshots"
            >
              <RefreshCw size={14} className={telemetryLoading ? 'spin-anim' : ''} />
              <span>Refresh</span>
            </Button>
          </div>
        }
      />

      {/* ── 2. SCADA Control Toolbar ── */}
      <div className="scada-toolbar-container mb-4">
        <Row className="g-2 align-items-center justify-content-between">
          {/* Left: Time Range Presets */}
          <Col xs={12} lg="auto">
            <div className="d-flex align-items-center gap-1.5 flex-wrap">
              <span className="text-secondary fs-8 fw-bold text-uppercase me-1 d-none d-md-inline">
                Time Window:
              </span>
              <div className="btn-group btn-group-sm" role="group" aria-label="Time Range Presets">
                {RANGE_PRESETS.map(preset => (
                  <Button
                    key={preset.id}
                    variant={rangePreset === preset.id ? 'info' : 'outline-secondary'}
                    size="sm"
                    className="py-1 px-2.5 fs-8"
                    onClick={() => {
                      if (rangePreset !== preset.id) {
                        setRangePreset(preset.id);
                        if (preset.defaultInterval) {
                          setActiveInterval(preset.defaultInterval);
                        }
                      }
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </Col>

          {/* Right: Sampling Intervals, Search, & Layout Switcher */}
          <Col xs={12} lg="auto">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Sampling Interval Switcher */}
              <div className="btn-group btn-group-sm" role="group" aria-label="Sampling Interval">
                {AQI_SAMPLING_INTERVALS.map(intOption => (
                  <Button
                    key={intOption.value}
                    variant={activeInterval === intOption.value ? 'primary' : 'outline-secondary'}
                    size="sm"
                    className="py-1 px-2 fs-8"
                    onClick={() => {
                      if (activeInterval !== intOption.value) {
                        setActiveInterval(intOption.value);
                      }
                    }}
                  >
                    {intOption.label}
                  </Button>
                ))}
              </div>

              {/* Search Filter */}
              <InputGroup size="sm" style={{ width: '180px' }}>
                <InputGroup.Text className="bg-dark border-secondary border-opacity-25 text-secondary p-1.5">
                  <Search size={14} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Filter parameters..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-dark text-light border-secondary border-opacity-25 fs-8"
                />
              </InputGroup>

              {/* Column Layout Switcher */}
              <div className="btn-group btn-group-sm" role="group" aria-label="Layout Columns">
                <Button
                  variant={gridColumns === 2 ? 'info' : 'outline-secondary'}
                  size="sm"
                  className="p-1 px-2"
                  onClick={() => setGridColumns(2)}
                  title="2-Column Grid View"
                >
                  <Grid size={14} />
                </Button>
                <Button
                  variant={gridColumns === 1 ? 'info' : 'outline-secondary'}
                  size="sm"
                  className="p-1 px-2"
                  onClick={() => setGridColumns(1)}
                  title="1-Column Full Width View"
                >
                  <Columns size={14} />
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* ── 3. Differentiated States & Graph Grid ── */}

      {/* State A: Devices Loading */}
      {devicesLoading && (
        <Card className="scada-graph-card text-center p-5 mb-4">
          <div className="py-4">
            <Spinner animation="border" variant="info" className="mb-3" />
            <h5 className="text-light fs-6 fw-bold">Loading AQI Sensors...</h5>
            <p className="text-secondary fs-8 mb-0">Discovering telemetry registers for this site</p>
          </div>
        </Card>
      )}

      {/* State B: No AQI Sensors on Site */}
      {!devicesLoading && (!devices || devices.length === 0) && (
        <Card className="scada-graph-card text-center p-5 mb-4 border border-warning border-opacity-25">
          <div className="py-4">
            <AlertTriangle size={42} className="text-warning mb-3 opacity-75" />
            <h5 className="text-warning fs-6 fw-bold">No AQI Sensors Configured at This Site</h5>
            <p className="text-secondary fs-8 max-w-lg mx-auto mb-3">
              No devices with category <code>AQI_SENSOR</code> were discovered for the selected facility.
              Please switch to a site with active environmental monitors or register a sensor in Device Management.
            </p>
            <Button
              variant="outline-info"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="fs-8"
            >
              Return to Dashboard
            </Button>
          </div>
        </Card>
      )}

      {/* State C: API Error */}
      {!devicesLoading && selectedDeviceId && telemetryError && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 border-danger border-opacity-30">
          <div className="d-flex align-items-center gap-2">
            <AlertTriangle size={20} className="text-danger flex-shrink-0" />
            <div>
              <div className="fw-bold fs-7">Failed to Retrieve Sensor Telemetry</div>
              <div className="fs-8 opacity-80">{telemetryError}</div>
            </div>
          </div>
          <Button
            variant="outline-danger"
            size="sm"
            className="fs-8 fw-semibold px-3"
            onClick={fetchTelemetrySnapshots}
          >
            Retry
          </Button>
        </div>
      )}

      {/* State D: Device Selected, Telemetry Loading Shimmer */}
      {!devicesLoading && selectedDeviceId && telemetryLoading && (
        <Row className="g-3 mb-4">
          {[1, 2, 3, 4].map(idx => (
            <Col key={idx} xs={12} lg={gridColumns === 1 ? 12 : 6}>
              <Card className="scada-graph-card p-4 text-center" style={{ minHeight: '300px' }}>
                <div className="d-flex flex-column align-items-center justify-content-center h-100 py-5">
                  <Spinner animation="grow" variant="info" size="sm" className="mb-2" />
                  <span className="text-secondary fs-8 fw-semibold tracking-wider text-uppercase">
                    Streaming Sensor Snapshots...
                  </span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* State E: Device has No Configured Telemetry Settings */}
      {!devicesLoading && selectedDeviceId && !telemetryLoading && !telemetryError && eligibleSettings.length === 0 && (
        <Card className="scada-graph-card text-center p-5 mb-4">
          <div className="py-4">
            <Cpu size={40} className="text-secondary opacity-50 mb-3" />
            <h5 className="text-light fs-6 fw-bold">No Telemetry Registers Available</h5>
            <p className="text-secondary fs-8 max-w-lg mx-auto mb-0">
              The selected sensor does not report any configured analog or continuous telemetry settings.
            </p>
          </div>
        </Card>
      )}

      {/* State F: Settings Exist, but Filtered Search Produced No Matches */}
      {!devicesLoading && selectedDeviceId && !telemetryLoading && !telemetryError && eligibleSettings.length > 0 && filteredSettings.length === 0 && (
        <Card className="scada-graph-card text-center p-4 mb-4">
          <p className="text-secondary fs-8 mb-0">
            No telemetry parameters matched the query &quot;{searchTerm}&quot;.
          </p>
        </Card>
      )}

      {/* State G: Render Dynamically Resolved Telemetry Cards */}
      {!devicesLoading && selectedDeviceId && !telemetryLoading && !telemetryError && filteredSettings.length > 0 && (
        <Row className="g-3 mb-4">
          {filteredSettings.map((setting, idx) => {
            const cardKey = setting.settingId ? `id_${setting.settingId}` : `key_${setting.fieldKey || idx}`;
            return (
              <Col
                key={cardKey}
                xs={12}
                lg={gridColumns === 1 ? 12 : 6}
                className="fade-in-slide"
                style={{ animationDelay: `${Math.min(idx * 0.05, 0.4)}s` }}
              >
                <TelemetryGraphCard
                  setting={setting}
                  interval={activeInterval}
                  rangePreset={rangePreset}
                  colorScheme={setting.colorScheme || GRAPH_PALETTES[idx % GRAPH_PALETTES.length]}
                  onExpand={handleOpenExpandModal}
                  height={250}
                />
              </Col>
            );
          })}
        </Row>
      )}

      {/* ── 4. Expand Graph Modal ── */}
      {modalSettingData && (
        <Modal
          show={Boolean(modalSettingData)}
          onHide={handleCloseExpandModal}
          size="xl"
          centered
          dialogClassName="modal-95w scada-expanded-modal"
        >
          <Modal.Header closeButton closeVariant="white" className="border-secondary border-opacity-25" style={{ background: '#080d19' }}>
            <Modal.Title className="d-flex align-items-center justify-content-between w-100 pe-3">
              <div className="d-flex align-items-center gap-2">
                <div
                  style={{
                    width: '4px',
                    height: '24px',
                    borderRadius: '2px',
                    background: expandedColorScheme.stroke,
                    boxShadow: `0 0 10px ${expandedColorScheme.stroke}aa`
                  }}
                />
                <div>
                  <h5 className="mb-0 fs-6 fw-bold text-light">
                    {expandedSetting?.displayName || 'Telemetry Parameter'}
                  </h5>
                  <small className="text-secondary fs-8 font-monospace">
                    {expandedSetting?.fieldKey ? `Key: ${expandedSetting.fieldKey}` : ''}
                    {expandedSetting?.unit ? ` • Unit: ${expandedSetting.unit}` : ''}
                  </small>
                </div>
              </div>

              {/* Modal Interval & Range Presets */}
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <div className="btn-group btn-group-sm" role="group" aria-label="Modal Time Range">
                  {RANGE_PRESETS.map(p => (
                    <Button
                      key={p.id}
                      variant={modalRangePreset === p.id ? 'info' : 'outline-secondary'}
                      size="sm"
                      className="py-0.5 px-2 fs-8"
                      onClick={() => {
                        setModalRangePreset(p.id);
                        fetchModalSnapshots(modalInterval, p.id);
                      }}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>

                <div className="btn-group btn-group-sm" role="group" aria-label="Modal Interval">
                  {AQI_SAMPLING_INTERVALS.map(intOpt => (
                    <Button
                      key={intOpt.value}
                      variant={modalInterval === intOpt.value ? 'primary' : 'outline-secondary'}
                      size="sm"
                      className="py-0.5 px-2 fs-8"
                      onClick={() => {
                        setModalInterval(intOpt.value);
                        fetchModalSnapshots(intOpt.value, modalRangePreset);
                      }}
                    >
                      {intOpt.label}
                    </Button>
                  ))}
                </div>
              </div>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body style={{ background: '#080d19', minHeight: '520px', padding: '24px', position: 'relative' }}>
            {modalLoading && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(8, 13, 25, 0.75)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}>
                <Spinner animation="border" variant="info" style={{ width: '2.5rem', height: '2.5rem' }} className="mb-2" />
                <span className="text-info fs-8 fw-semibold tracking-wider text-uppercase">
                  Updating Telemetry Snapshots (IST)...
                </span>
              </div>
            )}

            {modalError && (
              <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center justify-content-between fs-8">
                <span>{modalError}</span>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="py-0.5 px-2 fs-9 fw-bold"
                  onClick={() => fetchModalSnapshots(modalInterval, modalRangePreset)}
                >
                  Retry
                </Button>
              </div>
            )}

            <TelemetryGraphCard
              setting={modalSettingData}
              interval={modalInterval}
              rangePreset={modalRangePreset}
              colorScheme={expandedColorScheme}
              onExpand={() => {}}
              initialChartType={expandedChartType}
              isExpanded={true}
              height={460}
            />
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
};

export default AQIGraphs;
