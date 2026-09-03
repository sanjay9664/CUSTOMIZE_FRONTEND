import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSochiotGatewayStatus, getSochiotDeviceStatus, getSochiotDeviceDetails } from './authService';
import { setDeviceStatus, setGatewayStatus } from '../store/deviceStatusSlice';

const isOnlineResponse = (res) => Boolean(res && (res.status === 'ONLINE' || res.status === 'online' || res.mode?.name === 'ONLINE' || res.we?.mode?.name === 'ONLINE' || res.online === true || res.active === true));

export const useDeviceStatus = () => {
  const dispatch = useDispatch();
  const { deviceStatuses, gatewayStatuses } = useSelector((state) => state.deviceStatus);

  const checkDeviceStatus = useCallback(async (deviceId) => {
    if (!deviceId) return false;
    try {
      let res;
      const isNumeric = /^\d+$/.test(String(deviceId));
      if (isNumeric) {
        res = await getSochiotDeviceDetails(deviceId);
      } else {
        try {
          res = await getSochiotDeviceStatus(deviceId);
          const isOnline = res && (
            res.status === 'ONLINE' || 
            res.status === 'online' ||
            res.mode?.name === 'ONLINE' ||
            res.we?.mode?.name === 'ONLINE' ||
            res.online === true ||
            res.active === true
          );
          if (isOnline) {
            dispatch(setDeviceStatus({ id: deviceId, online: true }));
            return true;
          }
        } catch (statusErr) {
          console.warn(`getSochiotDeviceStatus failed for ${deviceId}, falling back to getSochiotDeviceDetails:`, statusErr);
        }
        
        // Fallback: try details endpoint
        try {
          res = await getSochiotDeviceDetails(deviceId);
        } catch (detailsErr) {
          console.error(`Fallback getSochiotDeviceDetails also failed for ${deviceId}:`, detailsErr);
        }
      }
      const isOnline = res && (
        res.status === 'ONLINE' || 
        res.status === 'online' ||
        res.mode?.name === 'ONLINE' ||
        res.we?.mode?.name === 'ONLINE' ||
        res.online === true ||
        res.active === true
      );
      dispatch(setDeviceStatus({ id: deviceId, online: isOnline }));
      return isOnline;
    } catch (e) {
      console.error(`Error checking device status for ${deviceId}:`, e);
      dispatch(setDeviceStatus({ id: deviceId, online: false }));
      return false;
    }
  }, [dispatch]);

  const checkGatewayStatus = useCallback(async (clusterId) => {
    if (!clusterId) return false;
    
    // If gateway/cluster ID is numeric, treat it as online (true) as a legacy fallback
    const isNumeric = /^\d+$/.test(String(clusterId));
    if (isNumeric) {
      dispatch(setGatewayStatus({ id: clusterId, online: true }));
      return true;
    }

    try {
      const res = await getSochiotGatewayStatus(clusterId);
      const isOnline = res && (
        res.status === 'ONLINE' || 
        res.status === 'online' ||
        res.mode?.name === 'ONLINE' ||
        res.we?.mode?.name === 'ONLINE' ||
        res.online === true ||
        res.active === true
      );
      dispatch(setGatewayStatus({ id: clusterId, online: isOnline }));
      return isOnline;
    } catch (e) {
      console.error(`Error checking gateway status for ${clusterId}:`, e);
      dispatch(setGatewayStatus({ id: clusterId, online: false }));
      return false;
    }
  }, [dispatch]);

  // Method to poll statuses for all devices/gateways found in savedTemplates
  const pollAllStatuses = useCallback(async () => {
    try {
      const saved = localStorage.getItem('scada_templates');
      if (!saved) return;
      const templates = JSON.parse(saved);

      const deviceIds = new Set();
      const gatewayUuids = new Set();

      if (Array.isArray(templates)) {
        templates.forEach(t => {
          if (t.mapping) {
            // Check if mapping has global deviceId/gatewayUuid
            if (t.mapping.deviceId) deviceIds.add(t.mapping.deviceId);
            if (t.mapping.gatewayUuid) gatewayUuids.add(t.mapping.gatewayUuid);

            // Fallback check: look through any section mappings for device fields
            Object.values(t.mapping).forEach(sec => {
              if (sec && typeof sec === 'object') {
                if (sec.device) deviceIds.add(sec.device);
              }
            });
          }
        });
      }

      // Poll devices
      await Promise.all(Array.from(deviceIds).map(id => checkDeviceStatus(id)));
      // Poll gateways
      await Promise.all(Array.from(gatewayUuids).map(uuid => checkGatewayStatus(uuid)));
    } catch (e) {
      console.error('Error polling statuses:', e);
    }
  }, [checkDeviceStatus, checkGatewayStatus]);

  // Helper function to resolve overall status
  const getOverallStatus = useCallback((deviceId, gatewayUuid) => {
    const isDevOnline = deviceId ? (deviceStatuses[deviceId] ?? true) : true;
    const isGwyOnline = gatewayUuid ? (gatewayStatuses[gatewayUuid] ?? true) : true;
    return isDevOnline && isGwyOnline;
  }, [deviceStatuses, gatewayStatuses]);

  return { deviceStatuses, gatewayStatuses, checkDeviceStatus, checkGatewayStatus, getOverallStatus, refreshStatuses: pollAllStatuses };
};

export const DeviceStatusProvider = ({ children }) => {
  const { refreshStatuses } = useDeviceStatus();
  useEffect(() => { refreshStatuses(); const interval = setInterval(refreshStatuses, 20000); return () => clearInterval(interval); }, [refreshStatuses]);
  return children;
};
