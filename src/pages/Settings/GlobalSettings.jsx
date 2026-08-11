import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Toast, ToastContainer } from 'react-bootstrap';
import {
  ShieldCheck, Settings, Eye, EyeOff, Save, RotateCcw,
  LayoutDashboard, Droplets, Activity, Database, Bell, Zap,
  ShieldAlert, ClipboardList, PenTool, History, Gauge, Wind, Thermometer
} from 'lucide-react';

const ALL_MODULES = [
  { key: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, subItems: [] },
  { key: 'Water Management', label: 'Water Management', icon: <Droplets size={18} />, subItems: ['Overview', 'AG TANK', 'UG TANK'], configKey: 'showWaterManagement' },
  { key: 'Motors', label: 'Motors', icon: <Activity size={18} />, subItems: ['Overview', 'Pump Room 1', 'Pump Room 2', 'VFD / DOL Status', 'PDF Report'], configKey: 'showMotors' },
  { key: 'DG Set', label: 'DG Set', icon: <Database size={18} />, subItems: ['Overview', 'DG Set-1', 'DG Set-2', 'DG Set-3'], configKey: 'showDGSet' },
  { key: 'Setting Templates', label: 'Setting Templates', icon: <Settings size={18} />, subItems: [] },
  { key: 'Alarm System', label: 'Alarm System', icon: <Bell size={18} />, subItems: ['Overview', 'Active Alarms', 'Inactive Alarms', 'ACK (Acknowledge)', 'Alarm History', 'PDF Report'], configKey: 'showAlarms' },
  { key: 'LT Panel', label: 'LT Panel', icon: <LayoutDashboard size={18} />, subItems: ['Overview', 'LT Room-1', 'LT Room-2', 'LT Room-3', 'Incoming / Outgoing', 'Breaker Status', 'PDF Report'], configKey: 'showLTPanel' },
  { key: 'Transformer', label: 'Transformer', icon: <Zap size={18} />, subItems: ['Overview', 'Transformer-1', 'Transformer-2', 'Load / Temp', 'PDF Report'], configKey: 'showTransformers' },
  { key: 'Fire', label: 'Fire', icon: <ShieldAlert size={18} />, subItems: ['Overview', 'Pump Status', 'Header Pressure', 'Jockey / Main', 'PDF Report'], configKey: 'showFirePumps' },
  { key: 'Ticketing', label: 'Ticketing', icon: <ClipboardList size={18} />, subItems: [] },
  { key: 'Maintenance', label: 'Maintenance', icon: <PenTool size={18} />, subItems: ['Scheduled', 'Pending Tasks', 'PDF Report'], configKey: 'showMaintenance' },
  { key: 'Service History', label: 'Service History', icon: <History size={18} />, subItems: ['Equipment-wise', 'Service Records', 'PDF Report'], configKey: 'showServiceHistory' },
  { key: 'Daily DPR', label: 'Daily DPR', icon: <Gauge size={18} />, subItems: ['Data Aggregation', 'Daily Logs', 'PDF Report'], configKey: 'showDailyDPR' },
  { key: 'Energy Metering', label: 'Energy Metering', icon: <Zap size={18} />, subItems: ['Overview', 'Main Meter', 'Sub Meters', 'Graphs', 'PDF Report'], configKey: 'showEnergyMetering' },
  { key: 'VRV', label: 'VRV', icon: <Wind size={18} />, subItems: [] },
  { key: 'AQI Sensor', label: 'AQI Sensor', icon: <Wind size={18} />, subItems: ['Overview', 'Temp & Humidity', 'PDF Report'], configKey: 'showAQISensor' },
  { key: 'HVAC', label: 'HVAC', icon: <Thermometer size={18} />, subItems: ['Chiller', 'AHU', 'Cooling Tower', 'PDF Report'], configKey: 'showHVAC' },
  { key: 'AC', label: 'AC', icon: <Wind size={18} />, subItems: ['Overview', 'PDF Report'], configKey: 'showAC' },
];

