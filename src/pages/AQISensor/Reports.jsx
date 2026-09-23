import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Row, Col, Card, Button, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Activity,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  LayoutDashboard
} from 'lucide-react';
import PageContextBanner from '../../components/PageContextBanner';
import { useSiteStore } from '../../context/SiteContext';
import { useDeviceStatus } from '../../services/DeviceStatusContext';
import { bmsService } from '../../services/bmsService';
import { getApiUrl } from '../../utils/apiConfig';
import { getAuthHeaders, normalizeList } from '../../services/apiClient';
import './AQIOverview.css';

const AQIReports = () => {
  const navigate = useNavigate();
  const { sites, selectedSite, setSelectedSite } = useSiteStore();
  const { getOverallStatus } = useDeviceStatus();

  // Site state
  const [selectedSiteId, setSelectedSiteId] = useState(() => {
    return selectedSite?.id || sites?.[0]?.id || '1';
  });

  // Devices state
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    return localStorage.getItem(`selected_aqi_device_id_${selectedSiteId}`) || '';
  });

  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const requestIdRef = useRef(0);

  // Sync with SiteContext if changed from outside
  useEffect(() => {
    if (selectedSite?.id && String(selectedSite.id) !== String(selectedSiteId)) {
      setSelectedSiteId(String(selectedSite.id));
    }
  }, [selectedSite?.id]);

  // Fetch AQI devices whenever selectedSiteId changes
  useEffect(() => {
    if (!selectedSiteId) {
      setDevices([]);
      setSelectedDeviceId('');
      return;
    }

    let isMounted = true;
    const currentRequestId = ++requestIdRef.current;
    setDevicesLoading(true);

    const fetchAqiDevices = async () => {
      try {
        let items = [];

        try {
          const res = await bmsService.getSiteDevices(selectedSiteId, {
            category: 'AQI_SENSOR',
            include: 'settings,rules,profile',
            limit: 100
          });
          items = normalizeList(res, 'devices');
        } catch (err) {
          console.warn('[AQIReports] getSiteDevices notice:', err);
        }

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
            console.warn('[AQIReports] Fallback /devices error:', fallbackErr);
          }
        }

        if (!isMounted || requestIdRef.current !== currentRequestId) return;

        const aqiDevices = items.filter(d => {
          const cat = String(d.category || '').toUpperCase();
          return cat === 'AQI_SENSOR' || cat.includes('AQI');
        });

        setDevices(aqiDevices);

        if (aqiDevices.length > 0) {
          const persistedId = localStorage.getItem(`selected_aqi_device_id_${selectedSiteId}`);
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
        console.error('[AQIReports] Error fetching devices:', err);
        setDevices([]);
        setSelectedDeviceId('');
      } finally {
        if (isMounted && requestIdRef.current === currentRequestId) {
          setDevicesLoading(false);
          setLastSyncTime(new Date());
        }
      }
    };

    fetchAqiDevices();

    return () => {
      isMounted = false;
    };
  }, [selectedSiteId]);

  // Selected device object
  const selectedDevice = useMemo(() => {
    if (!selectedDeviceId || !devices || devices.length === 0) return null;
    return devices.find(d => String(d.id || d._id) === String(selectedDeviceId)) || null;
  }, [devices, selectedDeviceId]);

  // Configured telemetry parameters on this sensor
  const configuredParameters = useMemo(() => {
    if (!selectedDevice?.settings) return [];
    return selectedDevice.settings
      .filter(s => !(s.isCommand === true && s.isTelemetry === false))
      .map(s => s.displayName || s.name || s.sochiotFieldName || `Setting ${s.id || s.settingId}`);
  }, [selectedDevice]);

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
    <div className="energy-graphs-container fade-in aqi-reports-wrapper">
      {/* ── 1. BMS Context Banner ── */}
      <PageContextBanner
        title="AQI Sensor Reports & Compliance"
        subtitle="Environmental audits, air quality compliance schedules & periodic telemetry exports"
        icon={<FileText size={24} className="text-info" />}
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
              title="Go to AQI Overview"
            >
              <LayoutDashboard size={14} />
              <span className="d-none d-md-inline">Overview</span>
            </Button>
            <Button
              variant="info"
              size="sm"
              className="d-flex align-items-center gap-1.5 py-1 px-3 fs-8 fw-semibold"
              onClick={() => navigate(selectedDeviceId ? `/aqi-sensor/graphs?deviceId=${selectedDeviceId}` : '/aqi-sensor/graphs')}
              title="View Sensor Graphs"
            >
              <Activity size={14} />
              <span>Sensor Graphs</span>
            </Button>
          </div>
        }
      />

      {/* ── 2. Loading State ── */}
      {devicesLoading && (
        <Card className="scada-graph-card text-center p-5 mb-4">
          <div className="py-4">
            <Spinner animation="border" variant="info" className="mb-3" />
            <h5 className="text-light fs-6 fw-bold">Loading Sensor Context...</h5>
            <p className="text-secondary fs-8 mb-0">Synchronizing device registers and reporting schedules</p>
          </div>
        </Card>
      )}

      {/* ── 3. No Sensors on Site State ── */}
      {!devicesLoading && (!devices || devices.length === 0) && (
        <Card className="scada-graph-card text-center p-5 mb-4 border border-warning border-opacity-25">
          <div className="py-4">
            <AlertTriangle size={42} className="text-warning mb-3 opacity-75" />
            <h5 className="text-warning fs-6 fw-bold">No AQI Sensors Available at This Site</h5>
            <p className="text-secondary fs-8 max-w-lg mx-auto mb-3">
              No devices with category <code>AQI_SENSOR</code> were found on this facility.
              Switch sites to view configured air quality reporting schedules.
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

      {/* ── 4. Meaningful Selected Sensor Context Card ── */}
      {!devicesLoading && selectedDevice && (
        <Row className="g-3 mb-4">
          <Col xs={12} lg={4}>
            <Card className="scada-graph-card h-100 p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="text-secondary fs-8 text-uppercase fw-bold tracking-wider">
                  Target Sensor
                </span>
                <Badge bg="info" className="bg-opacity-15 text-info border border-info border-opacity-25 px-2 py-1 fs-9">
                  {selectedDevice.status || 'ACTIVE'}
                </Badge>
              </div>

              <h4 className="text-light fs-5 fw-bold mb-1">
                {selectedDevice.name || selectedDevice.deviceName || 'AQI Sensor'}
              </h4>
              <p className="text-secondary fs-8 mb-3">
                {selectedDevice.location || selectedDevice.siteName || `Site #${selectedSiteId}`}
              </p>

              <div className="border-top border-secondary border-opacity-20 pt-3">
                <div className="d-flex justify-content-between text-secondary fs-8 mb-1.5">
                  <span>Device ID:</span>
                  <span className="font-monospace text-light">#{selectedDevice.id || selectedDevice._id}</span>
                </div>
                <div className="d-flex justify-content-between text-secondary fs-8 mb-1.5">
                  <span>Device Category:</span>
                  <span className="font-monospace text-info">{selectedDevice.category || 'AQI_SENSOR'}</span>
                </div>
                <div className="d-flex justify-content-between text-secondary fs-8">
                  <span>Reporting Protocol:</span>
                  <span className="font-monospace text-light">MQTT / SCADA Telemetry</span>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={12} lg={8}>
            <Card className="scada-graph-card h-100 p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="text-secondary fs-8 text-uppercase fw-bold tracking-wider">
                  Configured Telemetry Registers
                </span>
                <span className="text-secondary fs-8">
                  {configuredParameters.length} Active Parameter{configuredParameters.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="d-flex flex-wrap gap-2 mb-4">
                {configuredParameters.length > 0 ? (
                  configuredParameters.map((param, idx) => (
                    <span
                      key={idx}
                      className="badge bg-dark text-light border border-secondary border-opacity-30 py-1.5 px-2.5 fs-8 fw-medium"
                    >
                      {param}
                    </span>
                  ))
                ) : (
                  <span className="text-secondary fs-8">No specific parameter registers configured</span>
                )}
              </div>

              <div className="border-top border-secondary border-opacity-20 pt-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2 text-secondary fs-8">
                  <Clock size={14} className="text-info" />
                  <span>Real-time snapshots recorded every 15 minutes</span>
                </div>
                <Button
                  variant="outline-info"
                  size="sm"
                  className="d-flex align-items-center gap-1.5 fs-8 py-1 px-3"
                  onClick={() => navigate(`/aqi-sensor/graphs?deviceId=${selectedDevice.id || selectedDevice._id}`)}
                >
                  <span>Open Parameter Graphs</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* ── 5. Honest Status & Empty State (No Fake Records) ── */}
      {!devicesLoading && selectedDevice && (
        <Card className="scada-graph-card text-center p-5">
          <div className="py-4 max-w-xl mx-auto">
            <div
              className="d-inline-flex align-items-center justify-content-center mb-3 rounded-circle p-3"
              style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)' }}
            >
              <FileText size={42} className="text-info opacity-75" />
            </div>

            <h5 className="text-light fs-5 fw-bold mb-2">
              Automated Compliance & Periodic Reports
            </h5>

            <Badge bg="warning" className="bg-opacity-15 text-warning border border-warning border-opacity-25 px-2.5 py-1 fs-8 mb-3">
              Automated Schedule Configuration Pending
            </Badge>

            <p className="text-secondary fs-7 leading-relaxed mb-4">
              Automated PDF and CSV compliance report generation is currently being provisioned for AQI sensors at this facility.
              Scheduled daily, weekly, and monthly air quality summaries will be available once the backend reporting cron is activated for this site.
            </p>

            <div
              className="p-3 rounded-3 text-start mb-4 border border-secondary border-opacity-20"
              style={{ background: 'rgba(15, 23, 42, 0.6)' }}
            >
              <div className="d-flex align-items-center gap-2 text-info fs-8 fw-semibold mb-1">
                <ShieldCheck size={16} />
                <span>Active Telemetry Monitoring Notice</span>
              </div>
              <p className="text-secondary fs-8 mb-0">
                Live sensor readings, 15-minute telemetry snapshots, and multi-parameter historical trend charts for{' '}
                <strong className="text-light">{selectedDevice.name || 'this sensor'}</strong> are actively recording and immediately accessible in the Graphs module.
              </p>
            </div>

            <div className="d-flex justify-content-center gap-2">
              <Button
                variant="info"
                size="sm"
                className="px-4 py-2 fs-8 fw-semibold d-flex align-items-center gap-2"
                onClick={() => navigate(`/aqi-sensor/graphs?deviceId=${selectedDevice.id || selectedDevice._id}`)}
              >
                <Activity size={16} />
                <span>View Live Graphs & Telemetry</span>
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AQIReports;
