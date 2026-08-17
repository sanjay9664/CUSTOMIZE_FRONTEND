import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { FileText, Download, Calendar, MapPin, User, FileCheck, CheckCircle2, Zap } from 'lucide-react';
import { generateUserCustomPdfReport } from '../utils/pdfReportGenerator';

const UserPdfReportModal = ({ show, onHide, sites = [], assets = [] }) => {
  const [formData, setFormData] = useState({
    title: 'Custom Operational & Telemetry Report',
    subtitle: 'System Performance & Security Audit',
    siteId: '4',
    reportType: 'TELEMETRY_LOGS',
    dateRange: 'Last 7 Days (Aug 10 - Aug 17, 2026)',
    userName: localStorage.getItem('userName') || 'Rajesh Padhi',
    userRole: localStorage.getItem('userRole') || 'Super Admin',
    includeKpis: true,
    notes: 'All physical assets, telemetry sensors, and power distribution systems operating within standard threshold limits.'
  });

  const [generating, setGenerating] = useState(false);

  const handleDownloadPdf = (e) => {
    e.preventDefault();
    setGenerating(true);

    setTimeout(() => {
      // Resolve target site name
      const targetSiteObj = sites.find(s => String(s.id) === String(formData.siteId));
      const siteName = targetSiteObj ? `${targetSiteObj.name} (Site #${targetSiteObj.id})` : `Site #${formData.siteId}`;

      // Build data based on user-selected reportType
      let kpis = [];
      let headers = [];
      let dataRows = [];

      if (formData.reportType === 'TELEMETRY_LOGS') {
        kpis = [
          { label: 'Total Events Logged', value: '14,280', unit: 'telemetry' },
          { label: 'Active Sensors', value: '38 / 40', unit: 'online' },
          { label: 'Avg System Uptime', value: '99.8%', unit: 'percentage' },
          { label: 'Critical Thresholds', value: '0', unit: 'breaches' }
        ];
        headers = ['Timestamp', 'Sensor / Metric', 'Location', 'Reading Value', 'Unit', 'Status'];
        dataRows = [
          ['2026-08-17 11:45:00', 'Water Pump #01 Pressure', 'Pump Room 1', '3.45', 'Bar', 'OPTIMAL'],
          ['2026-08-17 11:30:00', 'Main Chiller Incomer Temp', 'Basement B2', '7.2', '°C', 'OPTIMAL'],
          ['2026-08-17 11:15:00', 'Grid Incomer Voltage R-Phase', 'Power Substation', '415.2', 'V', 'NORMAL'],
          ['2026-08-17 11:00:00', 'DG Set Fuel Level Sensor', 'Generator Room', '84.5', '%', 'NORMAL'],
          ['2026-08-17 10:45:00', 'AHU Air Flow Rate - Fl 3', 'AHU Plant Floor', '1,240', 'CFM', 'OPTIMAL'],
          ['2026-08-17 10:30:00', 'Ambient AQI PM2.5 Sensor', 'Main Terrace', '24.0', 'µg/m³', 'GOOD']
        ];
      } else if (formData.reportType === 'SITE_ASSETS') {
        kpis = [
          { label: 'Total Physical Assets', value: assets.length || '5', unit: 'registered' },
          { label: 'Active Assets', value: assets.filter(a => a.status === 'ACTIVE').length || '5', unit: 'active' },
          { label: 'Main Equipment', value: '3', unit: 'chiller/pump/dg' },
          { label: 'Health Score', value: '100%', unit: 'operational' }
        ];
        headers = ['Asset ID', 'Asset Name', 'Asset Type', 'Location / Scope', 'Parent Asset ID', 'Status'];
        dataRows = assets.length > 0
          ? assets.map(a => [a.id, a.name, a.assetType, a.location || `Site #${a.siteId || 4}`, a.parentAssetId || 'Root', a.status || 'ACTIVE'])
          : [
              ['building_main', 'Main Building', 'BUILDING', 'Site #4', 'Root', 'ACTIVE'],
              ['floor_1', 'Floor 1', 'FLOOR', 'Main Building', 'building_main', 'ACTIVE'],
              ['room_101', 'Room 101', 'ROOM', 'Floor 1', 'floor_1', 'ACTIVE'],
              ['sanjay', 'sanjay', 'FLOOR', 'Second Floor', 'building_main', 'ACTIVE']
            ];
      } else if (formData.reportType === 'ALARM_SUMMARY') {
        kpis = [
          { label: 'Total Alarm Triggers', value: '12', unit: 'events' },
          { label: 'Critical Alarms', value: '1', unit: 'critical' },
          { label: 'Acknowledged', value: '12 / 12', unit: 'resolved' },
          { label: 'Avg MTTR', value: '4.2', unit: 'mins' }
        ];
        headers = ['Alarm ID', 'Device / Equipment', 'Metric Field', 'Triggered Value', 'Severity', 'Status'];
        dataRows = [
          ['ALM-2026-088', 'Chiller Compressor #01', 'Chilled Temp High', '12.4 °C', 'WARNING', 'RESOLVED'],
          ['ALM-2026-087', 'Grid Incomer Breaker', 'Overvoltage Phase-B', '442.0 V', 'CRITICAL', 'ACKNOWLEDGED'],
          ['ALM-2026-086', 'Jockey Fire Pump', 'Header Pressure Low', '2.1 Bar', 'WARNING', 'RESOLVED'],
          ['ALM-2026-085', 'Water Storage Tank B', 'High Water Level', '94.0 %', 'INFO', 'NORMAL']
        ];
      } else {
        kpis = [
          { label: 'Daily Energy Consumed', value: '12,450', unit: 'kWh' },
          { label: 'Peak Power Demand', value: '620.4', unit: 'kW' },
          { label: 'Average Power Factor', value: '0.98', unit: 'lagging' },
          { label: 'Estimated Tariff Cost', value: '₹1,12,050', unit: 'INR' }
        ];
        headers = ['Date Interval', 'Meter Name', 'Consumption (kWh)', 'Peak Demand (kW)', 'Power Factor', 'Status'];
        dataRows = [
          ['2026-08-17', 'Main Grid Incomer Meter', '12,450 kWh', '620.4 kW', '0.98 PF', 'OPTIMAL'],
          ['2026-08-16', 'Main Grid Incomer Meter', '12,210 kWh', '612.0 kW', '0.97 PF', 'OPTIMAL'],
          ['2026-08-15', 'Main Grid Incomer Meter', '11,980 kWh', '598.5 kW', '0.98 PF', 'OPTIMAL'],
          ['2026-08-14', 'Main Grid Incomer Meter', '12,340 kWh', '615.2 kW', '0.97 PF', 'OPTIMAL']
        ];
      }

      const fileNameClean = `${formData.reportType}_${siteName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;

      generateUserCustomPdfReport({
        title: formData.title,
        subtitle: formData.subtitle,
        siteName: siteName,
        userName: formData.userName,
        userRole: formData.userRole,
        dateRange: formData.dateRange,
        kpis: formData.includeKpis ? kpis : [],
        headers: headers,
        data: dataRows,
        notes: formData.notes,
        fileName: fileNameClean
      });

      setGenerating(false);
      onHide();
    }, 800);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="glass-modal">
      <Form onSubmit={handleDownloadPdf}>
        <Modal.Header closeButton className="border-secondary border-opacity-25 bg-slate-900 text-white">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2 fs-5">
            <FileText className="text-info" size={22} /> User-Specific PDF Report Generator
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4 bg-slate-900 text-white" style={{ background: '#0f172a' }}>
          <p className="text-slate-400 fs-13 mb-4">
            Customize report scope, target site, date interval, and notes to generate a tailored PDF document.
          </p>

          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wider">Report Title *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="bg-dark text-white border-secondary border-opacity-25 fs-13"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wider">Report Category / Module *</Form.Label>
                <Form.Select
                  value={formData.reportType}
                  onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-25 fs-13"
                >
                  <option value="TELEMETRY_LOGS">Sensor Telemetry & Audit Logs</option>
                  <option value="SITE_ASSETS">Physical Assets & Equipment Inventory</option>
                  <option value="ALARM_SUMMARY">Alarm Events & Security Alerts Audit</option>
                  <option value="DAILY_DPR">Daily DPR & Energy Metering Summary</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wider">Target Site / Scope *</Form.Label>
                <Form.Select
                  value={formData.siteId}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-25 fs-13"
                >
                  {sites.length === 0 ? (
                    <option value="4">Site #4 - LIT India / Testing Site</option>
                  ) : sites.map(s => (
                    <option key={s.id} value={s.id}>Site #{s.id} - {s.name} ({s.city || 'HQ'})</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wider">Target Date Interval *</Form.Label>
                <Form.Select
                  value={formData.dateRange}
                  onChange={(e) => setFormData({ ...formData, dateRange: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-25 fs-13"
                >
                  <option value="Today (Aug 17, 2026)">Today (Aug 17, 2026)</option>
                  <option value="Yesterday (Aug 16, 2026)">Yesterday (Aug 16, 2026)</option>
                  <option value="Last 7 Days (Aug 10 - Aug 17, 2026)">Last 7 Days (Aug 10 - Aug 17, 2026)</option>
                  <option value="Last 30 Days (Jul 18 - Aug 17, 2026)">Last 30 Days (Jul 18 - Aug 17, 2026)</option>
                  <option value="Current Month (August 2026)">Current Month (August 2026)</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wider">Generated By User</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-25 fs-13"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wider">User Designation / Role</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.userRole}
                  onChange={(e) => setFormData({ ...formData, userRole: e.target.value })}
                  className="bg-dark text-white border-secondary border-opacity-25 fs-13"
                />
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label className="fs-12 fw-bold text-slate-300 uppercase tracking-wider">User Custom Observations & Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter custom observations to append at the bottom of the PDF report..."
                  className="bg-dark text-white border-secondary border-opacity-25 fs-13"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer className="border-secondary border-opacity-25 bg-slate-900">
          <Button variant="outline-secondary" onClick={onHide} className="px-4">Cancel</Button>
          <Button variant="info" type="submit" disabled={generating} className="fw-semibold text-dark px-4 d-flex align-items-center gap-2">
            {generating ? (
              <>
                <Spinner animation="border" size="sm" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download Custom PDF</span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UserPdfReportModal;
