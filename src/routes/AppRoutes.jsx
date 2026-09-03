import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Each screen is downloaded only after its route is opened.
const Dashboard = lazy(() => import('../pages/Dashboard'));
const WaterOverview = lazy(() => import('../pages/WaterManagement/Overview'));
const AgTank = lazy(() => import('../pages/WaterManagement/AgTank'));
const UgTank = lazy(() => import('../pages/WaterManagement/UgTank'));
const MotorsOverview = lazy(() => import('../pages/Motors/Overview'));
const DGSetOverview = lazy(() => import('../pages/DGSet/Overview'));
const AlarmOverview = lazy(() => import('../pages/AlarmSystem/Overview'));
const ActiveAlarms = lazy(() => import('../pages/AlarmSystem/Active'));
const AlarmConfig = lazy(() => import('../pages/AlarmSystem/AlarmConfig'));
const MessageTemplateSetting = lazy(() => import('../pages/AlarmSystem/MessageTemplateSetting'));
const LTRoom1 = lazy(() => import('../pages/LTPanel/LTRoom1'));
const LTRoom2 = lazy(() => import('../pages/LTPanel/LTRoom2'));
const LTRoom3 = lazy(() => import('../pages/LTPanel/LTRoom3'));
const LTOverview = lazy(() => import('../pages/LTPanel/Overview'));
const IncomingOutgoing = lazy(() => import('../pages/LTPanel/IncomingOutgoing'));
const BreakerStatus = lazy(() => import('../pages/LTPanel/BreakerStatus'));
const TransformerOverview = lazy(() => import('../pages/Transformer/Overview'));
const SettingsIndex = lazy(() => import('../pages/Settings/SettingsIndex'));
const ManageOrganisation = lazy(() => import('../pages/Settings/ManageOrganisation'));
const UserManagement = lazy(() => import('../pages/Admin/UserManagement'));
const AuditLogViewer = lazy(() => import('../pages/Admin/AuditLogViewer'));
const MaintenancePage = lazy(() => import('../pages/Maintenance/Index'));
const TicketingSystem = lazy(() => import('../pages/Ticketing/Index'));
const EnergyOverview = lazy(() => import('../pages/EnergyMetering/Overview'));
const EnergyMainMeter = lazy(() => import('../pages/EnergyMetering/MainMeter'));
const EnergySubMeters = lazy(() => import('../pages/EnergyMetering/SubMeters'));
const EnergyPDFReport = lazy(() => import('../pages/EnergyMetering/PDFReport'));
const EnergyGraphs = lazy(() => import('../pages/EnergyMetering/EnergyGraphs'));
const VRVOverview = lazy(() => import('../pages/VRV/Overview'));
const VRVControlPanel = lazy(() => import('../pages/VRV/ControlPanel'));
const VRVSchedule = lazy(() => import('../pages/VRV/Schedule'));
const VRVHumanSensor = lazy(() => import('../pages/VRV/HumanSensor'));
const VRVTempHumidity = lazy(() => import('../pages/VRV/TempHumidity'));
const AQIOverview = lazy(() => import('../pages/AQISensor/Overview'));
const Chiller = lazy(() => import('../pages/HVAC/Chiller'));
const AHU = lazy(() => import('../pages/HVAC/AHU'));
const CoolingTower = lazy(() => import('../pages/HVAC/CoolingTower'));
const ACOverview = lazy(() => import('../pages/AC/Overview'));
const ACScheduler = lazy(() => import('../pages/AC/ACScheduler'));
const FireOverview = lazy(() => import('../pages/FirePumps/Overview'));
const PumpStatus = lazy(() => import('../pages/FirePumps/PumpStatus'));
const HeaderPressure = lazy(() => import('../pages/FirePumps/HeaderPressure'));
const JockeyMain = lazy(() => import('../pages/FirePumps/JockeyMain'));

