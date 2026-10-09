import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Menu, Search, User, Bell, Sun, Moon, Building2, ChevronDown, ChevronRight, 
  Settings, LogOut, FileText, Check, ShieldCheck, BellRing, Users, Cpu, Zap, Droplets, 
  Activity, Thermometer, Layers, CheckCircle2 
} from 'lucide-react';
import { Button, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { bmsService } from '../services/bmsService';
import { normalizeList, getAuthHeaders } from '../services/apiClient';
import { getApiUrl } from '../utils/apiConfig';
import { getUserInitials } from '../utils/userUtils';

import logo from "../assets/logo.png";

import GlobalSiteAssetDropdown from '../components/GlobalSiteAssetDropdown';

const Header = ({ collapsed, toggleSidebar, sidebarWidth = '64px', isImpersonating = false, moduleHeader, moduleIcon: ModuleIcon, activeSites = [], selectedSite, setSelectedSite }) => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { userRole, logout, user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

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

      {moduleHeader && (
        <div className="global-module-context d-flex align-items-center justify-content-between gap-3 ms-3 me-auto px-3">
          <div className="global-module-title d-flex align-items-center gap-2 fw-bold text-nowrap">
            {ModuleIcon && <ModuleIcon size={19} />}
            <span>{moduleHeader.title}</span>
          </div>
          {activeSites.length > 0 && (
            <GlobalSiteAssetDropdown
              activeSites={activeSites}
              selectedSite={selectedSite}
              setSelectedSite={setSelectedSite}
              moduleHeader={moduleHeader}
              ModuleIcon={ModuleIcon}
            />
          )}
        </div>
      )}


      {/* Right Controls: User Profile & Settings Areas */}
      <div className="header-right d-flex align-items-center gap-2">
        {/* 1. USER PROFILE AREA: [ SA ⌵ ] Dropdown */}
        <Dropdown align="end" className="user-dropdown-wrapper">
          <Dropdown.Toggle 
            variant="custom" 
            className="header-user-avatar-pill border-0 text-decoration-none shadow-none"
            id="header-user-toggle"
            aria-label="User profile menu"
          >
            <div
              className="d-flex align-items-center justify-content-center rounded-circle fw-bold header-user-avatar-circle"
              style={{
                width: '26px',
                height: '26px',
                backgroundColor: '#14532d',
                color: '#4ade80',
                border: '1px solid rgba(74, 222, 128, 0.5)',
                fontSize: '11px',
                letterSpacing: '0.02em',
                userSelect: 'none'
              }}
            >
              {user?.name ? getUserInitials(user.name) : (userRole?.slice(0, 2).toUpperCase() || 'SA')}
            </div>
            <ChevronDown size={13} className="header-user-chevron" />
          </Dropdown.Toggle>

          <Dropdown.Menu className="user-dropdown-menu mt-2 p-0 shadow-lg border">
            {/* User Profile Card */}
            <div className="settings-user-header p-3 border-bottom d-flex align-items-center gap-3">
              <div className="settings-avatar-box rounded-circle d-flex align-items-center justify-content-center">
                <User size={18} />
              </div>
              <div className="flex-grow-1 overflow-hidden">
                <div className="d-flex align-items-center gap-2">
                  <span className="settings-user-name fw-bold text-truncate">
                    {user?.name || (userRole?.toUpperCase() === 'SUPER_ADMIN' ? 'Super Admin' : userRole?.toLowerCase() === 'admin' ? 'Administrator' : 'Field User')}
                  </span>
                  <span className="settings-online-badge">ONLINE</span>
                </div>
                <div className="settings-user-role text-muted small text-truncate">
                  {user?.role || (userRole?.toUpperCase() === 'SUPER_ADMIN' ? 'Global Overseer' : userRole?.toLowerCase() === 'admin' ? 'System Engineer' : 'Operator')}
                </div>
              </div>
            </div>

            {/* User Account Navigation Items */}
            <div className="p-2 d-flex flex-column gap-1">
              <button 
                type="button" 
                onClick={() => navigate('/admin/manage-users')}
                className="settings-menu-link d-flex align-items-center gap-2.5 px-2.5 py-2 rounded-2 border-0 bg-transparent text-start w-100"
              >
                <User size={15} className="text-info" />
                <span className="flex-grow-1" style={{ fontSize: '13px' }}>User Profile</span>
                <span className="text-muted" style={{ fontSize: '11px' }}>Manage</span>
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/audit-logs')}
                className="settings-menu-link d-flex align-items-center gap-2.5 px-2.5 py-2 rounded-2 border-0 bg-transparent text-start w-100"
              >
                <FileText size={15} className="text-primary" />
                <span className="flex-grow-1" style={{ fontSize: '13px' }}>Activity & Audit Logs</span>
                <span className="text-muted" style={{ fontSize: '11px' }}>View</span>
              </button>
            </div>

            {/* Dropdown Footer: Sign Out */}
            <div className="p-2 border-top">
              <button 
                type="button"
                className="settings-signout-btn d-flex align-items-center justify-content-center gap-2 w-100 py-2 rounded-2 border-0 fw-bold"
                onClick={logout}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </Dropdown.Menu>
        </Dropdown>

        {/* 2. SETTINGS AREA: [ ⚙ Settings ⌵ ] Dropdown */}
        <Dropdown align="end" className="settings-dropdown-wrapper">
          <Dropdown.Toggle 
            variant="custom" 
            className="settings-toggle-btn border-0 text-decoration-none shadow-none"
            id="header-settings-toggle"
            aria-label="Settings and preferences menu"
          >
            <Settings size={15} className="settings-gear-icon" />
            <span className="settings-toggle-text">Settings</span>
            <ChevronDown size={13} className="settings-chevron-icon" />
          </Dropdown.Toggle>

          <Dropdown.Menu className="settings-dropdown-menu mt-2 p-0 shadow-lg border">
            <div className="p-3 d-flex flex-column gap-3">
              {/* Theme Mode Switcher */}
              <div className="settings-section">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="settings-section-title">THEME MODE</span>
                  <span className="settings-active-pill">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                <div className="theme-toggle-segmented d-flex p-1 rounded-3">
                  <button 
                    type="button"
                    className={`theme-segment-btn flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-1.5 px-2 rounded-2 ${!isDark ? 'active' : ''}`}
                    onClick={() => { if (isDark) toggleTheme(); }}
                  >
                    <Sun size={14} />
                    <span className="fw-semibold">Light</span>
                  </button>
                  <button 
                    type="button"
                    className={`theme-segment-btn flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-1.5 px-2 rounded-2 ${isDark ? 'active' : ''}`}
                    onClick={() => { if (!isDark) toggleTheme(); }}
                  >
                    <Moon size={14} />
                    <span className="fw-semibold">Dark</span>
                  </button>
                </div>
              </div>

              {/* Notifications Setting */}
              <div className="settings-section">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="settings-section-title">NOTIFICATIONS</span>
                  <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-0.5 rounded-pill" style={{ fontSize: '10px' }}>
                    3 Alerts
                  </span>
                </div>
                <div className="settings-interactive-card p-2.5 rounded-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2.5">
                    <div className="settings-card-icon rounded-2 p-1.5 d-flex align-items-center justify-content-center">
                      <BellRing size={16} className="text-warning" />
                    </div>
                    <div>
                      <div className="fw-semibold settings-item-text" style={{ fontSize: '12px' }}>System Alarms & Alerts</div>
                      <div className="text-muted" style={{ fontSize: '10px' }}>
                        {notificationsEnabled ? 'Active & Receiving Live' : 'Muted'}
                      </div>
                    </div>
                  </div>
                  <Form.Check 
                    type="switch"
                    id="settings-notification-toggle"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="settings-custom-switch mb-0"
                  />
                </div>
              </div>

              {/* System Navigation Links */}
              <div className="settings-nav-links d-flex flex-column gap-1 pt-1 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                <button 
                  type="button" 
                  onClick={() => navigate('/settings?tab=global')}
                  className="settings-menu-link d-flex align-items-center gap-2.5 px-2.5 py-2 rounded-2 border-0 bg-transparent text-start w-100"
                >
                  <Settings size={15} className="text-warning" />
                  <span className="flex-grow-1" style={{ fontSize: '13px' }}>Global Settings</span>
                  <span className="text-muted" style={{ fontSize: '11px' }}>Configure</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => navigate('/manage-organisation')}
                  className="settings-menu-link d-flex align-items-center gap-2.5 px-2.5 py-2 rounded-2 border-0 bg-transparent text-start w-100"
                >
                  <Building2 size={15} className="text-primary" />
                  <span className="flex-grow-1" style={{ fontSize: '13px' }}>Manage Organisation</span>
                  <span className="text-muted" style={{ fontSize: '11px' }}>Manage</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => navigate('/admin/manage-users')}
                  className="settings-menu-link d-flex align-items-center gap-2.5 px-2.5 py-2 rounded-2 border-0 bg-transparent text-start w-100"
                >
                  <Users size={15} className="text-info" />
                  <span className="flex-grow-1" style={{ fontSize: '13px' }}>User Management</span>
                  <span className="text-muted" style={{ fontSize: '11px' }}>Manage</span>
                </button>
              </div>
            </div>
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
        body.light-mode .scada-header .header-left .btn-link {
          color: #0f172a !important;
        }
        body.light-mode .scada-header .input-group-text {
          background-color: #e2e8f0 !important;
          border-color: #cbd5e1 !important;
          color: #475569 !important;
        }
        body.light-mode .scada-header .form-control {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .global-module-context {
          background: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
        }
        body.light-mode .global-module-title {
          color: #0f172a !important;
        }
        .global-module-title {
          color: #f8fafc;
        }
        .leading-tight { line-height: 1.1; }
        .fs-8 { font-size: 0.62rem; }
        .fs-7 { font-size: 0.72rem; }
        .custom-toggle::after { display: none; }
        .hover-bg-secondary:hover { background-color: rgba(255, 255, 255, 0.1); }
        .global-module-context { min-width: 260px; max-width: 620px; flex: 1 1 auto; height: 44px; border: 1px solid rgba(96, 165, 250, 0.25); border-radius: 10px; background: rgba(15, 23, 42, 0.45); }
        .global-site-select-wrap { min-width: 200px; max-width: 360px; position: relative; }
        .global-site-cascading-toggle {
          appearance: none;
          height: 38px;
          padding: 0 12px;
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 8px;
          color: #f8fafc;
          background: #1e293b;
          font-size: 13px;
          font-weight: 700;
          outline: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .global-site-cascading-toggle:hover,
        .global-site-cascading-toggle.active {
          border-color: #38bdf8;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
          background: #0f172a;
        }
        .global-site-current-name {
          color: #f8fafc;
          font-size: 13px;
          font-weight: 700;
        }
        .global-device-current-name {
          color: #38bdf8;
          font-size: 12.5px;
          font-weight: 700;
        }
        .global-site-divider {
          color: rgba(255, 255, 255, 0.4);
          font-size: 13px;
        }
        .global-device-badge-empty {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
        }
        .global-site-icon {
          color: #38bdf8;
        }
        .global-site-chevron {
          transition: transform 0.2s ease;
          color: #38bdf8;
        }
        .global-site-chevron.rotate-180 {
          transform: rotate(180deg);
        }

        .global-cascading-menu-container {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          z-index: 1060;
          background: rgba(15, 23, 42, 0.98);
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 12px;
          backdrop-filter: blur(24px);
          overflow: hidden;
          min-width: 480px;
          max-width: 540px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(56, 189, 248, 0.15);
          opacity: 0;
          transform: translateY(-8px) scale(0.97);
          pointer-events: none;
          visibility: hidden;
          transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.24s cubic-bezier(0.16, 1, 0.3, 1),
                      visibility 0.24s ease;
        }
        .global-cascading-menu-container.open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
          visibility: visible;
        }
        /* Invisible bridge to prevent mouse leave gap between trigger and menu */
        .global-cascading-menu-container::before {
          content: '';
          position: absolute;
          top: -10px;
          left: 0;
          right: 0;
          height: 12px;
          background: transparent;
        }

        .global-cascading-search-box {
          background: rgba(0, 0, 0, 0.2);
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        .global-cascading-sites-panel {
          width: 220px;
          flex-shrink: 0;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(15, 23, 42, 0.75);
        }
        .global-cascading-assets-panel {
          width: 260px;
          flex-grow: 1;
          background: rgba(15, 23, 42, 0.98);
        }
        .global-cascading-panel-header {
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94a3b8;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.25);
        }
        .global-cascading-list-scroll {
          max-height: 290px;
          overflow-y: auto;
          padding: 6px;
        }
        .global-cascading-site-item {
          padding: 8px 10px;
          border-radius: 6px;
          color: #cbd5e1;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
          margin-bottom: 3px;
        }
        .global-cascading-site-item:hover,
        .global-cascading-site-item.hovered {
          background: #93c5fd !important;
          color: #0f172a !important;
          font-weight: 700;
        }
        .global-cascading-site-item:hover .text-dim,
        .global-cascading-site-item.hovered .text-dim,
        .global-cascading-site-item:hover .global-cascading-item-name,
        .global-cascading-site-item.hovered .global-cascading-item-name {
          color: #0f172a !important;
        }
        .global-cascading-site-item.active {
          border-left: 3px solid #38bdf8;
        }

        .global-cascading-count-pill {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 9999px;
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
        }
        .global-cascading-count-pill.zero {
          background: rgba(148, 163, 184, 0.1);
          color: #94a3b8;
          border-color: rgba(148, 163, 184, 0.2);
        }
        .global-cascading-site-item:hover .global-cascading-count-pill,
        .global-cascading-site-item.hovered .global-cascading-count-pill {
          background: #1e3a8a;
          color: #ffffff;
          border-color: #1e3a8a;
        }

        .global-cascading-asset-item {
          padding: 8px 10px;
          border-radius: 6px;
          color: #f1f5f9;
          font-size: 12.5px;
          font-weight: 600;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
          margin-bottom: 3px;
        }
        .global-cascading-asset-item:hover {
          background: rgba(56, 189, 248, 0.12);
          border-color: rgba(56, 189, 248, 0.25);
          color: #ffffff;
        }
        .global-cascading-asset-item.active {
          background: #93c5fd !important;
          color: #0f172a !important;
          font-weight: 700;
          border-color: #93c5fd !important;
        }
        .global-cascading-asset-item.active .global-cascading-item-name,
        .global-cascading-asset-item.active .text-muted {
          color: #0f172a !important;
          opacity: 0.9 !important;
        }
        .global-cascading-asset-item.active .global-cascading-asset-icon-box {
          color: #0f172a !important;
          background: rgba(255, 255, 255, 0.5) !important;
        }
        .global-cascading-asset-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          flex-shrink: 0;
        }

        /* LIGHT MODE COMPATIBILITY FOR CASCADING DROPDOWN */
        body.light-mode .global-site-cascading-toggle,
        [data-theme="light"] .global-site-cascading-toggle {
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .global-site-current-name,
        [data-theme="light"] .global-site-current-name {
          color: #0f172a !important;
        }
        body.light-mode .global-device-current-name,
        [data-theme="light"] .global-device-current-name {
          color: #0284c7 !important;
        }
        body.light-mode .global-site-divider,
        [data-theme="light"] .global-site-divider {
          color: #64748b !important;
        }
        body.light-mode .global-cascading-menu-container,
        [data-theme="light"] .global-cascading-menu-container {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15) !important;
        }
        body.light-mode .global-cascading-search-box,
        [data-theme="light"] .global-cascading-search-box {
          background: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .global-cascading-search-box input,
        [data-theme="light"] .global-cascading-search-box input {
          color: #0f172a !important;
        }
        body.light-mode .global-cascading-search-box input::placeholder,
        [data-theme="light"] .global-cascading-search-box input::placeholder {
          color: #64748b !important;
        }
        body.light-mode .global-cascading-sites-panel,
        [data-theme="light"] .global-cascading-sites-panel {
          background: #f8fafc !important;
          border-right: 1px solid #e2e8f0 !important;
        }
        body.light-mode .global-cascading-assets-panel,
        [data-theme="light"] .global-cascading-assets-panel {
          background: #ffffff !important;
        }
        body.light-mode .global-cascading-panel-header,
        [data-theme="light"] .global-cascading-panel-header {
          background: #f1f5f9 !important;
          color: #475569 !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        body.light-mode .global-cascading-site-item,
        [data-theme="light"] .global-cascading-site-item {
          color: #334155 !important;
        }
        body.light-mode .global-cascading-asset-item,
        [data-theme="light"] .global-cascading-asset-item {
          color: #334155 !important;
        }

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

        /* ── SETTINGS & USER DROPDOWN TOGGLES ── */
        .user-dropdown-wrapper .custom-toggle::after,
        .user-dropdown-wrapper .dropdown-toggle::after,
        .settings-dropdown-wrapper .custom-toggle::after,
        .settings-dropdown-wrapper .dropdown-toggle::after {
          display: none !important;
        }

        /* User Avatar Pill */
        .header-user-avatar-pill {
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          padding: 4px 10px 4px 5px !important;
          border-radius: 9999px !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          cursor: pointer !important;
          transition: all 0.18s ease !important;
          text-decoration: none !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25) !important;
        }

        .header-user-avatar-pill:hover,
        .header-user-avatar-pill:focus,
        .user-dropdown-wrapper.show .header-user-avatar-pill {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.38) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35) !important;
        }

        .header-user-chevron {
          color: #cbd5e1 !important;
          opacity: 0.85 !important;
          transition: transform 0.18s ease;
        }

        .user-dropdown-wrapper.show .header-user-chevron {
          transform: rotate(180deg);
        }

        /* Settings Toggle Button Pill */
        .settings-toggle-btn {
          display: inline-flex !important;
          align-items: center !important;
          gap: 7px !important;
          padding: 5px 14px !important;
          border-radius: 9999px !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          color: #ffffff !important;
          font-size: 13.5px !important;
          font-weight: 600 !important;
          line-height: 1.2 !important;
          cursor: pointer !important;
          transition: all 0.18s ease !important;
          text-decoration: none !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25) !important;
        }

        .settings-toggle-btn:hover,
        .settings-toggle-btn:focus,
        .settings-dropdown-wrapper.show .settings-toggle-btn {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.38) !important;
          color: #ffffff !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35) !important;
        }

        .settings-toggle-btn .settings-gear-icon {
          color: #ffffff !important;
          opacity: 0.95 !important;
          flex-shrink: 0;
        }

        .settings-toggle-btn .settings-toggle-text {
          color: #ffffff !important;
          font-weight: 600 !important;
          font-size: 13.5px !important;
          letter-spacing: -0.01em;
        }

        .settings-toggle-btn .settings-chevron-icon {
          color: #cbd5e1 !important;
          opacity: 0.85 !important;
          margin-left: 1px !important;
          transition: transform 0.18s ease;
        }

        .settings-dropdown-wrapper.show .settings-chevron-icon {
          transform: rotate(180deg);
        }

        /* Light Mode Pill Overrides */
        body.light-mode .header-user-avatar-pill {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06) !important;
        }

        body.light-mode .header-user-avatar-pill:hover,
        body.light-mode .header-user-avatar-pill:focus,
        body.light-mode .user-dropdown-wrapper.show .header-user-avatar-pill {
          background: #f1f5f9 !important;
          border-color: #0284c7 !important;
        }

        body.light-mode .header-user-chevron {
          color: #64748b !important;
        }

        body.light-mode .settings-toggle-btn {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06) !important;
        }

        body.light-mode .settings-toggle-btn:hover,
        body.light-mode .settings-toggle-btn:focus,
        body.light-mode .settings-dropdown-wrapper.show .settings-toggle-btn {
          background: #f1f5f9 !important;
          border-color: #0284c7 !important;
          color: #0284c7 !important;
        }

        body.light-mode .settings-toggle-btn .settings-gear-icon {
          color: #0f172a !important;
        }

        body.light-mode .settings-toggle-btn .settings-toggle-text {
          color: #0f172a !important;
        }

        body.light-mode .settings-toggle-btn .settings-chevron-icon {
          color: #64748b !important;
        }

        .user-dropdown-menu,
        .settings-dropdown-menu {
          min-width: 320px !important;
          border-radius: 14px !important;
          overflow: hidden !important;
          background: #0f172a !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.65) !important;
        }

        .settings-dropdown-menu {
          min-width: 330px !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          background: #0f172a !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.55) !important;
        }

        body.light-mode .settings-dropdown-menu {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12) !important;
        }

        .settings-user-header {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        body.light-mode .settings-user-header {
          background: #f8fafc;
          border-color: #e2e8f0 !important;
        }

        .settings-avatar-box {
          width: 38px;
          height: 38px;
          background: #0284c7;
          color: #ffffff;
        }

        .settings-user-name {
          color: #f8fafc;
          font-size: 13px;
        }

        body.light-mode .settings-user-name {
          color: #0f172a;
        }

        .settings-online-badge {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
          font-size: 9px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 12px;
          text-transform: uppercase;
        }

        .settings-section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #94a3b8;
        }

        body.light-mode .settings-section-title {
          color: #64748b;
        }

        .settings-active-pill {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 10px;
          background: rgba(56, 189, 248, 0.12);
          color: #38bdf8;
        }

        body.light-mode .settings-active-pill {
          background: #e0f2fe;
          color: #0284c7;
        }

        .theme-toggle-segmented {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        body.light-mode .theme-toggle-segmented {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
        }

        .theme-segment-btn {
          border: none;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 12px;
        }

        body.light-mode .theme-segment-btn {
          color: #64748b;
        }

        .theme-segment-btn.active {
          background: #0284c7 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
        }

        body.light-mode .theme-segment-btn.active {
          background: #0f172a !important;
          color: #ffffff !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .settings-interactive-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        body.light-mode .settings-interactive-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .settings-card-icon {
          background: rgba(245, 158, 11, 0.15);
        }

        body.light-mode .settings-card-icon {
          background: #fef3c7;
        }

        .settings-item-text {
          color: #f8fafc;
        }

        body.light-mode .settings-item-text {
          color: #0f172a;
        }

        .settings-menu-link {
          color: #e2e8f0;
          transition: all 0.18s ease;
          cursor: pointer;
        }

        body.light-mode .settings-menu-link {
          color: #334155;
        }

        .settings-menu-link:hover {
          background: rgba(255, 255, 255, 0.06) !important;
          color: #38bdf8 !important;
        }

        body.light-mode .settings-menu-link:hover {
          background: #f1f5f9 !important;
          color: #0284c7 !important;
        }

        .settings-signout-btn {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          transition: all 0.2s ease;
          font-size: 13px;
        }

        .settings-signout-btn:hover {
          background: #ef4444 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        body.light-mode .settings-signout-btn {
          background: #fee2e2;
          color: #dc2626;
        }

        body.light-mode .settings-signout-btn:hover {
          background: #dc2626 !important;
          color: #ffffff !important;
        }

        @media (max-width: 768px) {
          .global-module-context { min-width: 0; margin-left: 8px !important; padding: 0 8px !important; gap: 8px !important; }
          .global-module-context > div:first-child span { display: none; }
          .global-site-select-wrap { min-width: 130px; }
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
