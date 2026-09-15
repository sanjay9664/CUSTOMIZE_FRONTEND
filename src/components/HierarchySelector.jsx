import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Layers, Cpu, Loader2 } from 'lucide-react';
import { useSiteStore } from '../context/SiteContext';
import { bmsService } from '../services/bmsService';
import { normalizeList } from '../services/apiClient';

/**
 * Premium Hierarchical Selector — SCADA Module Scope Picker
 * 
 * Use this component at the top of any module page (DG Set, Transformer, LT Panel, Motors, etc.)
 * to let users select: Site → Asset → Device
 * 
 * Props:
 *   @param {string}   moduleTitle       - e.g. "DG SET", "TRANSFORMER", "LT PANEL", "MOTORS"
 *   @param {string}   accentColor       - Hex color for glow/accent, e.g. "#0891b2", "#f59e0b"
 *   @param {string}   deviceCategory    - Backend DeviceCategory enum: "GENERATOR", "LT_PANEL", "PUMP", etc.
 *   @param {string}   [assetType]       - Optional: Backend AssetType enum: "DG", "LT_ROOM", "PUMP_ROOM", etc.
 *   @param {string}   [deviceBasePath]  - Route base path for navigation, e.g. "/dg-set/device"
 *   @param {function} onDeviceSelect    - Callback(device) when a device is selected
 *   @param {function} [onSiteChange]    - Callback(siteId) when site changes
 *   @param {string}   [deviceLabel]     - Custom label for device buttons, e.g. "DG", "TRANSFORMER", "MOTOR"
 *   @param {object}   [icon]            - Lucide icon for the module, e.g. <Database size={16} />
 *   @param {string}   [selectedDeviceId] - Externally controlled selected device ID
 */
