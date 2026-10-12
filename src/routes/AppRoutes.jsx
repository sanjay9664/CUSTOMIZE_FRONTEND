import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Each screen is downloaded only after its route is opened.
const Dashboard = lazy(() => import('../pages/Dashboard'));
const WaterOverview = lazy(() => import('../pages/WaterManagement/Overview'));
const AgTank = lazy(() => import('../pages/WaterManagement/AgTank'));
const UgTank = lazy(() => import('../pages/WaterManagement/UgTank'));
const WaterReport = lazy(() => import('../pages/WaterManagement/WaterReport'));
const MotorsOverview = lazy(() => import('../pages/Motors/Overview'));
const MotorReport = lazy(() => import('../pages/Motors/MotorReport'));
const DGSetOverview = lazy(() => import('../pages/DGSet/Overview'));
const DGReport = lazy(() => import('../pages/DGSet/DGReport'));
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
const AssetManagement = lazy(() => import('../pages/Settings/AssetManagement'));
const DeviceManagement = lazy(() => import('../pages/Settings/DeviceManagement'));
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
const AQIGraphs = lazy(() => import('../pages/AQISensor/Graphs'));
const AQIReports = lazy(() => import('../pages/AQISensor/Reports'));
const Chiller = lazy(() => import('../pages/HVAC/Chiller'));
const AHU = lazy(() => import('../pages/HVAC/AHU'));
const CoolingTower = lazy(() => import('../pages/HVAC/CoolingTower'));
const ACOverview = lazy(() => import('../pages/AC/Overview'));
const ACScheduler = lazy(() => import('../pages/AC/ACScheduler'));
const FireOverview = lazy(() => import('../pages/FirePumps/Overview'));
const PumpStatus = lazy(() => import('../pages/FirePumps/PumpStatus'));
const HeaderPressure = lazy(() => import('../pages/FirePumps/HeaderPressure'));
const JockeyMain = lazy(() => import('../pages/FirePumps/JockeyMain'));
const HelpFeedback = lazy(() => import('../pages/Help/Feedback'));
const PolicyCondition = lazy(() => import('../pages/Help/PolicyCondition'));

