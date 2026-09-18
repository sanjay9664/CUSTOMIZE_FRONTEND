import React, { useState, useEffect } from 'react';
import { ChevronDown, Maximize2, Minimize2, Building2, Cpu } from 'lucide-react';
import './PageContextBanner.css';

/**
 * PageContextBanner - Reusable context sub-header for BMS/SCADA pages.
 * 
 * Sits directly between the main header and page content.
 * 
 * @param {Object} props
 * @param {string|React.ReactNode} [props.title] - Main title / entity name (e.g. "Main Grid Incomer Meter")
 * @param {string|React.ReactNode} [props.subtitle] - Secondary text or badge
 * @param {React.ReactNode} [props.icon] - Leading icon (e.g. <Zap />)
 * @param {string|React.ReactNode|Object} [props.status] - Status string ('online', 'offline', etc.) or custom element
 * @param {Object|React.ReactNode} [props.siteSelector] - Site dropdown { value, options: [{value, label}], onChange, placeholder, icon }
 * @param {Object|React.ReactNode} [props.deviceSelector] - Device dropdown { value, options: [{value, label}], onChange, placeholder, icon }
 * @param {Object|React.ReactNode} [props.selector] - Generic dropdown configuration
 * @param {Array} [props.selectors] - Array of custom selectors
 * @param {Array|React.ReactNode} [props.metadata] - Array of metadata pills [{ icon, label, value }] or custom node
 * @param {Array|React.ReactNode} [props.actions] - Array of action buttons [{ id, icon, label, title, onClick, disabled }] or custom node
 * @param {boolean} [props.enableFullscreen=false] - If true, displays a fullscreen toggle button
 * @param {React.RefObject} [props.fullscreenTargetRef] - Optional element ref to fullscreen
 * @param {'teal'|'scada'|'dark'} [props.variant='teal'] - Visual theme variant
 * @param {React.ReactNode} [props.children] - Additional custom content
 * @param {string} [props.className=''] - Extra CSS classes
 * @param {Object} [props.style={}] - Inline styles
 */
