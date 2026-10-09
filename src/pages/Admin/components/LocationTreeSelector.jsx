import React, { useState, useEffect, useMemo } from 'react';
import { Form, Spinner, Button } from 'react-bootstrap';
import { 
  Building2, ChevronRight, ChevronDown, MapPin, 
  Layers, Box, Server, Search, Compass, Map, Home
} from 'lucide-react';
import { bmsService } from '../../../services/bmsService';
import { buildLocationMapping, cleanLocationMapping } from '../../../utils/locationTreeUtils';

const getNodeIcon = (type) => {
  const normType = String(type || '').toUpperCase();
  switch (normType) {
    case 'COMPANY':
      return <Building2 size={15} style={{ color: '#38bdf8' }} />;
    case 'TENANT':
      return <Layers size={15} style={{ color: '#818cf8' }} />;
    case 'ZONE':
      return <Map size={15} style={{ color: '#facc15' }} />;
    case 'AREA':
      return <Compass size={15} style={{ color: '#4ade80' }} />;
    case 'SITE':
      return <MapPin size={15} style={{ color: '#f87171' }} />;
    case 'BUILDING':
      return <Home size={15} style={{ color: '#cbd5e1' }} />;
    case 'FLOOR':
    case 'ROOM':
      return <Box size={14} style={{ color: '#94a3b8' }} />;
    case 'ASSET':
    case 'DG':
    case 'PANEL':
    case 'EQUIPMENT':
      return <Server size={14} style={{ color: '#38bdf8' }} />;
    default:
      return <Box size={14} style={{ color: '#94a3b8' }} />;
  }
};

const getNodeTypeBadge = (type) => {
  const norm = String(type || '').toUpperCase();
  let bg = 'rgba(255, 255, 255, 0.08)';
  let color = '#94a3b8';
  let border = 'rgba(255, 255, 255, 0.15)';

  if (norm === 'COMPANY') {
    bg = 'rgba(56, 189, 248, 0.15)';
    color = '#38bdf8';
    border = 'rgba(56, 189, 248, 0.3)';
  } else if (norm === 'TENANT') {
    bg = 'rgba(99, 102, 241, 0.15)';
    color = '#818cf8';
    border = 'rgba(99, 102, 241, 0.3)';
  } else if (norm === 'ZONE' || norm === 'AREA') {
    bg = 'rgba(234, 179, 8, 0.15)';
    color = '#facc15';
    border = 'rgba(234, 179, 8, 0.3)';
  } else if (norm === 'SITE') {
    bg = 'rgba(34, 197, 94, 0.15)';
    color = '#4ade80';
    border = 'rgba(34, 197, 94, 0.3)';
  } else if (norm === 'BUILDING') {
    bg = 'rgba(148, 163, 184, 0.15)';
    color = '#cbd5e1';
    border = 'rgba(148, 163, 184, 0.3)';
  }

  return (
    <span
      className="ms-2 px-1.5 py-0.5 rounded-pill fs-10 fw-semibold text-uppercase user-select-none"
      style={{ backgroundColor: bg, color, border: `1px solid ${border}`, letterSpacing: '0.04em' }}
    >
      {type}
    </span>
  );
};

