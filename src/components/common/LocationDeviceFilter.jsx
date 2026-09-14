import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import { MapPin, Cpu, RotateCcw } from 'lucide-react';
import LocationCascaderSelector from './LocationCascaderSelector';
import {
  generateTreeFromSochiot,
  generateTreeFromBmsEntities,
  transformGatewayDeviceHierarchy,
  parseLocationValue
} from '../../utils/locationTreeUtils';
import {
  fetchSochiotAccessToken,
  fetchUserLocationHierarchy,
  fetchEntityHierarchy
} from '../../services/sochiotLocationService';
import { useLocationScope } from '../../context/SiteContext';
import { parseApiError } from '../../utils/errorHandler';

/**
 * LocationDeviceFilter Component
 * Implements the location & gateway/device filter from ismartaccess-frontend-v2
 * as displayed in Image 2 ("Reports" -> [ 📍 ] Ashish_Manufacturing >).
 */
const LocationDeviceFilter = ({
  // BMS fallback entities
  companies = [],
  tenants = [],
  zones = [],
  areas = [],
  sites = [],
  
  // Callbacks
  onSelectLocation = () => {},
  onSelectDevice = () => {},
  onDeviceTreeLoaded = null,
  
  // Configuration
  showTitle = true,
  title = 'Reports',
  enableDeviceFilter = false,
  initialLocationValue = null,
  className = ''
}) => {
  const {
    sochiotUserLocation: globalSochiotLocation,
    loadSochiotHierarchy,
    setCurrentLocationScope
  } = useLocationScope();

  const [loading, setLoading] = useState(false);
  const [sochiotUserLocation, setSochiotUserLocation] = useState(globalSochiotLocation || null);
  const [locationTree, setLocationTree] = useState(() => {
    if (globalSochiotLocation) {
      return generateTreeFromSochiot(globalSochiotLocation);
    }
    return [];
  });
  const [selectedLocationVal, setSelectedLocationVal] = useState(initialLocationValue);
  const [selectedLocationNode, setSelectedLocationNode] = useState(null);
  
  // Gateways & Devices under the selected location
  const [deviceTree, setDeviceTree] = useState([]);
  const [selectedDeviceVal, setSelectedDeviceVal] = useState(null);

  // Stable references to prevent infinite loop re-renders
  const onDeviceTreeLoadedRef = useRef(onDeviceTreeLoaded);
  useEffect(() => {
    onDeviceTreeLoadedRef.current = onDeviceTreeLoaded;
  }, [onDeviceTreeLoaded]);

  const lastLoadedEntityRef = useRef(null);
  const prevInitialValRef = useRef(null);

  // 1. When location changes, query /config-engine/entity/{NODE_TYPE}/{NODE_ID}
  const loadEntityHierarchy = useCallback(async (nodeType, nodeId) => {
    if (!nodeType || !nodeId) return;
    const cleanNodeType = (!nodeType || nodeType === 'UNKNOWN') ? 'LOCATION' : nodeType;
    const cleanNodeId = String(nodeId);
    const entityKey = `${cleanNodeType}-${cleanNodeId}`;

    // Prevent redundant requests if already loaded or currently active
    if (lastLoadedEntityRef.current === entityKey) {
      return;
    }
    lastLoadedEntityRef.current = entityKey;

    setLoading(true);
    try {
      const entityResult = await fetchEntityHierarchy(cleanNodeType, cleanNodeId);
      if (entityResult?.locationVOS) {
        const transformed = transformGatewayDeviceHierarchy(entityResult.locationVOS);
        setDeviceTree(transformed);
        if (typeof onDeviceTreeLoadedRef.current === 'function') {
          onDeviceTreeLoadedRef.current(transformed);
        }
      } else {
        setDeviceTree([]);
        if (typeof onDeviceTreeLoadedRef.current === 'function') {
          onDeviceTreeLoadedRef.current([]);
        }
      }
    } catch (err) {
      console.warn('[LocationDeviceFilter] loadEntityHierarchy error:', err);
      setDeviceTree([]);
      if (typeof onDeviceTreeLoadedRef.current === 'function') {
        onDeviceTreeLoadedRef.current([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Initial Load: Retrieve token and user location hierarchy from Sochiot API
  useEffect(() => {
    let isMounted = true;

    const initLocationData = async () => {
      // If already cached globally in context, use it immediately
      if (globalSochiotLocation) {
        setSochiotUserLocation(globalSochiotLocation);
        const tree = generateTreeFromSochiot(globalSochiotLocation);
        if (tree.length > 0) setLocationTree(tree);
        return;
      }

      setLoading(true);
      try {
        await fetchSochiotAccessToken();
        const hierarchyData = await loadSochiotHierarchy();

        if (isMounted && hierarchyData?.userZoneLocationVO) {
          setSochiotUserLocation(hierarchyData.userZoneLocationVO);
          const tree = generateTreeFromSochiot(hierarchyData.userZoneLocationVO);
          if (tree.length > 0) {
            setLocationTree(tree);
            if (hierarchyData.preferredZoneNodeId && hierarchyData.preferredZoneNodeType && !initialLocationValue) {
              const defaultVal = `${hierarchyData.preferredZoneNodeType}-${hierarchyData.preferredZoneNodeId}`;
              setSelectedLocationVal(defaultVal);
              loadEntityHierarchy(hierarchyData.preferredZoneNodeType, hierarchyData.preferredZoneNodeId);
            }
          }
        }
      } catch (err) {
        const parsed = parseApiError(err, 'Failed to initialize location filter');
        console.warn('[LocationDeviceFilter] Init notice:', parsed.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initLocationData();
    return () => { isMounted = false; };
  }, [globalSochiotLocation, loadSochiotHierarchy, initialLocationValue, loadEntityHierarchy]);

  // 3. Fallback: If Sochiot tree is empty, build tree from local BMS entities
  useEffect(() => {
    if (!sochiotUserLocation && !globalSochiotLocation) {
      const bmsTree = generateTreeFromBmsEntities({ companies, tenants, zones, areas, sites });
      if (bmsTree.length > 0) {
        setLocationTree(bmsTree);
        // Default to first site if none selected
        if (!initialLocationValue && sites.length > 0) {
          setSelectedLocationVal(`LOCATION-${sites[0].id}`);
          loadEntityHierarchy('LOCATION', sites[0].id);
        }
      }
    }
  }, [sochiotUserLocation, globalSochiotLocation, companies, tenants, zones, areas, sites, initialLocationValue, loadEntityHierarchy]);

  // Synchronize when initialLocationValue changes from parent
  useEffect(() => {
    if (initialLocationValue && initialLocationValue !== prevInitialValRef.current) {
      prevInitialValRef.current = initialLocationValue;
      setSelectedLocationVal(initialLocationValue);
      const parsed = parseLocationValue(initialLocationValue);
      if (parsed) {
        const type = (!parsed.type || parsed.type === 'UNKNOWN') ? 'LOCATION' : parsed.type;
        loadEntityHierarchy(type, parsed.id);
      }
    }
  }, [initialLocationValue, loadEntityHierarchy]);

  // Handle Location Selection
  const handleLocationChange = (valArray, pathNodes, leafNode) => {
    setSelectedLocationVal(valArray);
    setSelectedLocationNode(leafNode);
    setSelectedDeviceVal(null);

    if (leafNode) {
      const parsed = parseLocationValue(leafNode.value);
      const locObj = {
        type: parsed?.type || leafNode.type,
        id: parsed?.id || leafNode.id,
        name: leafNode.label,
        path: pathNodes,
        data: leafNode.data
      };
      
      // Update global location scope (ismartaccess-frontend-v2 pattern)
      if (typeof setCurrentLocationScope === 'function') {
        setCurrentLocationScope(locObj);
      }
      onSelectLocation(locObj);

      if (parsed) {
        const type = (!parsed.type || parsed.type === 'UNKNOWN') ? 'LOCATION' : parsed.type;
        loadEntityHierarchy(type, parsed.id);
      }
    } else {
      lastLoadedEntityRef.current = null;
      if (typeof setCurrentLocationScope === 'function') {
        setCurrentLocationScope(null);
      }
      onSelectLocation(null);
      setDeviceTree([]);
      if (typeof onDeviceTreeLoadedRef.current === 'function') {
        onDeviceTreeLoadedRef.current([]);
      }
    }
  };

  // Handle Device Selection
  const handleDeviceChange = (valArray, pathNodes, leafNode) => {
    setSelectedDeviceVal(valArray);
    if (leafNode) {
      const parsed = parseLocationValue(leafNode.value);
      onSelectDevice({
        type: parsed?.type || leafNode.type,
        id: parsed?.id || leafNode.id,
        uuid: parsed?.uuid,
        name: leafNode.label,
        path: pathNodes,
        data: leafNode.data
      });
    } else {
      onSelectDevice(null);
    }
  };

  return (
    <div className={`location-device-filter-container ${className}`}>
      <style>{`
        .location-device-filter-container {
          margin-bottom: 1.25rem;
        }

        .location-filter-header-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.85rem;
          letter-spacing: -0.02em;
        }
        body:not(.light-mode) .location-filter-header-title {
          color: #f8fafc;
        }

        /* 📍 Location Pin Badge Icon (Image 2 style) */
        .location-pin-badge {
          width: 40px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #bae6fd;
          color: #0284c7;
          border-radius: 9px;
          flex-shrink: 0;
          transition: all 0.2s ease;
          box-shadow: 0 2px 5px rgba(2, 132, 199, 0.15);
        }
        body:not(.light-mode) .location-pin-badge {
          background: rgba(2, 132, 199, 0.25);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
        }

        .location-filter-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
      `}</style>

      {/* Title as in Image 2 ("Reports") */}
      {showTitle && title && (
        <h2 className="location-filter-header-title">{title}</h2>
      )}

      {/* Main Filter Bar */}
      <div className="location-filter-row">
        {/* [ 📍 ] Pin Badge Icon */}
        <div className="location-pin-badge" title="Filter by Location">
          {loading ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <MapPin size={21} strokeWidth={2.2} />
          )}
        </div>

        {/* Primary Location Cascader (Image 2 style rounded pill) */}
        <div style={{ minWidth: 260, maxWidth: 400 }}>
          <LocationCascaderSelector
            options={locationTree}
            value={selectedLocationVal}
            onChange={handleLocationChange}
            changeOnSelect={true}
            displayOnlyChild={true}
            placeholder="Select Location"
            variant="pill"
            allowClear={true}
          />
        </div>

        {/* Optional Secondary Gateway / Device Cascader */}
        {enableDeviceFilter && deviceTree.length > 0 && (
          <div style={{ minWidth: 240, maxWidth: 360 }}>
            <LocationCascaderSelector
              options={deviceTree}
              value={selectedDeviceVal}
              onChange={handleDeviceChange}
              changeOnSelect={true}
              displayOnlyChild={true}
              placeholder="Select Gateway / Device"
              variant="pill"
              allowClear={true}
              triggerIcon={<Cpu size={15} className="text-info" />}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationDeviceFilter;
