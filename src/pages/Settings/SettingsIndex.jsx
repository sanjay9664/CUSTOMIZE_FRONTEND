import React, { useState, useEffect } from 'react';
import { Container, Nav, Row, Col } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { Settings, Users, Building2, ChevronRight, Shield, MapPin, Sparkles, Cpu, Building, Grid, Terminal, Zap } from 'lucide-react';
import GlobalSettings from './GlobalSettings';
import UserAdministration from './UserAdministration';
import SiteManagement from './SiteManagement';

const SETTING_CARDS = [
  {
    key: 'org',
    title: 'Manage Organisation',
    description: 'Manage SAAS Companies, Multi-tenant Organizations, Zones, Tenant Areas & Physical Sites',
    icon: <Building2 size={28} />,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    path: '/manage-organisation'
  },
  {
    key: 'global',
    title: 'Global Settings',
    description: 'Module visibility, feature toggles, system preferences & dashboard configuration',
    icon: <Settings size={28} />,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    path: '/settings'
  },
  {
    key: 'users',
    title: 'User Administration',
    description: 'User management, send invitations, assign roles & permissions across tenants',
    icon: <Users size={28} />,
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    path: '/settings/users'
  },
  {
    key: 'location',
    title: 'Location Management',
    description: 'Manage  Zones,  Areas & Regional Locations',
    icon: <MapPin size={28} />,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    path: '/manage-organisation?tab=zone'
  },
  {
    key: 'device',
    title: 'Device',
    description: 'Provision IoT devices, BMS Device IDs, and telemetry settings',
    icon: <Cpu size={28} />,
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
    path: '/manage-organisation?tab=device'
  },
  {
    key: 'sites',
    title: 'Site Management',
    description: 'Physical site configuration, buildings, and site overview',
    icon: <Building size={28} />,
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    path: '/manage-organisation?tab=site'
  }
];

