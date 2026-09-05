import React, { useState, useEffect, useCallback } from 'react';
import { Container, Nav, Row, Col, Button, Spinner, Form } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Settings, Users, Building2, ChevronRight, Shield, MapPin, Sparkles, Cpu,
  Building, Grid, Terminal, Zap, Sliders, FileText, Plus, ArrowRight,
  Globe, Layers, BarChart3, BellRing, Radio, RefreshCw
} from 'lucide-react';
import GlobalSettings from './GlobalSettings';
import UserAdministration from './UserAdministration';
import SiteManagement from './SiteManagement';
import organizationService from '../../services/organizationService';

// ── HIERARCHY STEPS (Exact Tree Explorer Order) ──────────────────────────────
const HIERARCHY_STEPS = [
  {
    key: 'company', step: 1, label: 'Company', subtitle: 'Global Organization',
    icon: Building2, color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)',
    tab: 'company', description: 'Root Company level (e.g. sochiot-comp)',
    apiKey: 'companies'
  },
  {
    key: 'tenant', step: 2, label: 'Tenant / Client', subtitle: 'Consumer Org Unit',
    icon: Users, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    tab: 'tenant', description: 'Consumer Organization Unit (e.g. Acme Corp)',
    apiKey: 'tenants'
  },
  {
    key: 'zone', step: 3, label: 'Zone', subtitle: 'Geographic Region',
    icon: Globe, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    tab: 'zone', description: 'Geographic Zone (e.g. Noida Region)',
    apiKey: 'zones'
  },
  {
    key: 'area', step: 4, label: 'Sub-Zone / Area', subtitle: 'City / District',
    icon: Layers, color: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',
    tab: 'area', description: 'Sub-Zone Area (e.g. Central Noida)',
    apiKey: 'areas'
  },
  {
    key: 'site', step: 5, label: 'Site / Location', subtitle: 'Sector / Campus',
    icon: MapPin, color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    tab: 'site', description: 'Physical Site (e.g. Sector 75)',
    apiKey: 'sites'
  },
  /*
  {
    key: 'building', step: 6, label: 'Building', subtitle: 'Property / Structure',
    icon: Building, color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    tab: 'building', description: 'Building (e.g. Maxblis Whitehouse)',
    apiKey: 'buildings'
  },
  */
  {
    key: 'asset', step: 6, label: 'Asset', subtitle: 'Machinery / HVAC',
    icon: Sliders, color: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
    tab: 'asset', description: 'Equipment & Machinery Inventory',
    apiKey: 'assets'
  },
  {
    key: 'device', step: 7, label: 'Device / Sensor', subtitle: 'IoT Hardware',
    icon: Cpu, color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    tab: 'device', description: 'Modbus/BACnet IoT Controllers & Meters',
    apiKey: 'devices'
  }
];

// ── QUICK ACTIONS (Hierarchy Order) ──────────────────────────────────────
const QUICK_ACTIONS = [
  { key: 'add_company', label: '1. Add Company', icon: Building2, color: '#10b981', tab: 'company', description: 'Global organization level' },
  { key: 'add_tenant', label: '2. Add Tenant / Client', icon: Users, color: '#8b5cf6', tab: 'tenant', description: 'Consumer organization unit' },
  { key: 'add_zone', label: '3. Add Zone', icon: Globe, color: '#f59e0b', tab: 'zone', description: 'Geographic region (e.g. Noida)' },
  { key: 'add_area', label: '4. Add Sub-Zone / Area', icon: Layers, color: '#a855f7', tab: 'area', description: 'Sub-Zone Area (e.g. Central Noida)' },
  { key: 'add_site', label: '5. Add Site / Location', icon: MapPin, color: '#3b82f6', tab: 'site', description: 'Physical location (e.g. Sector 75)' },
  // { key: 'add_building', label: '6. Add Building', icon: Building, color: '#06b6d4', tab: 'building', description: 'Building (e.g. Maxblis Whitehouse)' },
  { key: 'add_asset', label: '6. Add Asset', icon: Sliders, color: '#ec4899', tab: 'asset', description: 'HVAC & equipment inventory' },
  { key: 'add_device', label: '7. Provision Device', icon: Cpu, color: '#ef4444', tab: 'device', description: 'Modbus/BACnet IoT hardware' },
];

