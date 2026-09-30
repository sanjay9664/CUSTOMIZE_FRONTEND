import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Thermometer, Wind, Snowflake, Flame, ClipboardList, Wrench, History, LifeBuoy, Droplets, Activity, Bell, LayoutDashboard, Zap, Gauge } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSiteStore } from '../context/SiteContext';

const MODULE_HEADER_CONFIG = [
  { match: /^\/energy-metering(?:\/|$)/, title: 'Energy Metering', icon: Zap },
  { match: /^\/dg-set(?:\/|$)/, title: 'DG Set', icon: Activity },
  { match: /^\/water-management(?:\/|$)/, title: 'Water Management', icon: Droplets },
  { match: /^\/motors(?:\/|$)/, title: 'Motors', icon: Activity },
  { match: /^\/daily-dpr(?:\/|$)/, title: 'Daily DPR', icon: Gauge },
  { match: /^\/lt-panel(?:\/|$)/, title: 'LT Panel', icon: LayoutDashboard },
  { match: /^\/transformer(?:\/|$)/, title: 'Transformer', icon: Zap },
  { match: /^\/hvac(?:\/|$)|^\/ahu$|^\/cooling-tower$/, title: 'HVAC', icon: Thermometer },
  { match: /^\/VRV(?:\/|$)/i, title: 'VRV', icon: Wind },
  { match: /^\/ac(?:\/|$)/i, title: 'AC', icon: Snowflake },
  { match: /^\/alarm-system(?:\/|$)/, title: 'Alarm System', icon: Bell },
  { match: /^\/fire-pumps(?:\/|$)/, title: 'Fire', icon: Flame },
  { match: /^\/ticketing(?:\/|$)/, title: 'Ticketing', icon: ClipboardList },
  { match: /^\/maintenance(?:\/|$)/, title: 'Maintenance', icon: Wrench },
  { match: /^\/service(?:\/|$)/, title: 'Service History', icon: History },
  { match: /^\/help(?:\/|$)/, title: 'Help', icon: LifeBuoy },
  { match: /^\/aqi-sensor(?:\/|$)/, title: 'AQI Sensor', icon: Wind },
];

const MainLayout = ({ children }) => {
  const { pathname } = useLocation();
  const { activeSites, selectedSite, setSelectedSite } = useSiteStore();
  const [collapsed, setCollapsed] = useState(true);
  const [sidebarHover, setSidebarHover] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    if (!selectedSite && activeSites?.length) setSelectedSite(activeSites[0]);
  }, [activeSites, selectedSite, setSelectedSite]);

  useEffect(() => {
    setIsImpersonating(!!localStorage.getItem('impersonator_backup_role'));
  }, []);

  const handleExitVerification = () => {
    const backupUser = localStorage.getItem('impersonator_backup_user');
    const backupRole = localStorage.getItem('impersonator_backup_role');
    const cacheGlobalConfig = localStorage.getItem('cache_global_config');

    if (backupUser && backupRole) {
      localStorage.setItem('userData', backupUser);
      localStorage.setItem('userRole', backupRole);
      
      localStorage.removeItem('impersonator_backup_user');
      localStorage.removeItem('impersonator_backup_role');

      // Restore global modules config if available
      if (cacheGlobalConfig) {
        try {
          const globalConfig = JSON.parse(cacheGlobalConfig);
          const sidebarModules = {
            "Dashboard": globalConfig.showDashboard,
            "Water Management": globalConfig.showWaterManagement,
            "Motors": globalConfig.showMotors,
            "DG Monitoring": globalConfig.showDGSet,
            "Setting Templates": globalConfig.showSettingTemplates,
            "Alarm System": globalConfig.showAlarms,
            "LT Panel": globalConfig.showLTPanel,
            "Transformer": globalConfig.showTransformers,
            "Fire": globalConfig.showFirePumps,
            "Ticketing": globalConfig.showTicketing,
            "Maintenance": globalConfig.showMaintenance,
            "Service History": globalConfig.showServiceHistory,
            "Daily DPR": globalConfig.showDailyDPR,
            "Energy Metering": globalConfig.showEnergyMetering,
          };
          localStorage.setItem('scada_modules_config', JSON.stringify(sidebarModules));
          localStorage.setItem('scada_submodules_config', JSON.stringify(globalConfig.submoduleVisibility || {}));
        } catch(e) {}
      }

      window.location.href = '/dashboard';
    }
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const isExpanded = !collapsed || sidebarHover;
  const sidebarWidth = isExpanded ? '270px' : '64px';
  const moduleHeader = MODULE_HEADER_CONFIG.find(({ match }) => match.test(pathname));
  const ModuleIcon = moduleHeader?.icon;
  const currentSite = selectedSite || activeSites?.[0] || null;

  return (
    <div className="scada-container">
      <Sidebar collapsed={collapsed} onClose={() => setCollapsed(true)} onOpen={() => setCollapsed(false)} onHoverChange={setSidebarHover} />
      <Header
        collapsed={collapsed}
        toggleSidebar={toggleSidebar}
        sidebarWidth={sidebarWidth}
        isImpersonating={isImpersonating}
        moduleHeader={moduleHeader}
        moduleIcon={ModuleIcon}
        activeSites={activeSites}
        selectedSite={currentSite}
        setSelectedSite={setSelectedSite}
      />

      <div 
        className={`scada-main-content w-100`}
        style={{
          marginLeft: sidebarWidth,
          marginTop: 0,
          paddingTop: isImpersonating ? '104px' : '68px',
          transition: 'margin-left 0.22s cubic-bezier(0.25, 0.1, 0.25, 1)'
        }}
      >
        {isImpersonating && (
          <div 
            className="bg-warning text-dark px-4 py-2 d-flex justify-content-between align-items-center position-fixed top-0 z-3 shadow-sm border-bottom border-warning"
            style={{
              left: sidebarWidth,
              right: 0,
              height: '40px',
              transition: 'left 0.22s cubic-bezier(0.25, 0.1, 0.25, 1)'
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span className="fw-bold tracking-widest uppercase fs-7">
                Verification Mode Active
              </span>
              <span className="ms-2 opacity-75 fs-7">
                Previewing as: {JSON.parse(localStorage.getItem('userData') || '{}')?.name}
              </span>
            </div>
            <button 
              className="btn btn-sm btn-dark fw-bold uppercase tracking-wider fs-8 px-3"
              onClick={handleExitVerification}
            >
              Exit Verification
            </button>
          </div>
        )}
        <main className={`px-2 px-md-3 pb-4 ${moduleHeader ? 'single-module-header-page' : ''}`}>
          {children}
        </main>
      </div>

      {/* Responsive: On mobile remove sidebar margin */}
      <style dangerouslySetInnerHTML={{ __html: `
        .single-module-header-page .page-context-banner { display: none !important; }
        @media (max-width: 992px) {
          .scada-main-content { margin-left: 0 !important; }
        }
      `}} />
    </div>
  );
};

export default MainLayout;

