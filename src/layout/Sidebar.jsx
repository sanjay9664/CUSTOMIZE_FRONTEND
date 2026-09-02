import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Droplets, Activity, Zap, Bell, ShieldAlert, Settings,
  ClipboardList, PenTool, History, LayoutDashboard,
  Gauge, Database, User, Wind, Leaf, Thermometer,
  ChevronDown, X
} from 'lucide-react';
import logo from "../assets/logo.png";
import { useTheme } from '../context/ThemeContext';

const THEMES = {
  "Dashboard":        { c: "#38bdf8", bg: "rgba(56,189,248,0.10)",  b: "rgba(56,189,248,0.28)" },
  "Water Management": { c: "#38bdf8", bg: "rgba(56,189,248,0.10)",  b: "rgba(56,189,248,0.28)" },
  "Motors":           { c: "#2dd4bf", bg: "rgba(45,212,191,0.10)",  b: "rgba(45,212,191,0.28)" },
  "DG Set":           { c: "#c084fc", bg: "rgba(192,132,252,0.10)", b: "rgba(192,132,252,0.28)" },
  "Alarm System":     { c: "#f87171", bg: "rgba(248,113,113,0.10)", b: "rgba(248,113,113,0.28)" },
  "LT Panel":        { c: "#fbbf24", bg: "rgba(251,191,36,0.10)",  b: "rgba(251,191,36,0.28)" },
  "Transformer":     { c: "#fb923c", bg: "rgba(251,146,60,0.10)",  b: "rgba(251,146,60,0.28)" },
  "Fire":            { c: "#ef4444", bg: "rgba(239,68,68,0.10)",   b: "rgba(239,68,68,0.28)" },
  "Ticketing":       { c: "#34d399", bg: "rgba(52,211,153,0.10)",  b: "rgba(52,211,153,0.28)" },
  "Maintenance":     { c: "#818cf8", bg: "rgba(129,140,248,0.10)", b: "rgba(129,140,248,0.28)" },
  "Service History": { c: "#a78bfa", bg: "rgba(167,139,250,0.10)", b: "rgba(167,139,250,0.28)" },
  "Daily DPR":       { c: "#f472b6", bg: "rgba(244,114,182,0.10)", b: "rgba(244,114,182,0.28)" },
  "Energy Metering": { c: "#60a5fa", bg: "rgba(96,165,250,0.10)",  b: "rgba(96,165,250,0.28)" },
  "VRV":             { c: "#38bdf8", bg: "rgba(56,189,248,0.10)",  b: "rgba(56,189,248,0.28)" },
  "AQI Sensor":      { c: "#2dd4bf", bg: "rgba(45,212,191,0.10)",  b: "rgba(45,212,191,0.28)" },
  "HVAC":            { c: "#38bdf8", bg: "rgba(56,189,248,0.10)",  b: "rgba(56,189,248,0.28)" },
  "AC":              { c: "#60a5fa", bg: "rgba(96,165,250,0.10)",  b: "rgba(96,165,250,0.28)" },
};

const SIDEBAR_W = 270;     // expanded width
const STRIP_W = 70;        // collapsed icon strip width

