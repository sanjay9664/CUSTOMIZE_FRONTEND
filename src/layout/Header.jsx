import React from 'react';
import { Menu, Search, User, Bell, LayoutGrid, Sun, Building2, Shield, Users, Building, ChevronDown } from 'lucide-react';
import { Button, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Header = ({ collapsed, toggleSidebar }) => {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className={`scada-header ${collapsed ? 'collapsed' : ''}`}>
      <div className="header-left d-flex align-items-center">
        <Button 
          variant="link" 
          className="text-white p-0 me-3" 
          onClick={toggleSidebar}
        >
          <Menu size={24} />
        </Button>
        <h5 className="mb-0 fw-bold tracking-tight d-none d-md-block">
           Sochiot Smart Monitoring System
        </h5>
      </div>

      <div className="header-center d-none d-lg-block">
        <InputGroup className="header-search border-0">
          <InputGroup.Text className="bg-transparent border-secondary border-opacity-25 text-muted">
            <Search size={18} />
          </InputGroup.Text>
          <Form.Control
            placeholder="Search systems..."
            className="bg-transparent border-secondary border-opacity-25 text-white"
          />
        </InputGroup>
      </div>

      <div className="header-right d-flex align-items-center">
        {/* Quick Access Admin / Organisation Button in Right Corner */}
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
            <div className="px-3 py-2 border-bottom border-secondary border-opacity-25 mb-1">
              <p className="mb-0 fw-bold text-info fs-12 uppercase tracking-wider">Quick Management</p>
              <small className="text-muted fs-11">Organization & User Controls</small>
            </div>

            <Dropdown.Item 
              className="text-white hover-bg-secondary rounded-2 py-2 d-flex align-items-center gap-2"
              onClick={() => navigate('/manage-organisation?tab=company')}
            >
              <Building size={16} className="text-info" />
              <div className="d-flex flex-column">
                <span className="fw-semibold fs-13">Company</span>
                <small className="text-muted fs-11">Create & Manage SAAS Companies</small>
              </div>
            </Dropdown.Item>

            <Dropdown.Item 
              className="text-white hover-bg-secondary rounded-2 py-2 d-flex align-items-center gap-2"
              onClick={() => navigate('/manage-organisation')}
            >
              <Building2 size={16} className="text-cyan-400" />
              <div className="d-flex flex-column">
                <span className="fw-semibold fs-13">Manage Organisation</span>
                <small className="text-muted fs-11">Tenants, Zones & Tenant Areas</small>
              </div>
            </Dropdown.Item>

            <Dropdown.Item 
              className="text-white hover-bg-secondary rounded-2 py-2 d-flex align-items-center gap-2"
              onClick={() => navigate('/settings/users')}
            >
              <Shield size={16} className="text-amber-400" />
              <div className="d-flex flex-column">
                <span className="fw-semibold fs-13">Manage Roles</span>
                <small className="text-muted fs-11">Role & Permission Configurations</small>
              </div>
            </Dropdown.Item>

            <Dropdown.Item 
              className="text-white hover-bg-secondary rounded-2 py-2 d-flex align-items-center gap-2"
              onClick={() => navigate('/settings/users')}
            >
              <Users size={16} className="text-emerald-400" />
              <div className="d-flex flex-column">
                <span className="fw-semibold fs-13">Users</span>
                <small className="text-muted fs-11">User Administration & Access</small>
              </div>
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
        
        <Dropdown align="end">
          <Dropdown.Toggle variant="link" className="d-flex align-items-center text-white text-decoration-none p-0 border-0 custom-toggle">
            <div className="user-avatar bg-info rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '24px', height: '24px' }}>
              <User size={14} className="text-dark" />
            </div>
            <div className="user-info d-none d-sm-block text-start">
              <p className="mb-0 text-white fw-bold" style={{ fontSize: '11px', lineHeight: '1.1' }}>
                {localStorage.getItem('userRole')?.toUpperCase() === 'SUPER_ADMIN' ? 'Super Admin' : 
                 localStorage.getItem('userRole')?.toLowerCase() === 'admin' ? 'Administrator' : 'Field User'}
              </p>
              <p className="mb-0 text-muted uppercase tracking-tighter" style={{ fontSize: '9px', lineHeight: '1.1' }}>
                {localStorage.getItem('userRole')?.toUpperCase() === 'SUPER_ADMIN' ? 'Global Overseer' :
                 localStorage.getItem('userRole')?.toLowerCase() === 'admin' ? 'System Engineer' : 'Operator'}
              </p>
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu className="bg-dark border-secondary mt-2 shadow">
            <Dropdown.Item className="text-white hover-bg-secondary">Profile</Dropdown.Item>
            <Dropdown.Item className="text-white hover-bg-secondary">Logs</Dropdown.Item>
            <Dropdown.Divider className="bg-secondary" />
            <Dropdown.Item 
              className="text-danger hover-bg-secondary fw-bold"
              onClick={() => {
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('userRole');
                window.location.href = '/login';
              }}
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
      `}} />
    </header>
  );
};

export default Header;