// Fallback for other routes until customized
const PlaceholderPage = ({ title }) => (
  <div className="fade-in">
    <div className="page-header">
      <div>
        <h2 className="mb-1">{title}</h2>
        <p className="text-muted">Detailed monitoring and controls for {title}</p>
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-outline-secondary btn-sm">Refresh Data</button>
        <button className="btn btn-info btn-sm">System Check</button>
      </div>
    </div>

    <div className="scada-card p-5 text-center mt-4">
      <div className="text-muted opacity-50 mb-3">
        <div className="display-4 font-monospace">DATA_STREAM_ACTIVE</div>
      </div>
      <h4>{title} Module</h4>
      <p>Continuous monitoring in progress. All sensors reporting normal operation.</p>
      <div className="d-flex justify-content-center gap-4 mt-4">
        <div className="text-center">
          <div className="h3 mb-0 text-success">98%</div>
          <small className="text-muted">Efficiency</small>
        </div>
        <div className="text-center border-start border-end px-4">
          <div className="h3 mb-0 text-info">24.5°C</div>
          <small className="text-muted">Amb. Temp</small>
        </div>
        <div className="text-center">
          <div className="h3 mb-0 text-warning">1.2kW</div>
          <small className="text-muted">Load</small>
        </div>
      </div>
    </div>
  </div>
);


import { useAuth } from '../context/AuthContext';

