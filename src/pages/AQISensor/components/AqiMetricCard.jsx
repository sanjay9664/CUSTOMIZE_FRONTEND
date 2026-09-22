import React from 'react';
import { Card } from 'react-bootstrap';
import { useTheme } from '../../../context/ThemeContext';

/**
 * Reusable Props-Based AQI Metric Card Component
 * 
 * @param {Object} props
 * @param {Object} props.setting - Setting metadata (displayName, unit, limits)
 * @param {Object} [props.telemetry] - Live telemetry reading (value, rawValue, status, isWarning, isCritical, unit)
 * @param {Object} [props.displayConfig] - Visual configuration (badgeText, badgeClass, sublabel, icon, decimals)
 * @param {boolean} [props.isConfigured=true] - Whether the sensor/setting is mapped
 * @param {Function} [props.onClick] - Optional click handler
 */
const AqiMetricCard = ({
  setting = {},
  telemetry = {},
  displayConfig = {},
  isConfigured = true,
  onClick
}) => {
  const { isDark } = useTheme();

  const displayName = setting.displayName || setting.name || displayConfig.title || 'Metric';
  const unit = telemetry.unit !== undefined && telemetry.unit !== null && telemetry.unit !== ''
    ? telemetry.unit
    : (setting.unit || displayConfig.defaultUnit || '');

  const value = telemetry.value !== undefined ? telemetry.value : null;

  const {
    badgeText = '',
    badgeClass = 'aqi-badge-pm',
    sublabel = '',
    icon = null,
    decimals = 1,
    className = ''
  } = displayConfig;

  const status = telemetry.status || 'default';
  const isAlert = status === 'alert' || telemetry.isCritical;
  const isWarning = status === 'warning' || telemetry.isWarning;

  // Format value safely
  let formattedValue = '—';
  if (isConfigured && value !== null && value !== undefined) {
    const num = Number(value);
    if (!isNaN(num)) {
      formattedValue = num.toLocaleString('en-IN', {
        minimumFractionDigits: Number.isInteger(num) && decimals === 0 ? 0 : Math.min(decimals, 1),
        maximumFractionDigits: decimals
      });
    } else {
      formattedValue = String(value);
    }
  }

  // Threshold alert glow styling
  let cardStyle = {};
  if (isAlert) {
    cardStyle = {
      borderColor: 'rgba(239, 68, 68, 0.45)',
      boxShadow: '0 0 15px rgba(239, 68, 68, 0.25)',
      borderLeft: '4px solid #ef4444'
    };
  } else if (isWarning) {
    cardStyle = {
      borderColor: 'rgba(245, 158, 11, 0.45)',
      boxShadow: '0 0 15px rgba(245, 158, 11, 0.25)',
      borderLeft: '4px solid #f59e0b'
    };
  }

  return (
    <Card
      className={`aqi-card aqi-metric-card h-100 ${className} ${onClick ? 'cursor-pointer' : ''}`}
      style={cardStyle}
      onClick={onClick}
    >
      <div className="d-flex align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2">
          {badgeText && (
            <span className={`aqi-badge ${badgeClass}`}>{badgeText}</span>
          )}
          {icon}
          <span className="aqi-metric-title text-truncate" title={displayName}>
            {displayName}
          </span>
        </div>
        {isAlert && (
          <span className="badge bg-danger bg-opacity-20 text-danger border border-danger border-opacity-25 px-1.5 py-0.5 fs-10">
            ALERT
          </span>
        )}
        {!isAlert && isWarning && (
          <span className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-25 px-1.5 py-0.5 fs-10">
            WARN
          </span>
        )}
      </div>

      <div className="aqi-metric-value-row my-auto py-2">
        <span
          className={`aqi-metric-value ${isAlert ? 'text-danger' : isWarning ? 'text-warning' : ''}`}
          style={{ color: !isAlert && !isWarning ? (isDark ? '#f8fafc' : '#0f172a') : undefined }}
        >
          {formattedValue}
        </span>
        {formattedValue !== '—' && unit && (
          <span className="aqi-metric-unit ms-1">{unit}</span>
        )}
      </div>

      {sublabel && (
        <div className="aqi-metric-sublabel text-truncate mt-auto" title={sublabel}>
          {sublabel}
        </div>
      )}
    </Card>
  );
};

export default React.memo(AqiMetricCard);