const HierarchySelector = ({
  moduleTitle = 'MODULE',
  accentColor = '#0891b2',
  deviceCategory,
  assetType,
  deviceBasePath,
  onDeviceSelect,
  onSiteChange,
  deviceLabel = 'DEVICE',
  icon,
  selectedDeviceId: externalDeviceId
}) => {
  const navigate = useNavigate();
  const { sites: contextSites, activeSites } = useSiteStore();

  // ── All available sites ──
  const allSites = useMemo(() => {
    const s = activeSites?.length > 0 ? activeSites : contextSites || [];
    if (s.length === 0) {
      try { return JSON.parse(localStorage.getItem('scada_sites_db') || '[]'); } catch (e) { return []; }
    }
    return s;
  }, [activeSites, contextSites]);

  const [selectedSiteId, setSelectedSiteId] = useState(() => allSites.length > 0 ? allSites[0].id : null);
  const [devices, setDevices] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [internalDeviceId, setInternalDeviceId] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeDeviceId = externalDeviceId ?? internalDeviceId;

  // Auto-select first site
  useEffect(() => {
    if (!selectedSiteId && allSites.length > 0) setSelectedSiteId(allSites[0].id);
  }, [allSites]);

  // Fetch devices & assets when site changes
  useEffect(() => {
    if (!selectedSiteId || !deviceCategory) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        const devRes = await bmsService.getSiteDevices(selectedSiteId, { category: deviceCategory });
        const devList = normalizeList(devRes, 'devices').filter(d => d.category === deviceCategory && d.isActive !== false);
        setDevices(devList);

        if (assetType) {
          try {
            const assetRes = await bmsService.getAssets(selectedSiteId, { assetType });
            setAssets(normalizeList(assetRes, 'assets').filter(a => a.assetType === assetType));
          } catch { setAssets([]); }
        }
      } catch (err) {
        console.warn(`[HierarchySelector] Failed to fetch ${deviceCategory} devices:`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    setSelectedAssetId(null);
    setInternalDeviceId(null);
    onSiteChange?.(selectedSiteId);
  }, [selectedSiteId, deviceCategory]);

  // Auto-select first asset
  useEffect(() => {
    if (assets.length > 0 && !selectedAssetId) setSelectedAssetId(assets[0].id);
  }, [assets]);

  // Filter devices by asset
  const filteredDevices = useMemo(() => {
    if (!selectedAssetId) return devices;
    const linked = devices.filter(d => d.assetId === selectedAssetId);
    return linked.length > 0 ? linked : devices;
  }, [devices, selectedAssetId]);

  // Auto-select first device
  useEffect(() => {
    if (filteredDevices.length > 0 && !activeDeviceId) {
      const firstId = filteredDevices[0].id;
      setInternalDeviceId(firstId);
      onDeviceSelect?.(filteredDevices[0]);
    }
  }, [filteredDevices]);

  const handleDeviceClick = useCallback((dev) => {
    setInternalDeviceId(dev.id);
    onDeviceSelect?.(dev);
    if (deviceBasePath) navigate(`${deviceBasePath}/${dev.id}`);
  }, [deviceBasePath, navigate, onDeviceSelect]);

  const handleSiteChange = useCallback((e) => {
    const val = e.target.value ? Number(e.target.value) : null;
    setSelectedSiteId(val);
  }, []);

  // Color utils
  const accentRgb = useMemo(() => {
    const hex = accentColor.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }, [accentColor]);
  const rgba = (a) => `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${a})`;

  const selectedSite = allSites.find(s => String(s.id) === String(selectedSiteId));
  const activeDevice = filteredDevices.find(d => d.id === activeDeviceId) || filteredDevices[0];

  return (
    <>
      <div className="hs-panel" style={{ '--hs-accent': accentColor, '--hs-glow': rgba(0.3), '--hs-bg': rgba(0.06), '--hs-border': rgba(0.2) }}>
        {/* Animated top border */}
        <div className="hs-top-border" />
        
        <div className="hs-content">
          {/* Module badge */}
          <div className="hs-badge" style={{ background: rgba(0.12), borderColor: rgba(0.3) }}>
            {icon || <Cpu size={13} />}
            <span>{moduleTitle}</span>
          </div>

          {/* SITE */}
          <div className="hs-group">
            <div className="hs-label">
              <MapPin size={11} />
              <span>SITE</span>
            </div>
            <select className="hs-select" value={selectedSiteId || ''} onChange={handleSiteChange}
              style={{ '--hs-accent': accentColor, borderColor: rgba(0.2) }}>
              <option value="">Select Site</option>
              {allSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <ChevronRight size={14} className="hs-arrow" style={{ color: rgba(0.4) }} />

          {/* ASSET (only if assetType provided) */}
          {assetType && (
            <>
              <div className="hs-group">
                <div className="hs-label">
                  <Layers size={11} />
                  <span>ASSET</span>
                </div>
                <select className="hs-select" value={selectedAssetId || ''} 
                  onChange={(e) => setSelectedAssetId(e.target.value || null)}
                  disabled={!selectedSiteId}
                  style={{ '--hs-accent': accentColor, borderColor: rgba(0.2) }}>
                  <option value="">All {assetType} Assets</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <ChevronRight size={14} className="hs-arrow" style={{ color: rgba(0.4) }} />
            </>
          )}

          {/* DEVICES */}
          <div className="hs-group hs-group-grow">
            <div className="hs-label">
              <Cpu size={11} />
              <span>{deviceLabel}</span>
            </div>
            <div className="hs-devices">
              {loading ? (
                <div className="hs-loading">
                  <Loader2 size={14} className="hs-spinner" style={{ color: accentColor }} />
                  <span>Loading...</span>
                </div>
              ) : filteredDevices.length > 0 ? (
                filteredDevices.map((dev, idx) => {
                  const isActive = dev.id === activeDeviceId;
                  return (
                    <button key={dev.id} className={`hs-device-btn ${isActive ? 'hs-device-active' : ''}`}
                      style={{
                        '--hs-accent': accentColor,
                        '--hs-glow': rgba(0.3),
                        background: isActive ? rgba(0.14) : 'transparent',
                        borderColor: isActive ? rgba(0.45) : rgba(0.15),
                        color: isActive ? accentColor : '#8899b4'
                      }}
                      onClick={() => handleDeviceClick(dev)}>
                      <div className="hs-dot" style={{ 
                        background: isActive ? accentColor : '#3a4560',
                        boxShadow: isActive ? `0 0 8px ${rgba(0.6)}` : 'none'
                      }} />
                      <span>{dev.name || `${deviceLabel}-${idx + 1}`}</span>
                    </button>
                  );
                })
              ) : (
                <span className="hs-empty">
                  {selectedSiteId ? `No ${deviceLabel} devices found` : 'Select a site first'}
                </span>
              )}
            </div>
          </div>

          {/* Active device indicator */}
          {activeDevice && (
            <div className="hs-active-indicator d-none d-xl-flex" style={{ borderColor: rgba(0.2) }}>
              <div className="hs-active-dot" style={{ background: accentColor, boxShadow: `0 0 8px ${rgba(0.5)}` }} />
              <span style={{ color: accentColor }}>{activeDevice.name || `${deviceLabel}-1`}</span>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    </>
  );
};

const STYLES = `
/* ═══════════════════════════════════════════════════════
   PREMIUM HIERARCHY SELECTOR — GLASSMORPHISM SCADA
   ═══════════════════════════════════════════════════════ */
.hs-panel {
  position: relative;
  border-radius: 14px;
  margin-bottom: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.65) 0%, rgba(8, 12, 24, 0.85) 100%);
  border: 1px solid var(--hs-border);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 
    0 4px 24px rgba(0,0,0,0.3),
    inset 0 1px 0 rgba(255,255,255,0.04);
}

body.light-mode .hs-panel {
  background: linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(241,245,249,0.95) 100%);
  border-color: #e2e8f0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

/* Animated gradient top border */
.hs-top-border {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--hs-accent) 30%, transparent 50%, var(--hs-accent) 70%, transparent 100%);
  background-size: 200% 100%;
  animation: hs-shimmer 4s ease-in-out infinite;
  opacity: 0.7;
}

@keyframes hs-shimmer {
  0%, 100% { background-position: 200% 0; }
  50% { background-position: -200% 0; }
}

/* Content layout */
.hs-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  flex-wrap: wrap;
}

/* Module badge */
.hs-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 8px;
  border: 1px solid;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--hs-accent);
  flex-shrink: 0;
  white-space: nowrap;
}

/* Selection group */
.hs-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.hs-group-grow { flex: 1; min-width: 0; }

/* Label */
.hs-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #5a6a82;
  flex-shrink: 0;
  white-space: nowrap;
}

body.light-mode .hs-label { color: #94a3b8; }

/* Select dropdown */
.hs-select {
  appearance: none;
  -webkit-appearance: none;
  background-color: rgba(15, 23, 42, 0.6);
  border: 1px solid;
  color: #e2e8f0;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 7px 32px 7px 12px;
  border-radius: 10px;
  min-width: 150px;
  max-width: 220px;
  cursor: pointer;
  transition: all 0.25s ease;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  outline: none;
}

.hs-select:hover {
  border-color: var(--hs-accent) !important;
  background-color: rgba(15, 23, 42, 0.8);
}

.hs-select:focus {
  border-color: var(--hs-accent) !important;
  box-shadow: 0 0 0 3px var(--hs-glow), 0 0 16px var(--hs-glow);
}

.hs-select:disabled { opacity: 0.35; cursor: not-allowed; }

.hs-select option { background: #0c1428; color: #e2e8f0; padding: 8px; }

body.light-mode .hs-select {
  background-color: #ffffff;
  border-color: #e2e8f0;
  color: #1e293b;
}
body.light-mode .hs-select option { background: #ffffff; color: #1e293b; }
body.light-mode .hs-select:hover { border-color: var(--hs-accent) !important; }

/* Chevron arrow */
.hs-arrow {
  flex-shrink: 0;
  opacity: 0.5;
}

/* Device buttons */
.hs-devices {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.hs-device-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 16px;
  border-radius: 10px;
  border: 1px solid;
  font-size: 0.73rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  background: transparent;
  font-family: inherit;
}

.hs-device-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  background: radial-gradient(circle at center, var(--hs-glow) 0%, transparent 70%);
  transition: opacity 0.3s ease;
}

.hs-device-btn:hover {
  transform: translateY(-2px);
  color: var(--hs-accent) !important;
  border-color: var(--hs-accent) !important;
  box-shadow: 0 4px 16px var(--hs-glow);
}

.hs-device-btn:hover::before { opacity: 0.3; }

.hs-device-active {
  box-shadow: 0 0 16px var(--hs-glow), inset 0 0 12px rgba(0,0,0,0.2) !important;
  animation: hs-pulse 2.5s ease-in-out infinite;
}

@keyframes hs-pulse {
  0%, 100% { box-shadow: 0 0 12px var(--hs-glow), inset 0 0 8px rgba(0,0,0,0.15); }
  50% { box-shadow: 0 0 22px var(--hs-glow), inset 0 0 12px rgba(0,0,0,0.1); }
}

body.light-mode .hs-device-btn {
  color: #64748b !important;
}
body.light-mode .hs-device-btn:hover {
  color: var(--hs-accent) !important;
  background: rgba(0,0,0,0.03);
}

.hs-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

/* Loading */
.hs-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  font-size: 0.7rem;
  color: #64748b;
}

.hs-spinner {
  animation: hs-spin 1s linear infinite;
}

@keyframes hs-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Empty state */
.hs-empty {
  font-size: 0.7rem;
  color: #475569;
  padding: 4px 8px;
  font-style: italic;
}

/* Active indicator */
.hs-active-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 14px;
  border-left: 1px solid;
  margin-left: auto;
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.hs-active-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  animation: hs-dot-pulse 1.5s ease-in-out infinite;
}

@keyframes hs-dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Responsive */
@media (max-width: 768px) {
  .hs-content { gap: 8px; padding: 10px 12px; }
  .hs-select { min-width: 120px; font-size: 0.7rem; }
  .hs-group { width: 100%; }
  .hs-group .hs-select { flex: 1; }
  .hs-arrow { display: none; }
  .hs-badge { width: 100%; justify-content: center; }
  .hs-active-indicator { display: none !important; }
}
`;

export default HierarchySelector;