// ── SYSTEM CONFIG CARDS ──────────────────────────────────────────────────
const SYSTEM_CARDS = [
  { key: 'global', title: 'Global Settings', description: 'Module visibility, feature toggles & system preferences', icon: Settings, color: '#f59e0b', path: '/settings', isGlobal: true },
  { key: 'users', title: 'User Administration', description: 'Manage users, invitations, roles & permissions', icon: Users, color: '#06b6d4', path: '/settings/users', isUsers: true },
  { key: 'commands', title: 'Device Commands', description: 'Remote Modbus/BACnet commands & execution', icon: Terminal, color: '#64748b', tab: 'commands' },
];

const SettingsIndex = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ── Entity Counts State ────────────────────────────────────────────────
  const [entityCounts, setEntityCounts] = useState({});
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsError, setCountsError] = useState('');

  const [activeTab, setActiveTab] = useState(() => {
    if (location.search.includes('tab=asset')) return 'assets';
    if (location.search.includes('tab=building')) return 'buildings';
    if (location.pathname.includes('/settings/sites') || location.search.includes('tab=site')) return 'sites';
    if (location.search.includes('tab=zone') || location.search.includes('tab=area')) return 'location';
    if (location.search.includes('tab=telemetry') || location.search.includes('tab=report') || location.search.includes('tab=alarm')) return 'report_group';
    if (location.search.includes('tab=device')) return 'device';
    if (location.pathname.includes('/settings/users') || location.pathname.includes('/admin/users')) return 'users';
    if (location.pathname.includes('/global-settings')) return 'global';
    if (location.pathname.includes('/manage-organisation')) return 'org';
    return 'hub';
  });

  useEffect(() => {
    if (location.search.includes('tab=asset')) {
      setActiveTab('assets');
    } else if (location.search.includes('tab=building')) {
      setActiveTab('buildings');
    } else if (location.pathname.includes('/settings/sites') || location.search.includes('tab=site')) {
      setActiveTab('sites');
    } else if (location.search.includes('tab=zone') || location.search.includes('tab=area')) {
      setActiveTab('location');
    } else if (location.search.includes('tab=telemetry') || location.search.includes('tab=report') || location.search.includes('tab=alarm')) {
      setActiveTab('report_group');
    } else if (location.search.includes('tab=device')) {
      setActiveTab('device');
    } else if (location.pathname.includes('/settings/users') || location.pathname.includes('/admin/users')) {
      setActiveTab('users');
    } else if (location.pathname.includes('/global-settings')) {
      setActiveTab('global');
    } else if (location.pathname.includes('/manage-organisation')) {
      setActiveTab('org');
    } else if (location.pathname === '/settings') {
      setActiveTab('hub');
    }
  }, [location.pathname, location.search]);

  const isExtraTabActiveIndex = ['widgets', 'rules', 'commands', 'report_group', 'buildings', 'building'].includes(activeTab);
  const [showExtraTabsIndex, setShowExtraTabsIndex] = useState(() => {
    const saved = localStorage.getItem('bms_show_extra_tabs');
    if (saved !== null) return saved === 'true';
    return isExtraTabActiveIndex;
  });

  useEffect(() => {
    if (isExtraTabActiveIndex && !showExtraTabsIndex) {
      setShowExtraTabsIndex(true);
    }
  }, [isExtraTabActiveIndex]);

  const handleToggleExtraIndex = (e) => {
    const val = e.target.checked;
    setShowExtraTabsIndex(val);
    localStorage.setItem('bms_show_extra_tabs', String(val));
  };

  // ── Fetch Entity Counts via bmsService ─────────────────────────────────
  const fetchEntityCounts = useCallback(async () => {
    setCountsLoading(true);
    setCountsError('');
    // Leave failed values undefined. A visible em dash is more honest than
    // displaying a false zero when the user is not authorized or the API is down.
    const counts = {};

    const requests = [
      ['companies', organizationService.getCompanies()],
      ['tenants', organizationService.getTenants()],
      ['zones', organizationService.getZones()],
      ['areas', organizationService.getAreas()],
      ['sites', organizationService.getSites()],
      // ['buildings', organizationService.getBuildings()], // Commented out: building moved to asset-based model
      ['assets', organizationService.getAssets()],
      ['devices', organizationService.getDevices()]
    ];
    const results = await Promise.allSettled(requests.map(([, request]) => request));
    const failedRequests = [];

    results.forEach((result, index) => {
      const key = requests[index][0];
      if (result.status === 'fulfilled') {
        counts[key] = Array.isArray(result.value) ? result.value.length : 0;
      } else {
        failedRequests.push({ key, error: result.reason });
        console.warn(`Unable to load ${key} count:`, result.reason);
      }
    });

    setEntityCounts(counts);
    if (failedRequests.length) {
      setCountsError(
        `Some counts could not be loaded (${failedRequests.map(({ key }) => key).join(', ')}). ` +
        'Please check your API access and try again.'
      );
    }
    setCountsLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'hub') {
      fetchEntityCounts();
    }
  }, [activeTab, fetchEntityCounts]);

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'hub') navigate('/settings');
    else if (tab === 'global') navigate('/settings');
    else if (tab === 'users') navigate('/settings/users');
    else if (tab === 'org') navigate('/manage-organisation');
    else if (tab === 'location') navigate('/manage-organisation?tab=zone');
    else if (tab === 'device') navigate('/manage-organisation?tab=device');
    else if (tab === 'sites') navigate('/manage-organisation?tab=site');
    else if (tab === 'assets') navigate('/manage-organisation?tab=asset');
    else if (tab === 'buildings') navigate('/manage-organisation?tab=building');
    else if (tab === 'report_group') navigate('/manage-organisation?tab=telemetry');
  };

  return (
    <div className="settings-page-wrapper" style={{ backgroundColor: '#070605', minHeight: '100vh' }}>
      <style>{`
        body.light-mode .settings-page-wrapper {
          background-color: var(--scada-bg, #e2e8f0) !important;
        }
        body.light-mode .settings-tabs-header {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
        }
        body.light-mode .settings-tab-link.active-tab {
          background-color: #f1f5f9 !important;
          color: #0284c7 !important;
          border-bottom-color: #0284c7 !important;
        }
        body.light-mode .settings-tab-link.inactive-tab {
          color: #64748b !important;
        }
        body.light-mode .settings-tab-link.inactive-tab:hover {
          color: #334155 !important;
          background-color: #f8fafc !important;
        }

        /* ── HIERARCHY STEP CARDS (RESPONSIVE NO-SCROLL GRID) ─────── */
        .hierarchy-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 10px;
          width: 100%;
        }
        @media (max-width: 1399.98px) {
          .hierarchy-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }
        }
        @media (max-width: 767.98px) {
          .hierarchy-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
        }

        .hierarchy-step-card {
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(20, 25, 35, 0.95));
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 16px 8px 14px;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          height: 100%;
        }
        .hierarchy-step-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          opacity: 0.85;
          transition: opacity 0.3s;
        }
        .hierarchy-step-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255,255,255,0.18);
          box-shadow: 0 16px 36px rgba(0,0,0,0.5), 0 0 25px rgba(6,182,212,0.08);
        }
        .hierarchy-step-card:hover::before { opacity: 1; }
        .hierarchy-step-card:hover .step-icon-wrap { transform: scale(1.1); }

        .step-icon-wrap {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin: 6px auto 8px;
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .step-number {
          font-size: 0.62rem;
          font-weight: 800;
          border-radius: 6px;
          padding: 2px 6px;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .step-count-badge {
          font-size: 1.35rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 2px;
        }
        .step-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          color: rgba(255,255,255,0.15);
        }

        /* ── QUICK ACTION CARDS ──────────────────────────────────── */
        .quick-action-card {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 18px 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .quick-action-card:hover {
          background: rgba(15, 23, 42, 0.9);
          border-color: rgba(255,255,255,0.12);
          transform: translateX(4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .quick-action-card:hover .qa-arrow { opacity: 1; transform: translateX(4px); }
        .qa-icon-wrap {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .qa-arrow { opacity: 0.3; transition: all 0.3s; margin-left: auto; }

        /* ── SYSTEM CONFIG CARDS ──────────────────────────────────── */
        .sys-config-card {
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(20, 25, 35, 0.9));
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.35s ease;
          position: relative;
          overflow: hidden;
        }
        .sys-config-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 3px;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .sys-config-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255,255,255,0.12);
          box-shadow: 0 16px 36px rgba(0,0,0,0.4);
        }
        .sys-config-card:hover::before { opacity: 1; }
        .sys-config-card:hover .sys-arrow { opacity: 1; transform: translateX(4px); }
        .sys-arrow { opacity: 0.3; transition: all 0.3s; }

        /* ── SECTION HEADERS ──────────────────────────────────────── */
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .section-header-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .section-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          margin: 32px 0;
        }

        /* ── LIGHT MODE OVERRIDES ────────────────────────────────── */
        body.light-mode .hierarchy-step-card {
          background: linear-gradient(145deg, #ffffff, #f8fafc) !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .hierarchy-step-card:hover {
          box-shadow: 0 16px 40px rgba(0,0,0,0.08) !important;
          border-color: #cbd5e1 !important;
        }
        body.light-mode .step-arrow { color: #cbd5e1 !important; }
        body.light-mode .quick-action-card {
          background: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .quick-action-card:hover {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.06) !important;
        }
        body.light-mode .sys-config-card {
          background: linear-gradient(145deg, #ffffff, #f8fafc) !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .sys-config-card:hover {
          box-shadow: 0 16px 36px rgba(0,0,0,0.06) !important;
          border-color: #cbd5e1 !important;
        }
        body.light-mode .hub-title-text, body.light-mode .hub-card-title {
          color: #0f172a !important;
        }
        body.light-mode .hub-sub-text {
          color: #475569 !important;
        }
        body.light-mode .section-divider {
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent) !important;
        }

        /* ── ANIMATIONS ──────────────────────────────────────────── */
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hub-animated { animation: fadeSlideUp 0.5s ease-out forwards; opacity: 0; }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(6,182,212,0.2); }
          50% { box-shadow: 0 0 20px 4px rgba(6,182,212,0.15); }
        }
      `}</style>

      {/* Sub-Header Tabs Row - Unified Executive Glass Segmented Bar */}
      <div className="px-4 py-2-5 mb-4 rounded-3 border border-secondary border-opacity-25 shadow-lg overflow-auto" style={{ margin: '0 0 1.5rem 0', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))' }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 w-100">
          <Nav variant="pills" activeKey={activeTab} className="flex-nowrap gap-1.5 align-items-center">
            <Nav.Item>
              <Nav.Link
                onClick={() => { setActiveTab('hub'); navigate('/settings'); }}
                className={`d-flex align-items-center gap-1.5 fw-semibold px-3 py-2 rounded-2 transition-all ${activeTab === 'hub' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <Sparkles size={15} className={activeTab === 'hub' ? 'text-dark' : 'text-info'} /> Settings
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                onClick={() => { setActiveTab('global'); navigate('/settings?tab=global'); }}
                className={`d-flex align-items-center gap-1.5 fw-semibold px-3 py-2 rounded-2 transition-all ${activeTab === 'global' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <Settings size={15} className={activeTab === 'global' ? 'text-dark' : 'text-slate-400'} /> Global
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                onClick={() => { setActiveTab('users'); navigate('/settings/users'); }}
                className={`d-flex align-items-center gap-1.5 fw-semibold px-3 py-2 rounded-2 transition-all ${activeTab === 'users' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <Users size={15} className={activeTab === 'users' ? 'text-dark' : 'text-slate-400'} /> Users
              </Nav.Link>
            </Nav.Item>

            <div className="vr bg-secondary opacity-30 mx-1" style={{ height: '24px' }} />

            {/* Hierarchy Sequence: Company => Organization => Zone => Area => Site => Asset => Device */}
            <Nav.Item>
              <Nav.Link
                onClick={() => navigate('/manage-organisation?tab=company')}
                className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${activeTab === 'company' || activeTab === 'org' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <Building size={15} /> Company
              </Nav.Link>
            </Nav.Item>

            <ChevronRight size={13} className="text-info opacity-40 mx-0.5" />

            <Nav.Item>
              <Nav.Link
                onClick={() => navigate('/manage-organisation?tab=tenant')}
                className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${activeTab === 'tenant' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <Building2 size={15} /> Organization
              </Nav.Link>
            </Nav.Item>

            <ChevronRight size={13} className="text-info opacity-40 mx-0.5" />

            <Nav.Item>
              <Nav.Link
                onClick={() => navigate('/manage-organisation?tab=zone')}
                className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${activeTab === 'zone' || activeTab === 'location' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <Globe size={15} /> Zone
              </Nav.Link>
            </Nav.Item>

            <ChevronRight size={13} className="text-info opacity-40 mx-0.5" />

            <Nav.Item>
              <Nav.Link
                onClick={() => navigate('/manage-organisation?tab=area')}
                className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${activeTab === 'area' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <Layers size={15} /> Area
              </Nav.Link>
            </Nav.Item>

            <ChevronRight size={13} className="text-info opacity-40 mx-0.5" />

            <Nav.Item>
              <Nav.Link
                onClick={() => navigate('/manage-organisation?tab=site')}
                className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${activeTab === 'site' || activeTab === 'sites' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <MapPin size={15} /> Site
              </Nav.Link>
            </Nav.Item>

            <ChevronRight size={13} className="text-info opacity-40 mx-0.5" />

            <Nav.Item>
              <Nav.Link
                onClick={() => navigate('/manage-organisation?tab=asset')}
                className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${activeTab === 'asset' || activeTab === 'assets' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <Sliders size={15} /> Asset
              </Nav.Link>
            </Nav.Item>

            <ChevronRight size={13} className="text-info opacity-40 mx-0.5" />

            <Nav.Item>
              <Nav.Link
                onClick={() => navigate('/manage-organisation?tab=device')}
                className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${activeTab === 'device' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
                style={{ fontSize: '0.83rem' }}
              >
                <Cpu size={15} /> Device
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {/* Right Side Toggle Controls & Extra Tabs (Widgets, Rules, Commands, Report, Building) */}
          <div className="d-flex align-items-center gap-2 ms-auto">
            {showExtraTabsIndex && (
              <Nav variant="pills" activeKey={activeTab} className="flex-nowrap gap-1.5 align-items-center">
                <Nav.Item>
                  <Nav.Link onClick={() => navigate('/manage-organisation?tab=widgets')} className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${activeTab === 'widgets' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`} style={{ fontSize: '0.83rem' }}>
                    <Grid size={15} /> Widgets
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link onClick={() => navigate('/manage-organisation?tab=rules')} className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${activeTab === 'rules' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`} style={{ fontSize: '0.83rem' }}>
                    <Shield size={15} /> Rules
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link onClick={() => navigate('/manage-organisation?tab=commands')} className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${activeTab === 'commands' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`} style={{ fontSize: '0.83rem' }}>
                    <Zap size={15} /> Commands
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link onClick={() => navigate('/manage-organisation?tab=telemetry')} className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${activeTab === 'report_group' || activeTab === 'report' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`} style={{ fontSize: '0.83rem' }}>
                    <FileText size={15} /> Report
                  </Nav.Link>
                </Nav.Item>
                {/* Building Tab commented out: building is now managed as an asset */}
                {/* <Nav.Item>
                  <Nav.Link onClick={() => navigate('/manage-organisation?tab=building')} className={`d-flex align-items-center gap-1.5 fw-bold px-3 py-2 rounded-2 transition-all ${activeTab === 'building' || activeTab === 'buildings' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`} style={{ fontSize: '0.83rem' }}>
                    <Building2 size={15} /> Building
                  </Nav.Link>
                </Nav.Item> */}
              </Nav>
            )}

            <div className="d-flex align-items-center gap-2 px-2.5 py-1.5 rounded-2 bg-dark bg-opacity-60 border border-info border-opacity-30 shadow-sm ms-2">
              <Form.Check
                type="switch"
                id="extra-modules-toggle-index"
                checked={showExtraTabsIndex}
                onChange={handleToggleExtraIndex}
                className="m-0 cursor-pointer"
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="extra-modules-toggle-index" className="form-check-label fw-semibold text-info mb-0 text-nowrap cursor-pointer" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
                Extra Tabs
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'hub' ? (
        <Container fluid className="py-4 px-lg-5" style={{ maxWidth: 1300, margin: '0 auto' }}>

          {/* ═══════════════════ HUB HEADER ═══════════════════════════ */}
          <div className="text-center mb-4 hub-animated">
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(6,182,212,0.25)'
            }}>
              <Settings size={28} color="#fff" />
            </div>
            <h3 className="fw-bold mb-1 hub-title-text" style={{ color: '#f1f5f9', fontSize: '1.5rem' }}>BMS Control Center</h3>
            <p className="hub-sub-text mb-0" style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 520, margin: '0 auto' }}>
              Follow the setup hierarchy below to configure your Building Management System step by step
            </p>
          </div>

          {/* ═══════════════════ SECTION 1: SETUP HIERARCHY ═══════════ */}
          <div className="hub-animated" style={{ animationDelay: '0.15s' }}>
            <div className="section-header">
              <div className="section-header-icon" style={{ background: 'rgba(6,182,212,0.12)', color: '#06b6d4' }}>
                <Layers size={18} />
              </div>
              <div>
                <h5 className="fw-bold mb-0 hub-card-title" style={{ color: '#f1f5f9', fontSize: '1.05rem' }}>Setup Hierarchy</h5>
                <p className="mb-0 hub-sub-text" style={{ color: '#64748b', fontSize: '0.78rem' }}>Create entities in order — left to right</p>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                className="ms-auto d-flex align-items-center gap-1 rounded-3"
                style={{ fontSize: '0.75rem' }}
                onClick={fetchEntityCounts}
                disabled={countsLoading}
              >
                <RefreshCw size={13} className={countsLoading ? 'spin-icon' : ''} /> Refresh
              </Button>
            </div>

            {countsError && (
              <div
                className="mb-3 px-3 py-2 rounded-3"
                role="alert"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', fontSize: '0.78rem' }}
              >
                {countsError}
              </div>
            )}

            {/* Grid Hierarchy Flow (No Horizontal Scroll) */}
            <div className="hierarchy-grid">
              {HIERARCHY_STEPS.map((step) => {
                const IconComp = step.icon;
                const count = entityCounts[step.apiKey];
                return (
                  <div
                    key={step.key}
                    className="hierarchy-step-card"
                    onClick={() => navigate(`/manage-organisation?tab=${step.tab}`)}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: step.gradient }} />
                    <div className="d-flex align-items-center justify-content-between w-100 mb-1">
                      <div className="step-number" style={{ background: `${step.color}20`, color: step.color }}>
                        STEP {step.step}
                      </div>
                      <ArrowRight size={12} style={{ color: step.color, opacity: 0.6 }} />
                    </div>
                    <div className="step-icon-wrap" style={{ background: `${step.color}15`, border: `1px solid ${step.color}30`, color: step.color }}>
                      <IconComp size={20} />
                    </div>
                    <div className="w-100">
                      <div className="step-count-badge hub-card-title" style={{ color: step.color }}>
                        {countsLoading ? <Spinner animation="border" size="sm" style={{ width: 14, height: 14 }} /> : (count ?? '—')}
                      </div>
                      <div className="fw-bold hub-card-title text-truncate" style={{ color: '#f1f5f9', fontSize: '0.8rem', marginBottom: 1 }} title={step.label}>
                        {step.label}
                      </div>
                      <div className="hub-sub-text text-truncate" style={{ color: '#64748b', fontSize: '0.65rem', lineHeight: 1.2 }} title={step.subtitle}>
                        {step.subtitle}
                      </div>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 p-0 d-flex align-items-center gap-1 mx-auto"
                      style={{ fontSize: '0.7rem', color: step.color, textDecoration: 'none' }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/manage-organisation?tab=${step.tab}`); }}
                    >
                      <Plus size={11} /> Add / Manage
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="section-divider" />

          {/* ═══════════════════ SECTION 2: QUICK ACTIONS ═══════════════ */}
          <div className="hub-animated" style={{ animationDelay: '0.3s' }}>
            <div className="section-header">
              <div className="section-header-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
                <Zap size={18} />
              </div>
              <div>
                <h5 className="fw-bold mb-0 hub-card-title" style={{ color: '#f1f5f9', fontSize: '1.05rem' }}>Quick Actions</h5>
                <p className="mb-0 hub-sub-text" style={{ color: '#64748b', fontSize: '0.78rem' }}>Common creation & configuration tasks — ordered by hierarchy flow</p>
              </div>
            </div>

            <Row className="g-3">
              {QUICK_ACTIONS.map((action) => {
                const IconComp = action.icon;
                return (
                  <Col xs={12} md={6} lg={3} key={action.key}>
                    <div
                      className="quick-action-card"
                      onClick={() => navigate(`/manage-organisation?tab=${action.tab}`)}
                    >
                      <div className="qa-icon-wrap" style={{ background: `${action.color}15`, border: `1px solid ${action.color}25`, color: action.color }}>
                        <IconComp size={20} />
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold hub-card-title" style={{ color: '#f1f5f9', fontSize: '0.88rem' }}>{action.label}</div>
                        <div className="hub-sub-text" style={{ color: '#64748b', fontSize: '0.75rem' }}>{action.description}</div>
                      </div>
                      <ChevronRight size={18} className="qa-arrow" style={{ color: action.color }} />
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>

          <div className="section-divider" />

          {/* ═══════════════════ SECTION 3: SYSTEM CONFIGURATION ════════ */}
          <div className="hub-animated" style={{ animationDelay: '0.45s' }}>
            <div className="section-header">
              <div className="section-header-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                <Settings size={18} />
              </div>
              <div>
                <h5 className="fw-bold mb-0 hub-card-title" style={{ color: '#f1f5f9', fontSize: '1.05rem' }}>System Configuration</h5>
                <p className="mb-0 hub-sub-text" style={{ color: '#64748b', fontSize: '0.78rem' }}>Platform settings & administration</p>
              </div>
            </div>

            <Row className="g-3">
              {SYSTEM_CARDS.map((card) => {
                const IconComp = card.icon;
                return (
                  <Col xs={12} md={4} key={card.key}>
                    <div
                      className="sys-config-card"
                      onClick={() => {
                        if (card.path) navigate(card.path);
                        else if (card.tab) navigate(`/manage-organisation?tab=${card.tab}`);
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${card.color}, ${card.color}80)` }} />
                      <div className="d-flex align-items-start justify-content-between mb-3">
                        <div style={{
                          width: 48, height: 48, borderRadius: 14,
                          background: `${card.color}12`, border: `1px solid ${card.color}25`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: card.color
                        }}>
                          <IconComp size={22} />
                        </div>
                        <ChevronRight size={18} className="sys-arrow" style={{ color: card.color }} />
                      </div>
                      <h6 className="fw-bold mb-1 hub-card-title" style={{ color: '#f1f5f9', fontSize: '0.95rem' }}>{card.title}</h6>
                      <p className="mb-0 hub-sub-text" style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.5 }}>{card.description}</p>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>

          <div style={{ height: 40 }} />
        </Container>
      ) : activeTab === 'global' ? (
        <GlobalSettings />
      ) : activeTab === 'users' ? (
        <UserAdministration />
      ) : activeTab === 'sites' ? (
        <SiteManagement />
      ) : null}
    </div>
  );
};

export default SettingsIndex;

