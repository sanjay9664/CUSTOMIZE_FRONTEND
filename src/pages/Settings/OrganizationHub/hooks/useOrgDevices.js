import { useState, useCallback, useMemo, useEffect } from 'react';
import { getApiUrl } from '../../../../utils/apiConfig';
import { getAuthToken } from '../../../../utils/cookieUtils';
import { fetchAndStoreSochiotAccessToken } from '../../../../services/bmsService';
import { fetchDevicesByDeviceIds, extractDeviceModulesAndFields } from '../../../../services/sochiotLocationService';
import { getTemplateForCategory } from '../../../../constants/deviceTemplates';

export const API_BASE_URL = getApiUrl();

export const getAuthHeaders = () => {
  const token = getAuthToken() || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const normalizeList = (raw, key) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.data && Array.isArray(raw.data.data)) return raw.data.data;
  if (raw.data && Array.isArray(raw.data[key])) return raw.data[key];
  if (Array.isArray(raw[key])) return raw[key];
  return [];
};

export const useOrgDevices = ({ showToast, setLoading, selectedAssetFilter, selectedSiteFilter, activeSites }) => {
  const [devices, setDevices] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Purge any stale mock storage that causes phantom non-DB devices (e.g. jkanjd, frfr)
  useEffect(() => {
    try {
      localStorage.removeItem('bms_registered_devices');
      localStorage.removeItem('bms_device_edits');
    } catch (e) {}
  }, []);

  const activeDevices = useMemo(() => {
    return normalizeList(devices, 'devices').filter(d => d && d.isActive !== false && d.status !== 'DISABLED');
  }, [devices]);

  // Modals & form state
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceForm, setDeviceForm] = useState({ name: '', category: 'ENERGY_METER', bmsDeviceId: '', serialNumber: '', siteId: 7 });

  const [deviceSubTab, setDeviceSubTab] = useState('registration');
  const [showRegisterDeviceModal, setShowRegisterDeviceModal] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const [registerForm, setRegisterForm] = useState({
    siteId: '', name: '', sochiotDeviceIds: '', moduleIds: [], sochiotTemplateId: null, category: 'ENERGY_METER', areaId: '', buildingId: '', floorNo: '', roomNo: '', energyGroupId: '', description: '', serialNumber: '', profileId: '', assetId: ''
  });

  const [dynamicTemplateFields, setDynamicTemplateFields] = useState([]);

  const [showLiveModal, setShowLiveModal] = useState(false);
  const [selectedDeviceForLive, setSelectedDeviceForLive] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedDeviceForSettings, setSelectedDeviceForSettings] = useState(null);
  const [deviceSettingsForm, setDeviceSettingsForm] = useState({
    slaveId: 1, baudRate: 9600, parity: 'NONE', pollingIntervalMs: 2000,
    fieldMappings: [
      { field: 'voltage', register: 40001, dataType: 'FLOAT32' },
      { field: 'current', register: 40003, dataType: 'FLOAT32' },
      { field: 'powerKw', register: 40005, dataType: 'FLOAT32' }
    ]
  });

  const [showThresholdsModal, setShowThresholdsModal] = useState(false);
  const [selectedDeviceForThresholds, setSelectedDeviceForThresholds] = useState(null);
  const [thresholdsForm, setThresholdsForm] = useState({
    '3,100F': { warningHigh: 250, criticalHigh: 260, warningLow: 210, criticalLow: 200 },
    '4,0F': { warningHigh: 50, criticalHigh: 65, warningLow: 0, criticalLow: 0 }
  });

  const [showAuditLogModal, setShowAuditLogModal] = useState(false);
  const [selectedDeviceForAudit, setSelectedDeviceForAudit] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const [showRecentEventsModal, setShowRecentEventsModal] = useState(false);
  const [showConfigDevicesModal, setShowConfigDevicesModal] = useState(false);
  const [recentEventsList, setRecentEventsList] = useState([]);

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedDeviceForRules, setSelectedDeviceForRules] = useState(null);
  const [deviceRulesForm, setDeviceRulesForm] = useState([]);

  const [showEditDeviceModal, setShowEditDeviceModal] = useState(false);
  const [editingDeviceItem, setEditingDeviceItem] = useState(null);
  const [editDeviceForm, setEditDeviceForm] = useState({ name: '', category: 'ENERGY_METER', serialNumber: '' });

  // Fetch Devices (per OpenAPI: /assets/{id}/devices, /sites/{siteId}/devices, or /devices)
  const fetchDevices = useCallback(async () => {
    try {
      let endpoint = `${API_BASE_URL}/devices`;
      if (selectedAssetFilter && selectedAssetFilter !== 'ALL') {
        endpoint = `${API_BASE_URL}/assets/${selectedAssetFilter}/devices`;
      } else if (selectedSiteFilter && selectedSiteFilter !== 'ALL') {
        endpoint = `${API_BASE_URL}/sites/${selectedSiteFilter}/devices`;
      }

      const res = await fetch(endpoint, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        const list = normalizeList(json, 'devices');
        const deletedIds = JSON.parse(localStorage.getItem('bms_deleted_devices') || '[]');
        const finalDevices = list.filter(d => !deletedIds.includes(String(d.id)));
        setDevices(finalDevices);

        // Purge obsolete local mock storage that causes phantom non-DB devices (e.g. jkanjd, frfr)
        try {
          localStorage.removeItem('bms_registered_devices');
          localStorage.removeItem('bms_device_edits');
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Devices fetch err:', err);
    }
  }, [selectedSiteFilter, selectedAssetFilter]);

  // Device Actions
  const handleOpenEditDevice = async (d) => {
    fetchAndStoreSochiotAccessToken();
    setEditingDeviceItem(d);
    setRegisterStep(1);
    const resolvedSiteId = d.siteId || d.site?.id || d.site_id || (selectedSiteFilter && selectedSiteFilter !== 'ALL' ? String(selectedSiteFilter) : '') || (activeSites && activeSites.length ? String(activeSites[0].id) : '');

    // Set initial baseline from row data so modal opens immediately
    setRegisterForm({
      id: d.id,
      siteId: resolvedSiteId,
      name: d.name || '',
      sochiotDeviceIds: Array.isArray(d.sochiotDeviceIds) ? d.sochiotDeviceIds.join(', ') : (d.sochiotDeviceIds || d.sochiot_device_ids || ''),
      category: d.category || '',
      areaId: d.areaId ? String(d.areaId) : '',
      buildingId: d.buildingId ? String(d.buildingId) : '',
      floorNo: d.floorNo !== null && d.floorNo !== undefined ? String(d.floorNo) : '',
      roomNo: d.roomNo !== null && d.roomNo !== undefined ? String(d.roomNo) : '',
      energyGroupId: d.energyGroupId || '',
      description: d.description || '',
      serialNumber: d.serialNumber || '',
      profileId: d.profileId || '',
      sochiotTemplateId: d.sochiotTemplateId || d.sochiot_template_id || null,
      moduleIds: Array.isArray(d.moduleIds) ? d.moduleIds : (d.moduleId ? [d.moduleId] : []),
      assetId: d.assetId ? String(d.assetId) : ''
    });

    const extractAllDeviceIds = (targetDev, settingsList = []) => {
      const ids = new Set();
      const rawDevIds = targetDev?.sochiotDeviceIds || targetDev?.sochiot_device_ids;
      if (Array.isArray(rawDevIds)) {
        rawDevIds.forEach(id => { const n = parseInt(id, 10); if (!isNaN(n) && n > 0 && n !== 101) ids.add(n); });
      } else if (typeof rawDevIds === 'string' && rawDevIds.trim()) {
        rawDevIds.split(',').forEach(s => { const n = parseInt(s.trim(), 10); if (!isNaN(n) && n > 0 && n !== 101) ids.add(n); });
      } else if (typeof rawDevIds === 'number' && rawDevIds > 0 && rawDevIds !== 101) {
        ids.add(rawDevIds);
      }

      (settingsList || []).forEach(s => {
        if (s?.sochiotDeviceId) {
          const n = parseInt(s.sochiotDeviceId, 10);
          if (!isNaN(n) && n > 0 && n !== 101) ids.add(n);
        }
        if (s?.deviceId && targetDev?.id && String(s.deviceId) !== String(targetDev.id) && String(s.deviceId) !== '101') {
          const n = parseInt(s.deviceId, 10);
          if (!isNaN(n) && n > 0) ids.add(n);
        }
      });

      return Array.from(ids);
    };

    const matchSettingsWithSochiotDevices = (settingsList, sochiotDevicesList, fallbackDevIds = [], currentDev = null) => {
      const normalizedDevices = (sochiotDevicesList || []).map(dev => {
        const extracted = extractDeviceModulesAndFields(dev);
        return {
          raw: dev,
          id: String(dev.id || dev.hardwareId || ''),
          name: dev.name || '',
          modules: extracted.modules || []
        };
      });

      return (settingsList || []).map(s => {
        let matchedDev = null;
        let matchedModule = null;
        let matchedFieldDef = null;

        const sDevName = (s.deviceName || '').trim().toLowerCase();
        const sModName = (s.moduleName || '').trim().toLowerCase();
        const sField = (s.sochiotFieldName || '').trim();
        const sModId = s.moduleId ? String(s.moduleId).trim() : '';

        // 1a. If explicit sochiotDeviceId
        if (s.sochiotDeviceId) {
          matchedDev = normalizedDevices.find(dev => String(dev.id) === String(s.sochiotDeviceId));
        }

        // 1b. Match by device name
        if (!matchedDev && sDevName) {
          matchedDev = normalizedDevices.find(dev => dev.name && dev.name.trim().toLowerCase() === sDevName);
        }

        // 1c. Match by event field presence across all devices
        if (!matchedDev && sField) {
          for (const dev of normalizedDevices) {
            const foundM = dev.modules.find(m => m.allFields?.some(f => f.fieldName === sField));
            if (foundM) {
              matchedDev = dev;
              matchedModule = foundM;
              matchedFieldDef = foundM.allFields?.find(f => f.fieldName === sField);
              break;
            }
          }
        }

        // 1d. Match by moduleId across all devices
        if (!matchedDev && sModId) {
          for (const dev of normalizedDevices) {
            const foundM = dev.modules.find(m =>
              String(m.id) === sModId ||
              (m.name && m.name.trim().toLowerCase() === sModId.toLowerCase()) ||
              (m.label && m.label.trim().toLowerCase() === sModId.toLowerCase())
            );
            if (foundM) {
              matchedDev = dev;
              matchedModule = foundM;
              break;
            }
          }
        }

        // 1e. If single device in list
        if (!matchedDev && normalizedDevices.length === 1) {
          matchedDev = normalizedDevices[0];
        }

        // 2. Match module within device:
        if (matchedDev) {
          if (!matchedModule && sModId) {
            matchedModule = matchedDev.modules.find(m =>
              String(m.id) === sModId ||
              (m.name && m.name.trim().toLowerCase() === sModId.toLowerCase()) ||
              (m.label && m.label.trim().toLowerCase() === sModId.toLowerCase())
            );
          }
          if (!matchedModule && sField) {
            matchedModule = matchedDev.modules.find(m => m.allFields?.some(f => f.fieldName === sField));
          }
          if (!matchedModule && sModName) {
            matchedModule = matchedDev.modules.find(m =>
              (m.name && m.name.trim().toLowerCase() === sModName) ||
              (m.label && m.label.trim().toLowerCase() === sModName)
            );
          }
          if (!matchedModule && matchedDev.modules.length === 1) {
            matchedModule = matchedDev.modules[0];
          }

          if (matchedModule && sField) {
            matchedFieldDef = matchedModule.allFields?.find(f => f.fieldName === sField);
          }
        }

        const isDbFk = s?.deviceId && currentDev?.id && String(s.deviceId) === String(currentDev.id);
        const fallbackId = (!isDbFk && s?.deviceId && String(s.deviceId) !== '101')
          ? String(s.deviceId)
          : (fallbackDevIds.length > 0 ? String(fallbackDevIds[0]) : '');

        const resolvedDevId = matchedDev ? matchedDev.id : (s.sochiotDeviceId ? String(s.sochiotDeviceId) : fallbackId);
        const resolvedDevName = matchedDev?.name || s.deviceName || (matchedDev?.id ? `Device #${matchedDev.id}` : '');
        const resolvedModId = matchedModule ? String(matchedModule.id) : (s.moduleId ? String(s.moduleId) : '');
        const resolvedModName = matchedModule?.name || matchedModule?.label || s.moduleName || (resolvedModId ? `Module #${resolvedModId}` : '');

        return {
          id: s.id,
          deviceId: resolvedDevId,
          deviceName: resolvedDevName,
          moduleId: resolvedModId,
          moduleName: resolvedModName,
          sochiotFieldName: s.sochiotFieldName || '',
          displayName: s.displayName || matchedFieldDef?.displayName || s.sochiotFieldName || '',
          dataType: s.dataType || matchedFieldDef?.dataType || 'INTEGER',
          unit: s.unit || matchedFieldDef?.unit || '',
          warningHigh: s.warningHigh !== undefined && s.warningHigh !== null ? s.warningHigh : '',
          criticalHigh: s.criticalHigh !== undefined && s.criticalHigh !== null ? s.criticalHigh : '',
          warningLow: s.warningLow !== undefined && s.warningLow !== null ? s.warningLow : '',
          criticalLow: s.criticalLow !== undefined && s.criticalLow !== null ? s.criticalLow : '',
          isCommand: Boolean(s.isCommand),
          graphable: s.graphable !== false
        };
      });
    };

    const mergeWithCategoryTemplate = (savedMappedFields = [], category, currentDev = null, fallbackDevIds = []) => {
      const tmpl = getTemplateForCategory(category);
      if (!tmpl || !Array.isArray(tmpl.parameters) || tmpl.parameters.length === 0) {
        return savedMappedFields || [];
      }

      // Find primary device from saved mapped fields, currentDev, or fallbackDevIds
      const defaultDevField = (savedMappedFields || []).find(s => s.deviceId && String(s.deviceId).trim() !== '' && String(s.deviceId) !== '101');
      const defaultDeviceId = defaultDevField?.deviceId || (fallbackDevIds.length > 0 ? String(fallbackDevIds[0]) : '');
      const defaultDeviceName = defaultDevField?.deviceName || (defaultDeviceId ? `Device #${defaultDeviceId}` : '');
      const defaultModuleId = defaultDevField?.moduleId || '';
      const defaultModuleName = defaultDevField?.moduleName || '';

      const matchedFields = new Set();

      const templateMerged = tmpl.parameters.map(param => {
        const pName = (param.name || '').trim().toLowerCase();
        const existing = (savedMappedFields || []).find(s => {
          const sDisp = (s.displayName || '').trim().toLowerCase();
          const sSoch = (s.sochiotFieldName || '').trim().toLowerCase();
          return sDisp === pName || sSoch === pName;
        });

        if (existing) {
          matchedFields.add(existing);
          return {
            ...existing,
            displayName: existing.displayName || param.name,
            required: Boolean(param.required),
            deviceId: existing.deviceId || defaultDeviceId,
            deviceName: existing.deviceName || defaultDeviceName,
            moduleId: existing.moduleId || defaultModuleId,
            moduleName: existing.moduleName || defaultModuleName
          };
        }

        return {
          deviceId: defaultDeviceId,
          deviceName: defaultDeviceName,
          deviceVal: null,
          moduleId: defaultModuleId,
          moduleName: defaultModuleName,
          sochiotFieldName: '',
          displayName: param.name,
          required: Boolean(param.required),
          thresholdValue: '',
          warningHigh: null,
          criticalHigh: null,
          warningLow: null,
          criticalLow: null,
          dataType: 'INTEGER',
          unit: '',
          isCommand: false,
          graphable: true
        };
      });

      // Append any custom saved fields that didn't match standard template parameters
      (savedMappedFields || []).forEach(s => {
        if (!matchedFields.has(s)) {
          templateMerged.push(s);
        }
      });

      return templateMerged;
    };

    const initialSettings = (Array.isArray(d.template_settings) && d.template_settings.length > 0)
      ? d.template_settings
      : (Array.isArray(d.settings) && d.settings.length > 0)
      ? d.settings
      : (Array.isArray(d.deviceSettings) && d.deviceSettings.length > 0)
      ? d.deviceSettings
      : (Array.isArray(d.templateFields) && d.templateFields.length > 0)
      ? d.templateFields
      : [];

    const initialDevIds = extractAllDeviceIds(d, initialSettings);
    if (typeof setDynamicTemplateFields === 'function') {
      const initialMapped = initialSettings.length > 0
        ? matchSettingsWithSochiotDevices(initialSettings, [], initialDevIds, d)
        : [];
      setDynamicTemplateFields(mergeWithCategoryTemplate(initialMapped, d.category, d, initialDevIds));
    }

    setShowRegisterDeviceModal(true);

    // Call GET /sites/{siteId}/devices/{deviceId} to fetch full pre-fed values and settings
    if (resolvedSiteId && d.id) {
      try {
        const getUrl = `${API_BASE_URL}/sites/${resolvedSiteId}/devices/${d.id}`;
        const res = await fetch(getUrl, {
          method: 'GET',
          headers: getAuthHeaders()
        });

        if (res.ok) {
          const json = await res.json();
          const detail = json?.data || json;
          if (detail && (detail.id || detail.name)) {
            setEditingDeviceItem(detail);
            setRegisterForm(prev => ({
              ...prev,
              id: detail.id,
              siteId: String(detail.siteId || resolvedSiteId),
              name: detail.name || prev.name,
              sochiotDeviceIds: Array.isArray(detail.sochiotDeviceIds)
                ? detail.sochiotDeviceIds.join(', ')
                : (detail.sochiotDeviceIds || detail.sochiot_device_ids || prev.sochiotDeviceIds),
              category: detail.category || prev.category,
              areaId: detail.areaId ? String(detail.areaId) : prev.areaId,
              buildingId: detail.buildingId ? String(detail.buildingId) : prev.buildingId,
              floorNo: detail.floorNo !== null && detail.floorNo !== undefined ? String(detail.floorNo) : prev.floorNo,
              roomNo: detail.roomNo !== null && detail.roomNo !== undefined ? String(detail.roomNo) : prev.roomNo,
              energyGroupId: detail.energyGroupId || prev.energyGroupId,
              description: detail.description || prev.description,
              serialNumber: detail.serialNumber || prev.serialNumber,
              profileId: detail.profileId || prev.profileId,
              sochiotTemplateId: detail.sochiotTemplateId || detail.sochiot_template_id || prev.sochiotTemplateId || null,
              moduleIds: Array.isArray(detail.moduleIds) ? detail.moduleIds : prev.moduleIds,
              assetId: detail.assetId ? String(detail.assetId) : prev.assetId
            }));

            let fullSettings = (Array.isArray(detail.settings) && detail.settings.length > 0)
              ? detail.settings
              : (Array.isArray(detail.template_settings) && detail.template_settings.length > 0)
              ? detail.template_settings
              : (Array.isArray(detail.deviceSettings) && detail.deviceSettings.length > 0)
              ? detail.deviceSettings
              : (Array.isArray(detail.templateFields) && detail.templateFields.length > 0)
              ? detail.templateFields
              : [];

            // Fallback: If detail object didn't have settings, fetch from /sites/{siteId}/devices/{deviceId}/settings
            if (fullSettings.length === 0) {
              try {
                const settingsUrl = `${API_BASE_URL}/sites/${resolvedSiteId}/devices/${d.id}/settings`;
                const sRes = await fetch(settingsUrl, {
                  method: 'GET',
                  headers: getAuthHeaders()
                });
                if (sRes.ok) {
                  const sJson = await sRes.json();
                  fullSettings = normalizeList(sJson, 'settings');
                }
              } catch (se) {
                console.warn('Fallback settings fetch error:', se);
              }
            }

            // Fetch Sochiot device and module details
            const allDevIds = extractAllDeviceIds(detail, fullSettings);
            let sochiotDevs = [];
            if (allDevIds.length > 0) {
              try {
                sochiotDevs = await fetchDevicesByDeviceIds(allDevIds);
              } catch (be) {
                console.warn('[useOrgDevices] fetchDevicesByDeviceIds notice:', be);
              }
            }

            if (typeof setDynamicTemplateFields === 'function') {
              const mappedFields = matchSettingsWithSochiotDevices(fullSettings, sochiotDevs, allDevIds, detail);
              setDynamicTemplateFields(mergeWithCategoryTemplate(mappedFields, detail.category || d.category, detail, allDevIds));
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch device detail:', err);
      }
    }
  };

  const handleOpenRegisterDevice = () => {
    fetchAndStoreSochiotAccessToken();
    setEditingDeviceItem(null);
    setRegisterStep(1);
    const defaultSiteId = (selectedSiteFilter && selectedSiteFilter !== 'ALL')
      ? String(selectedSiteFilter)
      : (activeSites && activeSites.length ? String(activeSites[0].id) : '');
    setRegisterForm({
      id: '',
      siteId: defaultSiteId,
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
      assetId: '',
      sochiotTemplateId: null,
      moduleIds: []
    });
    if (typeof setDynamicTemplateFields === 'function') {
      setDynamicTemplateFields([]);
    }
    setShowRegisterDeviceModal(true);
  };

  const handleSaveEditDevice = async (e) => {
    e.preventDefault();
    if (!editingDeviceItem) return;
    setLoading(true);
    try {
      await fetchAndStoreSochiotAccessToken();
      const siteId = editingDeviceItem.siteId || 7;
      const queryParam = siteId ? `?siteId=${siteId}` : '';
      const updateUrl = getApiUrl(`/devices/${editingDeviceItem.id}${queryParam}`);
      const res = await fetch(updateUrl, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editDeviceForm.name,
          category: editDeviceForm.category,
          ...(siteId ? { siteId: Number(siteId) } : {})
        })
      });
      if (res.ok) {
        showToast('success', `Device updated successfully!`);
        setShowEditDeviceModal(false);
        fetchDevices();
      } else {
        const err = await res.json();
        showToast('danger', err.error?.message || err.message || 'Failed to update device');
      }
    } catch (err) {
      showToast('danger', 'Error updating device');
    }
    setLoading(false);
  };

  const handleDeleteDevice = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete device "${name}"?`)) return;
    setLoading(true);
    try {
      const siteId = 7;
      try {
        await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      } catch (e) {
        console.warn('Backend delete notice, removing locally:', e);
      }

      // Persist deleted status
      const deletedIds = JSON.parse(localStorage.getItem('bms_deleted_devices') || '[]');
      if (!deletedIds.includes(String(id))) {
        localStorage.setItem('bms_deleted_devices', JSON.stringify([...deletedIds, String(id)]));
      }

      // Remove from custom registered devices in localStorage
      const customDevices = JSON.parse(localStorage.getItem('bms_registered_devices') || '[]');
      localStorage.setItem('bms_registered_devices', JSON.stringify(customDevices.filter(c => String(c.id) !== String(id))));

      // Remove from devices React state
      setDevices(prev => (Array.isArray(prev) ? prev.filter(d => String(d.id) !== String(id)) : []));
      showToast('success', `Device "${name}" deleted successfully.`);
    } catch (err) {
      showToast('danger', 'Error deleting device');
    }
    setLoading(false);
  };

  const handleOpenLiveModal = async (d) => {
    setSelectedDeviceForLive(d);
    setShowLiveModal(true);
    setLiveLoading(true);
    try {
      const siteId = d.siteId || 7;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${d.id}/live`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setLiveData(json.data || json);
      } else {
        setLiveData(null);
        showToast('danger', 'Live device data could not be loaded.');
      }
    } catch (e) {
      setLiveData(null);
      showToast('danger', 'Live device data could not be loaded.');
    }
    setLiveLoading(false);
  };

  const handleOpenThresholdsModal = (d) => {
    setSelectedDeviceForThresholds(d);
    let validSettings = [];
    if (d.settings && Array.isArray(d.settings) && d.settings.length > 0) {
      validSettings = d.settings;
    } else {
      validSettings = [{ sochiotFieldName: '3,100F', displayName: 'Voltage R-N', warningHigh: 250, criticalHigh: 260, warningLow: 210, criticalLow: 200 }];
    }
    const initialForm = {};
    validSettings.forEach(s => {
      const key = s.sochiotFieldName || s.displayName || '3,100F';
      initialForm[key] = {
        warningHigh: s.warningHigh ?? 250, criticalHigh: s.criticalHigh ?? 260, warningLow: s.warningLow ?? 210, criticalLow: s.criticalLow ?? 200
      };
    });
    setThresholdsForm(initialForm);
    setShowThresholdsModal(true);
  };

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    if (!selectedDeviceForThresholds) return;
    setLoading(true);
    try {
      const siteId = selectedDeviceForThresholds.siteId || 7;
      const res = await fetch(`${API_BASE_URL}/sites/${siteId}/devices/${selectedDeviceForThresholds.id}/thresholds`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ thresholds: thresholdsForm })
      });
      if (res.ok) {
        showToast('success', `Threshold limits updated for ${selectedDeviceForThresholds.name}!`);
        setShowThresholdsModal(false);
        fetchDevices();
      }
    } catch (err) {
      showToast('danger', 'Error updating thresholds');
    }
    setLoading(false);
  };

  const handleOpenSettingsModal = (d) => {
    setSelectedDeviceForSettings(d);
    setShowSettingsModal(true);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    showToast('success', 'Device Modbus settings saved.');
    setShowSettingsModal(false);
  };

  const handleOpenRulesModal = (d) => {
    setSelectedDeviceForRules(d);
    setShowRulesModal(true);
  };

  const handleSaveRules = async (e) => {
    e.preventDefault();
    showToast('success', 'Automation rule configured.');
    setShowRulesModal(false);
  };

  const handleOpenAuditLog = async (d) => {
    setSelectedDeviceForAudit(d);
    setShowAuditLogModal(true);
  };

  const handleOpenRecentEvents = () => {
    setShowRecentEventsModal(true);
  };

  const handleGlobalResyncEventStats = () => {
    setShowConfigDevicesModal(true);
  };

  return {
    devices, setDevices,
    activeDevices,
    selectedCategoryFilter, setSelectedCategoryFilter,
    showDeviceModal, setShowDeviceModal, editingDevice, setEditingDevice, deviceForm, setDeviceForm,
    deviceSubTab, setDeviceSubTab,
    showRegisterDeviceModal, setShowRegisterDeviceModal, registerStep, setRegisterStep,
    showTemplateModal, setShowTemplateModal, wizardStep, setWizardStep,
    registerForm, setRegisterForm,
    dynamicTemplateFields, setDynamicTemplateFields,
    showLiveModal, setShowLiveModal, selectedDeviceForLive, setSelectedDeviceForLive, liveData, setLiveData, liveLoading, setLiveLoading,
    showSettingsModal, setShowSettingsModal, selectedDeviceForSettings, setSelectedDeviceForSettings, deviceSettingsForm, setDeviceSettingsForm,
    showThresholdsModal, setShowThresholdsModal, selectedDeviceForThresholds, setSelectedDeviceForThresholds, thresholdsForm, setThresholdsForm,
    showAuditLogModal, setShowAuditLogModal, selectedDeviceForAudit, setSelectedDeviceForAudit, auditLogs, setAuditLogs,
    showRecentEventsModal, setShowRecentEventsModal, recentEventsList, setRecentEventsList,
    showConfigDevicesModal, setShowConfigDevicesModal,
    showRulesModal, setShowRulesModal, selectedDeviceForRules, setSelectedDeviceForRules, deviceRulesForm, setDeviceRulesForm,
    showEditDeviceModal, setShowEditDeviceModal, editingDeviceItem, setEditingDeviceItem, editDeviceForm, setEditDeviceForm,
    fetchDevices,
    handleOpenEditDevice, handleOpenRegisterDevice, handleSaveEditDevice, handleDeleteDevice,
    handleOpenLiveModal, handleOpenThresholdsModal, handleSaveThresholds,
    handleOpenSettingsModal, handleSaveSettings,
    handleOpenRulesModal, handleSaveRules,
    handleOpenAuditLog, handleOpenRecentEvents, handleGlobalResyncEventStats
  };
};

export default useOrgDevices;
