import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Badge, Form, Button, Spinner, InputGroup } from 'react-bootstrap';
import {
  Shield, Search, Filter, RefreshCcw, Download, 
  LogIn, LogOut, UserPlus, ShieldCheck, Key,
  Smartphone, AlertTriangle, RotateCcw, Globe, Clock,
  ChevronLeft, ChevronRight, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const ACTION_CONFIG = {
  LOGIN:             { label: 'Login',             icon: <LogIn size={14} />,           color: '#10b981' },
  LOGOUT:            { label: 'Logout',            icon: <LogOut size={14} />,          color: '#6366f1' },
  USER_CREATION:     { label: 'User Created',      icon: <UserPlus size={14} />,        color: '#0ea5e9' },
  ROLE_CHANGE:       { label: 'Role Change',       icon: <ShieldCheck size={14} />,     color: '#f59e0b' },
  PERMISSION_CHANGE: { label: 'Permission Change', icon: <Shield size={14} />,          color: '#f97316' },
  DEVICE_LOGIN:      { label: 'Device Login',      icon: <Smartphone size={14} />,      color: '#14b8a6' },
  FAILED_LOGIN:      { label: 'Failed Login',      icon: <AlertTriangle size={14} />,   color: '#ef4444' },
  PASSWORD_RESET:    { label: 'Password Reset',    icon: <Key size={14} />,             color: '#a855f7' },
  TOKEN_REFRESH:     { label: 'Token Refresh',     icon: <RotateCcw size={14} />,       color: '#64748b' },
  API_ACCESS:        { label: 'API Access',        icon: <Globe size={14} />,           color: '#06b6d4' },
};

const STATUS_COLORS = {
  SUCCESS: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
  FAILED:  { bg: 'rgba(239, 68, 68, 0.15)',  text: '#ef4444' },
};

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    status: '',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  const token = localStorage.getItem('token');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('pageSize', pageSize);
      if (filters.action) params.set('action', filters.action);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await fetch(`/api/v1/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setLogs(json.data || []);
        setTotal(json.meta?.total || 0);
        setTotalPages(json.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      // Mock data for demo when backend unavailable
      setLogs(generateMockLogs());
      setTotal(50);
      setTotalPages(2);
    }
    setLoading(false);
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/v1/audit-logs/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setSummary(json.data);
    } catch {
      setSummary({ totalLogs: 1284, last24hCount: 47, failedLoginsLast7d: 3 });
    }
  };

  useEffect(() => { fetchLogs(); }, [page, filters]);
  useEffect(() => { fetchSummary(); }, []);

  const generateMockLogs = () => {
    const actions = Object.keys(ACTION_CONFIG);
    const emails = ['admin@sochiot.com', 'ops@building.co', 'viewer@site1.com'];
    return Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      action: actions[i % actions.length],
      userEmail: emails[i % emails.length],
      user: { name: emails[i % emails.length].split('@')[0] },
      tenant: { name: 'Main Org', slug: 'main-org' },
      status: i % 7 === 0 ? 'FAILED' : 'SUCCESS',
      ipAddress: `192.168.1.${100 + i}`,
      failureReason: i % 7 === 0 ? 'Invalid credentials' : null,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const exportCSV = () => {
    const headers = ['Time', 'Action', 'User', 'Status', 'IP Address', 'Failure Reason'];
    const rows = logs.map(l => [
      new Date(l.createdAt).toLocaleString(),
      l.action,
      l.userEmail || '',
      l.status,
      l.ipAddress || '',
      l.failureReason || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="audit-log-viewer p-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="audit-header d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-3">
            <div className="audit-icon-glow">
              <Shield size={24} />
            </div>
            <div>
              <h4 className="header-title mb-0">Enterprise Audit Logs</h4>
              <small className="text-muted">Security & compliance event tracking</small>
            </div>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" size="sm" onClick={fetchLogs} className="audit-btn">
              <RefreshCcw size={14} className="me-1" /> Refresh
            </Button>
            <Button variant="outline-info" size="sm" onClick={exportCSV} className="audit-btn">
              <Download size={14} className="me-1" /> Export CSV
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      {summary && (
        <Row className="mb-4 g-3">
          {[
            { label: 'Total Events', value: summary.totalLogs, icon: <Activity size={18} />, color: '#0ea5e9' },
            { label: 'Last 24h', value: summary.last24hCount, icon: <Clock size={18} />, color: '#10b981' },
            { label: 'Failed Logins (7d)', value: summary.failedLoginsLast7d, icon: <AlertTriangle size={18} />, color: '#ef4444' },
          ].map((card, i) => (
            <Col md={4} key={i}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="summary-card h-100 border-0">
                  <Card.Body className="d-flex align-items-center gap-3 py-3">
                    <div className="summary-icon" style={{ background: `${card.color}15`, color: card.color }}>
                      {card.icon}
                    </div>
                    <div>
                      <div className="fw-bold text-white fs-4">{card.value.toLocaleString()}</div>
                      <small className="text-muted">{card.label}</small>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      )}

      {/* Filters */}
      <Card className="filter-card mb-4 border-0">
        <Card.Body className="py-3">
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-transparent border-secondary text-muted"><Search size={14} /></InputGroup.Text>
                <Form.Control
                  placeholder="Search email, resource..."
                  className="audit-filter-input"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select size="sm" className="audit-filter-input" value={filters.action} onChange={(e) => handleFilterChange('action', e.target.value)}>
                <option value="">All Actions</option>
                {Object.entries(ACTION_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select size="sm" className="audit-filter-input" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                <option value="">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control type="date" size="sm" className="audit-filter-input" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
            </Col>
            <Col md={2}>
              <Form.Control type="date" size="sm" className="audit-filter-input" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
            </Col>
            <Col md={1} className="d-flex justify-content-end">
              <Button variant="outline-secondary" size="sm" onClick={() => { setFilters({ action: '', status: '', search: '', startDate: '', endDate: '' }); setPage(1); }} className="audit-btn">
                <Filter size={14} />
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Table */}
      <Card className="log-table-card border-0">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="info" />
              <p className="text-muted mt-2 mb-0">Loading audit events...</p>
            </div>
          ) : (
            <>
              <Table responsive hover className="audit-table mb-0">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>User</th>
                    <th>Tenant</th>
                    <th>Status</th>
                    <th>IP Address</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const cfg = ACTION_CONFIG[log.action] || { label: log.action, icon: <Globe size={14} />, color: '#94a3b8' };
                    const statusCfg = STATUS_COLORS[log.status] || STATUS_COLORS.SUCCESS;
                    return (
                      <tr key={log.id}>
                        <td className="text-nowrap">
                          <small className="text-muted">
                            {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </small>
                          {' '}
                          <span className="text-white">
                            {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </td>
                        <td>
                          <Badge
                            className="d-inline-flex align-items-center gap-1 px-2 py-1"
                            style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40`, fontSize: '0.72rem', fontWeight: 600 }}
                          >
                            {cfg.icon} {cfg.label}
                          </Badge>
                        </td>
                        <td className="text-white">{log.userEmail || '—'}</td>
                        <td><small className="text-muted">{log.tenant?.name || '—'}</small></td>
                        <td>
                          <span
                            className="px-2 py-1 rounded-pill fw-bold"
                            style={{ background: statusCfg.bg, color: statusCfg.text, fontSize: '0.7rem' }}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td><code className="text-muted" style={{ fontSize: '0.75rem' }}>{log.ipAddress || '—'}</code></td>
                        <td>
                          <small className="text-danger">{log.failureReason || ''}</small>
                        </td>
                      </tr>
                    );
                  })}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-5">
                        No audit log entries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Pagination */}
              <div className="d-flex align-items-center justify-content-between px-3 py-3 border-top border-secondary border-opacity-10">
                <small className="text-muted">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} entries
                </small>
                <div className="d-flex gap-1">
                  <Button variant="outline-secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="audit-btn px-2">
                    <ChevronLeft size={14} />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                    <Button
                      key={p}
                      variant={p === page ? 'info' : 'outline-secondary'}
                      size="sm"
                      onClick={() => setPage(p)}
                      className="audit-btn px-2"
                    >
                      {p}
                    </Button>
                  ))}
                  <Button variant="outline-secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="audit-btn px-2">
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <style>{`
        .audit-log-viewer { color: var(--scada-text, #e2e8f0); }
        .audit-header { background: linear-gradient(135deg, var(--scada-sidebar, #0f172a), var(--scada-bg, #020617)); border: 1px solid var(--scada-border, rgba(255,255,255,0.06)); border-radius: 16px; padding: 1.25rem 1.5rem; }
        .audit-icon-glow { width: 48px; height: 48px; background: rgba(14, 165, 233, 0.1); border: 1px solid rgba(14, 165, 233, 0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #0ea5e9; }
        .header-title { font-weight: 700; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .summary-card { background: var(--scada-card, #0f172a) !important; border: 1px solid var(--scada-border, rgba(255,255,255,0.06)) !important; border-radius: 14px; }
        .summary-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .filter-card { background: var(--scada-card, #0f172a) !important; border-radius: 14px; }
        .audit-filter-input { background: rgba(255,255,255,0.03) !important; border: 1px solid rgba(255,255,255,0.08) !important; color: #e2e8f0 !important; font-size: 0.82rem; }
        .audit-filter-input:focus { border-color: #0ea5e9 !important; box-shadow: 0 0 8px rgba(14,165,233,0.1); }
        .audit-filter-input option { background: #0f172a; color: #e2e8f0; }
        .log-table-card { background: var(--scada-card, #0f172a) !important; border-radius: 14px; overflow: hidden; }
        .audit-table { color: #cbd5e1; }
        .audit-table thead th { background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.06); color: #94a3b8; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; padding: 0.75rem 1rem; }
        .audit-table tbody td { border-bottom: 1px solid rgba(255,255,255,0.03); padding: 0.65rem 1rem; vertical-align: middle; font-size: 0.85rem; }
        .audit-table tbody tr:hover { background: rgba(14, 165, 233, 0.04); }
        .audit-btn { border-color: rgba(255,255,255,0.1) !important; color: #94a3b8 !important; font-size: 0.78rem; font-weight: 600; }
        .audit-btn:hover { background: rgba(255,255,255,0.05) !important; color: #e2e8f0 !important; }
      `}</style>
    </div>
  );
};

export default AuditLogViewer;
