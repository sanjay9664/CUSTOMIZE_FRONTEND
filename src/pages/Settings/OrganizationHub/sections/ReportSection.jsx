import React from 'react';
import { Button, Badge } from 'react-bootstrap';
import { Radio, FileText, BellRing } from 'lucide-react';
import PdfButton from '../../../../components/PdfButton';
import { generateUserCustomPdfReport } from '../../../../utils/pdfReportGenerator';

const ReportSection = ({
  activeTab,
  setShowResyncModal = () => {},
  telemetryLogs = [],
  formatDate = (d) => d || 'N/A',
  sites = [],
  assets = [],
  setShowReportModal = () => {},
  reportsList = [],
  setShowAlarmModal = () => {},
  alarmsList = []
}) => {
  const safeLogs = Array.isArray(telemetryLogs) ? telemetryLogs : [];
  const safeReports = Array.isArray(reportsList) ? reportsList : [];
  const safeAlarms = Array.isArray(alarmsList) ? alarmsList : [];

  return (
    <div>
      {/* TAB: TELEMETRY RESYNC MANAGEMENT */}
      {activeTab === 'telemetry' && (
        <div className="p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
              <Radio className="text-success" /> Live &amp; Historical Sensor Telemetry Resync
            </h5>
            <Button variant="success" size="sm" onClick={() => setShowResyncModal(true)} className="fw-semibold text-white px-3">
              <Radio size={15} /> Resync Telemetry Data
            </Button>
          </div>
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Site ID</th>
                  <th>Target Date Range</th>
                  <th>Processed Events</th>
                  <th>Triggered By</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {safeLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 empty-text fw-semibold">No telemetry resync logs available</td>
                  </tr>
                ) : safeLogs.map(log => (
                  <tr key={log.id}>
                    <td className="fw-bold text-white font-monospace">{log.id}</td>
                    <td className="text-slate-300 font-monospace">Site #{log.siteId || 7}</td>
                    <td className="text-slate-300 fs-13">{log.dateRange || 'Today (Live)'}</td>
                    <td className="text-info font-monospace fw-bold">{log.syncedDevices || 12} Devices</td>
                    <td className="text-slate-300">{log.triggeredBy || 'Super Admin'}</td>
                    <td>
                      <Badge bg={log.status === 'SUCCESS' ? 'success' : 'warning'} className="px-2 py-1">
                        {log.status || 'SUCCESS'}
                      </Badge>
                    </td>
                    <td className="text-slate-400 fs-12">{formatDate(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: ASYNC REPORTS MANAGEMENT */}
      {activeTab === 'report' && (
        <div className="p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
              <FileText className="text-info" /> Async DPR &amp; Telemetry Reports Generator
            </h5>
            <div className="d-flex gap-2">
              <PdfButton
                pdfReportGenerator={generateUserCustomPdfReport}
                currentSite={sites && sites.length ? sites[0] : { name: 'Main Site' }}
                reportData={{ metrics: [], sites: sites || [], assets: assets || [] }}
                title="Download Executive Report"
                buttonText="Export PDF Report"
              />
              <Button variant="info" size="sm" onClick={() => setShowReportModal(true)} className="fw-semibold text-dark px-3">
                <FileText size={15} /> Generate Async Report
              </Button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Report Title</th>
                  <th>Type</th>
                  <th>Format</th>
                  <th>Generated Date</th>
                  <th>Status</th>
                  <th className="text-end">Download</th>
                </tr>
              </thead>
              <tbody>
                {safeReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 empty-text fw-semibold">No generated reports available</td>
                  </tr>
                ) : safeReports.map(rep => (
                  <tr key={rep.id}>
                    <td className="fw-bold text-white">{rep.title || 'Daily DPR Telemetry Report'}</td>
                    <td><Badge bg="info" className="text-dark font-monospace">{rep.reportType || 'DAILY_DPR'}</Badge></td>
                    <td><Badge bg="secondary" className="font-monospace">{rep.format || 'PDF'}</Badge></td>
                    <td className="text-slate-400 fs-12">{formatDate(rep.createdAt)}</td>
                    <td><Badge bg={rep.status === 'READY' ? 'success' : 'warning'}>{rep.status || 'READY'}</Badge></td>
                    <td className="text-end">
                      <Button size="sm" variant="outline-info" className="p-1 border-0 fw-semibold fs-12">
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: ALARMS MANAGEMENT */}
      {activeTab === 'alarm' && (
        <div className="p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
              <BellRing className="text-warning" /> SCADA Alarm Events &amp; Threshold Excursions
            </h5>
            <Button variant="warning" size="sm" onClick={() => setShowAlarmModal(true)} className="fw-semibold text-dark px-3">
              <BellRing size={15} /> Trigger Alarm Event
            </Button>
          </div>
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Device ID</th>
                  <th>Field Key</th>
                  <th>Threshold Value</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {safeAlarms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 empty-text fw-semibold">No active alarm events</td>
                  </tr>
                ) : safeAlarms.map(alm => (
                  <tr key={alm.id}>
                    <td className="fw-bold text-white font-monospace">{alm.deviceId || 'EM_LIVEWIZE_101'}</td>
                    <td className="text-slate-300 font-monospace">{alm.fieldKey || 'temperature'}</td>
                    <td className="text-warning font-monospace fw-bold">{alm.value || '95.5°C'}</td>
                    <td>
                      <Badge bg={alm.severity === 'CRITICAL' ? 'danger' : 'warning'} className="px-2 py-1">
                        {alm.severity || 'CRITICAL'}
                      </Badge>
                    </td>
                    <td><Badge bg="danger">ACTIVE</Badge></td>
                    <td className="text-slate-400 fs-12">{formatDate(alm.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportSection;
