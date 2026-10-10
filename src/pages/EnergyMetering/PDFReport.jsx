import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Row, Col, Card, Form, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { Download, Calendar, ClipboardList, RefreshCw, Zap, FileSpreadsheet, Building2, Clock, AlertCircle } from 'lucide-react';
import { generateUserCustomPdfReport } from '../../utils/pdfReportGenerator';
import { useSiteStore } from '../../hooks/useSiteStore';
import { apiClient, normalizeList } from '../../services/apiClient';

const EnergyPDFReport = () => {
  const { sites = [], activeSites = [], selectedSite, setSelectedSite } = useSiteStore();

  const allSites = useMemo(() => {
    return activeSites.length > 0 ? activeSites : sites;
  }, [activeSites, sites]);

  // Resolve current active site from SiteContext, localStorage, or fallback
  const currentSite = useMemo(() => {
    if (selectedSite) return selectedSite;
    const stored = localStorage.getItem('scada_selected_site');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.id || parsed.siteId || parsed._id)) return parsed;
      } catch (e) {}
    }
    return allSites[0] || null;
  }, [selectedSite, allSites]);

  const selectedSiteId = useMemo(() => {
    return currentSite
      ? String(currentSite.id ?? currentSite.siteId ?? currentSite._id ?? '')
      : (localStorage.getItem('selected_main_meter_site_id') || (allSites[0]?.id ? String(allSites[0].id) : '1'));
  }, [currentSite, allSites]);

  const selectedSiteName = useMemo(() => {
    return currentSite?.name || currentSite?.siteName || (allSites[0]?.name ? allSites[0].name : 'STORE-1');
  }, [currentSite, allSites]);

  // Filter state strictly matching user API requirements:
  // deviceId=3/9, startDate=YYYY-MM-DDT00:00:00Z, endDate=YYYY-MM-DDT23:59:59Z, interval=DAILY|MIN_15|HOURLY
  const [filter, setFilter] = useState({
    deviceId: '3',
    interval: 'DAILY',
    startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [siteDevices, setSiteDevices] = useState([]);
  const [reportData, setReportData] = useState([]);

  // Sequence ref to ignore stale out-of-order network responses
  const activeRequestRef = useRef(0);

  // 1. Fetch site devices on site change to resolve available meter IDs (e.g. deviceId: 3, 9)
  useEffect(() => {
    let isMounted = true;
    const loadSiteDevices = async () => {
      if (!selectedSiteId) return;
      try {
        let list = [];
        try {
          const res = await apiClient.get(`/sites/${selectedSiteId}/devices`).catch(() => null);
          list = normalizeList(res, 'devices');
        } catch (e) {}

        if (!list || list.length === 0) {
          const res = await apiClient.get('/devices', { siteId: String(selectedSiteId) }).catch(() => null);
          list = normalizeList(res, 'devices');
        }

        // Local storage fallbacks
        if (!list || list.length === 0) {
          const localKeys = ['scada_devices_db', 'bms_registered_devices', 'scada_device_mappings', 'tb_devices'];
          localKeys.forEach(k => {
            try {
              const raw = localStorage.getItem(k);
              if (raw) {
                const parsed = JSON.parse(raw);
                const arr = Array.isArray(parsed) ? parsed : [parsed];
                list.push(...arr);
              }
            } catch (e) {}
          });
        }

        const validSiteIds = [
          selectedSiteId,
          currentSite?.id,
          currentSite?.siteId,
          currentSite?._id,
          currentSite?.name,
          currentSite?.siteName
        ].filter(Boolean).map(s => String(s).toLowerCase().trim());

        const siteFiltered = (list || []).filter(d => {
          if (!d) return false;
          const devSiteId = d.siteId ?? d.site_id;
          if (devSiteId !== undefined && devSiteId !== null && String(devSiteId).trim() !== '') {
            return validSiteIds.includes(String(devSiteId).toLowerCase().trim());
          }
          return true;
        });

        if (isMounted) {
          const energyMeters = siteFiltered.filter(d =>
            d.category === 'ENERGY_METER' ||
            d.category === 'MAIN_ENERGY_METER' ||
            d.category === 'SUB_ENERGY_METER' ||
            d.category === 'LT_PANEL' ||
            (d.name && /meter|energy/i.test(d.name))
          );
          const devicesToUse = energyMeters.length > 0
            ? energyMeters
            : siteFiltered.filter(d => d.category !== 'AQI_SENSOR' && d.category !== 'SENSOR');
          
          setSiteDevices(devicesToUse);

          if (devicesToUse.length > 0) {
            setFilter(prev => {
              const exists = devicesToUse.some(d => String(d.id || d.deviceId) === String(prev.deviceId));
              if (!exists) {
                const defaultDevId = String(devicesToUse[0]?.id || devicesToUse[0]?.deviceId || '');
                return { ...prev, deviceId: defaultDevId };
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.warn('Error fetching devices for site:', err);
      }
    };

    loadSiteDevices();
    return () => { isMounted = false; };
  }, [selectedSiteId, currentSite]);

  // Listen for global device changes from GlobalSiteAssetDropdown
  useEffect(() => {
    const handleDeviceEvent = (e) => {
      if (e.detail?.deviceId) {
        setFilter(prev => ({ ...prev, deviceId: String(e.detail.deviceId) }));
      }
    };
    window.addEventListener('scada_device_changed', handleDeviceEvent);
    return () => window.removeEventListener('scada_device_changed', handleDeviceEvent);
  }, []);

  // Resolve target meter display name
  const selectedMeterName = useMemo(() => {
    const dev = siteDevices.find(d => String(d.id || d.deviceId) === String(filter.deviceId));
    if (dev) {
      return dev.name || dev.deviceName || `Meter (ID: ${dev.id || dev.deviceId})`;
    }
    return filter.deviceId ? `Normal Meter (ID: ${filter.deviceId})` : selectedSiteName;
  }, [siteDevices, filter.deviceId, selectedSiteName]);

  // 2. Fetch energy report cleanly without request spam or 401s
  // Calls GET /api/v1/reports/energy with Bearer token authentication
  const fetchEnergyReport = useCallback(async (currentFilter) => {
    if (!currentFilter?.deviceId) return;

    const requestId = ++activeRequestRef.current;
    setLoading(true);

    try {
      const devId = currentFilter.deviceId;
      const startISO = `${currentFilter.startDate}T00:00:00Z`;
      const endISO = `${currentFilter.endDate}T23:59:59Z`;
      const intervalVal = currentFilter.interval || 'DAILY';

      const queryParams = {
        deviceId: String(devId),
        startDate: startISO,
        endDate: endISO,
        interval: intervalVal
      };

      // Call internal authenticated API route (/api/v1/reports/energy)
      // Never call external URL directly in browser to avoid 401s
      const reportRes = await apiClient.get('/reports/energy', queryParams).catch((err) => {
        console.warn('Failed to load energy report:', err);
        return null;
      });

      // Discard stale response if another request was triggered
      if (requestId !== activeRequestRef.current) {
        return;
      }

      // Extract records: backend returns { success: true, data: { deviceId, data: [...] } }
      let rawRecords = [];
      if (Array.isArray(reportRes?.data?.data)) {
        rawRecords = reportRes.data.data;
      } else if (Array.isArray(reportRes?.data)) {
        rawRecords = reportRes.data;
      } else if (Array.isArray(reportRes?.data?.records)) {
        rawRecords = reportRes.data.records;
      } else if (Array.isArray(reportRes?.records)) {
        rawRecords = reportRes.records;
      } else if (Array.isArray(reportRes?.items)) {
        rawRecords = reportRes.items;
      } else if (Array.isArray(reportRes)) {
        rawRecords = reportRes;
      }

      const currentDeviceObj = siteDevices.find(d => String(d.id || d.deviceId) === String(devId));
      const meterDisplayName = currentDeviceObj?.name || `Meter #${devId}`;

      if (rawRecords && rawRecords.length > 0) {
        const pad = (n) => String(n).padStart(2, '0');

        const parsedRows = rawRecords.map((item, idx) => {
          const startInstant = item.windowStart || item.timestamp || item.time || item.date || item.createdAt;
          const endInstant = item.windowEnd || item.recordedAt || startInstant;

          let dateCol = '-';
          let timeRangeCol = '-';
          let windowEndCol = '-';

          if (startInstant) {
            const startDateObj = new Date(startInstant);
            const endDateObj = endInstant ? new Date(endInstant) : startDateObj;

            const yyyy = startDateObj.getFullYear();
            const mm = pad(startDateObj.getMonth() + 1);
            const dd = pad(startDateObj.getDate());
            dateCol = `${dd}-${mm}-${yyyy}`;

            const startHH = pad(startDateObj.getHours());
            const startMM = pad(startDateObj.getMinutes());
            const endHH = pad(endDateObj.getHours());
            const endMM = pad(endDateObj.getMinutes());

            if (intervalVal === 'DAILY') {
              timeRangeCol = '24h (Daily)';
            } else {
              timeRangeCol = `${startHH}:${startMM} - ${endHH}:${endMM}`;
            }

            const endDD = pad(endDateObj.getDate());
            const endMMMonth = pad(endDateObj.getMonth() + 1);
            const endYYYY = endDateObj.getFullYear();
            const endSS = pad(endDateObj.getSeconds());
            windowEndCol = `${endDD}-${endMMMonth}-${endYYYY} ${endHH}:${endMM}:${endSS}`;
          }

          // Active Energy (kWh) — strictly from API
          let kwhStr = '-';
          let rawKwh = 0;
          if (item.energyDelta != null) {
            rawKwh = Number(item.energyDelta) || 0;
            kwhStr = `${rawKwh.toFixed(2)} kWh`;
          } else if (item.closingEnergy != null && item.openingEnergy != null) {
            rawKwh = Math.max(0, Number(item.closingEnergy) - Number(item.openingEnergy));
            kwhStr = `${rawKwh.toFixed(2)} kWh`;
          } else if (item.consumption != null || item.energy != null) {
            rawKwh = Number(item.consumption ?? item.energy) || 0;
            kwhStr = `${rawKwh.toFixed(2)} kWh`;
          }

          // Active Power (kW) — strictly from API
          let kwStr = '-';
          let rawKw = 0;
          if (item.demandMax != null || item.peakDemand != null || item.demand != null) {
            rawKw = Number(item.demandMax ?? item.peakDemand ?? item.demand) || 0;
            kwStr = `${rawKw.toFixed(2)} kW`;
          }

          // Apparent Energy (kVAh) — strictly from API
          let kvahStr = '-';
          let rawKvah = 0;
          if (item.kvahDelta != null) {
            rawKvah = Number(item.kvahDelta) || 0;
            kvahStr = `${rawKvah.toFixed(2)} kVAh`;
          } else if (item.closingKvah != null && item.openingKvah != null) {
            rawKvah = Math.max(0, Number(item.closingKvah) - Number(item.openingKvah));
            kvahStr = `${rawKvah.toFixed(2)} kVAh`;
          } else if (item.apparentEnergy != null || item.kvah != null) {
            rawKvah = Number(item.apparentEnergy ?? item.kvah) || 0;
            kvahStr = `${rawKvah.toFixed(2)} kVAh`;
          }

          // Power Factor (PF) — only from API, NO default 0.99
          const pfStr = item.pfAvg != null || item.powerFactor != null || item.pf != null
            ? Number(item.pfAvg ?? item.powerFactor ?? item.pf).toFixed(2)
            : '-';

          return {
            srNo: idx + 1,
            date: dateCol,
            timeRange: timeRangeCol,
            windowEnd: windowEndCol,
            meter: meterDisplayName,
            kwh: kwhStr,
            kw: kwStr,
            kvah: kvahStr,
            pf: pfStr,
            rawKwh,
            rawKw,
            rawKvah
          };
        });

        setReportData(parsedRows);
        return;
      }

      // Zero dummy data when no records returned
      setReportData([]);
    } catch (err) {
      console.warn('Error fetching energy report:', err);
      setReportData([]);
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoading(false);
      }
    }
  }, [siteDevices]);

  // Single trigger: fetch report strictly when filter parameters change (single request flow)
  useEffect(() => {
    if (filter.deviceId) {
      fetchEnergyReport(filter);
    }
  }, [filter.deviceId, filter.interval, filter.startDate, filter.endDate, fetchEnergyReport]);

  // Target Meter selection
  const handleDeviceSelectionChange = (e) => {
    const val = e.target.value;
    setFilter(prev => ({ ...prev, deviceId: val }));
  };

  // Interval selection: MIN_15 | HOURLY | DAILY
  const handleIntervalChange = (val) => {
    setFilter(prev => ({ ...prev, interval: val }));
  };

  // Manual Generate Report re-trigger
  const handleGenerate = async () => {
    setGenerating(true);
    await fetchEnergyReport(filter);
    setGenerating(false);
  };

  // Export to Excel / CSV with UTF-8 Byte Order Mark
  const handleDownloadExcel = () => {
    if (reportData.length === 0) return;
    const headers = [
      '#,Date,Time Window,Target Feed Node,Active Energy (kWh),Active Power (kW),Apparent Energy (kVAh),Power Factor (PF),Recorded Time'
    ];
    const csvRows = reportData.map(r =>
      `"${r.srNo}","${r.date}","${r.timeRange}","${r.meter}","${r.kwh}","${r.kw}","${r.kvah}","${r.pf}","${r.windowEnd}"`
    );
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + [headers.join(','), ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Energy_Report_${selectedMeterName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${filter.interval}_${filter.startDate}_to_${filter.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download professional executive PDF
  const handleDownloadPdf = () => {
    if (reportData.length === 0) return;

    const totalKwh = reportData.reduce((acc, r) => acc + (r.rawKwh || 0), 0);
    const maxKw = Math.max(...reportData.map(r => r.rawKw || 0));
    const totalKvah = reportData.reduce((acc, r) => acc + (r.rawKvah || 0), 0);
    const validPfs = reportData.filter(r => r.pf !== '-').map(r => parseFloat(r.pf));
    const avgPfVal = validPfs.length > 0 ? (validPfs.reduce((a, b) => a + b, 0) / validPfs.length).toFixed(2) : '-';
    const latestTime = reportData[reportData.length - 1]?.windowEnd || new Date().toLocaleString('en-IN');

    generateUserCustomPdfReport({
      title: 'Energy Telemetry & Metering Report',
      subtitle: `Target: ${selectedMeterName} • Interval: ${filter.interval}`,
      siteName: selectedSiteName,
      targetMeter: selectedMeterName,
      dateRange: `${filter.startDate} to ${filter.endDate} (${filter.interval})`,
      kpis: [
        { label: 'Active Energy', value: `${totalKwh.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`, unit: 'kWh' },
        { label: 'Peak Active Power', value: `${maxKw.toFixed(1)}`, unit: 'kW' },
        { label: 'Apparent Energy', value: `${totalKvah.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`, unit: 'kVAh' },
        { label: 'Power Factor', value: avgPfVal, unit: 'PF' },
        { label: 'Recorded Time', value: latestTime }
      ],
      headers: [
        '#',
        'Date',
        'Time Window',
        'Target Feed Node',
        'Active Energy (kWh)',
        'Active Power (kW)',
        'Apparent Energy (kVAh)',
        'Power Factor (PF)',
        'Recorded Time'
      ],
      data: reportData.map(r => [
        r.srNo,
        r.date,
        r.timeRange,
        r.meter,
        r.kwh,
        r.kw,
        r.kvah,
        r.pf,
        r.windowEnd
      ]),
      fileName: `Energy_Report_${selectedMeterName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${filter.interval}_${filter.startDate}_to_${filter.endDate}.pdf`
    });
  };

  return (
    <div className="energy-reports-page fade-in p-3 p-md-4">

      {/* FILTER CONTROL CARD */}
      <Card className="scada-card border-0 mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', borderRadius: '16px' }}>
        <Card.Body className="p-3 p-md-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0 fw-bold text-white d-flex align-items-center gap-2 fs-13 text-uppercase text-secondary">
              <Calendar className="text-info" size={16} /> Report Parameters & Filters
            </h6>
            <div className="d-flex align-items-center gap-2">
              {loading && (
                <span className="text-info fs-12 d-flex align-items-center gap-2 me-2">
                  <Spinner animation="border" size="sm" /> Querying Energy Report...
                </span>
              )}
              <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-25 px-2.5 py-1 rounded-pill d-flex align-items-center gap-2 fs-11 fw-semibold">
                <Building2 size={13} />
                Selected: {selectedMeterName}
              </Badge>
            </div>
          </div>

          <Row className="g-3 align-items-end">
            {/* TARGET METER */}
            <Col md={3}>
              <Form.Group>
                <Form.Label className="text-secondary fw-semibold fs-12 mb-1">Target Meter</Form.Label>
                <Form.Select
                  className="bg-dark text-white border-secondary border-opacity-50 rounded-3 py-2 fw-semibold"
                  value={String(filter.deviceId || '')}
                  onChange={handleDeviceSelectionChange}
                  aria-label="Target Meter"
                >
                  {siteDevices.length > 0 ? (
                    siteDevices.map(d => {
                      const dId = String(d.id || d.deviceId || '');
                      const dName = d.name || d.deviceName || `Meter #${dId}`;
                      return (
                        <option key={dId} value={dId}>
                          {dName} (ID: {dId})
                        </option>
                      );
                    })
                  ) : (
                    <option value="">No meters available</option>
                  )}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* SELECT INTERVAL (15 Minutes, Hourly, Daily) */}
            <Col md={3}>
              <Form.Group>
                <Form.Label className="text-warning fw-bold fs-12 mb-1 d-flex align-items-center gap-2 text-uppercase" style={{ letterSpacing: '0.5px' }}>
                  <Clock size={14} className="text-warning" /> Select Interval
                </Form.Label>
                <Form.Select
                  className="bg-dark text-white border-secondary border-opacity-50 rounded-3 py-2 fw-semibold"
                  value={filter.interval}
                  onChange={(e) => handleIntervalChange(e.target.value)}
                  aria-label="Select Interval"
                >
                  <option value="MIN_15">15 Minutes</option>
                  <option value="HOURLY">Hourly</option>
                  <option value="DAILY">Daily</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* START DATE */}
            <Col md={2}>
              <Form.Group>
                <Form.Label className="text-secondary fw-semibold fs-12 mb-1">Start Date</Form.Label>
                <Form.Control
                  type="date"
                  className="bg-dark text-white border-secondary border-opacity-50 rounded-3 py-2"
                  value={filter.startDate}
                  onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </Form.Group>
            </Col>

            {/* END DATE */}
            <Col md={2}>
              <Form.Group>
                <Form.Label className="text-secondary fw-semibold fs-12 mb-1">End Date</Form.Label>
                <Form.Control
                  type="date"
                  className="bg-dark text-white border-secondary border-opacity-50 rounded-3 py-2"
                  value={filter.endDate}
                  onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </Form.Group>
            </Col>

            {/* GENERATE REPORT BUTTON */}
            <Col md={2} className="d-grid">
              <Button
                onClick={handleGenerate}
                disabled={generating || loading}
                variant="info"
                className="rounded-pill py-2 fw-bold text-white shadow-sm d-flex align-items-center justify-content-center gap-2"
              >
                {generating ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                {generating ? 'Compiling...' : 'Generate Report'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* GENERATED REPORT DATA TABLE */}
      <Card className="scada-card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))', borderRadius: '16px' }}>
        <Card.Body className="p-3 p-md-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div>
              <h6 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
                <ClipboardList className="text-info" size={18} /> Generated Report Ledger
              </h6>
              <small className="text-secondary">
                {reportData.length > 0 ? (
                  <>Showing {reportData.length} recorded interval{reportData.length > 1 ? 's' : ''} for <strong className="text-info">{selectedMeterName}</strong> (Interval: {filter.interval}).</>
                ) : (
                  <>Showing 0 recorded intervals for <strong className="text-secondary">{selectedMeterName}</strong> (No report data).</>
                )}
              </small>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <Button
                variant="outline-success"
                size="sm"
                disabled={reportData.length === 0}
                onClick={handleDownloadExcel}
                className="rounded-pill px-3 py-1.5 text-success border-success border-opacity-50 d-flex align-items-center gap-2 fs-12 fw-semibold"
                title="Export report as Excel spreadsheet"
              >
                <FileSpreadsheet size={15} /> Export Excel
              </Button>
              <Button
                variant="info"
                size="sm"
                disabled={reportData.length === 0}
                onClick={handleDownloadPdf}
                className="rounded-pill px-3 py-1.5 text-white fw-bold d-flex align-items-center gap-2 fs-12 shadow-sm"
                title="Download professional PDF report"
              >
                <Download size={15} /> Download PDF
              </Button>
            </div>
          </div>

          {reportData.length === 0 ? (
            <div className="text-center py-5">
              <div className="p-4 rounded-3 d-inline-block text-secondary" style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px dashed rgba(255, 255, 255, 0.1)', maxWidth: '480px' }}>
                <AlertCircle className="mx-auto mb-2 text-warning opacity-75 d-block" size={32} />
                <h6 className="text-white fw-bold mb-1">No Telemetry Report Recorded</h6>
                <p className="fs-12 mb-0 text-secondary">
                  Target <strong className="text-info">{selectedMeterName}</strong> does not have recorded telemetry data for interval <span className="text-warning fw-semibold">{filter.interval}</span> ({filter.startDate} to {filter.endDate}). Dummy data generation is disabled.
                </p>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover borderless className="align-middle text-white mb-0" style={{ fontSize: '0.85rem' }}>
                <thead style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <tr className="text-secondary text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3">Date</th>
                    <th className="py-3">Time Window</th>
                    <th className="py-3">Target Feed Node</th>
                    <th className="py-3 text-end">Active Energy (kWh)</th>
                    <th className="py-3 text-end">Active Power (kW)</th>
                    <th className="py-3 text-end">Apparent Energy (kVAh)</th>
                    <th className="py-3 text-center">Power Factor (PF)</th>
                    <th className="py-3 text-end px-3">
                      <span className="d-inline-flex align-items-center justify-content-end gap-2">
                        <Clock size={12} className="text-secondary opacity-75" />
                        <span>Recorded Time</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row) => (
                    <tr key={row.srNo} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="py-3 px-3 font-monospace text-secondary fs-12">{row.srNo}</td>
                      <td className="py-3 text-white fw-semibold">{row.date}</td>
                      <td className="py-3 text-secondary font-monospace fs-12">{row.timeRange}</td>
                      <td className="py-3 text-light">{row.meter}</td>
                      <td className="py-3 text-end text-white fw-bold font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.kwh}
                      </td>
                      <td className="py-3 text-end text-secondary font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.kw}
                      </td>
                      <td className="py-3 text-end text-light font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.kvah}
                      </td>
                      <td className="py-3 text-center text-secondary font-monospace">
                        {row.pf}
                      </td>
                      <td className="py-3 text-end px-3 font-monospace fs-12" style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        <span className="d-inline-flex align-items-center justify-content-end gap-2 text-info fw-semibold">
                          <Clock size={13} className="text-secondary opacity-75 flex-shrink-0" />
                          <span>{row.windowEnd}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default EnergyPDFReport;
