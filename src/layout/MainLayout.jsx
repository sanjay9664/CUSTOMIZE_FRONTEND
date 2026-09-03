import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [sidebarHover, setSidebarHover] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);

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

  return (
    <div className="scada-container">
      <Sidebar collapsed={collapsed} onClose={() => setCollapsed(true)} onOpen={() => setCollapsed(false)} onHoverChange={setSidebarHover} />
      <div 
        className={`scada-main-content w-100`}
        style={{ marginLeft: (!collapsed || sidebarHover) ? '270px' : '62px', transition: 'margin-left 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        {isImpersonating && (
          <div className="bg-warning text-dark px-4 py-2 d-flex justify-content-between align-items-center position-sticky top-0 z-3 shadow-sm border-bottom border-warning">
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
        <Header collapsed={collapsed} toggleSidebar={toggleSidebar} />
        <main className="px-3 px-md-4 pb-5">
          {children}
        </main>
      </div>

      {/* Responsive: On mobile remove sidebar margin */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 992px) {
          .scada-main-content { margin-left: 0 !important; }
        }
      `}} />
    </div>
  );
};

export default MainLayout;

