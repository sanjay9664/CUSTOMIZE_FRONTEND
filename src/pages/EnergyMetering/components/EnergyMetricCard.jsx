import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { formatTelemetryValue } from '../utils/energyTelemetryAdapter';

/**
 * Reusable Props-Based Energy Metric Card
 * 
 * @param {Object} props
 * @param {Object} props.setting - Setting metadata (displayName, unit, limits)
 * @param {Object} [props.telemetry] - Live telemetry reading (value, rawValue, time, status, isWarning, isCritical)
 * @param {Object} [props.displayConfig] - Optional visual styling overrides (icon, accentColor, isImportant, decimals)
 * @param {boolean} [props.isConfigured=true] - Whether the meter/setting is properly mapped and configured
 * @param {Function} [props.onClick] - Optional click handler
 */
const EnergyMetricCard = ({
  setting = {},
  telemetry = {},
  displayConfig = {},
  isConfigured = true,
  onClick
}) => {
  const { isDark } = useTheme();

  const displayName = setting.displayName || setting.name || 'Parameter';
  const unit = telemetry.unit !== undefined && telemetry.unit !== null && telemetry.unit !== ''
    ? telemetry.unit
    : (setting.unit || '');
  const value = telemetry.value !== undefined ? telemetry.value : null;

  const {
    icon = null,
    accentColor = '#10b981',
    isImportant = false,
    decimals = 2,
    compact = false
  } = displayConfig;

  // Determine card status: alert, warning, normal, or default
  const status = telemetry.status || 'default';
  const isAlert = status === 'alert' || telemetry.isCritical;
  const isWarning = status === 'warning' || telemetry.isWarning;
  const isNormal = status === 'normal';

  // Value formatting
  let displayValue = '--';
  if (isConfigured) {
    if (value !== null && value !== undefined) {
      if (displayName.toUpperCase().includes('BALANCE')) {
        const numStr = formatTelemetryValue(value, decimals);
        displayValue = numStr !== '--' ? `₹${numStr}` : '--';
      } else {
        const numStr = formatTelemetryValue(value, decimals);
        displayValue = numStr !== '--' ? (unit ? `${numStr} ${unit}` : numStr) : '--';
      }
    } else {
      displayValue = '—';
    }
  }

  // Visual styles
  let borderStyle = !isConfigured
    ? {
        border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff'
      }
    : {
        borderLeft: `4px solid ${accentColor}`,
        borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
        borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
        background: isDark ? 'rgba(15, 23, 42, 0.55)' : '#ffffff',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      };

  let textClass = !isConfigured ? 'text-secondary' : (isImportant ? 'text-warning' : 'text-white');

  if (isConfigured) {
    if (isAlert) {
      borderStyle = {
        ...borderStyle,
        borderColor: 'rgba(239, 68, 68, 0.4)',
        borderLeft: '4px solid #ef4444',
        boxShadow: '0 0 12px rgba(239, 68, 68, 0.25)'
      };
      textClass = 'text-danger';
    } else if (isWarning) {
      borderStyle = {
        ...borderStyle,
        borderColor: 'rgba(245, 158, 11, 0.4)',
        borderLeft: '4px solid #f59e0b',
        boxShadow: '0 0 12px rgba(245, 158, 11, 0.25)'
      };
      textClass = 'text-warning';
    } else if (isNormal) {
      borderStyle = {
        ...borderStyle,
        borderColor: 'rgba(16, 185, 129, 0.35)',
        borderLeft: '4px solid #10b981',
        boxShadow: '0 0 10px rgba(16, 185, 129, 0.15)'
      };
      textClass = isImportant ? 'text-warning' : (isDark ? 'text-white' : 'text-dark');
    }
  }

  // Threshold info hint if available on setting
  const hasThresholds = isConfigured && (
    setting.warningHigh !== undefined ||
    setting.criticalHigh !== undefined ||
    setting.warningLow !== undefined ||
    setting.criticalLow !== undefined
  );

  return (
    <div
      className={`p-2.5 parameter-glass-card rounded-3 h-100 d-flex flex-column align-items-center justify-content-center text-center ${onClick ? 'cursor-pointer' : ''}`}
      style={borderStyle}
      onClick={onClick}
    >
      <div
        className="d-flex align-items-center justify-content-center gap-1.5 mb-1 w-100"
        style={{ opacity: isConfigured ? 1 : 0.6 }}
      >
        {icon}
        <small
          className="text-secondary uppercase fw-bold tracking-wider text-truncate"
          style={{ fontSize: compact ? '0.62rem' : '0.68rem', maxWidth: '90%' }}
          title={displayName}
        >
          {displayName}
        </small>
      </div>

      <h5
        className={`mb-0 fw-bold font-monospace tracking-wide ${textClass}`}
        style={{ fontSize: compact ? '0.85rem' : '0.95rem' }}
      >
        {displayValue}
      </h5>

      {hasThresholds && (
        <div
          className="fs-10 text-secondary font-monospace mt-1 text-center"
          style={{ opacity: 0.7, fontSize: '0.62rem' }}
        >
          {setting.warningLow !== undefined && setting.warningLow !== null && `L: <${setting.warningLow}`}
          {setting.warningHigh !== undefined && setting.warningHigh !== null && ` H: >${setting.warningHigh}`}
        </div>
      )}
    </div>
  );
};

export default React.memo(EnergyMetricCard);