const SettingsIndex = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes('/settings/sites') || location.search.includes('tab=site')) return 'sites';
    if (location.search.includes('tab=zone') || location.search.includes('tab=area')) return 'location';
    if (location.search.includes('tab=device')) return 'device';
    if (location.pathname.includes('/settings/users') || location.pathname.includes('/admin/users')) return 'users';
    if (location.pathname.includes('/global-settings')) return 'global';
    if (location.pathname.includes('/manage-organisation')) return 'org';
    return 'hub';
  });

  useEffect(() => {
    if (location.pathname.includes('/settings/sites') || location.search.includes('tab=site')) {
      setActiveTab('sites');
    } else if (location.search.includes('tab=zone') || location.search.includes('tab=area')) {
      setActiveTab('location');
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

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'hub') navigate('/settings');
    else if (tab === 'global') navigate('/settings');
    else if (tab === 'users') navigate('/settings/users');
    else if (tab === 'org') navigate('/manage-organisation');
    else if (tab === 'location') navigate('/manage-organisation?tab=zone');
    else if (tab === 'device') navigate('/manage-organisation?tab=device');
    else if (tab === 'sites') navigate('/manage-organisation?tab=site');
  };

  const handleCardClick = (card) => {
    setActiveTab(card.key);
    navigate(card.path);
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
        .settings-hub-card {
          background: linear-gradient(135deg, rgba(30, 30, 36, 0.95), rgba(20, 20, 25, 0.9));
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 32px 28px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .settings-hub-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .settings-hub-card:hover {
          transform: translateY(-8px);
          border-color: rgba(255,255,255,0.12);
          box-shadow: 0 24px 48px rgba(0,0,0,0.4), 0 0 40px rgba(6,182,212,0.06);
        }
        .settings-hub-card:hover::before { opacity: 1; }
        .settings-hub-card:hover .hub-card-arrow {
          transform: translateX(6px);
          opacity: 1;
        }
        body.light-mode .settings-hub-card {
          background: linear-gradient(135deg, #ffffff, #f8fafc) !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .settings-hub-card:hover {
          box-shadow: 0 24px 48px rgba(0,0,0,0.08) !important;
          border-color: #cbd5e1 !important;
        }
        body.light-mode .hub-title-text {
          color: #0f172a !important;
        }
        body.light-mode .hub-card-title {
          color: #0f172a !important;
        }
        body.light-mode .hub-sub-text {
          color: #475569 !important;
        }
        .hub-card-arrow {
          transition: all 0.3s;
          opacity: 0.4;
        }
        .hub-card-icon-wrap {
          width: 56px; height: 56px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s;
        }
        .settings-hub-card:hover .hub-card-icon-wrap {
          transform: scale(1.08);
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hub-animated { animation: fadeSlideUp 0.5s ease-out forwards; }
      `}</style>

      {/* Sub-Header Tabs Row - Floating Executive Glass Segmented Bar */}
      <div className="px-4 py-2-5 mb-4 rounded-3 border border-secondary border-opacity-25 shadow-lg overflow-auto" style={{ margin: '0 0 1.5rem 0', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))' }}>
        <Nav variant="pills" activeKey={activeTab} onSelect={handleSelectTab} className="flex-nowrap gap-2">
          <Nav.Item>
            <Nav.Link
              eventKey="hub"
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${activeTab === 'hub' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Sparkles size={16} />
              Settings Hub
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="global"
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${activeTab === 'global' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Settings size={16} />
              Global Settings
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="users"
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${activeTab === 'users' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Users size={16} />
              User Admin
            </Nav.Link>
          </Nav.Item>
          <div className="vr bg-secondary opacity-30 my-1" />
          <Nav.Item>
            <Nav.Link
              eventKey="org"
              onClick={() => navigate('/manage-organisation')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${activeTab === 'org' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Building2 size={16} />
              Organisation
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="location"
              onClick={() => navigate('/manage-organisation?tab=zone')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${activeTab === 'location' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <MapPin size={16} />
              Location
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="device"
              onClick={() => navigate('/manage-organisation?tab=device')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${activeTab === 'device' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Cpu size={16} />
              Device
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="sites"
              onClick={() => navigate('/manage-organisation?tab=site')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${activeTab === 'sites' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Building size={16} />
              Site
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="widgets"
              onClick={() => navigate('/manage-organisation?tab=widgets')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${activeTab === 'widgets' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Grid size={16} />
              Widgets
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="rules"
              onClick={() => navigate('/manage-organisation?tab=rules')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${activeTab === 'rules' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Shield size={16} />
              Rules
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              eventKey="commands"
              onClick={() => navigate('/manage-organisation?tab=commands')}
              className={`d-flex align-items-center gap-2 fw-bold px-3.5 py-2 rounded-2 transition-all ${activeTab === 'commands' ? 'bg-info text-dark shadow-sm' : 'text-slate-300 hover:text-white'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Zap size={16} />
              Commands
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'hub' ? (
        <Container fluid className="py-5 px-lg-5">
          {/* Hub Header */}
          <div className="text-center mb-5 hub-animated">
            <div style={{
              width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(6,182,212,0.25)'
            }}>
              <Settings size={32} color="#fff" />
            </div>
            <h3 className="fw-bold mb-2 hub-title-text" style={{ color: '#f1f5f9' }}>System Settings</h3>
            <p className="hub-sub-text" style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: 500, margin: '0 auto' }}>
              Configure your BMS platform — manage modules, users, sites & permissions from one place
            </p>
          </div>

          {/* Setting Cards */}
          <Row className="g-4 justify-content-center" style={{ maxWidth: 1100, margin: '0 auto' }}>
            {SETTING_CARDS.map((card, idx) => (
              <Col xs={12} md={4} key={card.key}>
                <div
                  className="settings-hub-card hub-animated"
                  style={{ animationDelay: `${idx * 0.12}s` }}
                  onClick={() => handleCardClick(card)}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: card.gradient }} className="settings-hub-card-before" />

                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div className="hub-card-icon-wrap" style={{
                      background: `${card.color}15`,
                      border: `1px solid ${card.color}30`,
                      color: card.color
                    }}>
                      {card.icon}
                    </div>
                    <ChevronRight size={20} className="hub-card-arrow" style={{ color: card.color }} />
                  </div>

                  <h5 className="fw-bold mb-2 hub-card-title" style={{ color: '#f1f5f9', fontSize: '1.1rem' }}>
                    {card.title}
                  </h5>
                  <p className="mb-0 hub-sub-text" style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>
                    {card.description}
                  </p>
                </div>
              </Col>
            ))}
          </Row>
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