const TreeNode = ({ 
  node, 
  level = 0, 
  ancestors = [],
  selectedMap, 
  onToggleSelect, 
  expandedMap, 
  onToggleExpand,
  searchTerm 
}) => {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isExpanded = Boolean(expandedMap[node.id]);
  const isSelected = Boolean(selectedMap[node.id]);

  // Highlight if matches search
  const isMatch = searchTerm && node.name?.toLowerCase().includes(searchTerm.toLowerCase());

  return (
    <div className="location-tree-node" style={{ paddingLeft: level > 0 ? '20px' : '0' }}>
      <div 
        className={`d-flex align-items-center py-1.5 px-2 rounded-2 tree-row ${isSelected ? 'tree-row-selected' : ''} ${isMatch ? 'tree-row-highlight' : ''}`}
        style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
      >
        {/* Expand / Collapse toggle */}
        <span 
          className="me-1 tree-caret d-inline-flex align-items-center justify-content-center"
          style={{ width: '20px', height: '20px', color: '#94a3b8' }}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand(node.id);
          }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />
          ) : (
            <span style={{ width: '15px' }} />
          )}
        </span>

        {/* Checkbox */}
        <input
          type="checkbox"
          id={`loc-check-${node.id}`}
          className="form-check-input role-tree-checkbox me-2 mb-0"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(node, ancestors);
          }}
          aria-label={`Select ${node.name}`}
        />

        {/* Node Type Icon */}
        <span className="me-2 d-inline-flex align-items-center">
          {getNodeIcon(node.type)}
        </span>

        {/* Node Name */}
        <span 
          className="flex-grow-1 fs-13 text-truncate text-white tree-label"
          onClick={() => onToggleSelect(node, ancestors)}
          title={`${node.name} (${node.type})`}
        >
          <span className="fw-medium">{node.name}</span>
        </span>

        {/* Type Badge */}
        {getNodeTypeBadge(node.type)}
      </div>

      {/* Children list */}
      {hasChildren && isExpanded && (
        <div className="tree-children border-start ps-1 ms-3" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              ancestors={[...ancestors, node]}
              selectedMap={selectedMap}
              onToggleSelect={onToggleSelect}
              expandedMap={expandedMap}
              onToggleExpand={onToggleExpand}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const LocationTreeSelector = ({ 
  value = [], 
  onChange,
  disabled = false,
  organizationId = '',
  organizationType = '',
  organizationName = ''
}) => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMap, setExpandedMap] = useState({});

  // Convert array of selected location mappings [{ siteId, assetId, ... }] or nodes into lookup map
  const selectedMap = useMemo(() => {
    const map = {};
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (!item) return;
        if (typeof item === 'string') {
          map[item] = item;
          return;
        }
        if (item._nodeId) map[String(item._nodeId)] = item;
        const id = item.id || item.zoneNodeId;
        if (id) map[String(id)] = item;
        if (item.deviceId && !item.assetId) map[String(item.deviceId)] = item;
        if (item.assetId) map[String(item.assetId)] = item;
        if (item.areaId && !item.assetId && !item.deviceId) map[String(item.areaId)] = item;
        if (item.siteId && !item.areaId && !item.assetId && !item.deviceId) map[String(item.siteId)] = item;
        if (item.tenantAreaId) map[String(item.tenantAreaId)] = item;
        if (item.zoneId) map[String(item.zoneId)] = item;
        if (item.tenantId && !item.siteId && !item.zoneId) map[String(item.tenantId)] = item;
        if (item.companyId && !item.siteId && !item.zoneId) map[String(item.companyId)] = item;
      });
    }
    return map;
  }, [value]);

  // Load tree only when organization is selected or on mount
  useEffect(() => {
    let isMounted = true;
    const loadTree = async () => {
      if (!organizationId) {
        setTreeData([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const params = { includeCompany: true };
        if (organizationType === 'TENANT') params.tenantId = organizationId;
        if (organizationType === 'COMPANY') params.companyId = organizationId;

        const res = await bmsService.getLocationTree(params);
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (isMounted) {
          setTreeData(list);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load location hierarchy tree.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTree();
    return () => { isMounted = false; };
  }, [organizationId, organizationType]);

  // Filter treeData strictly for selected organization / company
  const filteredTreeData = useMemo(() => {
    if (!organizationId) return [];
    if (!Array.isArray(treeData) || treeData.length === 0) return [];

    const targetId = String(organizationId).trim();

    // 1. Recursive search to find the specific organization node (Tenant or Company)
    const findTargetNode = (nodes) => {
      for (const n of nodes) {
        if (
          String(n.id) === targetId ||
          String(n.tenantId) === targetId ||
          String(n.companyId) === targetId
        ) {
          return n;
        }
        if (Array.isArray(n.children) && n.children.length > 0) {
          const found = findTargetNode(n.children);
          if (found) return found;
        }
      }
      return null;
    };

    const targetNode = findTargetNode(treeData);
    if (targetNode) {
      return [targetNode];
    }

    // 2. Fallback: match by root level nodes
    const matchedRoots = treeData.filter(n =>
      String(n.id) === targetId ||
      String(n.tenantId) === targetId ||
      String(n.companyId) === targetId
    );
    return matchedRoots.length > 0 ? matchedRoots : treeData;
  }, [treeData, organizationId]);

  // Automatically expand all nodes inside the filtered tree
  useEffect(() => {
    if (filteredTreeData.length > 0) {
      const all = {};
      const traverse = (nodes) => {
        if (!Array.isArray(nodes)) return;
        nodes.forEach(n => {
          all[n.id] = true;
          if (n.children) traverse(n.children);
        });
      };
      traverse(filteredTreeData);
      setExpandedMap(all);
    }
  }, [filteredTreeData]);

  const handleToggleExpand = (nodeId) => {
    setExpandedMap(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handleExpandAll = () => {
    const all = {};
    const traverse = (nodes) => {
      if (!Array.isArray(nodes)) return;
      nodes.forEach(n => {
        all[n.id] = true;
        if (n.children) traverse(n.children);
      });
    };
    traverse(filteredTreeData);
    setExpandedMap(all);
  };

  const handleCollapseAll = () => {
    setExpandedMap({});
  };

  const handleToggleSelect = (node, ancestors = []) => {
    if (disabled) return;
    const nodeId = String(node.id);
    const isCurrentlySelected = Boolean(selectedMap[nodeId]);

    let nextValues = [];
    if (isCurrentlySelected) {
      // Remove
      nextValues = (value || []).filter(item => {
        if (!item) return false;
        if (typeof item === 'string') return item !== nodeId;
        if (item._nodeId && String(item._nodeId) === nodeId) return false;
        if (item.id && String(item.id) === nodeId) return false;
        if (item.deviceId && String(item.deviceId) === nodeId) return false;
        if (item.assetId && String(item.assetId) === nodeId) return false;
        if (item.areaId && String(item.areaId) === nodeId && !item.assetId && !item.deviceId) return false;
        if (item.siteId && String(item.siteId) === nodeId && !item.areaId && !item.assetId && !item.deviceId) return false;
        if (item.tenantAreaId && String(item.tenantAreaId) === nodeId) return false;
        if (item.zoneId && String(item.zoneId) === nodeId) return false;
        if (item.tenantId && String(item.tenantId) === nodeId && !item.siteId && !item.zoneId) return false;
        if (item.companyId && String(item.companyId) === nodeId && !item.siteId && !item.zoneId) return false;
        return true;
      });
    } else {
      // Add node as clean LocationMapping with hierarchical context
      const newItem = buildLocationMapping(node, ancestors);
      nextValues = [...(value || []), newItem];
    }

    if (onChange) {
      onChange(nextValues);
    }
  };

  const selectedCount = Object.keys(selectedMap).length;

  return (
    <div 
      className="location-tree-container rounded-3 border p-3"
      style={{ backgroundColor: '#081024', borderColor: 'rgba(255, 255, 255, 0.08)' }}
    >
      {/* Header controls */}
      <div className="d-flex align-items-center justify-content-between mb-2.5 pb-2 border-bottom border-secondary border-opacity-25">
        <div className="d-flex align-items-center gap-2">
          <span className="fw-semibold fs-14 text-white">Location Assignment</span>
          {selectedCount > 0 && (
            <span 
              className="px-2 py-0.5 rounded-pill fs-11 fw-semibold"
              style={{ 
                backgroundColor: 'rgba(56, 189, 248, 0.18)', 
                color: '#38bdf8', 
                border: '1px solid rgba(56, 189, 248, 0.35)' 
              }}
            >
              {selectedCount} selected
            </span>
          )}
        </div>
        {organizationId && (
          <div className="d-flex align-items-center gap-1.5">
            <button 
              type="button"
              className="btn btn-link p-0 text-decoration-none fs-12 fw-medium"
              style={{ color: '#38bdf8' }}
              onClick={handleExpandAll}
              disabled={loading || filteredTreeData.length === 0}
            >
              Expand All
            </button>
            <span className="text-secondary opacity-40 mx-1 fs-12">|</span>
            <button 
              type="button"
              className="btn btn-link p-0 text-decoration-none fs-12 fw-medium text-secondary"
              onClick={handleCollapseAll}
              disabled={loading || filteredTreeData.length === 0}
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      {!organizationId ? (
        /* Empty State: Prompt User to Select Organization First */
        <div 
          className="p-4 rounded-3 d-flex flex-column align-items-center justify-content-center text-center my-2"
          style={{ minHeight: '260px' }}
        >
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center mb-2.5"
            style={{ 
              width: '48px', 
              height: '48px', 
              backgroundColor: 'rgba(56, 189, 248, 0.1)', 
              border: '1px solid rgba(56, 189, 248, 0.25)' 
            }}
          >
            <Building2 size={22} style={{ color: '#38bdf8' }} />
          </div>
          <span className="fs-13 fw-semibold text-white mb-1">Select an Organization</span>
          <span className="fs-12 text-secondary" style={{ maxWidth: '300px', color: '#94a3b8' }}>
            Choose an organization or company on the left to form and configure its location permission hierarchy.
          </span>
        </div>
      ) : (
        <>
          {/* Search Input */}
          <div className="position-relative mb-2.5">
            <div
              className="position-absolute top-50 translate-middle-y ps-3 text-secondary d-flex align-items-center pointer-events-none"
              style={{ zIndex: 2 }}
            >
              <Search size={14} style={{ color: '#94a3b8' }} />
            </div>
            <input
              type="text"
              placeholder="Search sites, zones, or assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control ps-5 py-1.5 fs-13 text-white tree-search-input"
              aria-label="Search locations"
            />
          </div>

          {/* Tree Content */}
          <div 
            className="tree-scroll-area overflow-auto pe-1" 
            style={{ maxHeight: '380px', minHeight: '200px' }}
          >
            {loading ? (
              <div className="text-center py-5 text-secondary">
                <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                <span className="fs-13">Loading location hierarchy for selected organization...</span>
              </div>
            ) : error ? (
              <div className="alert alert-warning py-2 px-3 fs-13 mb-0 bg-warning bg-opacity-10 border-warning border-opacity-25 text-warning">
                {error}
              </div>
            ) : filteredTreeData.length === 0 ? (
              <div className="text-center py-5 text-secondary fs-13">
                No location nodes found for this organization.
              </div>
            ) : (
              <div className="tree-root">
                {filteredTreeData.map((rootNode) => (
                  <TreeNode
                    key={rootNode.id}
                    node={rootNode}
                    level={0}
                    ancestors={[]}
                    selectedMap={selectedMap}
                    onToggleSelect={handleToggleSelect}
                    expandedMap={expandedMap}
                    onToggleExpand={handleToggleExpand}
                    searchTerm={searchTerm}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center text-secondary fs-11">
            <span style={{ color: '#94a3b8' }}>Select nodes to assign geographical and site permissions</span>
            {selectedCount > 0 && (
              <button 
                type="button"
                className="btn btn-link p-0 text-danger text-decoration-none fs-11"
                onClick={() => onChange && onChange([])}
              >
                Clear Selected
              </button>
            )}
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .tree-search-input {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          border-radius: 8px !important;
          height: 35px;
          color: #ffffff !important;
          box-shadow: none !important;
          transition: all 0.15s ease;
        }
        .tree-search-input:focus {
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-color: #38bdf8 !important;
          color: #ffffff !important;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.15) !important;
        }
        .tree-search-input::placeholder {
          color: #64748b !important;
        }

        .tree-scroll-area {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        .tree-scroll-area::-webkit-scrollbar {
          width: 6px;
        }
        .tree-scroll-area::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }

        .tree-row:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
        .tree-row-selected {
          background-color: rgba(14, 165, 233, 0.12) !important;
        }
        .tree-row-highlight {
          background-color: rgba(234, 179, 8, 0.12) !important;
        }

        .role-tree-checkbox {
          cursor: pointer;
          background-color: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .role-tree-checkbox:checked {
          background-color: #0284c7;
          border-color: #0284c7;
        }

        /* Light mode overrides */
        body.light-mode .location-tree-container {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .tree-search-input {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .tree-row:hover {
          background-color: #f1f5f9;
        }
        body.light-mode .tree-row-selected {
          background-color: #e0f2fe !important;
        }
        body.light-mode .role-tree-checkbox {
          background-color: #ffffff;
          border-color: #cbd5e1;
        }
      `}} />
    </div>
  );
};

export default LocationTreeSelector;