const Sidebar = ({ collapsed, onClose, onOpen, onHoverChange }) => {
  const location = useLocation();
  const { isDark } = useTheme();
  const [openSections, setOpenSections] = useState({});
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const hoverTimer = useRef(null);

  const [modulesConfig, setModulesConfig] = useState(() => {
    const s = localStorage.getItem('scada_modules_config');
    return s ? JSON.parse(s) : null;
  });
  const [submodulesConfig, setSubmodulesConfig] = useState(() => {
    const s = localStorage.getItem('scada_submodules_config');
    return s ? JSON.parse(s) : {};
  });

  const userRole = localStorage.getItem('userRole') || 'USER';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isAdmin = userRole === 'ADMIN';
  const isImpersonating = !!localStorage.getItem('impersonator_backup_role');

  // Is the sidebar showing full content?
  const isExpanded = !collapsed || hoverExpanded;

  // Auto-open the section containing active route
  useEffect(() => {
    const autoOpen = {};
    menuItems.forEach(item => {
      if (item.subItems?.some(s => location.pathname === s.path)) {
        autoOpen[item.title] = true;
      }
    });
    setOpenSections(prev => ({ ...prev, ...autoOpen }));
  }, [location.pathname]);

  // Hover open/close — smooth, stable, no flicker
  const handleMouseEnter = useCallback(() => {
    if (!collapsed) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setHoverExpanded(true);
      onHoverChange?.(true);
    }, 200);
  }, [collapsed, onHoverChange]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setHoverExpanded(false);
      onHoverChange?.(false);
    }, 350);
  }, [onHoverChange]);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const toggleSection = (title) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // Config fetching
  useEffect(() => {
    const fetchConfig = async () => {
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      if (!isAuth) return;
      const defaults = {
        "Dashboard": true, "Water Management": true, "Motors": true,
        "DG Set": true, "Setting Templates": true, "Alarm System": true,
        "LT Panel": true, "Transformer": true, "Fire": true,
        "Ticketing": true, "Maintenance": true, "Service History": true,
        "Daily DPR": true, "Energy Metering": true, "VRV": true,
        "AQI Sensor": true, "HVAC": true, "AC": true
      };
      try {
        const ep = isSuperAdmin ? '/api/super-admin/config' : '/api/super-admin/admin-config';
        const res = await fetch(ep);
        if (res.ok) {
          const cfg = await res.json();
          const map = {
            showDashboard:'Dashboard', showWaterManagement:'Water Management',
            showMotors:'Motors', showDGSet:'DG Set', showSettingTemplates:'Setting Templates',
            showAlarms:'Alarm System', showLTPanel:'LT Panel', showTransformers:'Transformer',
            showFirePumps:'Fire', showTicketing:'Ticketing', showMaintenance:'Maintenance',
            showServiceHistory:'Service History', showDailyDPR:'Daily DPR',
            showEnergyMetering:'Energy Metering', showVRV:'VRV', showAQISensor:'AQI Sensor',
            showHVAC:'HVAC', showAC:'AC'
          };
          const sm = {};
          Object.entries(map).forEach(([k,l]) => { sm[l] = cfg[k]; });
          setModulesConfig(sm);
          setSubmodulesConfig(cfg.submoduleVisibility || {});
          localStorage.setItem('scada_modules_config', JSON.stringify(sm));
          localStorage.setItem('scada_submodules_config', JSON.stringify(cfg.submoduleVisibility || {}));
          return;
        }
      } catch(e) {}
      if (!localStorage.getItem('scada_modules_config')) {
        setModulesConfig(defaults);
        localStorage.setItem('scada_modules_config', JSON.stringify(defaults));
      }
    };
    fetchConfig();
    const upd = () => {
      const a = localStorage.getItem('scada_modules_config');
      const b = localStorage.getItem('scada_submodules_config');
      if (a) setModulesConfig(JSON.parse(a));
      if (b) setSubmodulesConfig(JSON.parse(b));
    };
    window.addEventListener('storage-update', upd);
    return () => window.removeEventListener('storage-update', upd);
  }, []);

  const handleExitImpersonation = () => {
    const u = localStorage.getItem('impersonator_backup_user');
    const r = localStorage.getItem('impersonator_backup_role');
    if (u && r) {
      localStorage.setItem('userData', u);
      localStorage.setItem('userRole', r);
      localStorage.removeItem('impersonator_backup_user');
      localStorage.removeItem('impersonator_backup_role');
      localStorage.removeItem('scada_modules_config');
      localStorage.removeItem('scada_submodules_config');
      window.location.href = r === 'ADMIN' ? '/admin/manage-users' : '/dashboard';
    }
  };

  const menuItems = [
    { title: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard", disabled: modulesConfig ? !modulesConfig["Dashboard"] : false },
    { title: "Water Management", icon: <Droplets size={20} />, disabled: modulesConfig ? !modulesConfig["Water Management"] : false,
      subItems: [{ title: "Overview", path: "/water-management/overview" }, { title: "AG TANK", path: "/water-management/ag-pump" }, { title: "UG TANK", path: "/water-management/ug-pump" }].filter(s => submodulesConfig.showWaterManagement?.[s.title] ?? true) },
    { title: "Motors", icon: <Activity size={20} />, disabled: modulesConfig ? !modulesConfig["Motors"] : false,
      subItems: [{ title: "Overview", path: "/motors/overview" }, { title: "Pump Room 1", path: "/motors/room1" }, { title: "Pump Room 2", path: "/motors/room2" }, { title: "VFD / DOL Status", path: "/motors/status" }, { title: "PDF Report", path: "/motors/report" }].filter(s => submodulesConfig.showMotors?.[s.title] ?? true) },
    { title: "DG Set", icon: <Database size={20} />, disabled: modulesConfig ? !modulesConfig["DG Set"] : false,
      subItems: [{ title: "Overview", path: "/dg-set/overview" }, { title: "DG Set-1", path: "/dg-set/dg1" }, { title: "DG Set-2", path: "/dg-set/dg2" }, { title: "DG Set-3", path: "/dg-set/dg3" }].filter(s => submodulesConfig.showDGSet?.[s.title] ?? true) },
    { title: "Alarm System", icon: <Bell size={20} />, disabled: modulesConfig ? !modulesConfig["Alarm System"] : false,
      subItems: [{ title: "Overview", path: "/alarm-system/overview" }, { title: "Alarm Config", path: "/alarm-system/config" }, { title: "Message Template Setting", path: "/alarm-system/message-templates" }, { title: "Active Alarms", path: "/alarm-system/active" }, { title: "Inactive Alarms", path: "/alarm-system/inactive" }, { title: "ACK (Acknowledge)", path: "/alarm-system/ack" }, { title: "Alarm History", path: "/alarm-system/history" }, { title: "PDF Report", path: "/alarm-system/report" }].filter(s => (submodulesConfig.showAlarms?.[s.title] ?? true) && !s.hidden) },
    { title: "LT Panel", icon: <LayoutDashboard size={20} />, disabled: modulesConfig ? !modulesConfig["LT Panel"] : false,
      subItems: [{ title: "Overview", path: "/lt-panel/overview" }, { title: "LT Room-1", path: "/lt-panel/room1" }, { title: "LT Room-2", path: "/lt-panel/room2" }, { title: "LT Room-3", path: "/lt-panel/room3" }, { title: "Incoming / Outgoing", path: "/lt-panel/io" }, { title: "Breaker Status", path: "/lt-panel/breaker" }, { title: "PDF Report", path: "/lt-panel/report" }].filter(s => submodulesConfig.showLTPanel?.[s.title] ?? true) },
    { title: "Transformer", icon: <Zap size={20} />, disabled: modulesConfig ? !modulesConfig["Transformer"] : false,
      subItems: [{ title: "Overview", path: "/transformer/overview" }, { title: "Transformer-1", path: "/transformer/t1" }, { title: "Transformer-2", path: "/transformer/t2" }, { title: "Load / Temp", path: "/transformer/load" }, { title: "PDF Report", path: "/transformer/report" }].filter(s => submodulesConfig.showTransformers?.[s.title] ?? true) },
    { title: "Fire", icon: <ShieldAlert size={20} />, disabled: modulesConfig ? !modulesConfig["Fire"] : false,
      subItems: [{ title: "Overview", path: "/fire-pumps/overview" }, { title: "Pump Status", path: "/fire-pumps/status" }, { title: "Header Pressure", path: "/fire-pumps/pressure" }, { title: "Jockey / Main", path: "/fire-pumps/jockey" }, { title: "PDF Report", path: "/fire-pumps/report" }].filter(s => submodulesConfig.showFirePumps?.[s.title] ?? true) },
    { title: "Ticketing", icon: <ClipboardList size={20} />, path: "/ticketing", disabled: modulesConfig ? !modulesConfig["Ticketing"] : false },
    { title: "Maintenance", icon: <PenTool size={20} />, disabled: modulesConfig ? !modulesConfig["Maintenance"] : false,
      subItems: [{ title: "Scheduled", path: "/maintenance/scheduled" }, { title: "Pending Tasks", path: "/maintenance/pending" }, { title: "PDF Report", path: "/maintenance/report" }].filter(s => submodulesConfig.showMaintenance?.[s.title] ?? true) },
    { title: "Service History", icon: <History size={20} />, disabled: modulesConfig ? !modulesConfig["Service History"] : false,
      subItems: [{ title: "Equipment-wise", path: "/service/equipment" }, { title: "Service Records", path: "/service/records" }, { title: "PDF Report", path: "/service/report" }].filter(s => submodulesConfig.showServiceHistory?.[s.title] ?? true) },
    { title: "Daily DPR", icon: <Gauge size={20} />, disabled: modulesConfig ? !modulesConfig["Daily DPR"] : false,
      subItems: [{ title: "Data Aggregation", path: "/dpr/aggregation" }, { title: "Daily Logs", path: "/dpr/logs" }, { title: "PDF Report", path: "/dpr/report" }].filter(s => submodulesConfig.showDailyDPR?.[s.title] ?? true) },
    { title: "Energy Metering", icon: <Zap size={20} />, disabled: modulesConfig ? !modulesConfig["Energy Metering"] : false,
      subItems: [{ title: "Overview", path: "/energy-metering/overview" }, { title: "Main Meter", path: "/energy-metering/main" }, { title: "Sub Meters", path: "/energy-metering/sub" }, { title: "Graphs", path: "/energy-metering/graphs" }, { title: "PDF Report", path: "/energy-metering/report" }].filter(s => submodulesConfig.showEnergyMetering?.[s.title] ?? true) },
    { title: "VRV", icon: <Wind size={20} />, disabled: modulesConfig ? !modulesConfig["VRV"] : false,
      subItems: [{ title: "Overview", path: "/VRV/overview" }, { title: "Control Panel", path: "/VRV/control" }, { title: "Schedule", path: "/VRV/schedule" }, { title: "Human Sensor", path: "/VRV/human-sensor" }].filter(s => submodulesConfig.showVRV?.[s.title] ?? true) },
    { title: "AQI Sensor", icon: <Leaf size={20} />, disabled: modulesConfig ? !modulesConfig["AQI Sensor"] : false,
      subItems: [{ title: "Overview", path: "/aqi-sensor/overview" }, { title: "Temp & Humidity", path: "/aqi-sensor/temp-humidity" }].filter(s => submodulesConfig.showAQISensor?.[s.title] ?? true) },
    { title: "HVAC", icon: <Thermometer size={20} />, disabled: modulesConfig ? !modulesConfig["HVAC"] : false,
      subItems: [{ title: "Chiller", path: "/hvac/chiller" }, { title: "AHU", path: "/hvac/ahu" }, { title: "Cooling Tower", path: "/hvac/cooling-tower" }, { title: "PDF Report", path: "/hvac/report" }].filter(s => submodulesConfig.showHVAC?.[s.title] ?? true) },
    { title: "AC", icon: <Wind size={20} />, disabled: modulesConfig ? !modulesConfig["AC"] : false,
      subItems: [{ title: "Overview", path: "/ac/overview" }, { title: "PDF Report", path: "/ac/report" }].filter(s => submodulesConfig.showAC?.[s.title] ?? true) }
  ];

  const filteredItems = menuItems.filter(item => {
    const byRole = !item.adminOnly || isAdmin || isSuperAdmin;
    const byCfg = !modulesConfig || modulesConfig[item.title] === true;
    return byRole && byCfg;
  });

  const handleNavClick = () => {
    // On mobile, close the drawer after navigation
    if (window.innerWidth <= 992 && onClose) onClose();
  };

  // Build class names for sidebar state
  let sidebarClass = 'sb';
  if (collapsed && !hoverExpanded) sidebarClass += ' sb--collapsed';
  if (collapsed && hoverExpanded) sidebarClass += ' sb--hover-open';
  if (!collapsed) sidebarClass += ' sb--open';

  return (
    <>
      {/* Mobile Backdrop (when open on mobile) */}
      {!collapsed && <div className="sb-backdrop d-lg-none" onClick={onClose} />}

      <aside
        className={sidebarClass}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Mobile Close */}
        <button className="sb-close-btn d-lg-none" onClick={onClose}><X size={18} /></button>

        {/* Logo */}
        <div className="sb-brand">
          {isExpanded ? (
            <img src={logo} alt="Logo" className="sb-logo" />
          ) : (
            <div className="sb-logo-mini">S</div>
          )}
        </div>

        {/* Scrollable Content */}
        <nav className="sb-nav">
          {/* Verification */}
          {isImpersonating && (
            <div className="sb-verify" onClick={handleExitImpersonation}>
              <ShieldAlert size={14} />
              {isExpanded && <span>Exit Verification</span>}
            </div>
          )}

          {/* Settings */}
          <NavLink to="/settings" onClick={handleNavClick}
            className={({ isActive }) => `sb-link sb-settings ${isActive ? 'active' : ''}`}>
            <span className="sb-link-icon"><Settings size={18} /></span>
            {isExpanded && <span className="sb-link-text">Settings</span>}
          </NavLink>

          {isAdmin && (
            <NavLink to="/admin/manage-users" onClick={handleNavClick}
              className={({ isActive }) => `sb-link sb-admin ${isActive ? 'active' : ''}`}>
              <span className="sb-link-icon"><User size={18} /></span>
              {isExpanded && <span className="sb-link-text">Manage Users</span>}
            </NavLink>
          )}

          <div className="sb-sep" />

          {/* Modules */}
          {filteredItems.map((item, idx) => {
            const t = THEMES[item.title] || THEMES["Dashboard"];
            const isOpen = openSections[item.title];
            const hasSubs = item.subItems && item.subItems.length > 0;
            const hasActiveSub = item.subItems?.some(s => location.pathname === s.path);

            if (item.disabled) return null;

            return (
              <div key={idx} className="sb-mod">
                {/* Module Header */}
                {item.path && !hasSubs ? (
                  <NavLink
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) => `sb-mod-head ${isActive ? 'sb-mod-active' : ''}`}
                    style={{ '--mc': t.c, '--mbg': t.bg, '--mb': t.b }}
                  >
                    <span className="sb-mod-ico">{item.icon}</span>
                    {isExpanded && <span className="sb-mod-txt">{item.title}</span>}
                  </NavLink>
                ) : (
                  <button
                    className={`sb-mod-head ${hasActiveSub ? 'sb-mod-active' : ''} ${isOpen && isExpanded ? 'sb-mod-opened' : ''}`}
                    style={{ '--mc': t.c, '--mbg': t.bg, '--mb': t.b }}
                    onClick={() => isExpanded ? toggleSection(item.title) : null}
                  >
                    <span className="sb-mod-ico">{item.icon}</span>
                    {isExpanded && (
                      <>
                        <span className="sb-mod-txt">{item.title}</span>
                        {hasSubs && <ChevronDown size={14} className={`sb-chev ${isOpen ? 'sb-chev-up' : ''}`} />}
                      </>
                    )}
                  </button>
                )}

                {/* Dropdown */}
                {hasSubs && isExpanded && (
                  <div className={`sb-dd ${isOpen ? 'sb-dd-open' : ''}`}>
                    <div className="sb-dd-inner">
                      {item.subItems.map((sub, sIdx) => (
                        <NavLink
                          key={sIdx}
                          to={sub.path}
                          onClick={handleNavClick}
                          className={({ isActive }) => `sb-sub ${isActive ? 'sb-sub-on' : ''}`}
                          style={{ '--mc': t.c, '--mbg': t.bg, '--mb': t.b }}
                        >
                          <span className="sb-dot" />
                          <span>{sub.title}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    </>
  );
};

/* ── CSS ── */
const STYLES = `
/* ============================================
   SIDEBAR — Collapsible Strip + Hover Expand
   ============================================ */

.sb {
  position: fixed;
  left: 0; top: 0;
  height: 100vh;
  z-index: 1050;
  display: flex;
  flex-direction: column;
  background: linear-gradient(175deg, #080e1e 0%, #0c1428 40%, #0f172a 100%);
  border-right: 1px solid rgba(56,189,248,0.06);
  overflow: hidden;
  transition: width 0.4s cubic-bezier(0.25,0.1,0.25,1);
  will-change: width;
}

body.light-mode .sb {
  background: linear-gradient(175deg, #ffffff 0%, #f8fafc 40%, #f1f5f9 100%) !important;
  border-right-color: #e2e8f0 !important;
}

/* States */
.sb--open      { width: ${SIDEBAR_W}px; }
.sb--collapsed { width: ${STRIP_W}px; }
.sb--hover-open {
  width: ${SIDEBAR_W}px;
  box-shadow: 6px 0 30px rgba(0,0,0,0.35);
}

body.light-mode .sb--hover-open { box-shadow: 6px 0 30px rgba(0,0,0,0.1); }

/* Close btn (mobile) */
.sb-close-btn {
  position: absolute; top: 12px; right: 10px; z-index: 10;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8; border-radius: 8px;
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.sb-close-btn:hover { background: rgba(248,113,113,0.15); color: #f87171; }

/* Brand */
.sb-brand {
  display: flex; align-items: center; justify-content: center;
  padding: 16px 10px; min-height: 66px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  flex-shrink: 0;
}
body.light-mode .sb-brand { border-bottom-color: #e2e8f0; }

.sb-logo { width: 140px; height: 42px; object-fit: contain; animation: sbLogoIn 0.25s ease; }
@keyframes sbLogoIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }

.sb-logo-mini {
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(56,189,248,0.12); border: 1.5px solid rgba(56,189,248,0.3);
  color: #38bdf8; font-weight: 700; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}

/* Nav scroll */
.sb-nav {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  padding: 8px 6px 20px;
  scrollbar-width: thin;
  scrollbar-color: rgba(56,189,248,0.1) transparent;
}
.sb-nav::-webkit-scrollbar { width: 3px; }
.sb-nav::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.15); border-radius: 3px; }

/* Top Links */
.sb-link {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 9px 12px; margin-bottom: 2px;
  border-radius: 10px; text-decoration: none;
  font-size: 13px; font-weight: 600; transition: all 0.2s;
  white-space: nowrap;
}

.sb-link-icon {
  display: flex; align-items: center; justify-content: center;
  width: 28px; flex-shrink: 0;
}

.sb-link-text { opacity: 1; transition: opacity 0.2s ease; }

.sb-settings { color: #f59e0b; }
.sb-settings:hover, .sb-settings.active { background: rgba(245,158,11,0.1); color: #fbbf24; }
body.light-mode .sb-settings { color: #b45309; }
body.light-mode .sb-settings:hover, body.light-mode .sb-settings.active { background: rgba(245,158,11,0.08); color: #d97706; }

.sb-admin { color: #10b981; }
.sb-admin:hover, .sb-admin.active { background: rgba(16,185,129,0.1); color: #34d399; }

/* Separator */
.sb-sep {
  height: 1px; margin: 6px 8px;
  background: linear-gradient(90deg, transparent, rgba(56,189,248,0.12), transparent);
}
body.light-mode .sb-sep { background: linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent); }

/* Verify banner */
.sb-verify {
  display: flex; align-items: center; justify-content: center;
  gap: 6px; margin: 4px 0 6px; padding: 7px;
  border-radius: 8px; background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.25);
  color: #f59e0b; font-weight: 700; font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.06em;
  cursor: pointer;
}

/* ============================================
   MODULE SECTION
   ============================================ */

.sb-mod { margin-bottom: 1px; }

.sb-mod-head {
  display: flex; align-items: center;
  gap: 10px; width: 100%; padding: 9px 14px;
  border: none; border-radius: 10px; background: transparent;
  color: #8899b4; font-size: 13.5px; font-weight: 600;
  text-align: left; cursor: pointer;
  transition: all 0.2s; text-decoration: none;
  font-family: inherit; white-space: nowrap;
  min-height: 44px;
}

/* Collapsed: center icon only */
.sb--collapsed .sb-mod-head,
.sb--collapsed .sb-link {
  justify-content: center;
  padding: 9px 0;
}

.sb-mod-head:hover { color: #cbd5e1; background: rgba(255,255,255,0.03); }
body.light-mode .sb-mod-head { color: #475569; }
body.light-mode .sb-mod-head:hover { color: #1e293b; background: rgba(0,0,0,0.03); }

.sb-mod-active { color: var(--mc) !important; background: var(--mbg) !important; }
.sb-mod-opened { color: var(--mc) !important; }

/* Module Icon Circle */
.sb-mod-ico {
  display: flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--mbg); border: 1.5px solid var(--mb);
  color: var(--mc); flex-shrink: 0; transition: all 0.25s;
}

.sb-mod-head:hover .sb-mod-ico {
  transform: scale(1.08);
  box-shadow: 0 0 14px var(--mbg);
}

.sb-mod-txt { flex: 1; text-align: left; opacity: 1; transition: opacity 0.2s ease; }

/* Chevron */
.sb-chev {
  color: #475569; flex-shrink: 0;
  transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
}
.sb-chev-up { transform: rotate(180deg); color: var(--mc); }

/* ============================================
   DROPDOWN
   ============================================ */

.sb-dd {
  max-height: 0; overflow: hidden;
  transition: max-height 0.35s cubic-bezier(0.4,0,0.2,1);
}
.sb-dd-open { max-height: 600px; }

.sb-dd-inner { padding: 3px 0 6px; }

.sb-sub {
  display: flex; align-items: center;
  gap: 8px; padding: 7px 14px 7px 56px;
  border-radius: 8px; font-size: 12.5px; color: #5a6a82;
  text-decoration: none; transition: color 0.2s ease;
  background: transparent;
}

.sb-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #2a3548; flex-shrink: 0; transition: all 0.2s;
}

.sb-sub:hover { color: #e2e8f0; }
.sb-sub:hover .sb-dot { background: var(--mc); box-shadow: 0 0 6px var(--mc); }

body.light-mode .sb-sub { color: #64748b; }
body.light-mode .sb-sub:hover { color: #0f172a; }
body.light-mode .sb-dot { background: #cbd5e1; }

/* Active sub — transparent bg, only colored text + dot */
.sb-sub-on {
  color: var(--mc) !important;
  background: transparent !important;
  font-weight: 600;
}

.sb-sub-on .sb-dot {
  background: var(--mc) !important; box-shadow: 0 0 8px var(--mc) !important;
  width: 6px; height: 6px;
}

/* ============================================
   MOBILE
   ============================================ */

.sb-backdrop {
  position: fixed; inset: 0; z-index: 1040;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
  animation: bdIn 0.25s ease;
}
@keyframes bdIn { from { opacity:0; } to { opacity:1; } }

@media (min-width: 993px) {
  .sb-close-btn { display: none !important; }
}

@media (max-width: 992px) {
  .sb { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), width 0s; }
  .sb--collapsed, .sb--hover-open { width: ${SIDEBAR_W}px; }
  .sb--collapsed { transform: translateX(-100%); }
  .sb--open { transform: translateX(0); box-shadow: 8px 0 32px rgba(0,0,0,0.4); }
}
`;

export default Sidebar;
