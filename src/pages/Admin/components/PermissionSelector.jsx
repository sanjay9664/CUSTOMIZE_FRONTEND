import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Form, Spinner, Badge, Button, InputGroup } from 'react-bootstrap';
import { ShieldCheck, Search, CheckSquare, Square, Info } from 'lucide-react';
import { bmsService } from '../../../services/bmsService';

export const PermissionSelector = ({ 
  selectedPermissions = [], 
  onChange,
  disabled = false 
}) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    const fetchPermissionsCatalog = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await bmsService.getPermissions();
        const list = res?.data || (Array.isArray(res) ? res : []);
        if (isMounted) {
          setPermissions(list);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load permissions catalog.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPermissionsCatalog();
    return () => { isMounted = false; };
  }, []);

  // Set for fast lookup of selected permission codes
  const selectedSet = useMemo(() => new Set(selectedPermissions || []), [selectedPermissions]);

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set();
    permissions.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [permissions]);

  // Filter permissions by category and search
  const filteredPermissions = useMemo(() => {
    return permissions.filter(p => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchSearch = !searchTerm || 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [permissions, selectedCategory, searchTerm]);

  const handleToggle = (code) => {
    if (disabled) return;
    const next = new Set(selectedSet);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    if (onChange) {
      onChange(Array.from(next));
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    const next = new Set(selectedSet);
    filteredPermissions.forEach(p => next.add(p.code));
    if (onChange) {
      onChange(Array.from(next));
    }
  };

  const handleClearAll = () => {
    if (disabled) return;
    if (onChange) {
      onChange([]);
    }
  };

  // Helper for category badge styling
  const renderCategoryBadge = (category) => {
    if (!category) return null;
    const cat = String(category).toLowerCase();
    let bg = 'rgba(255, 255, 255, 0.08)';
    let color = '#cbd5e1';
    let border = 'rgba(255, 255, 255, 0.16)';

    if (cat.includes('user')) {
      bg = 'rgba(56, 189, 248, 0.14)';
      color = '#38bdf8';
      border = 'rgba(56, 189, 248, 0.3)';
    } else if (cat.includes('device')) {
      bg = 'rgba(168, 85, 247, 0.14)';
      color = '#c084fc';
      border = 'rgba(168, 85, 247, 0.3)';
    } else if (cat.includes('role')) {
      bg = 'rgba(34, 197, 94, 0.14)';
      color = '#4ade80';
      border = 'rgba(34, 197, 94, 0.3)';
    } else if (cat.includes('energy') || cat.includes('meter')) {
      bg = 'rgba(234, 179, 8, 0.14)';
      color = '#facc15';
      border = 'rgba(234, 179, 8, 0.3)';
    }

    return (
      <span
        className="flex-shrink-0 px-2 py-0.5 rounded-pill fs-10 fw-semibold text-capitalize ms-1 user-select-none"
        style={{ backgroundColor: bg, color, border: `1px solid ${border}` }}
      >
        {category}
      </span>
    );
  };

  return (
    <div className="permission-selector-wrapper">
      {/* Header with Title and Controls */}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-2.5 gap-2">
        <div className="d-flex align-items-center gap-2">
          <span className="fw-semibold text-white fs-14">Permissions</span>
          <span
            className="px-2.5 py-0.5 rounded-pill fs-11 fw-semibold"
            style={{
              backgroundColor: selectedSet.size > 0 ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.08)',
              color: selectedSet.size > 0 ? '#38bdf8' : '#94a3b8',
              border: selectedSet.size > 0 ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            {selectedSet.size} selected
          </span>
        </div>

        <div className="d-flex align-items-center gap-1.5">
          <button 
            type="button" 
            className="btn btn-link p-0 text-decoration-none fs-12 fw-medium"
            style={{ color: '#38bdf8' }}
            onClick={handleSelectAll}
            disabled={disabled || loading || filteredPermissions.length === 0}
          >
            Select All
          </button>
          <span className="text-secondary opacity-40 mx-1 fs-12">|</span>
          <button 
            type="button" 
            className="btn btn-link p-0 text-decoration-none fs-12 fw-medium text-secondary"
            onClick={handleClearAll}
            disabled={disabled || loading || selectedSet.size === 0}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        {/* Search Input with Icon */}
        <div className="position-relative flex-grow-1" style={{ minWidth: '180px' }}>
          <div
            className="position-absolute top-50 translate-middle-y ps-3 text-secondary d-flex align-items-center pointer-events-none"
            style={{ zIndex: 2 }}
          >
            <Search size={14} style={{ color: '#94a3b8' }} />
          </div>
          <input
            type="text"
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control ps-5 py-1.5 fs-13 text-white perm-filter-input"
            disabled={disabled || loading}
            aria-label="Search permissions"
          />
        </div>

        {/* Category Select Dropdown */}
        {categories.length > 2 && (
          <div style={{ width: '150px' }}>
            <Form.Select 
              size="sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={disabled || loading}
              className="perm-filter-select text-white fs-13 py-1.5 px-3"
              aria-label="Filter permissions by category"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Categories' : `${c.charAt(0).toUpperCase() + c.slice(1)}`}
                </option>
              ))}
            </Form.Select>
          </div>
        )}
      </div>

      {/* Permissions 2-Column Grid */}
      <div 
        className="permission-grid-scroll overflow-auto p-2.5 rounded-3 border" 
        style={{ maxHeight: '420px', minHeight: '240px', backgroundColor: '#081024', borderColor: 'rgba(255, 255, 255, 0.08)' }}
      >
        {loading ? (
          <div className="text-center py-5 text-secondary">
            <Spinner animation="border" size="sm" variant="primary" className="me-2" />
            <span className="fs-13">Loading permissions catalog...</span>
          </div>
        ) : error ? (
          <div className="alert alert-warning py-2 px-3 fs-13 mb-0 bg-warning bg-opacity-10 border-warning border-opacity-25 text-warning">
            {error}
          </div>
        ) : filteredPermissions.length === 0 ? (
          <div className="text-center py-5 text-secondary fs-13">
            {searchTerm ? `No permissions matching "${searchTerm}".` : 'No permissions found.'}
          </div>
        ) : (
          <Row className="g-2.5">
            {filteredPermissions.map((perm) => {
              const isChecked = selectedSet.has(perm.code);
              return (
                <Col xs={12} md={6} key={perm.code}>
                  <div 
                    className={`permission-item p-2.5 rounded-3 border d-flex align-items-start gap-2.5 ${
                      isChecked ? 'permission-item-checked' : 'permission-item-default'
                    }`}
                    style={{ 
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => !disabled && handleToggle(perm.code)}
                  >
                    <input 
                      type="checkbox" 
                      id={`perm-check-${perm.code}`}
                      checked={isChecked}
                      onChange={() => {}} // Handled by parent div
                      disabled={disabled}
                      className="form-check-input role-perm-checkbox mt-0.5 flex-shrink-0"
                      aria-label={`Select ${perm.name || perm.code}`}
                    />
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex align-items-center justify-content-between gap-1">
                        <span className="fw-semibold fs-13 text-white text-truncate">
                          {perm.name || perm.code}
                        </span>
                        {renderCategoryBadge(perm.category)}
                      </div>
                      {perm.description && (
                        <div className="fs-11 text-truncate mt-1" style={{ color: '#94a3b8' }} title={perm.description}>
                          {perm.description}
                        </div>
                      )}
                      <div className="fs-10 font-monospace mt-1" style={{ color: '#64748b' }}>
                        {perm.code}
                      </div>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </div>

      {/* Scoped Permission Selector CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        .perm-filter-input,
        .perm-filter-select {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          border-radius: 8px !important;
          height: 35px;
          color: #ffffff !important;
          box-shadow: none !important;
          transition: all 0.15s ease;
        }
        .perm-filter-input:focus,
        .perm-filter-select:focus {
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-color: #38bdf8 !important;
          color: #ffffff !important;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.15) !important;
        }
        .perm-filter-input::placeholder {
          color: #64748b !important;
        }
        .perm-filter-select option {
          background-color: #0f172a;
          color: #ffffff;
        }

        .permission-grid-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        .permission-grid-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .permission-grid-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }

        .permission-item-default {
          background-color: rgba(255, 255, 255, 0.03) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        .permission-item-default:hover {
          background-color: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
        .permission-item-checked {
          background-color: rgba(14, 165, 233, 0.12) !important;
          border-color: rgba(56, 189, 248, 0.45) !important;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.08);
        }

        .role-perm-checkbox {
          cursor: pointer;
          background-color: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .role-perm-checkbox:checked {
          background-color: #0284c7;
          border-color: #0284c7;
        }

        /* Light mode overrides */
        body.light-mode .perm-filter-input,
        body.light-mode .perm-filter-select {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        body.light-mode .permission-grid-scroll {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .permission-item-default {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
        body.light-mode .permission-item-default:hover {
          background-color: #f1f5f9 !important;
        }
        body.light-mode .permission-item-checked {
          background-color: #e0f2fe !important;
          border-color: #38bdf8 !important;
        }
        body.light-mode .role-perm-checkbox {
          background-color: #ffffff;
          border-color: #cbd5e1;
        }
      `}} />
    </div>
  );
};

export default PermissionSelector;
