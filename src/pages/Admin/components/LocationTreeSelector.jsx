import React, { useState, useEffect, useMemo } from 'react';
import { Form, Spinner, Badge, Button, InputGroup } from 'react-bootstrap';
import { 
  Building2, ChevronRight, ChevronDown, MapPin, 
  Layers, Box, Server, Search, CheckSquare, Square, 
  RotateCcw, Compass, Map, Home
} from 'lucide-react';
import { bmsService } from '../../../services/bmsService';

const getNodeIcon = (type) => {
  const normType = String(type || '').toUpperCase();
  switch (normType) {
    case 'COMPANY':
      return <Building2 size={16} className="text-primary" />;
    case 'TENANT':
      return <Layers size={16} className="text-info" />;
    case 'ZONE':
      return <Map size={16} className="text-warning" />;
    case 'AREA':
      return <Compass size={16} className="text-success" />;
    case 'SITE':
      return <MapPin size={16} className="text-danger" />;
    case 'BUILDING':
      return <Home size={15} className="text-secondary" />;
    case 'FLOOR':
    case 'ROOM':
      return <Box size={14} className="text-muted" />;
    case 'ASSET':
    case 'DG':
    case 'PANEL':
    case 'EQUIPMENT':
      return <Server size={14} className="text-info" />;
    default:
      return <Box size={14} className="text-muted" />;
  }
};

const TreeNode = ({ 
  node, 
  level = 0, 
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
        className={`d-flex align-items-center py-1 px-2 rounded tree-row ${isSelected ? 'tree-row-selected' : ''} ${isMatch ? 'tree-row-highlight' : ''}`}
        style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
      >
        {/* Expand / Collapse toggle */}
        <span 
          className="me-1 tree-caret d-inline-flex align-items-center justify-content-center"
          style={{ width: '20px', height: '20px', color: '#64748b' }}
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
        <Form.Check
          type="checkbox"
          id={`loc-check-${node.id}`}
          className="me-2 mb-0 custom-tree-checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(node);
          }}
        />

        {/* Node Type Icon */}
        <span className="me-2 d-inline-flex align-items-center">
          {getNodeIcon(node.type)}
        </span>

        {/* Node Name */}
        <span 
          className="flex-grow-1 fs-13 text-truncate tree-label"
          onClick={() => onToggleSelect(node)}
          title={`${node.name} (${node.type})`}
        >
          <strong className="fw-500">{node.name}</strong>
        </span>

        {/* Type Badge */}
        <Badge 
          bg="light" 
          className="text-muted ms-2 fs-10 border fw-normal"
          style={{ letterSpacing: '0.02em' }}
        >
          {node.type}
        </Badge>
      </div>

      {/* Children list */}
      {hasChildren && isExpanded && (
        <div className="tree-children border-start border-light-subtle ps-1 ms-3">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
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
  disabled = false 
}) => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMap, setExpandedMap] = useState({});

  // Convert array of selected zoneLocations [{ zoneNodeType, zoneNodeId }] into lookup map
  const selectedMap = useMemo(() => {
    const map = {};
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item && item.zoneNodeId) {
          map[item.zoneNodeId] = item;
        } else if (typeof item === 'string') {
          map[item] = { zoneNodeId: item, zoneNodeType: 'UNKNOWN' };
        }
      });
    }
    return map;
  }, [value]);

  useEffect(() => {
    let isMounted = true;
    const loadTree = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await bmsService.getLocationTree({ includeCompany: true });
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (isMounted) {
          setTreeData(list);
          // Automatically expand top-level company and tenant nodes by default
          const initialExpanded = {};
          const autoExpand = (nodes, maxDepth = 2, currentDepth = 0) => {
            if (currentDepth >= maxDepth || !Array.isArray(nodes)) return;
            nodes.forEach(n => {
              initialExpanded[n.id] = true;
              if (n.children) autoExpand(n.children, maxDepth, currentDepth + 1);
            });
          };
          autoExpand(list, 2, 0);
          setExpandedMap(initialExpanded);
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
  }, []);

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
    traverse(treeData);
    setExpandedMap(all);
  };

  const handleCollapseAll = () => {
    setExpandedMap({});
  };

  const handleToggleSelect = (node) => {
    if (disabled) return;
    const nodeId = String(node.id);
    const isCurrentlySelected = Boolean(selectedMap[nodeId]);

    let nextValues = [];
    if (isCurrentlySelected) {
      // Remove
      nextValues = (value || []).filter(item => {
        const id = item?.zoneNodeId || item;
        return String(id) !== nodeId;
      });
    } else {
      // Add node
      const newItem = {
        zoneNodeType: node.type || 'SITE',
        zoneNodeId: nodeId,
        name: node.name
      };
      nextValues = [...(value || []), newItem];
    }

    if (onChange) {
      onChange(nextValues);
    }
  };

  const selectedCount = Object.keys(selectedMap).length;

  return (
    <div className="location-tree-container border rounded bg-white p-3">
      {/* Header controls */}
      <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
        <div>
          <span className="fw-semibold fs-14 text-dark">Location Assignment</span>
          {selectedCount > 0 && (
            <Badge bg="primary" className="ms-2 fs-11">
              {selectedCount} selected
            </Badge>
          )}
        </div>
        <div className="d-flex gap-1">
          <Button 
            variant="link" 
            size="sm" 
            className="p-0 text-decoration-none fs-12 text-primary"
            onClick={handleExpandAll}
            disabled={loading || treeData.length === 0}
          >
            Expand All
          </Button>
          <span className="text-muted fs-12">|</span>
          <Button 
            variant="link" 
            size="sm" 
            className="p-0 text-decoration-none fs-12 text-secondary"
            onClick={handleCollapseAll}
            disabled={loading || treeData.length === 0}
          >
            Collapse All
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <InputGroup size="sm" className="mb-2">
        <InputGroup.Text className="bg-light border-end-0">
          <Search size={14} className="text-muted" />
        </InputGroup.Text>
        <Form.Control
          placeholder="Search sites, zones, or assets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-start-0"
        />
        {searchTerm && (
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => setSearchTerm('')}
          >
            ×
          </Button>
        )}
      </InputGroup>

      {/* Tree Content */}
      <div 
        className="tree-scroll-area overflow-auto" 
        style={{ maxHeight: '380px', minHeight: '180px' }}
      >
        {loading ? (
          <div className="text-center py-4 text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            <span className="fs-13">Loading location hierarchy...</span>
          </div>
        ) : error ? (
          <div className="alert alert-warning py-2 px-3 fs-13 mb-0">
            {error}
          </div>
        ) : treeData.length === 0 ? (
          <div className="text-center py-4 text-muted fs-13">
            No location nodes available.
          </div>
        ) : (
          <div className="tree-root">
            {treeData.map((rootNode) => (
              <TreeNode
                key={rootNode.id}
                node={rootNode}
                level={0}
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

      <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center text-muted fs-11">
        <span>Select nodes to assign geographical and site permissions</span>
        {selectedCount > 0 && (
          <Button 
            variant="link" 
            size="sm" 
            className="p-0 text-danger text-decoration-none fs-11"
            onClick={() => onChange && onChange([])}
          >
            Clear Selected
          </Button>
        )}
      </div>
    </div>
  );
};

export default LocationTreeSelector;
