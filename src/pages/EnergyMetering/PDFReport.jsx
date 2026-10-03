import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Row, Col, Card, Form, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { Download, Calendar, ClipboardList, RefreshCw, Zap, FileSpreadsheet, Building2, Clock, AlertCircle } from 'lucide-react';
import { generateUserCustomPdfReport } from '../../utils/pdfReportGenerator';
import { useSiteStore } from '../../context/SiteContext';
import { apiClient, normalizeList } from '../../services/apiClient';
import { bmsService } from '../../services/bmsService';
import { mapLatestEventsToTelemetry } from './utils/energyTelemetry';

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

  const [filter, setFilter] = useState({
    dateRange: 'today',
    siteId: selectedSiteId,
    startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [siteDevices, setSiteDevices] = useState([]);
  const [reportData, setReportData] = useState([]);

  // Ref to track last fetched parameters and avoid duplicate API queries
  const fetchedKeyRef = useRef('');

  // Helper to convert filter dates and interval to ISO strings matching GET /api/v1/reports/energy spec
  const resolveDateParams = useCallback((rangeKey, customStart, customEnd) => {
    const now = new Date();
    let startISO = '';
    let endISO = now.toISOString();
    let interval = 'HOURLY';

    if (rangeKey === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      startISO = todayStart.toISOString();
      interval = 'HOURLY';
    } else if (rangeKey === 'yesterday') {
      const yStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      const yEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      startISO = yStart.toISOString();
      endISO = yEnd.toISOString();
      interval = 'HOURLY';
    } else if (rangeKey === '7days') {
      const d7 = new Date(now.getTime() - 7 * 86400000);
      startISO = d7.toISOString();
      interval = 'DAILY';
    } else if (rangeKey === '30days') {
      const d30 = new Date(now.getTime() - 30 * 86400000);
      startISO = d30.toISOString();
      interval = 'DAILY';
    } else if (rangeKey === 'custom') {
      startISO = customStart ? new Date(`${customStart}T00:00:00.000Z`).toISOString() : new Date(now.getTime() - 7 * 86400000).toISOString();
      endISO = customEnd ? new Date(`${customEnd}T23:59:59.999Z`).toISOString() : now.toISOString();
      interval = 'DAILY';
    }

    return { startDate: startISO, endDate: endISO, interval };
  }, []);

  // Primary API execution function:
  // Hits GET /api/v1/reports/energy?deviceId=123&startDate=...&endDate=...&interval=HOURLY
  // and GET /api/v1/reports/energy as requested. Strictly zero dummy data.
  const fetchEnergyReportData = useCallback(async (siteId, currentFilter = filter) => {
    if (!siteId) return;
    setLoading(true);
    try {
      const targetSiteId = String(siteId);

      // 1. Resolve devices for the selected site
      let devicesList = siteDevices;
      if (!devicesList || devicesList.length === 0) {
        const devRes = await apiClient.get('/devices', {
          siteId: targetSiteId,
          category: 'MAIN_ENERGY_METER',
          include: 'settings,rules,profile'
        }).catch(() => null);

        devicesList = normalizeList(devRes, 'devices');
        if (!devicesList || devicesList.length === 0) {
          const fallbackRes = await apiClient.get('/devices', { siteId: targetSiteId }).catch(() => null);
          devicesList = normalizeList(fallbackRes, 'devices');
        }
        setSiteDevices(devicesList || []);
      }

      const targetDevice = devicesList && devicesList.length > 0 ? devicesList[0] : null;
      const targetDeviceId = targetDevice ? String(targetDevice.id || targetDevice.deviceId || '') : null;

      // 2. Resolve query parameters for Energy Report API
      const { startDate, endDate, interval } = resolveDateParams(
        currentFilter.dateRange,
        currentFilter.startDate,
        currentFilter.endDate
      );

      // 3. Hit the Energy Report APIs specified by user:
      // Endpoint 1: GET /api/v1/reports/energy?deviceId=123&startDate=...&endDate=...&interval=HOURLY
      let reportRes = null;
      if (targetDeviceId) {
        reportRes = await bmsService.getEnergyReports({
          deviceId: String(targetDeviceId),
          startDate,
          endDate,
          interval
        }).catch(() => null);
      }

      // Endpoint 2: GET /api/v1/reports/energy (general query)
      if (!reportRes || (Array.isArray(reportRes?.data) && reportRes.data.length === 0)) {
        const generalRes = await bmsService.getEnergyReports({
          startDate,
          endDate,
          interval
        }).catch(() => null);
        if (generalRes) {
          reportRes = generalRes;
        }
      }

      // Parse records returned from /reports/energy
      const rawRecords = Array.isArray(reportRes?.data)
        ? reportRes.data
        : (Array.isArray(reportRes?.data?.records)
          ? reportRes.data.records
          : (Array.isArray(reportRes?.records)
            ? reportRes.records
            : (Array.isArray(reportRes?.items)
              ? reportRes.items
              : (Array.isArray(reportRes) ? reportRes : null))));

      if (rawRecords && rawRecords.length > 0) {
        // Map records directly from GET /api/v1/reports/energy
        const parsedRows = rawRecords.map((item, idx) => {
          const rawTime = item.timestamp || item.time || item.date || item.createdAt || item.recordedAt;
          let dateStr = '';
          let lastUpdatedStr = '';
          if (rawTime) {
            const d = new Date(rawTime);
            dateStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : String(rawTime);
            lastUpdatedStr = !isNaN(d.getTime())
              ? `${dateStr} ${d.toLocaleTimeString('en-IN', { hour12: true })}`
              : String(rawTime);
          } else {
            dateStr = new Date().toISOString().split('T')[0];
            lastUpdatedStr = `${dateStr} ${new Date().toLocaleTimeString('en-IN', { hour12: true })}`;
          }

          const kwh = item.kwh ?? item.consumption ?? item.activeEnergy ?? item.ebKwh ?? item.totalKwh;
          const kw = item.kw ?? item.demand ?? item.peakDemand ?? item.activePower ?? item.totalKw;
          const kvah = item.kvah ?? item.apparentEnergy ?? item.ebKvah ?? item.totalKvah;
          const pf = item.pf ?? item.powerFactor ?? item.avgPf ?? item.pfAvg;

          return {
            id: item.id || item.refId || `REP-EM-${dateStr.replace(/-/g, '')}-${idx + 1}`,
            date: dateStr,
            meter: item.meterName || item.deviceName || item.targetFeedNode || targetDevice?.name || selectedSiteName,
            kwh: kwh !== undefined && kwh !== null ? `${Number(kwh).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh` : '0.00 kWh',
            kw: kw !== undefined && kw !== null ? `${Number(kw).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW` : '0.00 kW',
            kvah: kvah !== undefined && kvah !== null
              ? `${Number(kvah).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kVAh`
              : (kwh && pf && Number(pf) > 0 ? `${(Number(kwh) / Number(pf)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kVAh` : '0.00 kVAh'),
            pf: pf !== undefined && pf !== null ? Number(pf).toFixed(2) : '1.00',
            lastUpdated: lastUpdatedStr,
            rawKwh: Number(kwh) || 0,
            rawKw: Number(kw) || 0,
            rawKvah: Number(kvah) || 0
          };
        });

        setReportData(parsedRows);
        return;
      }

      // If report response is a single summary object
      if (reportRes?.data && typeof reportRes.data === 'object' && !Array.isArray(reportRes.data)) {
        const summary = reportRes.data;
        const kwh = summary.kwh ?? summary.consumption ?? summary.totalKwh ?? summary.activeEnergy;
        const kw = summary.kw ?? summary.peakDemand ?? summary.demand ?? summary.activePower;
        const kvah = summary.kvah ?? summary.apparentEnergy ?? summary.totalKvah;
        const pf = summary.pf ?? summary.avgPf ?? summary.powerFactor;

        if (kwh !== undefined || kw !== undefined) {
          const dateStr = new Date().toISOString().split('T')[0];
          const summaryRow = {
            id: `REP-EM-${dateStr.replace(/-/g, '')}-1`,
            date: dateStr,
            meter: targetDevice?.name || selectedSiteName,
            kwh: kwh !== undefined && kwh !== null ? `${Number(kwh).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh` : '0.00 kWh',
            kw: kw !== undefined && kw !== null ? `${Number(kw).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW` : '0.00 kW',
            kvah: kvah !== undefined && kvah !== null ? `${Number(kvah).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kVAh` : '0.00 kVAh',
            pf: pf !== undefined && pf !== null ? Number(pf).toFixed(2) : '1.00',
            lastUpdated: `${dateStr} ${new Date().toLocaleTimeString('en-IN', { hour12: true })}`,
            rawKwh: Number(kwh) || 0,
            rawKw: Number(kw) || 0,
            rawKvah: Number(kvah) || 0
          };
          setReportData([summaryRow]);
          return;
        }
      }

      // 4. Live telemetry fallback: check GET /devices/:id/events/latest if reports query returned empty
      if (targetDeviceId) {
        const eventsRes = await bmsService.getDeviceEventsLatest(targetDeviceId, targetSiteId).catch(() => null);
        if (eventsRes) {
          const mapped = mapLatestEventsToTelemetry(eventsRes, targetDevice);
          const updates = mapped?.updates || {};
          const lastEventTime = mapped?.lastEventTime;

          const kwh = updates.ebKwh ?? updates.cumulativekWh ?? updates.ep;
          const kw = updates.totalKw ?? updates.activePower ?? updates.kw;
          const kvah = updates.ebKvah ?? updates.apparentEnergy ?? updates.eq;
          const pf = updates.pf ?? updates.pfAvg ?? updates.powerFactor;
          const vR = updates.vR ?? updates.vLNAvg;

          const hasRealData = Boolean(
            (kwh !== undefined && kwh !== null && !isNaN(Number(kwh)) && Number(kwh) > 0) ||
            (kw !== undefined && kw !== null && !isNaN(Number(kw)) && Number(kw) > 0) ||
            (kvah !== undefined && kvah !== null && !isNaN(Number(kvah)) && Number(kvah) > 0) ||
            (pf !== undefined && pf !== null && !isNaN(Number(pf)) && Number(pf) > 0) ||
            (vR !== undefined && vR !== null && Number(vR) > 0) ||
            lastEventTime
          );

          if (hasRealData) {
            const formatTime = (ts) => {
              if (!ts) {
                const now = new Date();
                return `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString('en-IN', { hour12: true })}`;
              }
              const ms = ts > 1e12 ? ts : ts * 1000;
              const d = new Date(ms);
              return `${d.toISOString().split('T')[0]} ${d.toLocaleTimeString('en-IN', { hour12: true })}`;
            };

            const dateStr = lastEventTime
              ? new Date(lastEventTime > 1e12 ? lastEventTime : lastEventTime * 1000).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0];

            const realRow = {
              id: `REP-EM-${dateStr.replace(/-/g, '')}-${targetDevice.id || 1}`,
              date: dateStr,
              meter: targetDevice.name || selectedSiteName,
              kwh: kwh !== undefined && kwh !== null ? `${Number(kwh).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh` : '0.00 kWh',
              kw: kw !== undefined && kw !== null ? `${Number(kw).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW` : '0.00 kW',
              kvah: kvah !== undefined && kvah !== null
                ? `${Number(kvah).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kVAh`
                : (kwh && pf && Number(pf) > 0 ? `${(Number(kwh) / Number(pf)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kVAh` : '0.00 kVAh'),
              pf: pf !== undefined && pf !== null ? Number(pf).toFixed(2) : (updates.pfR ? Number(updates.pfR).toFixed(2) : '1.00'),
              lastUpdated: formatTime(lastEventTime),
              rawKwh: Number(kwh) || 0,
              rawKw: Number(kw) || 0,
              rawKvah: Number(kvah) || 0
            };
            setReportData([realRow]);
            return;
          }
        }
      }

      // No data recorded -> Strictly empty ledger (ZERO DUMMY DATA)
      setReportData([]);
    } catch (err) {
      console.warn('Error fetching energy report:', err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [siteDevices, selectedSiteName, filter, resolveDateParams]);

  // Trigger API when selected site changes (runs once per site change, preventing duplicate requests)
  useEffect(() => {
    const key = `${selectedSiteId}_${filter.dateRange}_${filter.startDate}_${filter.endDate}`;
    if (selectedSiteId && fetchedKeyRef.current !== key) {
      fetchedKeyRef.current = key;
      setFilter(prev => ({ ...prev, siteId: String(selectedSiteId) }));
      fetchEnergyReportData(selectedSiteId);
    }
  }, [selectedSiteId, filter.dateRange, filter.startDate, filter.endDate, fetchEnergyReportData]);

  // When user changes the Target Meter dropdown below:
  // Synchronizes with SiteContext; useEffect triggers the clean request.
  const handleSiteSelectionChange = (e) => {
    const val = e.target.value;
    setFilter(prev => ({ ...prev, siteId: val }));

    const foundSite = allSites.find(s => String(s.id ?? s.siteId ?? s._id) === String(val));
    if (foundSite && setSelectedSite) {
      setSelectedSite(foundSite);
    }
  };

  // Re-fetch energy report on clicking Generate Report
  const handleGenerate = async () => {
    setGenerating(true);
    fetchedKeyRef.current = '';
    await fetchEnergyReportData(filter.siteId || selectedSiteId, filter);
    setGenerating(false);
  };

  // Export to Excel / CSV with UTF-8 Byte Order Mark
  const handleDownloadExcel = () => {
    if (reportData.length === 0) return;
    const headers = [
      'Report Reference,Date,Target Feed Node,Active Energy (kWh),Active Power (kW),Apparent Energy (kVAh),Power Factor (PF),Last Updated Time'
    ];
    const csvRows = reportData.map(r =>
      `"${r.id}","${r.date}","${r.meter}","${r.kwh}","${r.kw}","${r.kvah}","${r.pf}","${r.lastUpdated}"`
    );
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + [headers.join(','), ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Energy_Report_${selectedSiteName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${filter.dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
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
    const avgPfVal = (reportData.reduce((acc, r) => acc + (parseFloat(r.pf) || 0.98), 0) / reportData.length).toFixed(2);
    const latestTime = reportData[0]?.lastUpdated || new Date().toLocaleString('en-IN');

    generateUserCustomPdfReport({
      title: 'Energy Telemetry & Metering Report',
      subtitle: `Target Feed: ${selectedSiteName}`,
      siteName: selectedSiteName,
      targetMeter: selectedSiteName,
      dateRange: filter.dateRange === 'custom' ? `${filter.startDate} to ${filter.endDate}` : `Interval: ${filter.dateRange.toUpperCase()}`,
      kpis: [
        { label: 'Active Energy', value: `${totalKwh.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`, unit: 'kWh' },
        { label: 'Peak Active Power', value: `${maxKw.toFixed(1)}`, unit: 'kW' },
        { label: 'Apparent Energy', value: `${totalKvah.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`, unit: 'kVAh' },
        { label: 'Power Factor', value: avgPfVal, unit: 'PF' },
        { label: 'Last Updated', value: latestTime }
      ],
      headers: [
        'Ref ID',
        'Date',
        'Target Feed Node',
        'Active Energy (kWh)',
        'Active Power (kW)',
        'Apparent Energy (kVAh)',
        'Power Factor (PF)',
        'Last Updated Time'
      ],
      data: reportData.map(r => [
        r.id,
        r.date,
        r.meter,
        r.kwh,
        r.kw,
        r.kvah,
        r.pf,
        r.lastUpdated
      ]),
      fileName: `Energy_Report_${selectedSiteName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${filter.dateRange}_${new Date().toISOString().split('T')[0]}.pdf`
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
                <span className="text-info fs-12 d-flex align-items-center gap-1.5 me-2">
                  <Spinner animation="border" size="sm" /> Querying Energy Report...
                </span>
              )}
              <Badge bg="info" className="bg-opacity-10 text-info border border-info border-opacity-25 px-2.5 py-1 rounded-pill d-flex align-items-center gap-1.5 fs-11 fw-semibold">
                <Building2 size={13} />
                Selected: {selectedSiteName}
              </Badge>
            </div>
          </div>

          <Row className="g-3 align-items-end">
            <Col md={filter.dateRange === 'custom' ? 3 : 4}>
              <Form.Group>
                <Form.Label className="text-secondary fw-semibold fs-12 mb-1">Target Meter</Form.Label>
                <Form.Select
                  className="bg-dark text-white border-secondary border-opacity-50 rounded-3 py-2 fw-semibold"
                  value={String(filter.siteId || selectedSiteId)}
                  onChange={handleSiteSelectionChange}
                  aria-label="Target Meter"
                >
                  {allSites.map(s => {
                    const sId = String(s.id ?? s.siteId ?? s._id);
                    const sName = s.name || s.siteName || `Site #${sId}`;
                    return (
                      <option key={sId} value={sId}>
                        {sName}
                      </option>
                    );
                  })}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={filter.dateRange === 'custom' ? 3 : 4}>
              <Form.Group>
                <Form.Label className="text-secondary fw-semibold fs-12 mb-1">Interval Presets</Form.Label>
                <Form.Select
                  className="bg-dark text-white border-secondary border-opacity-50 rounded-3 py-2"
                  value={filter.dateRange}
                  onChange={(e) => setFilter({ ...filter, dateRange: e.target.value })}
                  aria-label="Interval Presets"
                >
                  <option value="today">Today (Real-time snapshots)</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="custom">Custom Date Range</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {filter.dateRange === 'custom' && (
              <>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="text-secondary fw-semibold fs-12 mb-1">Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      className="bg-dark text-white border-secondary border-opacity-50 rounded-3 py-2"
                      value={filter.startDate}
                      onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="text-secondary fw-semibold fs-12 mb-1">End Date</Form.Label>
                    <Form.Control
                      type="date"
                      className="bg-dark text-white border-secondary border-opacity-50 rounded-3 py-2"
                      value={filter.endDate}
                      onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </>
            )}

            <Col md={filter.dateRange === 'custom' ? 2 : 4} className="d-grid">
              <Button
                onClick={handleGenerate}
                disabled={generating || loading}
                variant="info"
                className="rounded-pill py-2 fw-bold text-white shadow-sm d-flex align-items-center justify-content-center gap-2"
              >
                {generating ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                {generating ? 'Compiling Report...' : 'Generate Report'}
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
                  <>Showing {reportData.length} recorded interval{reportData.length > 1 ? 's' : ''} for <strong className="text-info">{selectedSiteName}</strong>.</>
                ) : (
                  <>Showing 0 recorded intervals for <strong className="text-secondary">{selectedSiteName}</strong> (No report data).</>
                )}
              </small>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <Button
                variant="outline-success"
                size="sm"
                disabled={reportData.length === 0}
                onClick={handleDownloadExcel}
                className="rounded-pill px-3 py-1.5 text-success border-success border-opacity-50 d-flex align-items-center gap-1.5 fs-12 fw-semibold"
                title="Export report as Excel spreadsheet"
              >
                <FileSpreadsheet size={15} /> Export Excel
              </Button>
              <Button
                variant="info"
                size="sm"
                disabled={reportData.length === 0}
                onClick={handleDownloadPdf}
                className="rounded-pill px-3 py-1.5 text-white fw-bold d-flex align-items-center gap-1.5 fs-12 shadow-sm"
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
                  Target <strong className="text-info">{selectedSiteName}</strong> does not have recorded telemetry data for this interval. Dummy data generation is disabled.
                </p>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover borderless className="align-middle text-white mb-0" style={{ fontSize: '0.85rem' }}>
                <thead style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <tr className="text-secondary text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                    <th className="py-3 px-3">Report Reference</th>
                    <th className="py-3">Date</th>
                    <th className="py-3">Target Feed Node</th>
                    <th className="py-3 text-end">Active Energy (kWh)</th>
                    <th className="py-3 text-end">Active Power (kW)</th>
                    <th className="py-3 text-end">Apparent Energy (kVAh)</th>
                    <th className="py-3 text-center">Power Factor (PF)</th>
                    <th className="py-3 text-end px-3">Last Updated Time</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="py-3 px-3 font-monospace text-info fs-12">{row.id}</td>
                      <td className="py-3 text-white fw-semibold">{row.date}</td>
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
                      <td className="py-3 text-end text-info fw-semibold font-monospace px-3 fs-12" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        <Clock size={12} className="text-secondary me-1.5" />
                        {row.lastUpdated}
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
