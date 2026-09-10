import React from 'react';
import { Form, Button, Badge } from 'react-bootstrap';
import { Search, Cpu, Zap, Edit3, RefreshCw, Activity, Sliders, Shield, FileText, X } from 'lucide-react';
import ConfigDevicesPopover from '../components/ConfigDevicesPopover';
import CommonFilterPopover from '../../../../components/common/CommonFilterPopover';

const DevicesTab = ({
  searchTerm = '',
  setSearchTerm = () => {},
  selectedSiteFilter = 'ALL',
  setSelectedSiteFilter = () => {},
  activeSites = [],
  selectedBuildingFilter = 'ALL',
  setSelectedBuildingFilter = () => {},
  selectedAreaFilter = 'ALL',
  setSelectedAreaFilter = () => {},
  activeBuildings = [],
  activeAreas = [],
  activeAssets = [],
  selectedAssetFilter = 'ALL',
  setSelectedAssetFilter = () => {},
  selectedAssetTypeFilter = 'ALL',
  setSelectedAssetTypeFilter = () => {},
  filteredDevices = [],
  handleOpenRecentEvents = () => {},
  handleGlobalResyncEventStats = () => {},
  showConfigDevicesModal = false,
  setShowConfigDevicesModal = () => {},
  handleTabSelect = () => {},
  setRegisterStep = () => {},
  setRegisterForm = () => {},
  setShowRegisterDeviceModal = () => {},
  handleOpenEditDevice = () => {},
  handleOpenLiveModal = () => {},
  handleOpenThresholdsModal = () => {},
  handleOpenSettingsModal = () => {},
  handleOpenRulesModal = () => {},
  setSelectedDeviceForCommandsTab = () => {},
  setShowSendCommandModal = () => {},
  handleOpenAuditLog = () => {},
  setSelectedDeviceForAudit = () => {},
  handleDeleteDevice = () => {},
  fetchDevices = () => {},
  showToast = () => {},
  getAuthHeaders = () => {},
  API_BASE_URL = '/api'
}) => {
  const safeSites = Array.isArray(activeSites) ? activeSites : [];
  const safeBuildings = Array.isArray(activeBuildings) ? activeBuildings : [];
  const safeAreas = Array.isArray(activeAreas) ? activeAreas : [];
  const safeAssets = Array.isArray(activeAssets) ? activeAssets : [];
  const safeDevices = Array.isArray(filteredDevices) ? filteredDevices : [];

  const getTabFilters = (draftValues) => {
    const currentSiteId = draftValues?.siteId !== undefined ? draftValues.siteId : (selectedSiteFilter || 'ALL');

    // Filter assets by selected site
    const assetsForSite = currentSiteId === 'ALL'
      ? safeAssets
      : safeAssets.filter(a => String(a.siteId) === String(currentSiteId));

    // Dynamic asset types list for the selected site's assets
    const assetTypesList = Array.from(
      new Set(assetsForSite.map(a => a.assetType).filter(Boolean))
    ).sort();

    return [
      {
        id: 'siteId',
        label: 'Site',
        options: [
          { value: 'ALL', label: 'All Sites' },
          ...safeSites.map(s => ({ value: String(s.id), label: s.name }))
        ],
        onChange: (newSiteVal, currentDrafts) => {
          let nextAssetId = currentDrafts.assetId;
          let nextAssetType = currentDrafts.assetType;
          if (newSiteVal !== 'ALL') {
            const assetStillValid = safeAssets.some(
              a => String(a.siteId) === String(newSiteVal) && String(a.id) === String(nextAssetId)
            );
            if (!assetStillValid) nextAssetId = 'ALL';

            const siteAssets = safeAssets.filter(a => String(a.siteId) === String(newSiteVal));
            const typeStillValid = siteAssets.some(a => a.assetType === nextAssetType);
            if (!typeStillValid) nextAssetType = 'ALL';
          }
          return {
            ...currentDrafts,
            siteId: newSiteVal,
            assetId: nextAssetId,
            assetType: nextAssetType
          };
        }
      },
      {
        id: 'assetId',
        label: 'Asset',
        options: [
          { value: 'ALL', label: currentSiteId === 'ALL' ? 'All Assets' : 'All Site Assets' },
          ...assetsForSite.map(a => ({
            value: String(a.id),
            label: a.name ? `${a.name}${a.assetType ? ` [${a.assetType}]` : ''}` : `Asset #${a.id}`
          }))
        ]
      },
      {
        id: 'assetType',
        label: 'Asset type',
        options: [
          { value: 'ALL', label: 'All Asset Types' },
          ...assetTypesList.map(type => ({
            value: type,
            label: type.replace(/_/g, ' ')
          }))
        ]
      }
    ];
  };

  const tabFilterValues = {
    siteId: selectedSiteFilter,
    assetId: selectedAssetFilter,
    assetType: selectedAssetTypeFilter
  };

  const handleApplyTabFilters = (newVals) => {
    if (newVals.siteId !== undefined) setSelectedSiteFilter(newVals.siteId);
    if (newVals.assetId !== undefined) setSelectedAssetFilter(newVals.assetId);
    if (newVals.assetType !== undefined) setSelectedAssetTypeFilter(newVals.assetType);
  };

  const handleResetTabFilters = () => {
    setSelectedSiteFilter('ALL');
    setSelectedAssetFilter('ALL');
    setSelectedAssetTypeFilter('ALL');
  };

  const hasActiveTabFilters = selectedSiteFilter !== 'ALL' || selectedAssetFilter !== 'ALL' || selectedAssetTypeFilter !== 'ALL';

  return (
    <div className="d-flex flex-column gap-2 p-0 m-0 mb-0 devices-tab-wrapper">
      <style>{`
        .devices-tab-wrapper .devices-filter-bar {
          background-color: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        body.light-mode .devices-tab-wrapper .devices-filter-bar {
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04) !important;
        }

        .devices-tab-wrapper .devices-filter-input,
        .devices-tab-wrapper .devices-filter-select {
          background-color: #0f172a !important;
          color: #f8fafc !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
        }
        body.light-mode .devices-tab-wrapper .devices-filter-input,
        body.light-mode .devices-tab-wrapper .devices-filter-select {
          background-color: #f8fafc !important;
          color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
        }
        body.light-mode .devices-tab-wrapper .devices-filter-input::placeholder {
          color: #94a3b8 !important;
        }

        body.light-mode .devices-tab-wrapper .btn-recent-events {
          background-color: #fffbeb !important;
          color: #d97706 !important;
          border: 1px solid #fde68a !important;
        }
        body.light-mode .devices-tab-wrapper .btn-recent-events:hover {
          background-color: #fef3c7 !important;
          color: #b45309 !important;
        }

        body.light-mode .devices-tab-wrapper .btn-config-devices {
          background-color: #f0f9ff !important;
          color: #0284c7 !important;
          border: 1px solid #bae6fd !important;
        }
        body.light-mode .devices-tab-wrapper .btn-config-devices:hover {
          background-color: #e0f2fe !important;
          color: #0369a1 !important;
        }

        .btn-register-device-primary {
          background-color: #2563eb !important;
          background-image: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
          color: #ffffff !important;
          border: none !important;
          box-shadow: 0 3px 10px rgba(37, 99, 235, 0.3) !important;
          transition: all 0.2s ease !important;
        }
        .btn-register-device-primary:hover {
          background-color: #1d4ed8 !important;
          background-image: linear-gradient(135deg, #1d4ed8, #1e40af) !important;
          color: #ffffff !important;
          transform: translateY(-1px) !important;
        }

        .devices-tab-wrapper .table-custom-container {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }
        body.light-mode .devices-tab-wrapper .table-custom-container {
          border: 1px solid #cbd5e1 !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04) !important;
        }

        .devices-tab-wrapper .device-title-text {
          color: #f8fafc;
        }
        body.light-mode .devices-tab-wrapper .device-title-text {
          color: #0f172a !important;
        }

        .devices-tab-wrapper .device-sub-text {
          color: #94a3b8;
        }
        body.light-mode .devices-tab-wrapper .device-sub-text {
          color: #64748b !important;
        }

        .devices-tab-wrapper .device-sn-text {
          color: #cbd5e1;
        }
        body.light-mode .devices-tab-wrapper .device-sn-text {
          color: #334155 !important;
        }

        .devices-tab-wrapper .device-sochiot-id {
          color: #38bdf8;
        }
        body.light-mode .devices-tab-wrapper .device-sochiot-id {
          color: #0284c7 !important;
        }

        .device-action-btn {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          color: var(--_icon-color, #94a3b8);
          transition: all 0.15s ease;
        }
        .device-action-btn:hover {
          background: var(--_hover-bg, rgba(56,189,248,0.12));
          transform: translateY(-1px);
        }
        body.light-mode .device-action-btn {
          background: #f1f5f9 !important;
          border: 1px solid #e2e8f0 !important;
        }
        body.light-mode .device-action-btn:hover {
          background: var(--_hover-bg, rgba(56,189,248,0.12)) !important;
          border-color: var(--_icon-color, #0284c7) !important;
        }
      `}</style>

      {/* Top Filter Controls */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-2 rounded devices-filter-bar">
        <div className="d-flex align-items-center gap-2 flex-grow-1 position-relative" style={{ maxWidth: 400 }}>
          <Search size={15} className="device-sub-text position-absolute" style={{ left: 12, pointerEvents: 'none' }} />
          <Form.Control
            type="text"
            placeholder="Search devices by name, serial or BMS ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="devices-filter-input fs-13"
            style={{ paddingLeft: 34, paddingRight: searchTerm ? 32 : 12 }}
          />
          {searchTerm && (
            <button
              type="button"
              className="btn btn-link p-0 position-absolute"
              style={{ right: 10, color: '#94a3b8', textDecoration: 'none' }}
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <CommonFilterPopover
            buttonLabel="Device filter"
            filters={getTabFilters}
            values={tabFilterValues}
            onApply={handleApplyTabFilters}
            onReset={handleResetTabFilters}
          />
          {hasActiveTabFilters && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 fs-12 px-2.5 py-1"
              style={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#94a3b8' }}
              onClick={handleResetTabFilters}
              title="Clear all active filters"
            >
              <X size={12} />
              <span>Clear</span>
            </button>
          )}

          <Button
            variant="outline-warning"
            size="sm"
            onClick={handleOpenRecentEvents}
            className="fw-semibold d-flex align-items-center gap-1.5 fs-12 btn-recent-events"
          >
            <Activity size={14} /> Recent Events
          </Button>

          <div className="position-relative d-inline-block">
            <Button
              variant="outline-info"
              size="sm"
              onClick={handleGlobalResyncEventStats}
              className="fw-semibold d-flex align-items-center gap-1.5 fs-12 btn-config-devices"
            >
              <Sliders size={14} /> Config Devices
            </Button>

            <ConfigDevicesPopover
              show={showConfigDevicesModal}
              onClose={() => setShowConfigDevicesModal(false)}
              onSelectTemplates={() => {
                setShowConfigDevicesModal(false);
                if (typeof handleTabSelect === 'function') {
                  handleTabSelect('templates');
                }
              }}
              onSelectEntities={() => {
                setShowConfigDevicesModal(false);
                if (typeof showToast === 'function') {
                  showToast('info', 'Opening Digital Twin Entities configuration...');
                }
              }}
              onSelectLaunchpad={() => {
                setShowConfigDevicesModal(false);
                if (typeof showToast === 'function') {
                  showToast('info', 'Opening Sochiot Cloud Launchpad...');
                }
              }}
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setRegisterStep(1);
              setRegisterForm({
                id: '',
                siteId: '',
                name: '',
                sochiotDeviceIds: '',
                category: '',
                areaId: '',
                buildingId: '',
                floorNo: '',
                roomNo: '',
                energyGroupId: '',
                description: '',
                serialNumber: '',
                profileId: '',
                templateName: ''
              });
              if (typeof setDynamicTemplateFields === 'function') {
                setDynamicTemplateFields([]);
              }
              setShowRegisterDeviceModal(true);
            }}
            className="fw-bold fs-12 text-white px-3 border-0 btn-register-device-primary d-flex align-items-center gap-1.5"
          >
            + Register Device
          </Button>
        </div>
      </div>

      {/* Devices List Table */}
      <div className="table-responsive rounded-3 overflow-hidden table-custom-container">
        <table className="table table-custom align-middle mb-0 fs-13">
          <thead>
            <tr className="text-uppercase fs-11 tracking-wider">
              <th className="py-3 px-3">DEVICE DETAILS</th>
              <th className="py-3 px-3">CATEGORY</th>
              <th className="py-3 px-3">SERIAL NUMBER</th>
              <th className="py-3 px-3">SOCHIOT ID(S)</th>
              <th className="py-3 px-3">LOCATION</th>
              <th className="py-3 px-3">STATUS</th>
              <th className="py-3 px-3 text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {safeDevices.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5 device-sub-text">
                  <Cpu size={32} className="mb-2 text-info opacity-50" />
                  <div>No devices matching filter criteria</div>
                </td>
              </tr>
            ) : safeDevices.map(d => {
              const catUpper = String(d.category || 'ENERGY_METER').toUpperCase();
              let badgeBg = 'rgba(2, 132, 199, 0.14)';
              let badgeColor = '#0284c7';
              let badgeBorder = '1px solid rgba(56, 189, 248, 0.35)';

              if (catUpper.includes('ENERGY') || catUpper.includes('METER')) {
                badgeBg = 'rgba(37, 99, 235, 0.14)';
                badgeColor = '#2563eb';
                badgeBorder = '1px solid rgba(59, 130, 246, 0.35)';
              } else if (catUpper.includes('GENERATOR') || catUpper.includes('DIESEL') || catUpper.includes('DG')) {
                badgeBg = 'rgba(217, 119, 6, 0.14)';
                badgeColor = '#d97706';
                badgeBorder = '1px solid rgba(245, 158, 11, 0.35)';
              } else if (catUpper.includes('PUMP')) {
                badgeBg = 'rgba(2, 132, 199, 0.14)';
                badgeColor = '#0284c7';
                badgeBorder = '1px solid rgba(56, 189, 248, 0.35)';
              } else if (catUpper.includes('HVAC') || catUpper.includes('AIR') || catUpper.includes('COOL')) {
                badgeBg = 'rgba(13, 148, 136, 0.14)';
                badgeColor = '#0d9488';
                badgeBorder = '1px solid rgba(45, 212, 191, 0.35)';
              } else {
                badgeBg = 'rgba(100, 116, 139, 0.14)';
                badgeColor = '#64748b';
                badgeBorder = '1px solid rgba(148, 163, 184, 0.35)';
              }

              const rawIds = d.sochiotDeviceIds || d.sochiot_device_ids;
              const displayIds = Array.isArray(rawIds) ? rawIds.join(', ') : String(rawIds || '101');

              return (
                <tr key={d.id}>
                  <td className="py-3 px-3">
                    <div className="fw-bold device-title-text fs-14">{d.name}</div>
                    <div className="device-sub-text fs-11 font-monospace fw-medium">BMS ID: {d.bmsDeviceId || `BMS-${d.id}`}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span 
                      className="px-3 py-1 fs-11 font-monospace fw-bold rounded-pill d-inline-flex align-items-center gap-1.5 shadow-sm"
                      style={{
                        background: badgeBg,
                        color: badgeColor,
                        border: badgeBorder,
                        letterSpacing: '0.04em'
                      }}
                    >
                      <span className="rounded-circle" style={{ width: 6, height: 6, backgroundColor: badgeColor }}></span>
                      {catUpper}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-monospace device-sn-text fw-medium">
                    {d.serialNumber || `SN-${d.id}`}
                  </td>
                  <td className="py-3 px-3 font-monospace device-sochiot-id fw-semibold">
                    {displayIds}
                  </td>
                  <td className="py-3 px-3 fs-12">
                    <div className="fw-medium device-title-text">{d.buildingName || 'store-1'}</div>
                    <div className="device-sub-text fs-10">{d.areaName || 'Main Area'}</div>
                  </td>
                  <td className="py-3 px-3">
                    <Badge bg={d.isActive !== false ? 'success' : 'secondary'} className="px-2 py-1 fs-11 fw-semibold">
                      {d.isActive !== false ? '● ACTIVE' : '○ INACTIVE'}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-end">
                    <div className="d-flex align-items-center justify-content-end gap-1">
                      {[
                        { icon: <Zap size={14} />,       color: '#38bdf8', hoverBg: 'rgba(56,189,248,0.12)',  label: 'Live Telemetry',    onClick: () => handleOpenLiveModal(d) },
                        { icon: <Sliders size={14} />,   color: '#f59e0b', hoverBg: 'rgba(245,158,11,0.12)',  label: 'Threshold Limits',  onClick: () => handleOpenThresholdsModal(d) },
                        { icon: <RefreshCw size={14} />, color: '#94a3b8', hoverBg: 'rgba(148,163,184,0.12)', label: 'Modbus Settings',   onClick: () => handleOpenSettingsModal(d) },
                        { icon: <Shield size={14} />,    color: '#818cf8', hoverBg: 'rgba(129,140,248,0.12)', label: 'Automation Rules',  onClick: () => handleOpenRulesModal(d) },
                        { icon: <Zap size={14} />,       color: '#34d399', hoverBg: 'rgba(52,211,153,0.12)',  label: 'Send Command',      onClick: () => { setSelectedDeviceForCommandsTab(d.id); setShowSendCommandModal(true); } },
                        { icon: <FileText size={14} />,  color: '#38bdf8', hoverBg: 'rgba(56,189,248,0.12)',  label: 'Audit Logs',        onClick: () => { setSelectedDeviceForAudit(d); handleOpenAuditLog(d); } },
                        { icon: <Edit3 size={14} />,     color: '#22d3ee', hoverBg: 'rgba(34,211,238,0.12)',  label: 'Edit Device',       onClick: () => handleOpenEditDevice(d) },
                      ].map((action, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={action.onClick}
                          title={action.label}
                          className="device-action-btn"
                          style={{ '--_icon-color': action.color, '--_hover-bg': action.hoverBg }}
                        >
                          {action.icon}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DevicesTab;
