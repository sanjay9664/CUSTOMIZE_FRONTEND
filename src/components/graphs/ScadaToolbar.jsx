/**
 * ScadaToolbar - Reusable SCADA graph controls toolbar
 *
 * Props:
 *   rangePresets       [{ id, label }]        preset options
 *   rangePreset        string                 currently active preset id
 *   onRangeChange      (preset) => void       called on preset selection (preset = { id, label, defaultInterval? })
 *   customStartDate    string                 pending start (YYYY-MM-DD)
 *   customEndDate      string                 pending end   (YYYY-MM-DD)
 *   onCustomStartChange (val) => void
 *   onCustomEndChange   (val) => void
 *   onApplyCustom       () => void            called when Apply is clicked
 *   intervals          [{ label, value }]     interval options
 *   activeInterval     string
 *   onIntervalChange   (value) => void
 *   searchTerm         string
 *   onSearchChange     (val) => void
 *   gridColumns        number                 1 or 2
 *   onGridColumnsChange (n) => void
 *   loading            bool                   disables Apply while fetching
 *   getTodayIst        () => string           returns today YYYY-MM-DD in IST (injected to avoid circular dep)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Calendar, Search, Grid, Columns, Check } from 'lucide-react';
import './ScadaToolbar.css';

const ScadaToolbar = ({
  rangePresets = [],
  rangePreset,
  onRangeChange,
  customStartDate,
  customEndDate,
  onCustomStartChange,
  onCustomEndChange,
  onApplyCustom,
  intervals = [],
  activeInterval,
  onIntervalChange,
  searchTerm = '',
  onSearchChange,
  gridColumns,
  onGridColumnsChange,
  loading = false,
  getTodayIst,
}) => {
  const [rangeOpen, setRangeOpen] = useState(false);
  const [intervalOpen, setIntervalOpen] = useState(false);

  const rangeRef = useRef(null);
  const intervalRef = useRef(null);

  // Close dropdowns on outside click
  const handleOutside = useCallback((e) => {
    if (rangeRef.current && !rangeRef.current.contains(e.target)) setRangeOpen(false);
    if (intervalRef.current && !intervalRef.current.contains(e.target)) setIntervalOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [handleOutside]);

  const activeRangeLabel = rangePresets.find(p => p.id === rangePreset)?.label || rangePreset;
  const activeIntervalLabel = intervals.find(i => i.value === activeInterval)?.label || activeInterval;
  const isCustom = rangePreset === 'custom';
  const todayStr = getTodayIst ? getTodayIst() : new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  return (
    <div className="scada-toolbar">

      {/* -- Range Dropdown -- */}
      <div className={`scada-tb-dropdown${rangeOpen ? ' is-open' : ''}`} ref={rangeRef}>
        <button
          className={`scada-tb-pill${isCustom ? ' active' : ''}`}
          onClick={() => { setRangeOpen(o => !o); setIntervalOpen(false); }}
          aria-expanded={rangeOpen}
          aria-haspopup="listbox"
          title="Select time range"
        >
          <Calendar size={13} style={{ opacity: 0.7, flexShrink: 0 }} />
          <span className="scada-tb-pill-value">{activeRangeLabel}</span>
          <ChevronDown size={13} className="scada-tb-chevron" />
        </button>

        {rangeOpen && (
          <div className="scada-tb-menu" role="listbox" aria-label="Time range">
            {rangePresets.map(p => (
              <button
                key={p.id}
                className={`scada-tb-menu-item${rangePreset === p.id ? ' selected' : ''}`}
                role="option"
                aria-selected={rangePreset === p.id}
                onClick={() => {
                  setRangeOpen(false);
                  onRangeChange?.(p);
                }}
              >
                {p.id === 'custom' && <Calendar size={12} style={{ opacity: 0.6, flexShrink: 0 }} />}
                {p.label}
                {rangePreset === p.id && p.id !== 'custom' && (
                  <Check size={12} style={{ marginLeft: 'auto', color: '#06b6d4' }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* -- Custom Date Row (shown inline when Custom is active) -- */}
      {isCustom && (
        <div className="scada-tb-custom-dates">
          <span className="scada-tb-date-label">From</span>
          <input
            type="date"
            className="scada-tb-date-input"
            value={customStartDate}
            max={customEndDate || todayStr}
            onChange={e => onCustomStartChange?.(e.target.value)}
          />
          <span className="scada-tb-date-label">To</span>
          <input
            type="date"
            className="scada-tb-date-input"
            value={customEndDate}
            min={customStartDate}
            max={todayStr}
            onChange={e => onCustomEndChange?.(e.target.value)}
          />
          <button
            className="scada-tb-apply-btn"
            onClick={onApplyCustom}
            disabled={loading || !customStartDate || !customEndDate}
          >
            Apply
          </button>
        </div>
      )}

      <div className="scada-tb-sep" />

      {/* -- Interval Dropdown -- */}
      {intervals.length > 0 && (
        <div className={`scada-tb-dropdown${intervalOpen ? ' is-open' : ''}`} ref={intervalRef}>
          <button
            className="scada-tb-pill"
            onClick={() => { setIntervalOpen(o => !o); setRangeOpen(false); }}
            aria-expanded={intervalOpen}
            aria-haspopup="listbox"
            title="Select sampling interval"
          >
            <span className="scada-tb-pill-value">{activeIntervalLabel}</span>
            <ChevronDown size={13} className="scada-tb-chevron" />
          </button>

          {intervalOpen && (
            <div className="scada-tb-menu" role="listbox" aria-label="Sampling interval">
              {intervals.map(opt => (
                <button
                  key={opt.value}
                  className={`scada-tb-menu-item${activeInterval === opt.value ? ' selected' : ''}`}
                  role="option"
                  aria-selected={activeInterval === opt.value}
                  onClick={() => {
                    setIntervalOpen(false);
                    onIntervalChange?.(opt.value);
                  }}
                >
                  {opt.label}
                  {activeInterval === opt.value && (
                    <Check size={12} style={{ marginLeft: 'auto', color: '#06b6d4' }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -- Right: Search + Layout -- */}
      <div className="scada-tb-right">
        {onSearchChange && (
          <div className="scada-tb-search-wrap">
            <Search size={13} style={{ color: '#475569', flexShrink: 0 }} />
            <input
              className="scada-tb-search-input"
              placeholder="Filter parameters..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              aria-label="Filter graph parameters"
            />
          </div>
        )}

        {onGridColumnsChange && (
          <>
            <button
              className={`scada-tb-layout-btn${gridColumns === 2 ? ' active' : ''}`}
              onClick={() => onGridColumnsChange(2)}
              title="2-column grid"
              aria-label="2-column grid layout"
            >
              <Grid size={14} />
            </button>
            <button
              className={`scada-tb-layout-btn${gridColumns === 1 ? ' active' : ''}`}
              onClick={() => onGridColumnsChange(1)}
              title="1-column full width"
              aria-label="1-column full width layout"
            >
              <Columns size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ScadaToolbar;