// Query-preserving redirect helper for legacy routes
const QueryPreservingRedirect = ({ to }) => {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}${location.hash}`} replace />;
};

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


import { useAuth } from '../hooks/useAuth';
import { getDefaultLandingRoute } from '../utils/rbac';

// Protected Route Guard for Role-based Access Control & Permission Guarding
const ProtectedRoute = ({ allowedRoles, requiredPermission, requiredFeature, children }) => {
  const { hasRole, hasPermission, hasFeature, isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If no permission, role, or feature constraint is set, PERMIT TO ALL
  if (!allowedRoles && !requiredPermission && !requiredFeature) {
    return children;
  }

  const fallback = getDefaultLandingRoute(user);

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to={fallback} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission, requiredFeature)) {
    return <Navigate to={fallback} replace />;
  }

  if (requiredFeature && !hasFeature(requiredFeature)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
};

// Automatic landing redirect based on user's assigned permissions
const DefaultLandingRedirect = () => {
  const { user } = useAuth();
  const target = getDefaultLandingRoute(user);
  return <Navigate to={target} replace />;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<div className="d-flex justify-content-center align-items-center py-5"><div className="spinner-border text-info" role="status" /></div>}>
      <Routes>
      <Route path="/" element={<DefaultLandingRedirect />} />
      <Route path="/dashboard" element={<ProtectedRoute requiredPermission="dashboard:read"><Dashboard /></ProtectedRoute>} />

      {/* Water Management */}
      <Route path="/water-management/overview" element={<ProtectedRoute requiredPermission="water:read"><WaterOverview /></ProtectedRoute>} />
      <Route path="/water-management/ag-pump" element={<ProtectedRoute requiredPermission="water:read"><AgTank /></ProtectedRoute>} />
      <Route path="/water-management/ag-tank" element={<ProtectedRoute requiredPermission="water:read"><AgTank /></ProtectedRoute>} />
      <Route path="/water-management/ug-pump" element={<ProtectedRoute requiredPermission="water:read"><UgTank /></ProtectedRoute>} />
      <Route path="/water-management/domestic" element={<ProtectedRoute requiredPermission="water:read"><PlaceholderPage title="Domestic / Flushing" /></ProtectedRoute>} />
      <Route path="/water-management/level" element={<ProtectedRoute requiredPermission="water:read"><PlaceholderPage title="OHT / UG Level Monitoring" /></ProtectedRoute>} />
      <Route path="/water-management/report" element={<ProtectedRoute requiredPermission={['water:read', 'report:read']}><WaterReport /></ProtectedRoute>} />

      {/* Motors */}
      <Route path="/motors/overview" element={<ProtectedRoute requiredPermission="motor:read"><MotorsOverview /></ProtectedRoute>} />
      <Route path="/motors/room1" element={<ProtectedRoute requiredPermission="motor:read"><PlaceholderPage title="Pump Room 1" /></ProtectedRoute>} />
      <Route path="/motors/room2" element={<ProtectedRoute requiredPermission="motor:read"><PlaceholderPage title="Pump Room 2" /></ProtectedRoute>} />
      <Route path="/motors/status" element={<ProtectedRoute requiredPermission="motor:read"><PlaceholderPage title="VFD / DOL Status" /></ProtectedRoute>} />
      <Route path="/motors/report" element={<ProtectedRoute requiredPermission={['motor:read', 'report:read']}><MotorReport /></ProtectedRoute>} />

      {/* DG Set */}
      <Route path="/dg-set/overview" element={<ProtectedRoute requiredPermission="dg:read"><DGSetOverview /></ProtectedRoute>} />
      <Route path="/dg-set/device/:deviceId" element={<ProtectedRoute requiredPermission="dg:read"><DGSetOverview /></ProtectedRoute>} />
      {/* Legacy routes for backward compatibility */}
      <Route path="/dg-set/dg1" element={<ProtectedRoute requiredPermission="dg:read"><DGSetOverview /></ProtectedRoute>} />
      <Route path="/dg-set/dg2" element={<ProtectedRoute requiredPermission="dg:read"><DGSetOverview /></ProtectedRoute>} />
      <Route path="/dg-set/dg3" element={<ProtectedRoute requiredPermission="dg:read"><DGSetOverview /></ProtectedRoute>} />
      <Route path="/dg-set/fuel" element={<ProtectedRoute requiredPermission="dg:read"><PlaceholderPage title="Fuel Level Monitoring" /></ProtectedRoute>} />
      <Route path="/dg-set/runtime" element={<ProtectedRoute requiredPermission="dg:read"><PlaceholderPage title="Runtime / Diesel Consumption" /></ProtectedRoute>} />
      <Route path="/dg-set/report" element={<ProtectedRoute requiredPermission={['dg:read', 'report:read']}><DGReport /></ProtectedRoute>} />

      {/* Configuration Templates */}
      <Route path="/config/templates" element={<DefaultLandingRedirect />} />

      {/* Alarm System */}
      <Route path="/alarm-system/overview" element={<ProtectedRoute requiredPermission="alarm:read"><AlarmOverview /></ProtectedRoute>} />
      <Route path="/alarm-system/active" element={<ProtectedRoute requiredPermission="alarm:read"><ActiveAlarms /></ProtectedRoute>} />
      <Route path="/alarm-system/config" element={<ProtectedRoute requiredPermission="alarm:write"><AlarmConfig /></ProtectedRoute>} />
      <Route path="/alarm-system/message-templates" element={<ProtectedRoute requiredPermission="alarm:write"><MessageTemplateSetting /></ProtectedRoute>} />
      <Route path="/alarm-system/inactive" element={<ProtectedRoute requiredPermission="alarm:read"><PlaceholderPage title="Inactive Alarms" /></ProtectedRoute>} />
      <Route path="/alarm-system/ack" element={<ProtectedRoute requiredPermission="alarm:ack"><PlaceholderPage title="ACK (Acknowledge)" /></ProtectedRoute>} />
      <Route path="/alarm-system/history" element={<ProtectedRoute requiredPermission="alarm:read"><PlaceholderPage title="Alarm History" /></ProtectedRoute>} />
      <Route path="/alarm-system/report" element={<ProtectedRoute requiredPermission={['alarm:read', 'report:read']}><PlaceholderPage title="Alarm PDF Reports" /></ProtectedRoute>} />

      {/* LT Panel */}
      <Route path="/lt-panel/overview" element={<ProtectedRoute requiredPermission="ltpanel:read"><LTOverview /></ProtectedRoute>} />
      <Route path="/lt-panel/room1" element={<ProtectedRoute requiredPermission="ltpanel:read"><LTRoom1 /></ProtectedRoute>} />
      <Route path="/lt-panel/room2" element={<ProtectedRoute requiredPermission="ltpanel:read"><LTRoom2 /></ProtectedRoute>} />
      <Route path="/lt-panel/room3" element={<ProtectedRoute requiredPermission="ltpanel:read"><LTRoom3 /></ProtectedRoute>} />
      <Route path="/lt-panel/io" element={<ProtectedRoute requiredPermission="ltpanel:read"><IncomingOutgoing /></ProtectedRoute>} />
      <Route path="/lt-panel/breaker" element={<ProtectedRoute requiredPermission="ltpanel:read"><BreakerStatus /></ProtectedRoute>} />
      <Route path="/lt-panel/report" element={<ProtectedRoute requiredPermission={['ltpanel:read', 'report:read']}><PlaceholderPage title="LT Panel PDF Reports" /></ProtectedRoute>} />

      {/* Transformer */}
      <Route path="/transformer/overview" element={<ProtectedRoute requiredPermission="transformer:read"><TransformerOverview /></ProtectedRoute>} />
      <Route path="/transformer/t1" element={<ProtectedRoute requiredPermission="transformer:read"><PlaceholderPage title="Transformer-1" /></ProtectedRoute>} />
      <Route path="/transformer/t2" element={<ProtectedRoute requiredPermission="transformer:read"><PlaceholderPage title="Transformer-2" /></ProtectedRoute>} />
      <Route path="/transformer/load" element={<ProtectedRoute requiredPermission="transformer:read"><PlaceholderPage title="Load / Temperature Monitoring" /></ProtectedRoute>} />
      <Route path="/transformer/report" element={<ProtectedRoute requiredPermission={['transformer:read', 'report:read']}><PlaceholderPage title="Transformer PDF Reports" /></ProtectedRoute>} />

      {/* Settings & User Administration */}
      <Route path="/global-settings" element={<ProtectedRoute requiredPermission={['settings:read', 'site:read', 'device:read', 'role:manage', 'asset:read']}><SettingsIndex /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute requiredPermission={['settings:read', 'site:read', 'device:read', 'role:manage', 'asset:read']}><SettingsIndex /></ProtectedRoute>} />
      <Route path="/settings/users" element={<ProtectedRoute requiredPermission="user:read"><Navigate to="/settings?tab=users" replace /></ProtectedRoute>} />
      <Route path="/settings/sites" element={<ProtectedRoute requiredPermission={['settings:read', 'site:read']}><SettingsIndex /></ProtectedRoute>} />
      <Route path="/settings/assets" element={<ProtectedRoute requiredPermission={['asset:read', 'site:read', 'location:read']}><AssetManagement /></ProtectedRoute>} />
      <Route path="/asset-management" element={<ProtectedRoute requiredPermission={['asset:read', 'site:read', 'location:read']}><AssetManagement /></ProtectedRoute>} />
      <Route path="/settings/devices" element={<ProtectedRoute requiredPermission="device:read"><DeviceManagement /></ProtectedRoute>} />
      <Route path="/device-management" element={<ProtectedRoute requiredPermission="device:read"><DeviceManagement /></ProtectedRoute>} />
      <Route path="/manage-organisation" element={<ProtectedRoute requiredPermission={['organization:read', 'site:read', 'device:read', 'asset:read', 'location:read', 'settings:read']}><ManageOrganisation /></ProtectedRoute>} />
      <Route path="/settings/manage-organisation" element={<ProtectedRoute requiredPermission={['organization:read', 'site:read', 'device:read', 'asset:read', 'location:read', 'settings:read']}><ManageOrganisation /></ProtectedRoute>} />

      {/* Super Admin Routes */}
      <Route path="/super-admin" element={<DefaultLandingRedirect />} />

      {/* User Settings & Audit Logs */}
      <Route path="/admin/manage-users" element={<ProtectedRoute requiredPermission="user:read"><UserManagement /></ProtectedRoute>} />
      <Route path="/admin/audit-logs" element={<ProtectedRoute requiredPermission="audit:read"><AuditLogViewer /></ProtectedRoute>} />
      <Route path="/audit-logs" element={<ProtectedRoute requiredPermission="audit:read"><AuditLogViewer /></ProtectedRoute>} />
      <Route path="/audit-logs/*" element={<ProtectedRoute requiredPermission="audit:read"><AuditLogViewer /></ProtectedRoute>} />

      {/* Maintenance & Service History */}
      <Route path="/maintenance" element={<ProtectedRoute requiredPermission="maintenance:read"><MaintenancePage /></ProtectedRoute>} />
      <Route path="/maintenance/scheduled" element={<ProtectedRoute requiredPermission="maintenance:read"><MaintenancePage /></ProtectedRoute>} />
      <Route path="/maintenance/pending" element={<ProtectedRoute requiredPermission="maintenance:read"><MaintenancePage /></ProtectedRoute>} />
      <Route path="/maintenance/report" element={<ProtectedRoute requiredPermission={['maintenance:read', 'report:read']}><MaintenancePage /></ProtectedRoute>} />
      <Route path="/service" element={<ProtectedRoute requiredPermission="service:read"><MaintenancePage /></ProtectedRoute>} />
      <Route path="/service/equipment" element={<ProtectedRoute requiredPermission="service:read"><MaintenancePage /></ProtectedRoute>} />
      <Route path="/service/records" element={<ProtectedRoute requiredPermission="service:read"><MaintenancePage /></ProtectedRoute>} />
      <Route path="/service/report" element={<ProtectedRoute requiredPermission={['service:read', 'report:read']}><MaintenancePage /></ProtectedRoute>} />

      {/* Ticketing */}
      <Route path="/ticketing" element={<ProtectedRoute requiredPermission="ticket:read"><TicketingSystem /></ProtectedRoute>} />

      {/* Energy Metering & Battery Backup (UPS) */}
      <Route path="/energy-metering/overview" element={<ProtectedRoute requiredPermission="energy:read"><EnergyOverview /></ProtectedRoute>} />
      <Route path="/energy-metering/main" element={<ProtectedRoute requiredPermission="energy:read"><EnergyMainMeter /></ProtectedRoute>} />
      <Route path="/energy-metering/sub" element={<ProtectedRoute requiredPermission="energy:read"><EnergySubMeters /></ProtectedRoute>} />
      <Route path="/energy-metering/graphs" element={<ProtectedRoute requiredPermission="energy:read"><EnergyGraphs /></ProtectedRoute>} />
      <Route path="/energy-metering/report" element={<ProtectedRoute requiredPermission={['energy:read', 'report:read']}><EnergyPDFReport /></ProtectedRoute>} />

      {/* Daily DPR */}
      <Route path="/daily-dpr" element={<ProtectedRoute requiredPermission="dpr:read"><EnergyOverview /></ProtectedRoute>} />
      <Route path="/daily-dpr/overview" element={<ProtectedRoute requiredPermission="dpr:read"><EnergyOverview /></ProtectedRoute>} />
      <Route path="/daily-dpr/aggregation" element={<ProtectedRoute requiredPermission="dpr:read"><EnergyOverview /></ProtectedRoute>} />
      <Route path="/daily-dpr/logs" element={<ProtectedRoute requiredPermission="dpr:read"><EnergyOverview /></ProtectedRoute>} />
      <Route path="/daily-dpr/report" element={<ProtectedRoute requiredPermission={['dpr:read', 'report:read']}><EnergyOverview /></ProtectedRoute>} />
      <Route path="/dpr" element={<ProtectedRoute requiredPermission="dpr:read"><EnergyOverview /></ProtectedRoute>} />
      <Route path="/dpr/aggregation" element={<ProtectedRoute requiredPermission="dpr:read"><EnergyOverview /></ProtectedRoute>} />
      <Route path="/dpr/logs" element={<ProtectedRoute requiredPermission="dpr:read"><EnergyOverview /></ProtectedRoute>} />
      <Route path="/dpr/report" element={<ProtectedRoute requiredPermission={['dpr:read', 'report:read']}><EnergyOverview /></ProtectedRoute>} />

      {/* VRV*/}
      <Route path="/VRV/overview" element={<ProtectedRoute requiredPermission="hvac:read"><VRVOverview /></ProtectedRoute>} />
      <Route path="/VRV/control" element={<ProtectedRoute requiredPermission="hvac:write"><VRVControlPanel /></ProtectedRoute>} />
      <Route path="/VRV/schedule" element={<ProtectedRoute requiredPermission="hvac:read"><VRVSchedule /></ProtectedRoute>} />
      <Route path="/VRV/human-sensor" element={<ProtectedRoute requiredPermission="hvac:read"><VRVHumanSensor /></ProtectedRoute>} />
      
      {/* AQI Sensor */}
      <Route path="/aqi-sensor/overview" element={<ProtectedRoute requiredPermission="aqi:read"><AQIOverview /></ProtectedRoute>} />
      <Route path="/aqi-sensor/graphs" element={<ProtectedRoute requiredPermission="aqi:read"><AQIGraphs /></ProtectedRoute>} />
      <Route path="/aqi-sensor/reports" element={<ProtectedRoute requiredPermission={['aqi:read', 'report:read']}><AQIReports /></ProtectedRoute>} />
      <Route path="/aqi-sensor/temp-humidity" element={<QueryPreservingRedirect to="/aqi-sensor/graphs" />} />
      <Route path="/aqi-sensor/report" element={<QueryPreservingRedirect to="/aqi-sensor/reports" />} />

      {/* HVAC */}
      <Route path="/hvac/chiller" element={<ProtectedRoute requiredPermission="hvac:read"><Chiller /></ProtectedRoute>} />
      <Route path="/hvac/ahu" element={<ProtectedRoute requiredPermission="hvac:read"><AHU /></ProtectedRoute>} />
      <Route path="/ahu" element={<ProtectedRoute requiredPermission="hvac:read"><AHU /></ProtectedRoute>} />
      <Route path="/hvac/cooling-tower" element={<ProtectedRoute requiredPermission="hvac:read"><CoolingTower /></ProtectedRoute>} />
      <Route path="/cooling-tower" element={<ProtectedRoute requiredPermission="hvac:read"><CoolingTower /></ProtectedRoute>} />
      <Route path="/hvac/report" element={<ProtectedRoute requiredPermission={['hvac:read', 'report:read']}><PlaceholderPage title="HVAC PDF Reports" /></ProtectedRoute>} />

      {/* AC */}
      <Route path="/ac/overview" element={<ProtectedRoute requiredPermission="hvac:read"><ACOverview /></ProtectedRoute>} />
      <Route path="/ac/schedule" element={<ProtectedRoute requiredPermission="hvac:read"><ACScheduler /></ProtectedRoute>} />
      <Route path="/ac/report" element={<ProtectedRoute requiredPermission={['hvac:read', 'report:read']}><PlaceholderPage title="AC PDF Reports" /></ProtectedRoute>} />

      {/* ACMS / Fire & Life Safety Systems */}
      <Route path="/acms" element={<Navigate to="/fire-pumps/overview" replace />} />
      <Route path="/acms/overview" element={<ProtectedRoute requiredPermission="fire:read"><FireOverview /></ProtectedRoute>} />
      <Route path="/fire-pumps/overview" element={<ProtectedRoute requiredPermission="fire:read"><FireOverview /></ProtectedRoute>} />
      <Route path="/fire-pumps/status" element={<ProtectedRoute requiredPermission="fire:read"><PumpStatus /></ProtectedRoute>} />
      <Route path="/fire-pumps/pressure" element={<ProtectedRoute requiredPermission="fire:read"><HeaderPressure /></ProtectedRoute>} />
      <Route path="/fire-pumps/jockey" element={<ProtectedRoute requiredPermission="fire:read"><JockeyMain /></ProtectedRoute>} />
      <Route path="/fire-pumps/report" element={<ProtectedRoute requiredPermission={['fire:read', 'report:read']}><PlaceholderPage title="ACMS / Fire Pumps PDF Reports" /></ProtectedRoute>} />

      {/* Help & Support (Permitted to all - no permission required) */}
      <Route path="/help" element={<Navigate to="/help/feedback" replace />} />
      <Route path="/help/feedback" element={<HelpFeedback />} />
      <Route path="/help/policy" element={<PolicyCondition />} />

      {/* Catch-all */}
      <Route path="*" element={<PlaceholderPage title="Module Under Calibration" />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