const PageContextBanner = ({
  title,
  subtitle,
  icon,
  status,
  siteSelector,
  deviceSelector,
  selector,
  selectors = [],
  metadata = [],
  actions = [],
  enableFullscreen = false,
  fullscreenTargetRef = null,
  variant = 'teal',
  children,
  className = '',
  style = {}
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        const target = fullscreenTargetRef?.current || document.documentElement;
        if (target.requestFullscreen) {
          target.requestFullscreen();
        } else if (target.webkitRequestFullscreen) {
          target.webkitRequestFullscreen();
        } else if (target.msRequestFullscreen) {
          target.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle not supported or allowed:', err);
    }
  };

  // Render status badge / indicator
  const renderStatus = () => {
    if (!status) return null;
    if (React.isValidElement(status)) return status;

    let statusText = '';
    let statusClass = 'status-default';

    if (typeof status === 'string') {
      statusText = status;
      const lower = status.toLowerCase();
      if (['online', 'running', 'active', 'ok', 'connected'].includes(lower)) {
        statusClass = 'status-online';
      } else if (['offline', 'stopped', 'disconnected'].includes(lower)) {
        statusClass = 'status-offline';
      } else if (['fault', 'error', 'danger', 'alarm'].includes(lower)) {
        statusClass = 'status-fault';
      } else if (['warning', 'alert', 'degraded'].includes(lower)) {
        statusClass = 'status-warning';
      } else if (['not configured', 'not mapped', 'unconfigured'].includes(lower)) {
        statusClass = 'status-not-configured';
      }
    } else if (typeof status === 'object') {
      statusText = status.text || status.label || '';
      statusClass = status.variant ? `status-${status.variant}` : 'status-online';
    }

    return (
      <span className={`context-banner-status-pill ${statusClass}`}>
        <span className="context-banner-status-dot" aria-hidden="true" />
        <span className="context-banner-status-text">{statusText}</span>
      </span>
    );
  };

  // Render single dropdown item with icon & chevron
  const renderSingleSelector = (sel, defaultIcon, defaultLabel, defaultKey) => {
    if (!sel) return null;
    if (React.isValidElement(sel)) return <React.Fragment key={defaultKey}>{sel}</React.Fragment>;

    const {
      value,
      options = [],
      onChange,
      placeholder,
      disabled = false,
      icon: selectorIcon = defaultIcon,
      label: selectorLabel = defaultLabel,
      ariaLabel,
      className: selClass = '',
      id
    } = sel;

    if (!Array.isArray(options) || options.length === 0) return null;

    return (
      <div key={id || defaultKey} className={`context-banner-selector-wrapper ${selClass}`}>
        {selectorIcon && (
          <span className="context-banner-selector-icon" aria-hidden="true">
            {selectorIcon}
          </span>
        )}
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={`context-banner-select ${selectorIcon ? 'has-icon' : ''}`}
          aria-label={ariaLabel || selectorLabel || 'Select option'}
        >
          {placeholder && !value && !options.some(opt => opt.value === "" || (opt.label || opt.name) === placeholder) && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt, idx) => (
            <option key={opt.value ?? idx} value={opt.value} className="context-banner-option">
              {opt.label || opt.name || opt.value}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="context-banner-select-arrow" aria-hidden="true" />
      </div>
    );
  };

  // Render all configured selectors (site, device, generic, or array)
  const renderSelectors = () => {
    const rendered = [];

    if (siteSelector) {
      rendered.push(
        renderSingleSelector(
          siteSelector,
          <Building2 size={16} className="text-emerald-300" />,
          'Site',
          'site-selector'
        )
      );
    }

    if (deviceSelector) {
      rendered.push(
        renderSingleSelector(
          deviceSelector,
          <Cpu size={16} className="text-emerald-300" />,
          'Device',
          'device-selector'
        )
      );
    }

    if (!deviceSelector && selector) {
      rendered.push(
        renderSingleSelector(
          selector,
          <Cpu size={15} className="text-emerald-300" />,
          'Selector',
          'main-selector'
        )
      );
    }

    if (Array.isArray(selectors) && selectors.length > 0) {
      selectors.forEach((s, idx) => {
        rendered.push(
          renderSingleSelector(s, null, `Selector ${idx + 1}`, `selector-${idx}`)
        );
      });
    }

    if (rendered.length === 0) return null;

    return <div className="context-banner-selectors-group">{rendered}</div>;
  };

  // Render metadata pills (e.g. Realtime - last 1 day)
  const renderMetadata = () => {
    if (!metadata) return null;
    if (React.isValidElement(metadata)) return metadata;

    const list = Array.isArray(metadata) ? metadata : [metadata];
    if (list.length === 0) return null;

    return (
      <div className="context-banner-meta-group">
        {list.map((item, idx) => {
          if (!item) return null;
          if (React.isValidElement(item)) {
            return <React.Fragment key={idx}>{item}</React.Fragment>;
          }

          return (
            <div
              key={item.key || item.id || idx}
              className="context-banner-meta-pill"
              title={item.tooltip || ''}
            >
              {item.icon && <span className="context-banner-meta-icon">{item.icon}</span>}
              {item.label && <span className="context-banner-meta-label">{item.label}</span>}
              {item.value && <strong className="context-banner-meta-val">{item.value}</strong>}
            </div>
          );
        })}
      </div>
    );
  };

  // Render action buttons
  const renderActions = () => {
    const actionList = Array.isArray(actions) ? actions : actions ? [actions] : [];
    const hasActions = actionList.length > 0 || enableFullscreen;

    if (!hasActions) return null;

    return (
      <div className="context-banner-actions-group">
        {actionList.map((action, idx) => {
          if (!action) return null;
          if (React.isValidElement(action)) {
            return <React.Fragment key={idx}>{action}</React.Fragment>;
          }

          const {
            id,
            icon: actionIcon,
            label,
            title: actionTitle,
            onClick,
            disabled,
            active,
            className: btnClass = '',
            variant: btnVariant
          } = action;

          return (
            <button
              key={id || idx}
              type="button"
              className={`context-banner-action-btn ${active ? 'is-active' : ''} ${btnVariant ? `btn-${btnVariant}` : ''} ${btnClass}`}
              onClick={onClick}
              disabled={disabled}
              title={actionTitle || label}
              aria-label={actionTitle || label}
            >
              {actionIcon}
              {label && <span className="action-btn-label">{label}</span>}
            </button>
          );
        })}

        {enableFullscreen && (
          <button
            type="button"
            className={`context-banner-action-btn ${isFullscreen ? 'is-active' : ''}`}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        )}
      </div>
    );
  };

  const hasLeft = Boolean(title || subtitle || icon || status);
  const hasRight = Boolean(
    siteSelector ||
    deviceSelector ||
    selector ||
    (Array.isArray(selectors) && selectors.length > 0) ||
    (Array.isArray(metadata) ? metadata.length > 0 : Boolean(metadata)) ||
    (Array.isArray(actions) ? actions.length > 0 : Boolean(actions)) ||
    enableFullscreen ||
    children
  );

  return (
    <aside
      className={`page-context-banner variant-${variant} ${className}`}
      style={style}
      aria-label="Page Context Banner"
    >
      {hasLeft && (
        <div className="context-banner-left">
          {icon && <span className="context-banner-icon">{icon}</span>}
          <div className="context-banner-title-group">
            {title && (typeof title === 'string' ? <h3 className="context-banner-title">{title}</h3> : title)}
            {subtitle && (typeof subtitle === 'string' ? <span className="context-banner-subtitle">{subtitle}</span> : subtitle)}
          </div>
          {renderStatus()}
        </div>
      )}

      {hasRight && (
        <div className="context-banner-right">
          {renderSelectors()}
          {renderMetadata()}
          {renderActions()}
          {children}
        </div>
      )}
    </aside>
  );
};

export default PageContextBanner;
