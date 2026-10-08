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

  return (
    <div className="permission-selector-wrapper">
      {/* Header with Title and Controls */}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
        <div className="d-flex align-items-center gap-2">
          <span className="fw-semibold text-dark fs-14">Permissions</span>
          <Badge bg="primary" pill className="fs-11">
            {selectedSet.size} selected
          </Badge>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button 
            variant="link" 
            size="sm" 
            className="p-0 text-decoration-none fs-12 text-primary"
            onClick={handleSelectAll}
            disabled={disabled || loading || filteredPermissions.length === 0}
          >
            Select All
          </Button>
          <span className="text-muted fs-12">|</span>
          <Button 
            variant="link" 
            size="sm" 
            className="p-0 text-decoration-none fs-12 text-secondary"
            onClick={handleClearAll}
            disabled={disabled || loading || selectedSet.size === 0}
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <Row className="g-2 mb-3">
        <Col xs={12} sm={7}>
          <InputGroup size="sm">
            <InputGroup.Text className="bg-light border-end-0">
              <Search size={14} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-start-0"
              disabled={disabled || loading}
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
        </Col>

        {categories.length > 2 && (
          <Col xs={12} sm={5}>
            <Form.Select 
              size="sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={disabled || loading}
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Categories' : `${c.charAt(0).toUpperCase() + c.slice(1)}`}
                </option>
              ))}
            </Form.Select>
          </Col>
        )}
      </Row>

      {/* Permissions 2-Column Grid */}
      <div 
        className="permission-grid-scroll overflow-auto p-3 border rounded bg-white" 
        style={{ maxHeight: '420px', minHeight: '220px' }}
      >
        {loading ? (
          <div className="text-center py-5 text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            <span className="fs-13">Loading permissions catalog...</span>
          </div>
        ) : error ? (
          <div className="alert alert-warning py-2 px-3 fs-13 mb-0">
            {error}
          </div>
        ) : filteredPermissions.length === 0 ? (
          <div className="text-center py-4 text-muted fs-13">
            No permissions matching filter.
          </div>
        ) : (
          <Row className="g-3">
            {filteredPermissions.map((perm) => {
              const isChecked = selectedSet.has(perm.code);
              return (
                <Col xs={12} md={6} key={perm.code}>
                  <div 
                    className={`permission-item p-2 rounded border d-flex align-items-start gap-2 ${
                      isChecked ? 'border-primary bg-primary-subtle' : 'border-light-subtle bg-light'
                    }`}
                    style={{ 
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => !disabled && handleToggle(perm.code)}
                  >
                    <Form.Check 
                      type="checkbox"
                      id={`perm-check-${perm.code}`}
                      checked={isChecked}
                      onChange={() => {}} // Handled by parent div
                      disabled={disabled}
                      className="mt-1"
                    />
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="fw-semibold fs-13 text-dark text-truncate">
                          {perm.name || perm.code}
                        </span>
                        {perm.category && (
                          <Badge bg="secondary" className="fs-10 text-capitalize ms-1 opacity-75">
                            {perm.category}
                          </Badge>
                        )}
                      </div>
                      {perm.description && (
                        <div className="fs-11 text-muted text-truncate mt-1" title={perm.description}>
                          {perm.description}
                        </div>
                      )}
                      <div className="fs-10 font-monospace text-secondary opacity-75 mt-0">
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
    </div>
  );
};

export default PermissionSelector;
