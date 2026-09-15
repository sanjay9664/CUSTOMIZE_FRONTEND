import React from 'react';
import { Menu, Search, User, Bell, LayoutGrid, Sun, Building2, Shield, Users, Building, ChevronDown, MapPin, Sliders, UserPlus, Settings } from 'lucide-react';
import { Button, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import logo from "../assets/logo.png";

const Header = ({ collapsed, toggleSidebar, sidebarWidth = '64px', isImpersonating = false }) => {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { userRole, logout } = useAuth();

  return (
    <header 
      className={`scada-header ${collapsed ? 'collapsed' : ''}`}
      style={{ 
        left: sidebarWidth,
        top: isImpersonating ? '40px' : '0px'
      }}
    >
      <div className="header-left d-flex align-items-center gap-3">
        <Button 
          variant="link" 
          className="text-white p-0 me-2 d-flex align-items-center justify-content-center" 
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu size={22} />
        </Button>

        {/* Global Search Bar */}
        <InputGroup style={{ width: '360px', maxWidth: '100%' }}>
          <InputGroup.Text className="bg-dark border-secondary border-opacity-25 text-muted">
            <Search size={18} />
          </InputGroup.Text>
          <Form.Control 
            placeholder="Search telemetry, devices, alarms..." 
            className="bg-dark border-secondary border-opacity-25 text-white shadow-none fs-14"
          />
        </InputGroup>
      </div>

      <div className="header-right d-flex align-items-center">
        {/* Quick Organisation Management Menu */}
        <Dropdown align="end" className="me-3">
          <Dropdown.Toggle 
            variant="info" 
            size="sm" 
            className="fw-bold d-flex align-items-center gap-2 text-dark px-3 py-1 border-0 shadow-sm rounded-pill custom-toggle"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #0284c7)' }}
          >
            <Building2 size={16} />
            <span>Organisation Hub</span>
            <ChevronDown size={14} />
          </Dropdown.Toggle>

          <Dropdown.Menu className="bg-dark border-secondary shadow-lg mt-2 p-2" style={{ minWidth: '220px', borderRadius: '12px' }}>
            <Dropdown.Item className="text-white hover-bg-secondary rounded-2 py-2 d-flex align-items-center gap-2" onClick={() => navigate('/admin/manage-users')}>
              <Users size={16} className="text-emerald-400" />
              <span>Users</span>
            </Dropdown.Item>
            <Dropdown.Item className="text-white hover-bg-secondary rounded-2 py-2 d-flex align-items-center gap-2" onClick={() => navigate('/admin/manage-users?tab=roles')}>
              <Shield size={16} className="text-amber-400" />
              <span>Manage Roles</span>
            </Dropdown.Item>
            <Dropdown.Item className="text-white hover-bg-secondary rounded-2 py-2 d-flex align-items-center gap-2" onClick={() => navigate('/manage-organisation')}>
              <Building2 size={16} className="text-cyan-400" />
              <span>Manage Organisation</span>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        {/* Toggle Theme Button */}
        <Button 
          variant="custom" 
          size="sm" 
          onClick={toggleTheme} 
          className="theme-toggle-btn me-3" 
        >
          {isDark ? <Sun size={14}/> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>}
          <span>{isDark ? 'LIGHT MODE' : 'DARK MODE'}</span>
        </Button>
        
        <Button variant="link" className="text-muted p-2 me-2 position-relative">
          <Bell size={20} />
          <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ marginTop: '8px', marginLeft: '-8px' }}></span>
        </Button>
        <Button variant="link" className="text-muted p-2 me-3">
          <LayoutGrid size={20} />
        </Button>
        
        {/* User Profile */}
        <Dropdown align="end">
          <Dropdown.Toggle variant="link" className="d-flex align-items-center text-white text-decoration-none p-0 border-0 custom-toggle">
            <div className="user-avatar bg-info rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '24px', height: '24px' }}>
              <User size={14} className="text-dark" />
            </div>
            <div className="user-info d-none d-sm-block text-start">
              <p className="mb-0 text-white fw-bold" style={{ fontSize: '11px', lineHeight: '1.1' }}>
                {userRole?.toUpperCase() === 'SUPER_ADMIN' ? 'Super Admin' : 
                 userRole?.toLowerCase() === 'admin' ? 'Administrator' : 'Field User'}
              </p>
              <p className="mb-0 text-muted uppercase tracking-tighter" style={{ fontSize: '9px', lineHeight: '1.1' }}>
                {userRole?.toUpperCase() === 'SUPER_ADMIN' ? 'Global Overseer' :
                 userRole?.toLowerCase() === 'admin' ? 'System Engineer' : 'Operator'}
              </p>
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu className="bg-dark border-secondary mt-2 shadow">
            <Dropdown.Item className="text-white hover-bg-secondary">Profile</Dropdown.Item>
            <Dropdown.Item className="text-white hover-bg-secondary">Logs</Dropdown.Item>
            <Dropdown.Divider className="bg-secondary" />
            <Dropdown.Item 
              className="text-danger hover-bg-secondary fw-bold"
              onClick={logout}
            >
              Sign Out
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .header-search {
          width: 400px;
        }
        .header-search .form-control:focus {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-color: var(--scada-accent) !important;
          box-shadow: none;
          color: white;
        }
        .leading-tight { line-height: 1.1; }
        .fs-8 { font-size: 0.62rem; }
        .fs-7 { font-size: 0.72rem; }
        .custom-toggle::after { display: none; }
        .hover-bg-secondary:hover { background-color: rgba(255, 255, 255, 0.1); }

        /* ── MANAGE HUB DROPDOWN (3 CARDS MATCHING USER DESIGN) ── */
        .manage-hub-dropdown {
          min-width: 660px !important;
          background: #ffffff !important;
          border-radius: 20px !important;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25) !important;
          border: 1px solid #e2e8f0 !important;
        }

        body.dark-mode .manage-hub-dropdown,
        .scada-header .manage-hub-dropdown {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6) !important;
        }

        .manage-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .manage-card-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px 16px;
          border-radius: 16px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }

        body.dark-mode .manage-card-item {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .manage-card-item:hover {
          transform: translateY(-5px);
          background: #ffffff;
          border-color: #06b6d4;
          box-shadow: 0 12px 30px rgba(6, 182, 212, 0.18);
        }

        body.dark-mode .manage-card-item:hover {
          background: rgba(6, 182, 212, 0.08);
          border-color: #38bdf8;
          box-shadow: 0 12px 35px rgba(56, 189, 248, 0.25);
        }

        .manage-icon-box {
          width: 86px;
          height: 86px;
          border-radius: 16px;
          border: 2px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          margin-bottom: 16px;
          transition: all 0.25s ease;
          background: #f8fafc;
        }

        body.dark-mode .manage-icon-box {
          border-color: rgba(255, 255, 255, 0.2);
          color: #94a3b8;
          background: rgba(0, 0, 0, 0.25);
        }

        .manage-card-item:hover .manage-icon-box {
          border-color: #06b6d4;
          color: #0284c7;
          transform: scale(1.06);
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
        }

        body.dark-mode .manage-card-item:hover .manage-icon-box {
          border-color: #38bdf8;
          color: #38bdf8;
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.35);
        }

        .manage-card-title {
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 6px;
        }

        body.dark-mode .manage-card-title {
          color: #f8fafc;
        }

        .manage-card-desc {
          font-size: 0.78rem;
          color: #64748b;
          margin-bottom: 0;
          line-height: 1.35;
        }

        body.dark-mode .manage-card-desc {
          color: #94a3b8;
        }

        @media (max-width: 768px) {
          .manage-hub-dropdown {
            min-width: 100% !important;
            width: 320px !important;
          }
          .manage-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />
    </header>
  );
};

export default Header;
