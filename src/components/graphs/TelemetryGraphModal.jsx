import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { Calendar, Activity } from 'lucide-react';
import { bmsService } from '../../services/bmsService';
import { useTheme } from '../../hooks/useTheme';
import {
  RANGE_PRESETS,
  SAMPLING_INTERVALS,
  GRAPH_PALETTES,
  calculateDateRange,
  getTodayIstDateString,
  downsampleSnapsTo30Min
} from '../../utils/scadaGraphUtils';
import TelemetryGraphCard from './TelemetryGraphCard';

const DEFAULT_INTERVALS = [
  { label: '15-Min', value: 'MIN_15' },
  { label: '30-Min', value: 'MIN_30' },
  { label: 'Hourly', value: 'HOURLY' },
  { label: 'Daily', value: 'DAILY' }
];

/**
 * Common Unified SCADA Telemetry Graph Modal
 * Provides full-screen 98vw / 94vh viewing, zero-shift controls,
 * custom date search, and horizontal infinite scroll pagination.
 */
export const TelemetryGraphModal = ({
  show,
  onHide,
  setting,
  siteId,
  deviceId,
  initialInterval = 'MIN_15',
  initialRangePreset = 'last24h',
  initialCustomStartDate = '',
  initialCustomEndDate = '',
  initialChartType = 'area',
  colorScheme = null,
  intervals = DEFAULT_INTERVALS,
  rangePresets = RANGE_PRESETS
}) => {
  const { isDark } = useTheme();
  const [modalInterval, setModalInterval] = useState(initialInterval);
  const [modalRangePreset, setModalRangePreset] = useState(initialRangePreset);
  const [modalCustomStartDate, setModalCustomStartDate] = useState(initialCustomStartDate || getTodayIstDateString());
  const [modalCustomEndDate, setModalCustomEndDate] = useState(initialCustomEndDate || getTodayIstDateString());
  const [modalChartType, setModalChartType] = useState(initialChartType);

  const [modalSnapshots, setModalSnapshots] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Infinite scrolling pagination state
  const [modalPage, setModalPage] = useState(1);
  const [modalHasMore, setModalHasMore] = useState(false);
  const [modalLoadingMore, setModalLoadingMore] = useState(false);
  const [modalNextFrom, setModalNextFrom] = useState(null);
  const [modalTargetTo, setModalTargetTo] = useState(null);

  const activeColorScheme = useMemo(() => {
    return colorScheme || setting?.colorScheme || GRAPH_PALETTES[0];
  }, [colorScheme, setting]);

  // Synchronize initial state when modal opens
  useEffect(() => {
    if (!show || !setting) return;

    setModalInterval(initialInterval);
    setModalRangePreset(initialRangePreset);
    setModalCustomStartDate(initialCustomStartDate || getTodayIstDateString());
    setModalCustomEndDate(initialCustomEndDate || getTodayIstDateString());
    setModalChartType(initialChartType);
    setModalError(null);
    setModalPage(1);

    const initialSnaps = setting.snapshots || [];
    setModalSnapshots(initialSnaps);

    const { to } = calculateDateRange(
      initialRangePreset,
      initialCustomStartDate || getTodayIstDateString(),
      initialCustomEndDate || getTodayIstDateString()
    );
    setModalTargetTo(to);

    // If initial snapshots have not yet reached the end of the date range, enable infinite scrolling
    if (initialSnaps.length > 0) {
      const lastSnap = initialSnaps[initialSnaps.length - 1];
      const lastTime = lastSnap?.windowEnd || lastSnap?.windowStart || lastSnap?.timestamp;
      const lastDate = lastTime ? new Date(lastTime) : null;
      const targetEndDate = new Date(to);
      if (lastDate && targetEndDate && (targetEndDate.getTime() - lastDate.getTime() > 30 * 60 * 1000)) {
        setModalHasMore(true);
        setModalNextFrom(new Date(lastDate.getTime() + 1000).toISOString());
      } else {
        setModalHasMore(false);
      }
    } else {
      setModalHasMore(false);
    }
  }, [show, setting, initialInterval, initialRangePreset, initialCustomStartDate, initialCustomEndDate, initialChartType]);

  // Fetch telemetry snapshots on interval or range preset change
  const fetchModalSnapshots = useCallback(async (targetInterval, targetRange, customStart, customEnd) => {
    if (!siteId || !deviceId || !setting) return;

    setModalLoading(true);
    setModalError(null);
    setModalPage(1);
    setModalHasMore(false);
    setModalLoadingMore(false);

    try {
      const activeStart = customStart || modalCustomStartDate;
      const activeEnd = customEnd || modalCustomEndDate;
      const { from, to } = calculateDateRange(targetRange, activeStart, activeEnd);
      const backendInterval = targetInterval === 'MIN_30' ? 'MIN_15' : targetInterval;
      setModalTargetTo(to);

      const limitSize = 1000;
      const params = {
        interval: backendInterval,
        from,
        to,
        limit: limitSize,
        page: 1
      };

      if (setting.settingId && !isNaN(Number(setting.settingId))) {
        params.settingId = Number(setting.settingId);
      } else if (setting.fieldKey) {
        params.fieldKey = setting.fieldKey;
      }

      const res = await bmsService.getDeviceTelemetrySnapshots(siteId, deviceId, params);
      const dataObj = res?.data || res || {};
      const rawSnaps = dataObj.snapshots || (Array.isArray(dataObj.settings) && dataObj.settings[0]?.snapshots) || [];
      const rawCount = rawSnaps.length;

      let snaps = rawSnaps;
      if (targetInterval === 'MIN_30' && Array.isArray(snaps)) {
        snaps = downsampleSnapsTo30Min(snaps);
      }

      setModalSnapshots(snaps);

      // Check against raw backend count before client downsampling
      if (rawCount >= limitSize) {
        const lastRawSnap = rawSnaps[rawCount - 1];
        const lastTime = lastRawSnap?.windowEnd || lastRawSnap?.windowStart || lastRawSnap?.timestamp;
        const lastDate = lastTime ? new Date(lastTime) : null;
        const targetEndDate = new Date(to);

        if (lastDate && targetEndDate && (targetEndDate.getTime() - lastDate.getTime() > 30 * 60 * 1000)) {
          setModalHasMore(true);
          setModalNextFrom(new Date(lastDate.getTime() + 1000).toISOString());
        } else {
          setModalHasMore(false);
        }
      } else {
        setModalHasMore(false);
      }
    } catch (err) {
      console.error('[TelemetryGraphModal] Fetch error:', err);
      setModalError(err?.message || 'Failed to update graph data.');
    } finally {
      setModalLoading(false);
    }
  }, [siteId, deviceId, setting, modalCustomStartDate, modalCustomEndDate]);

  // Load next chunk when scrolling horizontally near the end
  const handleLoadMore = useCallback(async () => {
    if (!modalHasMore || modalLoadingMore || modalLoading || !siteId || !deviceId || !setting || !modalNextFrom) {
      return;
    }

    setModalLoadingMore(true);
    try {
      const nextPage = modalPage + 1;
      const limitSize = 1000;
      const backendInterval = modalInterval === 'MIN_30' ? 'MIN_15' : modalInterval;
      // Use time cursor pagination starting from modalNextFrom
      const params = {
        interval: backendInterval,
        from: modalNextFrom,
        to: modalTargetTo,
        limit: limitSize,
        page: 1
      };

      if (setting.settingId && !isNaN(Number(setting.settingId))) {
        params.settingId = Number(setting.settingId);
      } else if (setting.fieldKey) {
        params.fieldKey = setting.fieldKey;
      }

      const res = await bmsService.getDeviceTelemetrySnapshots(siteId, deviceId, params);
      const dataObj = res?.data || res || {};
      const rawNewSnaps = dataObj.snapshots || (Array.isArray(dataObj.settings) && dataObj.settings[0]?.snapshots) || [];
      const rawNewCount = rawNewSnaps.length;

      let newSnaps = rawNewSnaps;
      if (modalInterval === 'MIN_30' && Array.isArray(newSnaps)) {
        newSnaps = downsampleSnapsTo30Min(newSnaps);
      }

      if (newSnaps.length > 0) {
        setModalSnapshots(prev => {
          const existingKeys = new Set(prev.map(s => s.windowStart || s.timestamp));
          const uniqueNew = newSnaps.filter(s => !existingKeys.has(s.windowStart || s.timestamp));
          return [...prev, ...uniqueNew];
        });

        const lastRawSnap = rawNewSnaps[rawNewCount - 1];
        const lastTime = lastRawSnap?.windowEnd || lastRawSnap?.windowStart || lastRawSnap?.timestamp;
        const lastDate = lastTime ? new Date(lastTime) : null;
        const targetEndDate = modalTargetTo ? new Date(modalTargetTo) : null;

        if (rawNewCount >= limitSize && lastDate && targetEndDate && (targetEndDate.getTime() - lastDate.getTime() > 30 * 60 * 1000)) {
          setModalHasMore(true);
          setModalNextFrom(new Date(lastDate.getTime() + 1000).toISOString());
          setModalPage(nextPage);
        } else {
          setModalHasMore(false);
        }
      } else {
        setModalHasMore(false);
      }
    } catch (err) {
      console.warn('[TelemetryGraphModal] Error loading more snapshots:', err);
    } finally {
      setModalLoadingMore(false);
    }
  }, [modalHasMore, modalLoadingMore, modalLoading, siteId, deviceId, setting, modalPage, modalInterval, modalNextFrom, modalTargetTo]);

  const modalSettingData = useMemo(() => {
    if (!setting) return null;
    return {
      ...setting,
      snapshots: modalSnapshots,
      interval: modalInterval,
      rangePreset: modalRangePreset
    };
  }, [setting, modalSnapshots, modalInterval, modalRangePreset]);

  if (!show || !setting) return null;

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      dialogClassName="modal-95w scada-expanded-modal"
    >
      <Modal.Header
        closeButton
        closeVariant={isDark ? "white" : undefined}
        className="px-4 py-3"
        style={{
          background: isDark ? '#080d19' : '#FFFFFF',
          borderBottom: isDark ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid #E2E8F0'
        }}
      >
        <div className="d-flex align-items-center justify-content-between w-100 pe-3 flex-wrap gap-3">
          {/* Left: Parameter Name & Unit Badge */}
          <div className="d-flex align-items-center gap-2.5 flex-shrink-0">
            <div
              style={{
                width: '4px',
                height: '24px',
                borderRadius: '2px',
                background: activeColorScheme.stroke,
                boxShadow: `0 0 10px ${activeColorScheme.stroke}aa`
              }}
            />
            <h5 className="mb-0 fs-5 fw-bold text-nowrap" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
              {setting.displayName || 'Telemetry Parameter'}
            </h5>
            {setting.unit && (
              <span className="scada-graph-unit">{setting.unit}</span>
            )}
          </div>

          {/* Right: Controls toolbar (Range Presets, Custom Date Range, Intervals, Chart Switcher) */}
          <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
            {/* Range Presets */}
            <div className="btn-group btn-group-sm flex-shrink-0" role="group" aria-label="Modal Time Range">
              {rangePresets.map(p => (
                <Button
                  key={p.id}
                  variant={modalRangePreset === p.id ? 'info' : 'outline-secondary'}
                  size="sm"
                  className="py-1 px-2.5 fs-8 fw-semibold"
                  onClick={() => {
                    setModalRangePreset(p.id);
                    if (p.id !== 'custom') {
                      fetchModalSnapshots(modalInterval, p.id, modalCustomStartDate, modalCustomEndDate);
                    }
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {/* Custom Date Range Picker */}
            {modalRangePreset === 'custom' && (
              <div
                className="d-flex align-items-center gap-1.5 px-2 py-1 rounded flex-shrink-0"
                style={{
                  backgroundColor: isDark ? '#000000' : '#FFFFFF',
                  border: isDark ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid #CBD5E1'
                }}
              >
                <Calendar size={13} className="text-info flex-shrink-0" />
                <span className="fs-8 fw-semibold" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>From:</span>
                <Form.Control
                  type="date"
                  size="sm"
                  value={modalCustomStartDate}
                  max={modalCustomEndDate || getTodayIstDateString()}
                  onChange={(e) => setModalCustomStartDate(e.target.value)}
                  className="py-0 px-1.5 fs-8 font-monospace rounded"
                  style={{
                    width: '125px',
                    height: '24px',
                    backgroundColor: isDark ? '#000000' : '#FFFFFF',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : '#CBD5E1'
                  }}
                />
                <span className="fs-8 fw-semibold" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>To:</span>
                <Form.Control
                  type="date"
                  size="sm"
                  value={modalCustomEndDate}
                  min={modalCustomStartDate}
                  max={getTodayIstDateString()}
                  onChange={(e) => setModalCustomEndDate(e.target.value)}
                  className="py-0 px-1.5 fs-8 font-monospace rounded"
                  style={{
                    width: '125px',
                    height: '24px',
                    backgroundColor: isDark ? '#000000' : '#FFFFFF',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : '#CBD5E1'
                  }}
                />
                <Button
                  variant="info"
                  size="sm"
                  className="py-0 px-2 fs-8 text-white fw-bold"
                  style={{ height: '24px' }}
                  onClick={() => fetchModalSnapshots(modalInterval, 'custom', modalCustomStartDate, modalCustomEndDate)}
                  disabled={modalLoading || !modalCustomStartDate || !modalCustomEndDate}
                  title="Apply custom date range"
                >
                  Apply
                </Button>
              </div>
            )}

            {/* Interval Selector */}
            <div className="btn-group btn-group-sm flex-shrink-0" role="group" aria-label="Modal Interval">
              {intervals.map(intOpt => (
                <Button
                  key={intOpt.value}
                  variant={modalInterval === intOpt.value ? 'primary' : 'outline-secondary'}
                  size="sm"
                  className="py-1 px-2.5 fs-8 fw-semibold"
                  onClick={() => {
                    setModalInterval(intOpt.value);
                    fetchModalSnapshots(intOpt.value, modalRangePreset);
                  }}
                >
                  {intOpt.label}
                </Button>
              ))}
            </div>

            {/* Chart Type Switcher */}
            <div className="btn-group btn-group-sm flex-shrink-0" role="group" aria-label="Modal Chart Switcher">
              <Button
                variant={modalChartType === 'area' ? 'info' : 'outline-secondary'}
                size="sm"
                className="py-1 px-2.5 fs-8"
                onClick={() => setModalChartType('area')}
              >
                Area
              </Button>
              <Button
                variant={modalChartType === 'line' ? 'info' : 'outline-secondary'}
                size="sm"
                className="py-1 px-2.5 fs-8"
                onClick={() => setModalChartType('line')}
              >
                Line
              </Button>
              <Button
                variant={modalChartType === 'bar' ? 'info' : 'outline-secondary'}
                size="sm"
                className="py-1 px-2.5 fs-8"
                onClick={() => setModalChartType('bar')}
              >
                Bar
              </Button>
            </div>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body style={{ background: isDark ? '#080d19' : '#F8FAFC', padding: '16px 20px', position: 'relative', flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
        {modalLoading && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(8, 13, 25, 0.75)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}>
            <Spinner animation="border" variant="info" style={{ width: '2.5rem', height: '2.5rem' }} className="mb-2" />
            <span className="text-info fs-8 fw-semibold tracking-wider text-uppercase">
              Updating Telemetry Snapshots (IST)...
            </span>
          </div>
        )}

        {modalError && (
          <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center justify-content-between fs-8">
            <span>{modalError}</span>
            <Button
              variant="outline-danger"
              size="sm"
              className="py-0.5 px-2 fs-9 fw-bold"
              onClick={() => fetchModalSnapshots(modalInterval, modalRangePreset)}
            >
              Retry
            </Button>
          </div>
        )}

        <div className="flex-grow-1 w-100" style={{ minHeight: '520px' }}>
          <TelemetryGraphCard
            setting={modalSettingData}
            interval={modalInterval}
            rangePreset={modalRangePreset}
            colorScheme={activeColorScheme}
            onExpand={() => {}}
            initialChartType={modalChartType}
            isExpanded={true}
            height={typeof window !== 'undefined' && window.innerHeight ? Math.max(Math.floor(window.innerHeight * 0.72), 520) : 580}
            hasMore={modalHasMore}
            isLoadingMore={modalLoadingMore}
            onLoadMore={handleLoadMore}
          />
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default TelemetryGraphModal;