// Protected Route Guard for Role-based Access Control
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { hasRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<div className="d-flex justify-content-center align-items-center py-5"><div className="spinner-border text-info" role="status" /></div>}>
      <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Water Management */}
      <Route path="/water-management/overview" element={<WaterOverview />} />
      <Route path="/water-management/ag-pump" element={<AgTank />} />
      <Route path="/water-management/ug-pump" element={<UgTank />} />
      <Route path="/water-management/domestic" element={<PlaceholderPage title="Domestic / Flushing" />} />
      <Route path="/water-management/level" element={<PlaceholderPage title="OHT / UG Level Monitoring" />} />
      <Route path="/water-management/report" element={<PlaceholderPage title="Water Management PDF Reports" />} />

      {/* Motors */}
      <Route path="/motors/overview" element={<MotorsOverview />} />
      <Route path="/motors/room1" element={<PlaceholderPage title="Pump Room 1" />} />
      <Route path="/motors/room2" element={<PlaceholderPage title="Pump Room 2" />} />
      <Route path="/motors/status" element={<PlaceholderPage title="VFD / DOL Status" />} />
      <Route path="/motors/report" element={<PlaceholderPage title="Motors PDF Reports" />} />

      {/* DG Set */}
      <Route path="/dg-set/overview" element={<DGSetOverview />} />
      <Route path="/dg-set/dg1" element={<DGSetOverview />} />
      <Route path="/dg-set/dg2" element={<DGSetOverview />} />
      <Route path="/dg-set/dg3" element={<DGSetOverview />} />
      <Route path="/dg-set/fuel" element={<PlaceholderPage title="Fuel Level Monitoring" />} />
      <Route path="/dg-set/runtime" element={<PlaceholderPage title="Runtime / Diesel Consumption" />} />
      <Route path="/dg-set/report" element={<PlaceholderPage title="DG Set PDF Reports" />} />

      {/* Configuration Templates */}
      <Route path="/config/templates" element={<Navigate to="/dashboard" replace />} />

      {/* Alarm System */}
      <Route path="/alarm-system/overview" element={<AlarmOverview />} />
      <Route path="/alarm-system/active" element={<ActiveAlarms />} />
      <Route path="/alarm-system/config" element={<AlarmConfig />} />
      <Route path="/alarm-system/message-templates" element={<MessageTemplateSetting />} />
      <Route path="/alarm-system/inactive" element={<PlaceholderPage title="Inactive Alarms" />} />
      <Route path="/alarm-system/ack" element={<PlaceholderPage title="ACK (Acknowledge)" />} />
      <Route path="/alarm-system/history" element={<PlaceholderPage title="Alarm History" />} />
      <Route path="/alarm-system/report" element={<PlaceholderPage title="Alarm PDF Reports" />} />

      {/* LT Panel */}
      <Route path="/lt-panel/overview" element={<LTOverview />} />
      <Route path="/lt-panel/room1" element={<LTRoom1 />} />
      <Route path="/lt-panel/room2" element={<LTRoom2 />} />
      <Route path="/lt-panel/room3" element={<LTRoom3 />} />
      <Route path="/lt-panel/io" element={<IncomingOutgoing />} />
      <Route path="/lt-panel/breaker" element={<BreakerStatus />} />
      <Route path="/lt-panel/report" element={<PlaceholderPage title="LT Panel PDF Reports" />} />

      {/* Transformer */}
      <Route path="/transformer/overview" element={<TransformerOverview />} />
      <Route path="/transformer/t1" element={<PlaceholderPage title="Transformer-1" />} />
      <Route path="/transformer/t2" element={<PlaceholderPage title="Transformer-2" />} />
      <Route path="/transformer/load" element={<PlaceholderPage title="Load / Temperature Monitoring" />} />
      <Route path="/transformer/report" element={<PlaceholderPage title="Transformer PDF Reports" />} />

      {/* Settings & User Administration */}
      <Route path="/global-settings" element={<SettingsIndex />} />
      <Route path="/settings" element={<SettingsIndex />} />
      <Route path="/settings/users" element={<SettingsIndex />} />
      <Route path="/settings/sites" element={<SettingsIndex />} />
      <Route path="/manage-organisation" element={<ManageOrganisation />} />
      <Route path="/settings/manage-organisation" element={<ManageOrganisation />} />

      {/* Super Admin Routes */}
      <Route path="/super-admin" element={<Navigate to="/dashboard" replace />} />

      {/* Admin Routes with Declarative Role Guard */}
      <Route 
        path="/admin/manage-users" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'SUPERADMIN']}>
            <UserManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/audit-logs" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'SUPERADMIN']}>
            <AuditLogViewer />
          </ProtectedRoute>
        } 
      />

      {/* Maintenance & Service History */}
      <Route path="/maintenance" element={<MaintenancePage />} />
      <Route path="/maintenance/scheduled" element={<MaintenancePage />} />
      <Route path="/maintenance/pending" element={<MaintenancePage />} />
      <Route path="/maintenance/report" element={<MaintenancePage />} />
      <Route path="/service" element={<MaintenancePage />} />
      <Route path="/service/equipment" element={<MaintenancePage />} />
      <Route path="/service/records" element={<MaintenancePage />} />
      <Route path="/service/report" element={<MaintenancePage />} />

      {/* Ticketing */}
      <Route path="/ticketing" element={<TicketingSystem />} />

      {/* Energy Metering */}
      <Route path="/energy-metering/overview" element={<EnergyOverview />} />
      <Route path="/energy-metering/main" element={<EnergyMainMeter />} />
      <Route path="/energy-metering/sub" element={<EnergySubMeters />} />
      <Route path="/energy-metering/graphs" element={<EnergyGraphs />} />
      <Route path="/energy-metering/report" element={<EnergyPDFReport />} />

      {/* VRV*/}
      <Route path="/VRV/overview" element={<VRVOverview />} />
      <Route path="/VRV/control" element={<VRVControlPanel />} />
      <Route path="/VRV/schedule" element={<VRVSchedule />} />
      <Route path="/VRV/human-sensor" element={<VRVHumanSensor />} />
      
      {/* AQI Sensor */}
      <Route path="/aqi-sensor/overview" element={<AQIOverview />} />
      <Route path="/aqi-sensor/temp-humidity" element={<VRVTempHumidity />} />

      {/* HVAC */}
      <Route path="/hvac/chiller" element={<Chiller />} />
      <Route path="/hvac/ahu" element={<AHU />} />
      <Route path="/hvac/cooling-tower" element={<CoolingTower />} />
      <Route path="/hvac/report" element={<PlaceholderPage title="HVAC PDF Reports" />} />

      {/* AC */}
      <Route path="/ac/overview" element={<ACOverview />} />
      <Route path="/ac/schedule" element={<ACScheduler />} />
      <Route path="/ac/report" element={<PlaceholderPage title="AC PDF Reports" />} />

      {/* Fire */}
      <Route path="/fire-pumps/overview" element={<FireOverview />} />
      <Route path="/fire-pumps/status" element={<PumpStatus />} />
      <Route path="/fire-pumps/pressure" element={<HeaderPressure />} />
      <Route path="/fire-pumps/jockey" element={<JockeyMain />} />
      <Route path="/fire-pumps/report" element={<PlaceholderPage title="Fire Pumps PDF Reports" />} />

      {/* Catch-all */}
      <Route path="*" element={<PlaceholderPage title="Module Under Calibration" />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
