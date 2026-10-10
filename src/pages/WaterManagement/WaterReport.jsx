import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Row, Col, Card, Form, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { Download, Calendar, ClipboardList, RefreshCw, Zap, FileSpreadsheet, Building2, Clock, AlertCircle, Database, Waves, Droplets } from 'lucide-react';
import { generateUserCustomPdfReport } from '../../utils/pdfReportGenerator';
import { useSiteStore } from '../../hooks/useSiteStore';
import { apiClient, normalizeList } from '../../services/apiClient';
import { bmsService } from '../../services/bmsService';

const WaterReport = () => {
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

  // Filter state
  const [filter, setFilter] = useState({
    deviceId: '9',
    interval: 'DAILY',
    startDate: '2026-09-26',
    endDate: '2026-10-03'
  });

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [siteDevices, setSiteDevices] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);

  const activeRequestRef = useRef(0);

  // 1. Fetch site devices and filter for water tanks / water management nodes
  useEffect(() => {
    let isMounted = true;
    const loadSiteDevices = async () => {
      if (!selectedSiteId) return;
      try {
        const res = await apiClient.get('/devices', { siteId: String(selectedSiteId) }).catch(() => null);
        const list = normalizeList(res, 'devices');

        if (isMounted && list && list.length > 0) {
          // Prioritize UG_TANK, AG_TANK, or WATER equipment
          const tankList = list.filter(d =>
            d.category === 'UG_TANK' ||
            d.category === 'AG_TANK' ||
            d.category === 'TANK' ||
            d.category === 'WATER_TANK' ||
            d.category === 'WATER' ||
            (d.name && /tank|water|sump|overhead|underground|domestic/i.test(d.name))
          );
          // If no dedicated tank equipment exists in site profile, allow general electrical/utility devices, excluding AQI/ambient temp sensors
          const devicesToUse = tankList.length > 0
            ? tankList
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
        console.warn('[WaterReport] Error fetching devices:', err);
      }
    };

    loadSiteDevices();
    return () => { isMounted = false; };
  }, [selectedSiteId]);

  // Selected device display name
  const selectedDeviceName = useMemo(() => {
    const dev = siteDevices.find(d => String(d.id || d.deviceId) === String(filter.deviceId));
    if (dev) {
      return dev.name || dev.deviceName || `Water Unit #${dev.id || dev.deviceId}`;
    }
    return filter.deviceId ? `Water Unit (ID: ${filter.deviceId})` : 'Water Unit';
  }, [siteDevices, filter.deviceId]);

  // 2. Fetch Water report strictly without dummy data
  const fetchWaterReport = useCallback(async (currentFilter) => {
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

      const reportRes = await bmsService.getWaterReports(queryParams).catch((err) => {
        console.warn('[WaterReport] Failed to load water report:', err);
        return null;
      });

      if (requestId !== activeRequestRef.current) return;

      // Extract raw records from response
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
      const waterDisplayName = currentDevObj?.name || `Water Unit #${devId}`;

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

          // Water Level Avg (%) — strictly from API
          let levelAvgStr = '-';
          let rawLevelAvg = 0;
          if (item.levelAvg != null || item.level != null || item.waterLevel != null) {
            rawLevelAvg = Number(item.levelAvg ?? item.level ?? item.waterLevel) || 0;
            levelAvgStr = `${rawLevelAvg.toFixed(1)} %`;
          }

          // Water Level Min (%) — strictly from API
          let levelMinStr = '-';
          let rawLevelMin = 0;
          if (item.levelMin != null) {
            rawLevelMin = Number(item.levelMin) || 0;
            levelMinStr = `${rawLevelMin.toFixed(1)} %`;
          }

          // Water Level Max (%) — strictly from API
          let levelMaxStr = '-';
          let rawLevelMax = 0;
          if (item.levelMax != null) {
            rawLevelMax = Number(item.levelMax) || 0;
            levelMaxStr = `${rawLevelMax.toFixed(1)} %`;
          }

          // Water Temperature (°C) — strictly from API
          let tempStr = '-';
          let rawTemp = 0;
          if (item.temperatureAvg != null || item.temp != null || item.temperature != null) {
            rawTemp = Number(item.temperatureAvg ?? item.temp ?? item.temperature) || 0;
            tempStr = `${rawTemp.toFixed(1)} °C`;
          }

          // Volume / Consumption (L or kL) — if reported
          let volumeStr = '-';
          let rawVolume = 0;
          if (item.volumeDelta != null || item.consumption != null || item.volume != null) {
            rawVolume = Number(item.volumeDelta ?? item.consumption ?? item.volume) || 0;
            volumeStr = `${rawVolume.toFixed(0)} L`;
          }

          return {
            srNo: idx + 1,
            date: dateCol,
            timeRange: timeRangeCol,
            windowEnd: windowEndCol,
            equipment: waterDisplayName,
            levelAvg: levelAvgStr,
            levelMin: levelMinStr,
            levelMax: levelMaxStr,
            temp: tempStr,
            volume: volumeStr,
            rawLevelAvg,
            rawLevelMin,
            rawLevelMax,
            rawTemp,
            rawVolume
          };
        });

        setReportData(parsedRows);
        return;
      }

      // No records: zero dummy data
      setReportData([]);
    } catch (err) {
      console.warn('[WaterReport] Error fetching water report:', err);
      setReportData([]);
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoading(false);
      }
    }
  }, [siteDevices]);

  // Single trigger on filter parameters change
  useEffect(() => {
    if (filter.deviceId) {
      fetchWaterReport(filter);
    }
  }, [filter.deviceId, filter.interval, filter.startDate, filter.endDate, fetchWaterReport]);

  const handleDeviceSelectionChange = (e) => {
    const val = e.target.value;
    setFilter(prev => ({ ...prev, deviceId: val }));
  };

  const handleIntervalChange = (val) => {
    setFilter(prev => ({ ...prev, interval: val }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    await fetchWaterReport(filter);
    setGenerating(false);
  };

  // Export to Excel / CSV with UTF-8 BOM
  const handleDownloadExcel = () => {
    if (reportData.length === 0) return;
    const headers = [
      'Sr. No.,Date,Time Window,Tank / Source,Avg Water Level (%),Min Level (%),Max Level (%),Water Temp (°C),Volume (L),Last Updated'
    ];
    const csvRows = reportData.map(r =>
      `"${r.srNo}","${r.date}","${r.timeRange}","${r.equipment}","${r.levelAvg}","${r.levelMin}","${r.levelMax}","${r.temp}","${r.volume}","${r.windowEnd}"`
    );
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + [headers.join(','), ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Water_Report_${selectedDeviceName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${filter.interval}_${filter.startDate}_to_${filter.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download professional executive PDF
  const handleDownloadPdf = () => {
    if (reportData.length === 0) return;

    const validLevels = reportData.filter(r => r.levelAvg !== '-').map(r => r.rawLevelAvg);
    const avgLevelVal = validLevels.length > 0 ? (validLevels.reduce((a, b) => a + b, 0) / validLevels.length).toFixed(1) : '-';

    const validTemps = reportData.filter(r => r.temp !== '-').map(r => r.rawTemp);
    const avgTempVal = validTemps.length > 0 ? (validTemps.reduce((a, b) => a + b, 0) / validTemps.length).toFixed(1) : '-';

    const latestTime = reportData[reportData.length - 1]?.windowEnd || new Date().toLocaleString('en-IN');

    generateUserCustomPdfReport({
      title: 'Water Management & Tanks Report',
      subtitle: `Target: ${selectedDeviceName} • Interval: ${filter.interval}`,
      siteName: selectedSiteName,
      targetMeter: selectedDeviceName,
      dateRange: `${filter.startDate} to ${filter.endDate} (${filter.interval})`,
      kpis: [
        { label: 'Avg Water Level', value: avgLevelVal, unit: '%' },
        { label: 'Avg Water Temp', value: avgTempVal, unit: '°C' },
        { label: 'Latest Recorded Time', value: latestTime }
      ],
      headers: [
        '#',
        'Date',
        'Time Window',
        'Tank / Node',
        'Avg Level (%)',
        'Min Level (%)',
        'Max Level (%)',
        'Temp (°C)',
        'Volume',
        'Recorded Time'
      ],
      rows: reportData.map(r => [
        r.srNo,
        r.date,
        r.timeRange,
        r.equipment,
        r.levelAvg,
        r.levelMin,
        r.levelMax,
        r.temp,
        r.volume,
        r.windowEnd
      ]),
      fileName: `Water_Report_${selectedDeviceName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${filter.interval}_${filter.startDate}_to_${filter.endDate}.pdf`
    });
  };

  return (
    <div className="water-reports-page fade-in p-3 p-md-4">
      {/* FILTER CONTROL CARD */}
      <Card className="scada-card border-0 mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', borderRadius: '16px' }}>
        <Card.Body className="p-3 p-md-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0 fw-bold text-white d-flex align-items-center gap-2 fs-13 text-uppercase text-secondary">
              <Calendar className="text-info" size={16} /> Water Management Parameters
            </h6>
            <div className="d-flex align-items-center gap-2">
              {loading && (
                <span className="text-info fs-12 d-flex align-items-center gap-2 me-2">
                  <Spinner animation="border" size="sm" /> Querying Water Telemetry...
                </span>
              )}
              <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-25 px-2.5 py-1 rounded-pill d-flex align-items-center gap-2 fs-11 fw-semibold">
                <Database size={13} className="text-info" />
                Selected: {selectedDeviceName}
              </Badge>
            </div>
          </div>

          <Row className="g-3 align-items-end">
            {/* TARGET TANK / WATER UNIT */}
            <Col md={3}>
              <Form.Group>
                <Form.Label className="text-secondary fw-semibold fs-12 mb-1">Target Tank / Water Unit</Form.Label>
                <Form.Select
                  className="bg-dark text-white border-secondary border-opacity-50 rounded-3 py-2 fw-semibold"
                  value={String(filter.deviceId || '')}
                  onChange={handleDeviceSelectionChange}
                  aria-label="Target Water Equipment"
                >
                  {siteDevices.length > 0 ? (
                    siteDevices.map(d => {
                      const dId = String(d.id || d.deviceId || '');
                      const dName = d.name || d.deviceName || `Water Unit #${dId}`;
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
                {reportSummary?.avgLevel != null && (
                  <div>
                    <small className="text-secondary d-block fs-11 text-uppercase">Avg Level</small>
                    <span className="fs-14 fw-bold text-info font-monospace">{Number(reportSummary.avgLevel).toFixed(1)} %</span>
                  </div>
                )}
                {reportSummary?.maxLevel != null && (
                  <div className="border-start border-secondary border-opacity-25 ps-3">
                    <small className="text-secondary d-block fs-11 text-uppercase">Max Level</small>
                    <span className="fs-14 fw-bold text-success font-monospace">{Number(reportSummary.maxLevel).toFixed(1)} %</span>
                  </div>
                )}
                {reportSummary?.minLevel != null && (
                  <div className="border-start border-secondary border-opacity-25 ps-3">
                    <small className="text-secondary d-block fs-11 text-uppercase">Min Level</small>
                    <span className="fs-14 fw-bold text-warning font-monospace">{Number(reportSummary.minLevel).toFixed(1)} %</span>
                  </div>
                )}
                {reportSummary?.avgTemperature != null && (
                  <div className="border-start border-secondary border-opacity-25 ps-3">
                    <small className="text-secondary d-block fs-11 text-uppercase">Avg Temp</small>
                    <span className="fs-14 fw-bold text-light font-monospace">{Number(reportSummary.avgTemperature).toFixed(1)} °C</span>
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
                <ClipboardList className="text-info" size={18} /> Water Telemetry Ledger
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
                <h6 className="text-white fw-bold mb-1">No Water Telemetry Recorded</h6>
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
                    <th className="py-3">Tank / Source</th>
                    <th className="py-3 text-end">Avg Level (%)</th>
                    <th className="py-3 text-end">Min Level (%)</th>
                    <th className="py-3 text-end">Max Level (%)</th>
                    <th className="py-3 text-end">Water Temp (°C)</th>
                    <th className="py-3 text-end">Volume</th>
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
                      <td className="py-3 text-end text-info fw-bold font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.levelAvg}
                      </td>
                      <td className="py-3 text-end text-warning font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.levelMin}
                      </td>
                      <td className="py-3 text-end text-success font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.levelMax}
                      </td>
                      <td className="py-3 text-end text-light font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.temp}
                      </td>
                      <td className="py-3 text-end text-secondary font-monospace" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {row.volume}
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

export default WaterReport;
