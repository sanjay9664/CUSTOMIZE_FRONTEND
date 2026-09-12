import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Search, X, Check, MapPin, Building, Globe, Layers, Navigation } from 'lucide-react';
import { findPathInTree } from '../../utils/locationTreeUtils';

/**
 * LocationCascaderSelector
 * A modern, dependency-free Cascader component for hierarchical location selection:
 * Company -> Organization/Client -> Zone -> Area -> Site/Location.
 * 
 * Supports:
 * - changeOnSelect (selecting higher-level zones or drilling down to sites)
 * - multi-column cascading navigation
 * - quick full-text search across all levels
 * - custom trigger variants ('pill' matching Image 2, or 'input' for forms)
 * - full dark mode and light mode support
 */
const LocationCascaderSelector = ({
  options = [],
  value = null,
  onChange = () => {},
  changeOnSelect = true,
  displayOnlyChild = false,
  placeholder = 'Select Location',
  searchPlaceholder = 'Search location...',
  fallbackLabel = '',
  disabled = false,
  allowClear = true,
  className = '',
  variant = 'input', // 'input' | 'pill' | 'compact'
  triggerIcon = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePath, setActivePath] = useState([]); // array of nodes currently hovered/selected per column
  const [selectedNodes, setSelectedNodes] = useState([]); // confirmed selection
  const [searchQuery, setSearchQuery] = useState('');
  const [openUpwards, setOpenUpwards] = useState(false);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize initial value to selectedNodes
  useEffect(() => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      setSelectedNodes([]);
      setActivePath([]);
      return;
    }

    // If value is an array of string values: e.g. ['COMPANY-10', 'ZONE-30']
    const targetVal = Array.isArray(value) ? value[value.length - 1] : value;
    const targetStr = typeof targetVal === 'object' ? (targetVal.value || targetVal.id) : String(targetVal);

    if (options && options.length) {
      const foundPath = findPathInTree(options, (n) => 
        String(n.value) === targetStr || 
        String(n.id) === targetStr || 
        (n.data && String(n.data.id) === targetStr)
      );

      if (foundPath && foundPath.length) {
        setSelectedNodes(foundPath);
        setActivePath(foundPath);
      }
    }
  }, [value, options]);

  // Viewport position check to open upwards if near screen bottom
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 300 && rect.top > 300) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Generate multi-column columns based on activePath
  const columns = useMemo(() => {
    if (!options || options.length === 0) return [];

    const cols = [options];
    let currentChildren = options;

    for (let i = 0; i < activePath.length; i++) {
      const activeNode = activePath[i];
      const matched = currentChildren.find((n) => n.value === activeNode.value);
      if (matched && matched.children && matched.children.length) {
        cols.push(matched.children);
        currentChildren = matched.children;
      } else {
        break;
      }
    }

    return cols;
  }, [options, activePath]);

  // Flatten options for quick search
  const flatSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results = [];

    const traverse = (nodes, currentBreadcrumbs) => {
      nodes.forEach((n) => {
        const nextBreadcrumbs = [...currentBreadcrumbs, n];
        if (n.label && n.label.toLowerCase().includes(query)) {
          results.push({
            node: n,
            path: nextBreadcrumbs,
            fullLabel: nextBreadcrumbs.map((x) => x.label).join(' > ')
          });
        }
        if (n.children && n.children.length) {
          traverse(n.children, nextBreadcrumbs);
        }
      });
    };

    traverse(options, []);
    return results;
  }, [options, searchQuery]);

  // Handle selecting a node
  const handleSelectNode = (node, colIndex, isLeaf = false) => {
    const newPath = [...activePath.slice(0, colIndex), node];
    setActivePath(newPath);

    if (changeOnSelect || isLeaf) {
      setSelectedNodes(newPath);
      const valuesArray = newPath.map((n) => n.value);
      onChange(valuesArray, newPath, node);

      if (isLeaf) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
  };

  const handleHoverNode = (node, colIndex) => {
    if (node.children && node.children.length) {
      const newPath = [...activePath.slice(0, colIndex), node];
      setActivePath(newPath);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedNodes([]);
    setActivePath([]);
    onChange([], [], null);
  };

  // Helper to get entity icon
  const getNodeIcon = (type) => {
    switch (type) {
      case 'COMPANY': return <Building size={14} className="text-amber-400" />;
      case 'CLIENT':
      case 'TENANT': return <Building size={14} className="text-blue-400" />;
      case 'ZONE': return <Globe size={14} className="text-emerald-400" />;
      case 'AREA': return <Layers size={14} className="text-cyan-400" />;
      case 'SITE':
      case 'LOCATION': return <MapPin size={14} className="text-rose-400" />;
      case 'CLUSTER': return <Navigation size={14} className="text-purple-400" />;
      case 'DEVICE': return <Check size={14} className="text-info" />;
      default: return <MapPin size={14} className="text-slate-400" />;
    }
  };

  // Compute trigger label
  const displayText = useMemo(() => {
    if (selectedNodes && selectedNodes.length > 0) {
      if (displayOnlyChild) {
        return selectedNodes[selectedNodes.length - 1]?.label || '';
      }
      return selectedNodes.map((n) => n.label).join(' > ');
    }
    if (fallbackLabel) return fallbackLabel;
    if (value && typeof value === 'string' && !value.includes('@') && !value.includes('-')) {
      return `Device #${value}`;
    }
    return '';
  }, [selectedNodes, displayOnlyChild, fallbackLabel, value]);

  return (
    <div
      ref={containerRef}
      className={`location-cascader-wrapper position-relative ${className} ${disabled ? 'opacity-70 pointer-events-none' : ''}`}
      style={{ zIndex: isOpen ? 1050 : 'auto' }}
    >
      <style>{`
        .location-cascader-wrapper {
          font-family: inherit;
        }

        /* Pill Trigger Variant (Image 2 style) */
        .cascader-trigger-pill {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          background: #f1f5f9;
          color: #0f172a;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 0.92rem;
          font-weight: 500;
          cursor: pointer;
          min-width: 220px;
          max-width: 100%;
          transition: all 0.2s ease;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .cascader-trigger-pill:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }
        body:not(.light-mode) .cascader-trigger-pill {
          background: rgba(30, 41, 59, 0.9);
          color: #f8fafc;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        body:not(.light-mode) .cascader-trigger-pill:hover {
          background: rgba(51, 65, 85, 0.95);
          border-color: rgba(56, 189, 248, 0.5);
        }

        /* Input Trigger Variant (Form style) */
        .cascader-trigger-input {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(15, 23, 42, 0.6);
          color: #f8fafc;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 0.88rem;
          cursor: pointer;
          width: 100%;
          min-height: 40px;
          transition: all 0.2s ease;
        }
        .cascader-trigger-input:hover {
          border-color: rgba(56, 189, 248, 0.5);
        }
        body.light-mode .cascader-trigger-input {
          background: #ffffff;
          color: #0f172a;
          border-color: #cbd5e1;
        }

        /* Compact Trigger Variant (Table / Field style, 32px height) */
        .cascader-trigger-compact {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(15, 23, 42, 0.7);
          color: #f8fafc;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          width: 100%;
          min-height: 32px;
          height: 32px;
          box-sizing: border-box;
          transition: all 0.15s ease;
        }
        .cascader-trigger-compact:hover {
          border-color: #38bdf8;
          background: rgba(30, 41, 59, 0.9);
        }
        body.light-mode .cascader-trigger-compact {
          background: #ffffff;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        body.light-mode .cascader-trigger-compact:hover {
          border-color: #0284c7;
          background: #f8fafc;
        }

        /* Dropdown Popover */
        .cascader-popover {
          position: absolute;
          left: 0;
          z-index: 1060;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.7);
          border-radius: 10px;
          overflow: hidden;
          min-width: 320px;
          max-width: 95vw;
          animation: cascaderFadeIn 0.15s ease-out;
        }
        body.light-mode .cascader-popover {
          background: #ffffff;
          border-color: #cbd5e1;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
        }

        @keyframes cascaderFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Search input inside popover */
        .cascader-search-box {
          padding: 8px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
        }
        body.light-mode .cascader-search-box {
          border-bottom-color: #e2e8f0;
          background: #f8fafc;
        }

        /* Columns container */
        .cascader-columns-container {
          display: flex;
          max-height: 280px;
          overflow-x: auto;
          overflow-y: hidden;
        }
        .cascader-column {
          min-width: 170px;
          max-width: 220px;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          overflow-y: auto;
          padding: 4px 0;
        }
        .cascader-column:last-child {
          border-right: none;
        }
        body.light-mode .cascader-column {
          border-right-color: #e2e8f0;
        }

        /* Node Item */
        .cascader-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 12px;
          font-size: 0.84rem;
          color: #cbd5e1;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
        }
        .cascader-item:hover {
          background: rgba(56, 189, 248, 0.12);
          color: #38bdf8;
        }
        .cascader-item.active {
          background: rgba(56, 189, 248, 0.18);
          color: #38bdf8;
          font-weight: 600;
        }
        body.light-mode .cascader-item {
          color: #334155;
        }
        body.light-mode .cascader-item:hover {
          background: #f0f9ff;
          color: #0284c7;
        }
        body.light-mode .cascader-item.active {
          background: #e0f2fe;
          color: #0284c7;
        }
      `}</style>

      {/* TRIGGER */}
      {variant === 'pill' ? (
        <div
          className="cascader-trigger-pill"
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="d-flex align-items-center gap-2 overflow-hidden text-truncate pe-2">
            {triggerIcon}
            <span className="text-truncate">
              {displayText || <span className="opacity-60">{placeholder}</span>}
            </span>
          </div>
          <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
            {allowClear && displayText && !disabled && (
              <X
                size={14}
                className="opacity-60 hover:opacity-100 cursor-pointer text-danger"
                onClick={handleClear}
                title="Clear selection"
              />
            )}
            <ChevronRight size={16} className={`transition-all ${isOpen ? 'rotate-90' : ''}`} />
          </div>
        </div>
      ) : variant === 'compact' ? (
        <div
          className="cascader-trigger-compact"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          title={displayText || placeholder}
        >
          <div className="d-flex align-items-center gap-1.5 overflow-hidden text-truncate pe-1">
            {triggerIcon}
            <span className="text-truncate">
              {displayText || <span className="opacity-50">{placeholder}</span>}
            </span>
          </div>
          <div className="d-flex align-items-center gap-1 flex-shrink-0">
            {allowClear && displayText && !disabled && (
              <X
                size={13}
                className="opacity-60 hover:opacity-100 cursor-pointer text-danger"
                onClick={handleClear}
                title="Clear selection"
              />
            )}
            <ChevronDown size={13} className={`transition-all opacity-60 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      ) : (
        <div
          className="cascader-trigger-input"
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="d-flex align-items-center gap-2 overflow-hidden text-truncate pe-2">
            {triggerIcon}
            <span className="text-truncate">
              {displayText || <span className="text-slate-400">{placeholder}</span>}
            </span>
          </div>
          <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
            {allowClear && displayText && !disabled && (
              <X
                size={14}
                className="opacity-60 hover:opacity-100 cursor-pointer text-danger"
                onClick={handleClear}
                title="Clear selection"
              />
            )}
            <ChevronDown size={15} className={`transition-all opacity-60 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      )}

      {/* DROPDOWN POPOVER */}
      {isOpen && (
        <div 
          className="cascader-popover"
          style={openUpwards ? { top: 'auto', bottom: 'calc(100% + 4px)' } : { top: 'calc(100% + 4px)', bottom: 'auto' }}
        >
          {/* Search Header */}
          <div className="cascader-search-box d-flex align-items-center gap-2">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-0 text-inherit w-100 p-0 focus:outline-none"
              style={{ outline: 'none', fontSize: '0.84rem' }}
            />
            {searchQuery && (
              <X
                size={13}
                className="text-slate-400 cursor-pointer"
                onClick={() => setSearchQuery('')}
              />
            )}
          </div>

          {/* If no options available */}
          {options.length === 0 ? (
            <div className="p-3 text-center text-muted fs-12">
              No items available.<br />
              <span className="fs-11 opacity-75">Please select a location above first.</span>
            </div>
          ) : searchQuery.trim() ? (
            /* Search results mode */
            <div style={{ maxHeight: 250, overflowY: 'auto' }} className="p-1">
              {flatSearchResults.length === 0 ? (
                <div className="p-3 text-center text-muted fs-12">No items match "{searchQuery}"</div>
              ) : (
                flatSearchResults.map((res, idx) => (
                  <div
                    key={idx}
                    className="cascader-item rounded-2 py-2"
                    onClick={() => {
                      setSelectedNodes(res.path);
                      onChange(res.path.map((n) => n.value), res.path, res.node);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <div className="d-flex align-items-center gap-2 overflow-hidden text-truncate">
                      {getNodeIcon(res.node.type)}
                      <span className="text-truncate fs-13">{res.fullLabel}</span>
                    </div>
                    <Check size={14} className="text-info opacity-0 group-hover:opacity-100" />
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Multi-column cascading columns */
            <div className="cascader-columns-container">
              {columns.map((colItems, colIdx) => (
                <div key={colIdx} className="cascader-column">
                  {colItems.map((node) => {
                    const hasChildren = !!(node.children && node.children.length);
                    const isActive = activePath[colIdx]?.value === node.value;
                    const isSelected = selectedNodes[selectedNodes.length - 1]?.value === node.value;

                    return (
                      <div
                        key={node.value || node.key}
                        className={`cascader-item ${isActive ? 'active' : ''} ${isSelected ? 'fw-bold' : ''}`}
                        onMouseEnter={() => handleHoverNode(node, colIdx)}
                        onClick={() => handleSelectNode(node, colIdx, !hasChildren)}
                      >
                        <div className="d-flex align-items-center gap-2 overflow-hidden text-truncate">
                          {getNodeIcon(node.type)}
                          <span className="text-truncate">{node.label}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1 ps-1">
                          {isSelected && <Check size={13} className="text-info flex-shrink-0" />}
                          {hasChildren && <ChevronRight size={13} className="opacity-60 flex-shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationCascaderSelector;
