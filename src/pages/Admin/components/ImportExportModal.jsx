import React, { useState, useRef } from 'react';
import { Modal, Button, Form, Spinner, Alert, ProgressBar, Badge } from 'react-bootstrap';
import { Download, Upload, FileText, CheckCircle2, AlertTriangle, X, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { bmsService } from '../../../services/bmsService';
import { getUserUsername, getUserStatus, formatJoinedDate } from '../../../utils/userUtils';

/**
 * ImportExportModal Component
 * Comprehensive modal for exporting and bulk-importing Users or Roles.
 *
 * @param {Object} props
 * @param {boolean} props.show - Modal visibility
 * @param {Function} props.onHide - Close modal callback
 * @param {'USERS' | 'ROLES'} props.entityType - Entity type
 * @param {Array} props.items - All available items (users or roles)
 * @param {Array} props.selectedIds - Array of currently selected item IDs
 * @param {Function} [props.onSuccess] - Callback after successful import or operation
 */
export const ImportExportModal = ({
  show,
  onHide,
  entityType = 'USERS',
  items = [],
  selectedIds = [],
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState('EXPORT'); // 'EXPORT' | 'IMPORT'
  const [exportFormat, setExportFormat] = useState('CSV'); // 'CSV' | 'JSON'
  const [exportScope, setExportScope] = useState(selectedIds.length > 0 ? 'SELECTED' : 'ALL');

  // Import State
  const fileInputRef = useRef(null);
  const [importFile, setImportFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [parseError, setParseError] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);

  const isUsers = entityType === 'USERS';
  const entityLabel = isUsers ? 'Users' : 'Roles';
  const singleLabel = isUsers ? 'User' : 'Role';

  const selectedCount = selectedIds.length;
  const totalCount = items.length;
  const exportItemsCount = exportScope === 'SELECTED' ? selectedCount : totalCount;

  // ── CSV Helpers ──
  const downloadBlob = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── Export Handler ──
  const handleExport = () => {
    const targetItems = exportScope === 'SELECTED'
      ? items.filter((item) => selectedIds.includes(item.id || item._id))
      : items;

    if (targetItems.length === 0) return;

    const timestamp = new Date().toISOString().slice(0, 10);

    if (exportFormat === 'JSON') {
      const jsonContent = JSON.stringify(targetItems, null, 2);
      downloadBlob(jsonContent, `${entityType.toLowerCase()}-export-${timestamp}.json`, 'application/json');
    } else {
      // CSV Format
      let headers = [];
      let rows = [];

      if (isUsers) {
        headers = ['Name', 'Email', 'Username', 'Role', 'Status', 'Joined Date', 'Tenant ID', 'Company ID'];
        rows = targetItems.map((u) => [
          `"${(u.name || u.user_name || '').replace(/"/g, '""')}"`,
          `"${(u.email || '').replace(/"/g, '""')}"`,
          `"${(getUserUsername(u) || '').replace(/"/g, '""')}"`,
          `"${(u.role || 'User').replace(/"/g, '""')}"`,
          `"${(getUserStatus(u) || 'ACTIVE').replace(/"/g, '""')}"`,
          `"${formatJoinedDate(u.createdAt || u.created_at)}"`,
          `"${(u.tenantId || '').replace(/"/g, '""')}"`,
          `"${(u.companyId || '').replace(/"/g, '""')}"`
        ]);
      } else {
        headers = ['Role Name', 'Category', 'Nature', 'Permissions Count', 'Description'];
        rows = targetItems.map((r) => {
          const name = String(r.name || '').toUpperCase();
          const category = name.includes('ADMIN') ? 'Administrator' : name.includes('OPERATOR') ? 'Installation' : 'Organization';
          const permCount = Array.isArray(r.permissions) ? r.permissions.length : 0;
          return [
            `"${(r.name || '').replace(/"/g, '""')}"`,
            `"${category}"`,
            `"${r.isPredefined ? 'System Predefined' : 'Custom Role'}"`,
            `"${permCount}"`,
            `"${(r.description || '').replace(/"/g, '""')}"`
          ];
        });
      }

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadBlob(csvContent, `${entityType.toLowerCase()}-export-${timestamp}.csv`, 'text/csv;charset=utf-8;');
    }
  };

  // ── Sample Template Download ──
  const handleDownloadTemplate = () => {
    if (isUsers) {
      const sampleCsv = `Name,Email,Role,Password,Tenant ID,Company ID
Alex Johnson,alex.johnson@example.com,OPERATOR,Secret123,c2a8b410-449e-11ee-be56-0242ac120002,
Sarah Connor,sarah.connor@example.com,ADMIN,Secret123,,clm_company_cuid
Michael Scott,michael.scott@example.com,VIEWER,Secret123,,`;
      downloadBlob('\uFEFF' + sampleCsv, 'users-import-template.csv', 'text/csv;charset=utf-8;');
    } else {
      const sampleCsv = `Role Name,Description,Permissions
Operations Supervisor,Supervisor with site operator access,"site:read,device:read,report:read"
Custom Facility Manager,Manager with full facility telemetry control,"site:read,site:write,device:read,device:write"`;
      downloadBlob('\uFEFF' + sampleCsv, 'roles-import-template.csv', 'text/csv;charset=utf-8;');
    }
  };

  // ── File Upload & Parsing ──
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setParseError(null);
    setParsedData([]);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') return;

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const list = Array.isArray(parsed) ? parsed : (parsed.users || parsed.roles || []);
          if (list.length === 0) throw new Error('No valid array of records found in JSON file.');
          setParsedData(list);
        } else {
          // CSV Parsing
          const lines = text.split(/\r\n|\n/).map(l => l.trim()).filter(Boolean);
          if (lines.length < 2) throw new Error('CSV file must contain a header row and at least 1 data row.');

          const parseCsvLine = (line) => {
            const values = [];
            let inQuotes = false;
            let current = '';
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            return values;
          };

          const rawHeaders = parseCsvLine(lines[0]).map(h => h.toLowerCase());
          const records = [];

          for (let i = 1; i < lines.length; i++) {
            const values = parseCsvLine(lines[i]);
            if (values.length === 0 || values.every(v => !v)) continue;

            const row = {};
            rawHeaders.forEach((h, idx) => {
              row[h] = values[idx] || '';
            });

            if (isUsers) {
              const name = row['name'] || row['full name'] || '';
              const email = row['email'] || '';
              const role = (row['role'] || 'VIEWER').toUpperCase();
              const password = row['password'] || 'User@123456';
              const tenantId = row['tenant id'] || row['tenantid'] || '';
              const companyId = row['company id'] || row['companyid'] || '';

              if (name && email) {
                records.push({
                  name,
                  email,
                  role,
                  password,
                  ...(companyId ? { companyId } : (tenantId ? { tenantId } : {})),
                  status: 'ACTIVE',
                  _valid: email.includes('@') && email.includes('.')
                });
              }
            } else {
              const name = row['role name'] || row['name'] || '';
              const desc = row['description'] || '';
              const permsRaw = row['permissions'] || '';
              const permissions = permsRaw ? permsRaw.split(',').map(p => p.trim()).filter(Boolean) : ['*'];

              if (name) {
                records.push({
                  name,
                  description: desc,
                  permissions,
                  _valid: name.length >= 2
                });
              }
            }
          }

          if (records.length === 0) {
            throw new Error('No valid records could be extracted from this file. Please verify CSV format.');
          }
          setParsedData(records);
        }
      } catch (err) {
        setParseError(err.message || 'Failed to parse file.');
      }
    };

    reader.readAsText(file);
  };

  // ── Import Submission ──
  const handleExecuteImport = async () => {
    if (parsedData.length === 0) return;
    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (let i = 0; i < parsedData.length; i++) {
      const item = parsedData[i];
      try {
        if (isUsers) {
          const payload = {
            name: item.name,
            email: item.email,
            role: item.role || 'VIEWER',
            password: item.password || 'User@123456',
            status: item.status || 'ACTIVE',
            ...(item.companyId ? { companyId: item.companyId } : (item.tenantId ? { tenantId: item.tenantId } : {}))
          };
          await bmsService.createUser(payload);
        } else {
          const payload = {
            name: item.name,
            description: item.description || '',
            permissions: item.permissions || ['*']
          };
          await bmsService.createRole(payload);
        }
        successCount++;
      } catch (err) {
        failCount++;
        errors.push(`${item.name || item.email}: ${err?.message || 'Failed'}`);
      }

      setImportProgress(Math.round(((i + 1) / parsedData.length) * 100));
    }

    setIsImporting(false);
    setImportResult({
      successCount,
      failCount,
      errors
    });

    if (successCount > 0 && onSuccess) {
      onSuccess();
    }
  };

  const handleResetModal = () => {
    setImportFile(null);
    setParsedData([]);
    setParseError(null);
    setImportResult(null);
    setImportProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Modal
      show={show}
      onHide={() => !isImporting && onHide()}
      centered
      size="lg"
      contentClassName="bg-dark border border-secondary border-opacity-25 text-light shadow-2xl rounded-3 overflow-hidden"
    >
      {/* ── Modal Header with Tab Navigation ── */}
      <Modal.Header closeButton={!isImporting} closeVariant="white" className="border-secondary border-opacity-25 py-2.5 px-4 bg-dark">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{ width: '36px', height: '36px', backgroundColor: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}
          >
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <Modal.Title className="fs-16 fw-bold text-white mb-0">
              Import & Export {entityLabel}
            </Modal.Title>
            <span className="fs-12 text-secondary">
              Transfer {entityLabel.toLowerCase()} records in CSV or JSON format
            </span>
          </div>
        </div>
      </Modal.Header>

      {/* ── Mode Switcher Tabs ── */}
      <div className="d-flex border-bottom border-secondary border-opacity-25 px-4 pt-2 bg-dark bg-opacity-50">
        <button
          type="button"
          className={`btn border-0 py-2 px-3.5 fs-13 fw-semibold position-relative rounded-0 ${
            activeTab === 'EXPORT' ? 'text-white' : 'text-secondary'
          }`}
          onClick={() => { setActiveTab('EXPORT'); handleResetModal(); }}
        >
          <div className="d-flex align-items-center gap-1.5">
            <Download size={14} className={activeTab === 'EXPORT' ? 'text-info' : ''} />
            <span>Export {entityLabel}</span>
          </div>
          {activeTab === 'EXPORT' && (
            <div className="position-absolute bottom-0 start-0 end-0 bg-info" style={{ height: '2px' }} />
          )}
        </button>

        <button
          type="button"
          className={`btn border-0 py-2 px-3.5 fs-13 fw-semibold position-relative rounded-0 ${
            activeTab === 'IMPORT' ? 'text-white' : 'text-secondary'
          }`}
          onClick={() => { setActiveTab('IMPORT'); handleResetModal(); }}
        >
          <div className="d-flex align-items-center gap-1.5">
            <Upload size={14} className={activeTab === 'IMPORT' ? 'text-primary' : ''} />
            <span>Bulk Import {entityLabel}</span>
          </div>
          {activeTab === 'IMPORT' && (
            <div className="position-absolute bottom-0 start-0 end-0 bg-primary" style={{ height: '2px' }} />
          )}
        </button>
      </div>

      <Modal.Body className="p-4 bg-dark">
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ── EXPORT TAB ── */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'EXPORT' && (
          <div>
            {/* Scope Selection Card */}
            <div className="p-3 rounded-3 mb-3 border border-secondary border-opacity-25" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <Form.Label className="fs-13 fw-semibold text-white mb-2">Export Scope</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  id="scope-all"
                  name="exportScope"
                  label={`All ${entityLabel} (${totalCount} records)`}
                  checked={exportScope === 'ALL'}
                  onChange={() => setExportScope('ALL')}
                  className="fs-13 text-light"
                />
                <Form.Check
                  type="radio"
                  id="scope-selected"
                  name="exportScope"
                  label={`Selected Only (${selectedCount} records)`}
                  checked={exportScope === 'SELECTED'}
                  onChange={() => setExportScope('SELECTED')}
                  disabled={selectedCount === 0}
                  className="fs-13 text-light"
                />
              </div>
            </div>

            {/* Format Selection Card */}
            <div className="p-3 rounded-3 mb-3 border border-secondary border-opacity-25" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <Form.Label className="fs-13 fw-semibold text-white mb-2">File Format</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  id="format-csv"
                  name="exportFormat"
                  label="CSV (.csv) — Recommended for Excel & Sheets"
                  checked={exportFormat === 'CSV'}
                  onChange={() => setExportFormat('CSV')}
                  className="fs-13 text-light"
                />
                <Form.Check
                  type="radio"
                  id="format-json"
                  name="exportFormat"
                  label="JSON (.json) — Structured Developer format"
                  checked={exportFormat === 'JSON'}
                  onChange={() => setExportFormat('JSON')}
                  className="fs-13 text-light"
                />
              </div>
            </div>

            {/* Included Columns Preview */}
            <div className="p-3 rounded-3 mb-4 border border-secondary border-opacity-25" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              <span className="fs-12 text-secondary d-block mb-1.5 fw-semibold text-uppercase">Included Fields:</span>
              <div className="d-flex flex-wrap gap-1.5">
                {isUsers ? (
                  ['Full Name', 'Email', 'Username', 'Role', 'Status', 'Joined Date', 'Tenant ID', 'Company ID'].map((f) => (
                    <Badge key={f} bg="secondary" className="bg-opacity-25 text-light fw-normal fs-11 px-2 py-1">
                      {f}
                    </Badge>
                  ))
                ) : (
                  ['Role Name', 'Category', 'Nature', 'Permissions Count', 'Description'].map((f) => (
                    <Badge key={f} bg="secondary" className="bg-opacity-25 text-light fw-normal fs-11 px-2 py-1">
                      {f}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="outline-secondary" size="sm" onClick={onHide} className="fs-13 px-3">
                Cancel
              </Button>
              <Button
                variant="info"
                size="sm"
                onClick={handleExport}
                disabled={exportItemsCount === 0}
                className="fs-13 px-4 fw-semibold text-dark d-inline-flex align-items-center gap-1.5"
                style={{ backgroundColor: '#38bdf8', borderColor: '#38bdf8' }}
              >
                <Download size={14} />
                <span>Download {exportFormat} ({exportItemsCount} records)</span>
              </Button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ── IMPORT TAB ── */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'IMPORT' && (
          <div>
            {/* Step 1: Download Template */}
            <div className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-3 border border-secondary border-opacity-25" style={{ backgroundColor: 'rgba(56, 189, 248, 0.04)' }}>
              <div>
                <span className="fs-13 fw-semibold text-white d-block">Need the standard spreadsheet format?</span>
                <span className="fs-12 text-secondary">Download our template to ensure all column headers match.</span>
              </div>
              <Button
                variant="outline-info"
                size="sm"
                onClick={handleDownloadTemplate}
                className="fs-12 fw-medium d-inline-flex align-items-center gap-1 px-2.5 py-1"
              >
                <Download size={13} />
                <span>Sample CSV</span>
              </Button>
            </div>

            {/* Step 2: Upload File Drag & Drop Zone */}
            <div
              className="p-4 text-center rounded-3 mb-3 border border-dashed border-secondary border-opacity-50"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', cursor: 'pointer' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .json"
                onChange={handleFileChange}
                className="d-none"
              />
              <Upload size={28} className="text-primary mb-2 opacity-75" />
              <div className="fs-13 fw-medium text-white mb-1">
                {importFile ? importFile.name : 'Click to select CSV or JSON file to import'}
              </div>
              <span className="fs-12 text-secondary">
                Supports .csv or .json files with user names, emails, and roles
              </span>
            </div>

            {/* Parse Error */}
            {parseError && (
              <Alert variant="danger" className="py-2 px-3 fs-13 mb-3 bg-danger bg-opacity-25 text-danger border-0">
                <AlertTriangle size={15} className="me-1.5" />
                {parseError}
              </Alert>
            )}

            {/* Parsed Preview Table */}
            {parsedData.length > 0 && !importResult && (
              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fs-13 fw-semibold text-white">
                    Found {parsedData.length} records in file:
                  </span>
                  <Badge bg="success" className="bg-opacity-25 text-success fw-medium">
                    {parsedData.filter(d => d._valid).length} valid
                  </Badge>
                </div>
                <div className="border border-secondary border-opacity-25 rounded-2 overflow-hidden" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                  <table className="table table-sm table-dark align-middle mb-0 fs-12">
                    <thead className="text-secondary bg-dark border-bottom border-secondary border-opacity-25">
                      <tr>
                        <th className="py-1 px-2">#</th>
                        <th className="py-1 px-2">{isUsers ? 'Name' : 'Role Name'}</th>
                        <th className="py-1 px-2">{isUsers ? 'Email' : 'Description'}</th>
                        <th className="py-1 px-2">{isUsers ? 'Role' : 'Permissions'}</th>
                        <th className="py-1 px-2 text-end">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="border-bottom border-secondary border-opacity-10">
                          <td className="py-1 px-2 text-secondary">{idx + 1}</td>
                          <td className="py-1 px-2 text-white fw-medium text-truncate" style={{ maxWidth: '140px' }}>{row.name}</td>
                          <td className="py-1 px-2 text-secondary text-truncate" style={{ maxWidth: '180px' }}>{row.email || row.description || '—'}</td>
                          <td className="py-1 px-2 text-light">{isUsers ? row.role : `${row.permissions?.length || 0} perms`}</td>
                          <td className="py-1 px-2 text-end">
                            {row._valid ? (
                              <span className="text-success fs-11">Ready</span>
                            ) : (
                              <span className="text-warning fs-11">Warning</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.length > 5 && (
                    <div className="p-1.5 text-center fs-11 text-secondary bg-dark bg-opacity-75">
                      + {parsedData.length - 5} more records ready to import
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Import Progress */}
            {isImporting && (
              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-between fs-12 text-secondary mb-1">
                  <span>Importing records to database...</span>
                  <span>{importProgress}%</span>
                </div>
                <ProgressBar now={importProgress} variant="primary" style={{ height: '6px' }} />
              </div>
            )}

            {/* Import Result Summary */}
            {importResult && (
              <div className="p-3 rounded-3 mb-3 border border-secondary border-opacity-25 bg-dark">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <CheckCircle2 size={18} className="text-success" />
                  <span className="fs-14 fw-bold text-white">Import Process Finished</span>
                </div>
                <div className="fs-13 text-light mb-1">
                  Successfully imported: <strong className="text-success">{importResult.successCount}</strong> {entityLabel.toLowerCase()}
                </div>
                {importResult.failCount > 0 && (
                  <div className="fs-12 text-danger mt-1">
                    Failed records ({importResult.failCount}):
                    <ul className="mb-0 ps-3 mt-1 text-danger opacity-80" style={{ maxHeight: '80px', overflowY: 'auto' }}>
                      {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="d-flex justify-content-end gap-2 pt-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={onHide}
                disabled={isImporting}
                className="fs-13 px-3"
              >
                {importResult ? 'Close' : 'Cancel'}
              </Button>
              {!importResult && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExecuteImport}
                  disabled={isImporting || parsedData.length === 0}
                  className="fs-13 px-4 fw-semibold d-inline-flex align-items-center gap-1.5"
                  style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
                >
                  {isImporting ? <Spinner animation="border" size="sm" /> : <Upload size={14} />}
                  <span>Start Import ({parsedData.length})</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ImportExportModal;
