import React, { useState, useRef, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { Filter, X, ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react';

/**
 * CommonFilterPopover Component
 * 
 * High-performance, SCADA-grade filter popover component built with modern UI/UX principles:
 * - Clear visual hierarchy and contrast
 * - Dedicated accessible input wrappers with hover/focus states
 * - Dedicated clear button per field without layout shifts
 * - Dynamic dependency-aware cascading options
 * - Zero clipping with high z-index and portal-safe positioning
 */
const CommonFilterPopover = ({
  buttonLabel = 'Device filter',
  buttonIcon,
  filters = [],
  values = {},
  onApply,
  onReset,
  extraHeader,
  align = 'left',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftValues, setDraftValues] = useState(values);
  const popoverRef = useRef(null);

  // Sync draft values whenever values prop changes or popover opens
  useEffect(() => {
    if (isOpen) {
      setDraftValues({ ...values });
    }
  }, [isOpen, values]);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  // Evaluate filters dynamically if passed as a function
  const resolvedFilters = typeof filters === 'function' ? filters(draftValues) : filters;

  const handleFieldChange = (filterId, val) => {
    setDraftValues(prev => {
      let next = { ...prev, [filterId]: val };
      const filterDef = resolvedFilters.find(f => f.id === filterId);
      if (typeof filterDef?.onChange === 'function') {
        next = filterDef.onChange(val, next);
      }
      return next;
    });
  };

  const handleClearField = (e, filterId, defaultVal = 'ALL') => {
    e.stopPropagation();
    handleFieldChange(filterId, defaultVal);
  };

  const handleReset = () => {
    const resetVals = {};
    resolvedFilters.forEach(f => {
      const opts = typeof f.options === 'function' ? f.options(draftValues) : (f.options || []);
      resetVals[f.id] = opts[0]?.value || 'ALL';
    });
    setDraftValues(resetVals);
    if (typeof onReset === 'function') {
      onReset();
    }
  };

  const handleCancel = () => {
    setDraftValues({ ...values });
    setIsOpen(false);
  };

  const handleUpdate = () => {
    if (typeof onApply === 'function') {
      onApply(draftValues);
    }
    setIsOpen(false);
  };

  // Calculate active filter count
  const activeCount = resolvedFilters.reduce((acc, f) => {
    const val = values[f.id];
    const opts = typeof f.options === 'function' ? f.options(values) : (f.options || []);
    const defaultVal = opts[0]?.value || 'ALL';
    return (val && val !== 'ALL' && val !== defaultVal) ? acc + 1 : acc;
  }, 0);

  return (
    <div className={`common-filter-popover-container position-relative d-inline-block ${className}`} ref={popoverRef}>
      <style>{`
        /* ── Trigger Button ── */
        .cfp-trigger-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1.5px solid #0d9488;
          background: transparent;
          color: #14b8a6;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none !important;
          user-select: none;
        }
        .cfp-trigger-btn:hover, .cfp-trigger-btn.is-active {
          background: rgba(13, 148, 136, 0.14);
          border-color: #14b8a6;
          color: #2dd4bf;
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.25);
        }
        body.light-mode .cfp-trigger-btn {
          border-color: #0d9488;
          color: #0f766e;
        }
        body.light-mode .cfp-trigger-btn:hover, body.light-mode .cfp-trigger-btn.is-active {
          background: rgba(13, 148, 136, 0.08);
          border-color: #0d9488;
          color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.18);
        }

        .cfp-badge {
          background: #0d9488;
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 700;
          border-radius: 12px;
          padding: 2px 7px;
          line-height: 1;
        }

        /* ── Popover Panel Surface ── */
        .cfp-panel {
          position: absolute;
          top: calc(100% + 8px);
          ${align === 'right' ? 'right: 0;' : 'left: 0;'}
          z-index: 1060;
          width: 440px;
          max-width: calc(100vw - 32px);
          background: linear-gradient(170deg, #0d1527 0%, #090e1a 100%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.85), 0 0 30px rgba(13, 148, 136, 0.12);
          padding: 16px 18px;
          animation: cfpFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        body.light-mode .cfp-panel {
          background: #ffffff;
          border-color: #e2e8f0;
          box-shadow: 0 20px 45px -8px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        @keyframes cfpFadeIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Header Title Bar ── */
        .cfp-title-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          margin-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        body.light-mode .cfp-title-bar {
          border-bottom-color: #f1f5f9;
        }

        .cfp-title-text {
          font-size: 0.9rem;
          font-weight: 700;
          color: #f8fafc;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        body.light-mode .cfp-title-text {
          color: #0f172a;
        }

        .cfp-title-icon {
          color: #14b8a6;
        }

        .cfp-btn-clear-all {
          background: transparent;
          border: none;
          color: #0d9488;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
          transition: all 0.15s ease;
        }
        .cfp-btn-clear-all:hover {
          color: #2dd4bf;
          background: rgba(20, 184, 166, 0.1);
        }
        body.light-mode .cfp-btn-clear-all {
          color: #0d9488;
        }
        body.light-mode .cfp-btn-clear-all:hover {
          color: #0f766e;
          background: #f0fdf4;
        }

        /* ── Filter Item Rows ── */
        .cfp-filters-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
        }

        .cfp-filter-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          width: 100%;
        }

        .cfp-filter-label {
          font-size: 0.86rem;
          font-weight: 600;
          color: #cbd5e1;
          width: 90px;
          flex-shrink: 0;
          letter-spacing: 0.01em;
        }
        body.light-mode .cfp-filter-label {
          color: #334155;
        }

        .cfp-filter-input-box {
          flex: 1;
          display: flex;
          align-items: center;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 8px;
          padding: 2px 8px;
          position: relative;
          transition: all 0.2s ease;
          min-height: 38px;
        }
        body.light-mode .cfp-filter-input-box {
          background: #ffffff;
          border-color: #cbd5e1;
        }
        .cfp-filter-input-box:focus-within {
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.22);
        }
        body.light-mode .cfp-filter-input-box:focus-within {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.18);
        }

        .cfp-select {
          width: 100%;
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          font-size: 0.86rem !important;
          font-weight: 500 !important;
          color: #f8fafc !important;
          padding: 6px 36px 6px 6px !important;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
        }
        body.light-mode .cfp-select {
          color: #0f172a !important;
        }
        .cfp-select option {
          background: #0f172a;
          color: #f8fafc;
          padding: 6px;
        }
        body.light-mode .cfp-select option {
          background: #ffffff;
          color: #0f172a;
        }

        /* Dedicated Clear Button */
        .cfp-clear-btn {
          position: absolute;
          right: 30px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 0;
          z-index: 2;
        }
        .cfp-clear-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }
        body.light-mode .cfp-clear-btn {
          background: #f1f5f9;
          color: #64748b;
        }
        body.light-mode .cfp-clear-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .cfp-chevron {
          position: absolute;
          right: 12px;
          pointer-events: none;
          color: #64748b;
        }

        /* ── Extra Header Row ── */
        .cfp-extra-header {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        body.light-mode .cfp-extra-header {
          border-top-color: #f1f5f9;
        }

        /* ── Footer Action Bar ── */
        .cfp-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        body.light-mode .cfp-footer {
          border-top-color: #f1f5f9;
        }

        .cfp-btn-reset {
          background: transparent;
          border: none;
          color: #2dd4bf;
          font-size: 0.86rem;
          font-weight: 600;
          cursor: pointer;
          padding: 6px 4px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: color 0.15s ease;
        }
        .cfp-btn-reset:hover {
          color: #5eead4;
          text-decoration: underline;
        }
        body.light-mode .cfp-btn-reset {
          color: #0d9488;
        }
        body.light-mode .cfp-btn-reset:hover {
          color: #0f766e;
        }

        .cfp-footer-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cfp-btn-cancel {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #94a3b8;
          font-size: 0.86rem;
          font-weight: 600;
          cursor: pointer;
          padding: 7px 16px;
          border-radius: 8px;
          transition: all 0.15s ease;
        }
        .cfp-btn-cancel:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #f8fafc;
        }
        body.light-mode .cfp-btn-cancel {
          border-color: #cbd5e1;
          color: #64748b;
        }
        body.light-mode .cfp-btn-cancel:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .cfp-btn-update {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          color: #ffffff;
          border: none;
          font-size: 0.86rem;
          font-weight: 600;
          padding: 8px 22px;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cfp-btn-update:hover {
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
          box-shadow: 0 6px 18px rgba(20, 184, 166, 0.45);
          transform: translateY(-1px);
        }
        .cfp-btn-update:active {
          transform: translateY(0);
        }
      `}</style>

      {/* Trigger Button */}
      <button
        type="button"
        className={`cfp-trigger-btn ${isOpen ? 'is-active' : ''}`}
        onClick={handleToggle}
        aria-expanded={isOpen}
      >
        {buttonIcon || <Filter size={15} />}
        <span>{buttonLabel}</span>
        {activeCount > 0 && (
          <span className="cfp-badge">{activeCount}</span>
        )}
      </button>

      {/* Filter Popover Panel */}
      {isOpen && (
        <div className="cfp-panel">
          {/* Title Bar */}
          <div className="cfp-title-bar">
            <span className="cfp-title-text">
              <SlidersHorizontal size={15} className="cfp-title-icon" />
              <span>{buttonLabel}</span>
              {activeCount > 0 && (
                <span className="cfp-badge ms-1">{activeCount}</span>
              )}
            </span>
            {activeCount > 0 && (
              <button
                type="button"
                className="cfp-btn-clear-all"
                onClick={handleReset}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Filter Rows */}
          <div className="cfp-filters-body">
            {resolvedFilters.map((filter) => {
              const opts = typeof filter.options === 'function' ? filter.options(draftValues) : (filter.options || []);
              const defaultVal = opts[0]?.value || 'ALL';
              const currentValue = draftValues[filter.id] ?? defaultVal;
              const isNonDefault = currentValue !== 'ALL' && currentValue !== defaultVal && currentValue !== '';
              const allowClear = filter.allowClear !== false;

              return (
                <div key={filter.id} className="cfp-filter-item">
                  <span className="cfp-filter-label">{filter.label}</span>
                  <div className="cfp-filter-input-box">
                    <Form.Select
                      size="sm"
                      className="cfp-select"
                      value={currentValue}
                      onChange={(e) => handleFieldChange(filter.id, e.target.value)}
                    >
                      {opts.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Form.Select>
                    {isNonDefault && allowClear && (
                      <button
                        type="button"
                        className="cfp-clear-btn"
                        onClick={(e) => handleClearField(e, filter.id, defaultVal)}
                        title="Clear this filter"
                        aria-label="Clear this filter"
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    )}
                    <ChevronDown size={14} className="cfp-chevron" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Optional Extra Header Row */}
          {extraHeader && (
            <div className="cfp-extra-header">
              {extraHeader}
            </div>
          )}

          {/* Footer Actions */}
          <div className="cfp-footer">
            <button
              type="button"
              className="cfp-btn-reset"
              onClick={handleReset}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
            <div className="cfp-footer-actions">
              <button
                type="button"
                className="cfp-btn-cancel"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cfp-btn-update"
                onClick={handleUpdate}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommonFilterPopover;