const GlobalSettings = () => {
  const [modulesState, setModulesState] = useState(() => {
    const saved = localStorage.getItem('scada_modules_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Default all 18 modules enabled matching user screenshot
    return {
      "Dashboard": true,
      "Water Management": true,
      "Motors": true,
      "DG Set": true,
      "Setting Templates": true,
      "Alarm System": true,
      "LT Panel": true,
      "Transformer": true,
      "Fire": true,
      "Ticketing": true,
      "Maintenance": true,
      "Service History": true,
      "Daily DPR": true,
      "Energy Metering": true,
      "VRV": true,
      "AQI Sensor": true,
      "HVAC": true,
      "AC": true,
    };
  });

  const [submodulesState, setSubmodulesState] = useState(() => {
    const saved = localStorage.getItem('scada_submodules_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      showWaterManagement: { Overview: true, 'AG TANK': true, 'UG TANK': true },
      showMotors: { Overview: true, 'Pump Room 1': true, 'Pump Room 2': true, 'VFD / DOL Status': true, 'PDF Report': true },
      showDGSet: { Overview: true, 'DG Set-1': true, 'DG Set-2': true, 'DG Set-3': true },
      showAlarms: { Overview: true, 'Active Alarms': true, 'Inactive Alarms': true, 'ACK (Acknowledge)': true, 'Alarm History': true, 'PDF Report': true },
      showLTPanel: { Overview: true, 'LT Room-1': true, 'LT Room-2': true, 'LT Room-3': true, 'Incoming / Outgoing': true, 'Breaker Status': true, 'PDF Report': true },
      showTransformers: { Overview: true, 'Transformer-1': true, 'Transformer-2': true, 'Load / Temp': true, 'PDF Report': true },
      showFirePumps: { Overview: true, 'Pump Status': true, 'Header Pressure': true, 'Jockey / Main': true, 'PDF Report': true },
      showMaintenance: { Scheduled: true, 'Pending Tasks': true, 'PDF Report': true },
      showServiceHistory: { 'Equipment-wise': true, 'Service Records': true, 'PDF Report': true },
      showDailyDPR: { 'Data Aggregation': true, 'Daily Logs': true, 'PDF Report': true },
      showEnergyMetering: { Overview: true, 'Main Meter': true, 'Sub Meters': true, Graphs: true, 'PDF Report': true },
      showAQISensor: { Overview: true, 'Temp & Humidity': true, 'PDF Report': true },
      showHVAC: { Chiller: true, AHU: true, 'Cooling Tower': true, 'PDF Report': true },
      showAC: { Overview: true, 'PDF Report': true }
    };
  });

  const [showToast, setShowToast] = useState(false);

  const handleToggleModule = (moduleKey) => {
    setModulesState(prev => {
      const updated = { ...prev, [moduleKey]: !prev[moduleKey] };
      localStorage.setItem('scada_modules_config', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage-update'));
      return updated;
    });
  };

  const handleToggleSubmodule = (configKey, subItem) => {
    if (!configKey) return;
    setSubmodulesState(prev => {
      const currentModuleSubs = prev[configKey] || {};
      const updatedModuleSubs = {
        ...currentModuleSubs,
        [subItem]: currentModuleSubs[subItem] !== false ? false : true
      };
      const updated = {
        ...prev,
        [configKey]: updatedModuleSubs
      };
      localStorage.setItem('scada_submodules_config', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage-update'));
      return updated;
    });
  };

  const handleSave = () => {
    localStorage.setItem('scada_modules_config', JSON.stringify(modulesState));
    localStorage.setItem('scada_submodules_config', JSON.stringify(submodulesState));
    window.dispatchEvent(new Event('storage-update'));
    setShowToast(true);
  };

  return (
    <Container fluid className="global-settings-wrapper py-4 px-lg-4" style={{ backgroundColor: '#070605', minHeight: '100vh', color: '#fff' }}>
      <style>{`
        body.light-mode .global-settings-wrapper {
          background-color: var(--scada-bg, #e2e8f0) !important;
          color: #0f172a !important;
        }
        body.light-mode .global-settings-card {
          background-color: #ffffff !important;
          border: 1.5px solid #0284c7 !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
        }
        body.light-mode .module-card-box {
          background-color: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
        }
        body.light-mode .module-card-title {
          color: #0f172a !important;
          font-weight: 700 !important;
        }
        body.light-mode .submodule-pill-badge {
          background-color: rgba(2, 132, 199, 0.12) !important;
          border-color: #0284c7 !important;
          color: #0284c7 !important;
        }
      `}</style>
      {/* Toast Notification */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg="dark" className="border border-info text-white">
          <Toast.Header closeButton={false} className="bg-dark text-info border-bottom border-secondary">
            <ShieldCheck size={16} className="me-2" />
            <strong className="me-auto">Global Settings</strong>
            <small>Just now</small>
          </Toast.Header>
          <Toast.Body className="small">Configuration saved and synchronized across the application!</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Main Outer Dark Container matching Sidebar Theme */}
      <div 
        className="p-4 rounded-4 position-relative global-settings-card"
        style={{
          backgroundColor: '#070a0f',
          border: '1px solid #00bfff',
          boxShadow: '0 0 25px rgba(0, 191, 255, 0.2)'
        }}
      >
        {/* Outer Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-2">
            <ShieldCheck size={22} style={{ color: '#00bfff' }} />
            <h5 
              className="mb-0 fw-bold uppercase tracking-wider" 
              style={{ color: '#00bfff', letterSpacing: '1px', fontSize: '1.1rem' }}
            >
              Application Module Control
            </h5>
          </div>

          <Button 
            onClick={handleSave} 
            className="d-flex align-items-center gap-2 rounded-pill px-4 py-2 fw-bold border-0 btn-save-global"
            style={{ background: 'linear-gradient(135deg, #0284c7 0%, #00bfff 100%)', color: '#fff', fontSize: '0.85rem', boxShadow: '0 4px 14px rgba(0, 191, 255, 0.4)' }}
          >
            <Save size={16} /> SAVE GLOBAL CONFIG
          </Button>
        </div>

        {/* 4-Column Grid of Module Cards */}
        <Row className="g-3">
          {ALL_MODULES.map((mod) => {
            const isEnabled = !!modulesState[mod.key];
            const subVisibility = mod.configKey ? (submodulesState[mod.configKey] || {}) : {};

            return (
              <Col key={mod.key} xl={3} lg={4} md={6} sm={12}>
                <div
                  className="p-3 rounded-4 h-100 transition-all d-flex flex-column justify-content-between module-card-box"
                  style={{
                    backgroundColor: isEnabled ? '#090d16' : '#11141d',
                    border: isEnabled ? '1.5px solid #1e293b' : '1px solid #161e2e',
                    boxShadow: isEnabled ? '0 4px 12px rgba(0,0,0,0.4)' : 'none'
                  }}
                >
                  {/* Card Header Row */}
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-3">
                      {/* Icon Circle */}
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: 38,
                          height: 38,
                          backgroundColor: isEnabled ? '#0284c7' : '#27272a',
                          color: isEnabled ? '#ffffff' : '#71717a'
                        }}
                      >
                        {mod.icon}
                      </div>

                      {/* Module Title */}
                      <span 
                        className="fw-bold module-card-title"
                        style={{
                          color: isEnabled ? '#ffffff' : '#a1a1aa',
                          fontSize: '0.92rem'
                        }}
                      >
                        {mod.label}
                      </span>
                    </div>

                    {/* Switch Toggle */}
                    <div 
                      onClick={() => handleToggleModule(mod.key)}
                      style={{
                        width: 48,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: isEnabled ? '#00bfff' : '#3f3f46',
                        padding: 3,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      className="d-flex align-items-center"
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          transform: isEnabled ? 'translateX(22px)' : 'translateX(0px)',
                          transition: 'transform 0.2s ease-in-out',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Submodules Badges (If enabled and has sub-items) */}
                  {isEnabled && mod.subItems && mod.subItems.length > 0 && (
                    <div className="pt-2 mt-2 border-top border-secondary border-opacity-25 d-flex flex-wrap gap-2">
                      {mod.subItems.map((sub) => {
                        const isSubVisible = subVisibility[sub] !== false;
                        return (
                          <button
                            key={sub}
                            onClick={() => handleToggleSubmodule(mod.configKey, sub)}
                            className="btn p-0 border-0 text-start"
                          >
                            <span
                              className="d-inline-flex align-items-center gap-1 rounded-pill px-2 py-1"
                              style={{
                                fontSize: '0.73rem',
                                backgroundColor: isSubVisible ? 'rgba(2, 132, 199, 0.15)' : 'rgba(39, 39, 42, 0.4)',
                                border: isSubVisible ? '1px solid #0284c7' : '1px solid #3f3f46',
                                color: isSubVisible ? '#38bdf8' : '#71717a',
                                cursor: 'pointer'
                              }}
                            >
                              {isSubVisible ? <Eye size={11} /> : <EyeOff size={11} />}
                              {sub}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Col>
            );
          })}
        </Row>
      </div>
    </Container>
  );
};

export default GlobalSettings;
