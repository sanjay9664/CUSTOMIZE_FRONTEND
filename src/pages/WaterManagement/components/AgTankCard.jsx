import React from 'react';
import { Badge } from 'react-bootstrap';
import { Droplets, Waves, Zap } from 'lucide-react';
import { formatWaterTelemetryValue } from '../utils/waterTelemetry';

/**
 * AgTankCard - SCADA Props-Driven Tank Visual Unit
 * 
 * @param {Object} props
 * @param {Object} props.tank - Normalized tank model
 * @param {Function} [props.onClick] - Click handler to open detail modal
 * @param {boolean} [props.isSelected=false] - Whether tank is currently selected
 * @param {boolean} [props.isFullscreen=false] - Fullscreen mode flag
 */
const AgTankCard = ({ tank, onClick, isSelected = false, isFullscreen = false }) => {
  if (!tank) return null;

  const isOnline = Boolean(tank.isOnline);
  const isRunning = tank.status === 'Running';
  const isAlarm = tank.status === 'Fault';
  const isWarning = tank.status === 'Warning';
  const isValveOpen = tank.valveStatus === 'OPEN';

  // Dynamic tank water color
  const getWaterColor = () => {
    if (!isOnline) return '#475569';
    if (isAlarm) return '#ef4444';
    if (isWarning) return '#f59e0b';
    return '#38bdf8'; // Constant vibrant cyan
  };

  const waterColor = getWaterColor();
  const valveColor = !isOnline ? '#475569' : (isValveOpen ? '#22c55e' : '#ef4444');
  const levelValue = tank.level !== null && tank.level !== undefined ? tank.level : null;

  // Calculate volume in liters if capacity is configured
  const currentVolume = (tank.capacity && levelValue !== null)
    ? Math.round((Number(tank.capacity) * levelValue) / 100)
    : null;

  // Level health tag
  const getLevelStatusBadge = () => {
    if (!isOnline || levelValue === null) return null;
    if (tank.minLevel !== undefined && levelValue <= tank.minLevel) {
      return <Badge bg="danger" className="bg-opacity-20 text-danger fs-10 px-2 py-0.5">LOW LEVEL</Badge>;
    }
    if (tank.maxLevel !== undefined && levelValue >= tank.maxLevel) {
      return <Badge bg="warning" className="bg-opacity-20 text-warning fs-10 px-2 py-0.5">HIGH LEVEL</Badge>;
    }
    return <Badge bg="success" className="bg-opacity-20 text-success fs-10 px-2 py-0.5">OPTIMAL</Badge>;
  };

  return (
    <div
      className={`tank-unit-wrapper p-3 rounded-4 position-relative ${isSelected ? 'tank-selected-border' : ''} ${isFullscreen ? 'expanded-unit' : ''}`}
      onClick={() => onClick && onClick(tank)}
      style={{
        cursor: 'pointer',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(30, 41, 59, 0.45) 100%)',
        border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isSelected ? '0 0 20px rgba(56, 189, 248, 0.25)' : '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}
      title={`Click to view telemetry & controls for ${tank.name}`}
    >
      {/* Top Header Strip: Name & Sector Tag */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-start pe-2 text-truncate" style={{ maxWidth: '65%' }}>
          <div className="fw-bold text-white fs-13 text-truncate" title={tank.name}>
            {tank.name}
          </div>
          <div className="text-secondary fs-10 text-truncate" title={tank.buildingName || 'AG Water Tank'}>
            {tank.buildingName || 'Storage Tank'}
          </div>
        </div>
        <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
          <Badge
            bg={tank.sectorType === 'DOMESTIC' ? 'info' : (tank.sectorType === 'FLUSHING' ? 'success' : 'secondary')}
            className="bg-opacity-20 fs-10 px-2 py-0.5 text-uppercase fw-bold border border-white border-opacity-10"
          >
            {tank.sectorType || 'AG TANK'}
          </Badge>
          <span
            className={`badge px-1.5 py-0.5 fs-10 border border-white border-opacity-10 fw-bold ${
              tank.valveMode === 'MANUAL'
                ? 'bg-warning bg-opacity-20 text-warning'
                : tank.valveMode === 'BYPASS'
                ? 'bg-danger bg-opacity-20 text-danger'
                : 'bg-info bg-opacity-10 text-info'
            }`}
          >
            {tank.valveMode || 'AUTO'}
          </span>
        </div>
      </div>

      {/* Main SCADA Split Row: Tank Vessel on Left, Telemetry Block on Right */}
      <div className="d-flex align-items-center justify-content-between gap-3 my-2">
        {/* Left: Industrial Tank Vessel with Pipe & Valve */}
        <div className="d-flex align-items-center flex-shrink-0 position-relative py-1">
          {/* Tank Cylinder */}
          <div className={`tank-vessel ${isFullscreen ? 'vessel-large' : ''}`}>
            {/* Graduation Scale along left edge */}
            <div className="vessel-scale">
              <div className="vessel-tick major" title="100%" />
              <div className="vessel-tick" />
              <div className="vessel-tick major" title="50%" />
              <div className="vessel-tick" />
              <div className="vessel-tick major" title="0%" />
            </div>

            {/* Liquid Fill */}
            <div
              className="tank-fill"
              style={{
                height: `${levelValue !== null ? Math.min(100, Math.max(0, levelValue)) : 0}%`,
                background: isOnline
                  ? (isAlarm
                    ? 'linear-gradient(180deg, #f87171 0%, #ef4444 60%, #b91c1c 100%)'
                    : isWarning
                    ? 'linear-gradient(180deg, #facc15 0%, #f59e0b 60%, #d97706 100%)'
                    : 'linear-gradient(180deg, #38bdf8 0%, #0284c7 60%, #0369a1 100%)')
                  : 'linear-gradient(180deg, #64748b 0%, #475569 100%)',
                boxShadow: isOnline && levelValue > 0 ? `0 0 16px ${waterColor}50` : 'none'
              }}
            >
              {isOnline && levelValue > 0 && <div className="tank-water-wave"></div>}
            </div>

            {/* Threshold Limit Markers */}
            {tank.minLevel !== undefined && (
              <div
                className="threshold-marker lower"
                style={{ bottom: `${Math.min(100, Math.max(0, tank.minLevel))}%` }}
                title={`Low Threshold: ${tank.minLevel}%`}
              />
            )}
            {tank.maxLevel !== undefined && (
              <div
                className="threshold-marker upper"
                style={{ bottom: `${Math.min(100, Math.max(0, tank.maxLevel))}%` }}
                title={`High Threshold: ${tank.maxLevel}%`}
              />
            )}
          </div>

          {/* Connected Discharge Pipe */}
          <div className="valve-connector-pipe"></div>

          {/* Industrial Actuator Valve */}
          <div
            className={`industrial-valve-node ${!isOnline ? 'valve-offline' : (isValveOpen ? 'valve-open' : 'valve-closed')}`}
            title={`Valve: ${tank.valveStatus || 'CLOSED'} (${tank.valveMode || 'AUTO'})`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6L20 18V6L4 18V6Z"
                fill={valveColor}
                stroke={valveColor}
                strokeWidth="2"
                style={{
                  transition: 'all 0.3s ease',
                  filter: isOnline && isValveOpen ? `drop-shadow(0 0 6px ${valveColor})` : 'none'
                }}
              />
              <rect x="11" y="2" width="2" height="5" fill="#94a3b8" />
              <rect x="9" y="1" width="6" height="2" fill="#94a3b8" />
            </svg>

            {/* Discharge Stream Animation when valve is open and running */}
            {isValveOpen && isRunning && isOnline && (
              <div className="discharge-manifold-system">
                <div className="horizontal-stream">
                  <div className="stream-pulse"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Key Telemetry Metrics */}
        <div className="flex-grow-1 text-end ps-2">
          {/* Water Level Percentage Display */}
          <div className="d-flex align-items-baseline justify-content-end mb-1">
            <span
              className="fw-black fs-2 text-white"
              style={{ lineHeight: 1, letterSpacing: '-0.5px' }}
            >
              {levelValue !== null ? levelValue : '--'}
            </span>
            <span className="fs-6 fw-bold text-info ms-1">%</span>
          </div>

          {/* Level Health Tag */}
          <div className="mb-2">
            {getLevelStatusBadge()}
          </div>

          {/* Reserve / Capacity Stat */}
          <div className="fs-11 fw-bold text-white text-truncate mb-1">
            {currentVolume !== null ? (
              <span>{currentVolume.toLocaleString()} <span className="text-secondary fs-10">/ {Number(tank.capacity).toLocaleString()} L</span></span>
            ) : tank.capacity ? (
              <span>{formatWaterTelemetryValue(tank.capacity, 0, tank.capacityUnit)}</span>
            ) : (
              <span className="text-secondary fs-10">Capacity: --</span>
            )}
          </div>

          {/* Valve & Flow Metrics */}
          <div className="fs-10 fw-bold d-flex flex-column align-items-end gap-0.5">
            <span className={isValveOpen ? 'text-success' : 'text-danger'}>
              ● Valve {isValveOpen ? 'OPEN' : 'CLOSED'}
            </span>
            {tank.inletFlow !== null ? (
              <span className="text-info d-flex align-items-center gap-1">
                <Droplets size={10} /> {formatWaterTelemetryValue(tank.inletFlow, 1, tank.inletFlowUnit)}
              </span>
            ) : tank.currentAmps !== null ? (
              <span className="text-warning d-flex align-items-center gap-1">
                <Zap size={10} className="pulse-icon" /> {tank.currentAmps}A
              </span>
            ) : (
              <span className="text-secondary opacity-50">Flow: --</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Live Online Status & Details Prompt */}
      <div className="d-flex align-items-center justify-content-between pt-2 mt-2 border-top border-white border-opacity-5">
        <div className="d-flex align-items-center gap-1.5">
          <span
            className="rounded-circle"
            style={{
              width: 7,
              height: 7,
              backgroundColor: !isOnline ? '#64748b' : (isAlarm ? '#ef4444' : (isRunning ? '#22c55e' : '#38bdf8')),
              boxShadow: isOnline ? `0 0 6px ${isRunning ? '#22c55e' : '#38bdf8'}` : 'none'
            }}
          />
          <span className={`fs-11 fw-bold ${!isOnline ? 'text-secondary' : (isAlarm ? 'text-danger' : (isRunning ? 'text-success' : 'text-info'))}`}>
            {!isOnline ? 'OFFLINE' : (isAlarm ? 'ALARM' : (isRunning ? 'RUNNING' : 'ONLINE'))}
          </span>
        </div>

        <span className="fs-10 text-secondary fw-bold tank-action-hint">
          Controls &amp; Breakdown →
        </span>
      </div>
    </div>
  );
};

export default React.memo(AgTankCard);
