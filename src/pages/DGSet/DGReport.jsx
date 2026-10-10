import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Row, Col, Card, Form, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { Download, Calendar, ClipboardList, RefreshCw, Zap, FileSpreadsheet, Building2, Clock, AlertCircle, Database, Gauge, Activity } from 'lucide-react';
import { generateUserCustomPdfReport } from '../../utils/pdfReportGenerator';
import { useSiteStore } from '../../hooks/useSiteStore';
import { apiClient, normalizeList } from '../../services/apiClient';
import { bmsService } from '../../services/bmsService';

const DGReport = () => {
  const { sites = [], activeSites = [], selectedSite } = useSiteStore();

  const allSites = useMemo(() => {
    return activeSites.length > 0 ? activeSites : sites;
  }, [activeSites, sites]);

  // Current active site
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
  // GET /api/v1/reports/dg?deviceId=9&startDate=2026-09-26T00:00:00Z&endDate=2026-10-03T23:59:59Z&interval=DAILY
  const [filter, setFilter] = useState({
    deviceId: '9',
    interval: 'DAILY',
    startDate: '2026-09-26',
    endDate: '2026-10-03',
    dgReportType: 'summary'
  });

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [siteDevices, setSiteDevices] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);

  // Sequence ref to prevent race conditions & ignore stale responses
  const activeRequestRef = useRef(0);

  // 1. Fetch site devices on site change to resolve available generator / meter IDs (e.g. deviceId: 9)
  useEffect(() => {
    let isMounted = true;
    const loadSiteDevices = async () => {
      if (!selectedSiteId) return;
      try {
        const res = await apiClient.get('/devices', { siteId: String(selectedSiteId) }).catch(() => null);
        const list = normalizeList(res, 'devices');

        if (isMounted && list && list.length > 0) {
          // Prioritize GENERATOR, DG_SET, or electrical metering devices
          const dgList = list.filter(d =>
            d.category === 'GENERATOR' ||
            d.category === 'DG_SET' ||
            d.category === 'DG' ||
            d.category === 'DIESEL_GENERATOR' ||
            (d.name && /dg|generator|genset/i.test(d.name))
          );
          // If no dedicated generator exists, only permit power/electrical meters (exclude environmental temp/aqi sensors)
          const devicesToUse = dgList.length > 0
            ? dgList
            : list.filter(d =>
                d.category === 'ENERGY_METER' ||
                d.category === 'LT_PANEL' ||
                d.category === 'MAIN_ENERGY_METER' ||
                (d.category !== 'AQI_SENSOR' && d.category !== 'SENSOR')
              );
          setSiteDevices(devicesToUse);

          setFilter(prev => {
            const exists = devicesToUse.some(d => String(d.id || d.deviceId) === String(prev.deviceId));
            if (!exists) {
              const defaultDevId = String(devicesToUse[0]?.id || devicesToUse[0]?.deviceId || '9');
              return { ...prev, deviceId: defaultDevId };
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn('[DGReport] Error fetching devices:', err);
      }
    };

    loadSiteDevices();
    return () => { isMounted = false; };
  }, [selectedSiteId]);

  // Selected device display name
  const selectedDeviceName = useMemo(() => {
    const dev = siteDevices.find(d => String(d.id || d.deviceId) === String(filter.deviceId));
    if (dev) {
      return dev.name || dev.deviceName || `DG Unit #${dev.id || dev.deviceId}`;
    }
    return filter.deviceId ? `DG Unit (ID: ${filter.deviceId})` : 'DG Unit';
  }, [siteDevices, filter.deviceId]);

  // 2. Fetch DG report strictly without dummy data:
  // Calls GET /api/v1/reports/dg?deviceId=...&startDate=...&endDate=...&interval=...
  const fetchDgReport = useCallback(async (currentFilter) => {
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
        interval: intervalVal,
        dgReportType: currentFilter.dgReportType || 'summary'
      };

      const reportRes = await bmsService.getDgReports(queryParams).catch((err) => {
        console.warn('[DGReport] Failed to load DG report:', err);
        return null;
      });

      // Discard stale out-of-order response
      if (requestId !== activeRequestRef.current) {
        return;
      }

      // Extract raw records: strictly from backend response
      let rawRecords = [];
      if (Array.isArray(reportRes?.data?.data)) {
        rawRecords = reportRes.data.data;
      } else if (Array.isArray(reportRes?.data)) {
        rawRecords = reportRes.data;
      } else if (Array.isArray(reportRes?.data?.records)) {
        rawRecords = reportRes.data.records;
      } else if (Array.isArray(reportRes?.records)) {
        rawRecords = reportRes.records;
      } else if (Array.isArray(reportRes)) {
        rawRecords = reportRes;
      }

      const summaryObj = reportRes?.data?.summary || null;
      setReportSummary(summaryObj);

      const currentDevObj = siteDevices.find(d => String(d.id || d.deviceId) === String(devId));
      const gensetDisplayName = currentDevObj?.name || `DG Unit #${devId}`;

      // Strictly parse real records — NO dummy data, NO synthetic fallback rows
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

          // Energy Generated (kWh) — strictly from API
          let kwhStr = '-';
          let rawKwh = 0;
          if (item.energyDelta != null) {
            rawKwh = Number(item.energyDelta) || 0;
            kwhStr = `${rawKwh.toFixed(2)} kWh`;
          } else if (item.closingEnergy != null && item.openingEnergy != null) {
            rawKwh = Math.max(0, Number(item.closingEnergy) - Number(item.openingEnergy));
            kwhStr = `${rawKwh.toFixed(2)} kWh`;
          } else if (item.consumption != null || item.energy != null || item.energyGen != null) {
            rawKwh = Number(item.consumption ?? item.energy ?? item.energyGen) || 0;
            kwhStr = `${rawKwh.toFixed(2)} kWh`;
          }

          // Peak Demand (kW) — strictly from API
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

          // Power Factor (PF) — only if reported, NO default 0.99
          const pfStr = item.pfAvg != null || item.powerFactor != null || item.pf != null
            ? Number(item.pfAvg ?? item.powerFactor ?? item.pf).toFixed(2)
            : '-';

          // Voltages and Currents — strictly from API
          const voltageStr = item.voltageAvg != null || item.voltage != null
            ? `${Number(item.voltageAvg ?? item.voltage).toFixed(1)} V`
            : '-';

          const currentStr = item.currentAvg != null || item.current != null
            ? `${Number(item.currentAvg ?? item.current).toFixed(2)} A`
            : '-';

          const openingKwh = item.openingEnergy != null ? Number(item.openingEnergy).toFixed(2) : '-';
          const closingKwh = item.closingEnergy != null ? Number(item.closingEnergy).toFixed(2) : '-';

          return {
            srNo: idx + 1,
            date: dateCol,
            timeRange: timeRangeCol,
            windowEnd: windowEndCol,
            equipment: gensetDisplayName,
            kwh: kwhStr,
            kw: kwStr,
            kvah: kvahStr,
            voltage: voltageStr,
            current: currentStr,
            pf: pfStr,
            openingKwh,
            closingKwh,
            rawKwh,
            rawKw,
            rawKvah,
            rawVoltage: Number(item.voltageAvg) || 0,
            rawCurrent: Number(item.currentAvg) || 0
          };
        });

        setReportData(parsedRows);
        return;
      }

      // If no records exist in the database, DO NOT fabricate any summary row.
      // Strictly show zero data so user knows no telemetry is recorded.
      setReportData([]);
    } catch (err) {
      console.warn('[DGReport] Error fetching DG report:', err);
      setReportData([]);
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoading(false);
      }
    }
  }, [siteDevices]);

  // Single trigger: fetch report strictly when filter parameters change
  useEffect(() => {
    if (filter.deviceId) {
      fetchDgReport(filter);
    }
  }, [filter.deviceId, filter.interval, filter.startDate, filter.endDate, filter.dgReportType, fetchDgReport]);

  // Target DG Device selection
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
    await fetchDgReport(filter);
    setGenerating(false);
  };

  // Export to Excel / CSV with UTF-8 Byte Order Mark
  const handleDownloadExcel = () => {
    if (reportData.length === 0) return;
    const headers = [
      'Sr. No.,Date,Time Window,Equipment,Energy Generated (kWh),Peak Demand (kW),Apparent Energy (kVAh),Avg Voltage (V),Avg Current (A),Power Factor,Opening Reading (kWh),Closing Reading (kWh)'
    ];
    const csvRows = reportData.map(r =>
      `"${r.srNo}","${r.date}","${r.timeRange}","${r.equipment}","${r.kwh}","${r.kw}","${r.kvah}","${r.voltage}","${r.current}","${r.pf}","${r.openingKwh}","${r.closingKwh}"`
    );
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + [headers.join(','), ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DG_Report_${selectedDeviceName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${filter.interval}_${filter.startDate}_to_${filter.endDate}.csv`);
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
      title: 'DG Set Telemetry & Operations Report',
      subtitle: `Target: ${selectedDeviceName} • Interval: ${filter.interval}`,
      siteName: selectedSiteName,
      targetMeter: selectedDeviceName,
      dateRange: `${filter.startDate} to ${filter.endDate} (${filter.interval})`,
      kpis: [
        { label: 'Energy Generated', value: `${totalKwh.toFixed(2)}`, unit: 'kWh' },
        { label: 'Peak Power Demand', value: `${maxKw.toFixed(2)}`, unit: 'kW' },
        { label: 'Apparent Energy', value: `${totalKvah.toFixed(2)}`, unit: 'kVAh' },
        { label: 'Avg Power Factor', value: avgPfVal },
        { label: 'Latest Recorded Time', value: latestTime }
      ],
      headers: [
        '#',
        'Date',
        'Time Window',
        'Equipment',
        'Energy Generated (kWh)',
        'Peak Demand (kW)',
        'Apparent Energy (kVAh)',
        'Avg Voltage (V)',
        'Avg Current (A)',
        'Power Factor',
        'Opening (kWh)',
        'Closing (kWh)'
      ],
      data: reportData.map(r => [
        r.srNo,
        r.date,
        r.timeRange,
        r.equipment,
        r.kwh,
        r.kw,
        r.kvah,
        r.voltage,
        r.current,
        r.pf,
        r.openingKwh,
        r.closingKwh
      ]),
      fileName: `DG_Report_${selectedDeviceName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${filter.interval}_${filter.startDate}_to_${filter.endDate}.pdf`
    });
  };

  // Calculate summary metrics for header badges strictly from data
  const totalGenEnergy = useMemo(() => {
    return reportData.reduce((acc, r) => acc + (r.rawKwh || 0), 0);
  }, [reportData]);

  const maxPeakDemand = useMemo(() => {
    return reportData.length > 0 ? Math.max(...reportData.map(r => r.rawKw || 0)) : 0;
  }, [reportData]);

  return (
    <div className="dg-reports-page fade-in p-3 p-md-4">

      {/* FILTER CONTROL CARD */}
      <Card className="scada-card border-0 mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', borderRadius: '16px' }}>
        <Card.Body className="p-3 p-md-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0 fw-bold text-white d-flex align-items-center gap-2 fs-13 text-uppercase text-secondary">
              <Calendar className="text-info" size={16} /> DG Report Parameters & Filters
            </h6>
            <div className="d-flex align-items-center gap-2">
              {loading && (
                <span className="text-info fs-12 d-flex align-items-center gap-2 me-2">
                  <Spinner animation="border" size="sm" /> Querying DG Telemetry...
                </span>
              )}
              <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-25 px-2.5 py-1 rounded-pill d-flex align-items-center gap-2 fs-11 fw-semibold">
                <Database size={13} className="text-info" />
                Selected: {selectedDeviceName}
              </Badge>
            </div>
          </div>

          <Row className="g-3 align-items-end">
            {/* TARGET DG SET */}
            <Col md={3}>
              <Form.Group>
                <Form.Label className="text-secondary fw-semibold fs-12 mb-1">Target DG Equipment</Form.Label>
                <Form.Select
                  className="bg-dark text-white border-secondary border-opacity-50 rounded-3 py-2 fw-semibold"
                  value={String(filter.deviceId || '')}
                  onChange={handleDeviceSelectionChange}
                  aria-label="Target DG Equipment"
                >
                  {siteDevices.length > 0 ? (
                    siteDevices.map(d => {
                      const dId = String(d.id || d.deviceId || '');
                      const dName = d.name || d.deviceName || `DG Unit #${dId}`;
                      return (
                        <option key={dId} value={dId}>
                          {dName} (ID: {dId})
                        </option>
                      );
                    })
                  ) : (
                    <option value="">No equipment available</option>
                  )}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* SELECT INTERVAL */}
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

          {/* Quick Metrics KPI Bar strictly if real data exists */}
          {reportData.length > 0 && (
            <div className="mt-3 pt-3 border-top border-secondary border-opacity-25 d-flex flex-wrap gap-3 align-items-center justify-content-between">
              <div className="d-flex flex-wrap gap-4 align-items-center">
                <div>
                  <small className="text-secondary d-block fs-11 text-uppercase">Total Generated</small>
                  <span className="fs-14 fw-bold text-white font-monospace">{totalGenEnergy.toFixed(2)} kWh</span>
                </div>
                <div className="border-start border-secondary border-opacity-25 ps-3">
                  <small className="text-secondary d-block fs-11 text-uppercase">Max Demand</small>
                  <span className="fs-14 fw-bold text-warning font-monospace">{maxPeakDemand.toFixed(2)} kW</span>
                </div>
                {reportSummary?.voltageAvg != null && (
                  <div className="border-start border-secondary border-opacity-25 ps-3">
                    <small className="text-secondary d-block fs-11 text-uppercase">Avg Voltage</small>
                    <span className="fs-14 fw-bold text-info font-monospace">{Number(reportSummary.voltageAvg).toFixed(1)} V</span>
                  </div>
                )}
                {reportSummary?.pfAvg != null && (
                  <div className="border-start border-secondary border-opacity-25 ps-3">
                    <small className="text-secondary d-block fs-11 text-uppercase">Avg Power Factor</small>
                    <span className="fs-14 fw-bold text-light font-monospace">{Number(reportSummary.pfAvg).toFixed(2)}</span>
                  </div>
                )}
              </div>
              <Badge bg="secondary" className="bg-opacity-25 text-light px-2.5 py-1.5 rounded-pill fs-11">
                Interval: {filter.interval} • Range: {filter.startDate} to {filter.endDate}
              </Badge>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* GENERATED REPORT DATA TABLE */}
      <Card className="scada-card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))', borderRadius: '16px' }}>
        <Card.Body className="p-3 p-md-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div>
              <h6 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
                <ClipboardList className="text-info" size={18} /> DG Generated Report Ledger
              </h6>
              <small className="text-secondary">
                {reportData.length > 0 ? (
                  <>Showing {reportData.length} recorded interval{reportData.length > 1 ? 's' : ''} for <strong className="text-info">{selectedDeviceName}</strong> (Interval: {filter.interval}).</>
                ) : (
                  <>Showing 0 recorded intervals for <strong className="text-secondary">{selectedDeviceName}</strong> (No report data in this range).</>
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
                <h6 className="text-white fw-bold mb-1">No DG Telemetry Recorded</h6>
                <p className="fs-12 mb-0 text-secondary">
                  Target <strong className="text-info">{selectedDeviceName}</strong> does not have recorded telemetry data in the system for interval <span className="text-warning fw-semibold">{filter.interval}</span> ({filter.startDate} to {filter.endDate}). Dummy data is disabled.
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
                    <th className="py-3">Equipment</th>
                    <th className="py-3 text-end">Energy Generated (kWh)</th>
                    <th className="py-3 text-end">Peak Demand (kW)</th>
                    <th className="py-3 text-end">Apparent Energy (kVAh)</th>
                    <th className="py-3 text-end">Avg Voltage (V)</th>
                    <th className="py-3 text-end">Avg Current (A)</th>
                    <th className="py-3 text-center">Power Factor</th>
                    <th className="py-3 text-end">Opening Reading (kWh)</th>
                    <th className="py-3 text-end">Closing Reading (kWh)</th>
                    <th className="py-3 text-end px-3">
                      <span className="d-inline-flex align-items-center justify-content-end gap-2 text-nowrap">
                        <Clock size={12} className="text-secondary opacity-75" />
                        <span>Last Updated</span>
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
                      <td className="py-3 text-light">{row.equipment}</td>
                      <td className="py-3 text-end text-white fw-bold font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.kwh}
                      </td>
                      <td className="py-3 text-end text-warning font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.kw}
                      </td>
                      <td className="py-3 text-end text-light font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.kvah}
                      </td>
                      <td className="py-3 text-end text-secondary font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.voltage}
                      </td>
                      <td className="py-3 text-end text-secondary font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.current}
                      </td>
                      <td className="py-3 text-center text-secondary font-monospace">
                        {row.pf}
                      </td>
                      <td className="py-3 text-end text-secondary font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.openingKwh}
                      </td>
                      <td className="py-3 text-end text-secondary font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.closingKwh}
                      </td>
                      <td className="py-3 text-end text-secondary font-monospace px-3" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        <span className="d-inline-flex align-items-center justify-content-end gap-2 text-nowrap">
                          <Clock size={11} className="text-info opacity-75 flex-shrink-0" />
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

export default DGReport;
