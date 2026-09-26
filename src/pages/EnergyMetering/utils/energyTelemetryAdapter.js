/**
 * Energy Telemetry Adapter
 * Decouples backend response structures from frontend presentation.
 * Preserves frontend-defined `displayName` values from `deviceTemplates.js`.
 * 
 * Resolution Precedence:
 * 1. `settingId` / `id` (backend setting ID)
 * 2. `fieldKey` / `sochiotFieldName` / `sochiotFieldId` (hardware/Modbus register)
 * 3. Canonical parameter definition from `deviceTemplates.js`
 */

import { DEVICE_TEMPLATES } from '../../../constants/deviceTemplates.js';

/**
 * Returns canonical template definition for a meter category
 */
export const getCanonicalEnergyTemplate = (category) => {
  const cat = String(category || '').trim().toUpperCase();
  if (cat.includes('SUB') || cat === 'ENERGY_METER') {
    return DEVICE_TEMPLATES.SUB_ENERGY_METER;
  }
  return DEVICE_TEMPLATES.MAIN_ENERGY_METER;
};

/**
 * Normalizes string keys for safe, robust comparison without losing phase identity
 */
export const normalizeKey = (str) => {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[\s\-_/()]+/g, '');
};

/**
 * Safely parses any value to numeric if possible
 */
export const parseNumericValue = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  const num = Number(val);
  return isNaN(num) ? null : num;
};

/**
 * Formats a telemetry value cleanly with specified decimal places and optional unit
 */
export const formatTelemetryValue = (val, decimals = 2, unit = '') => {
  if (val === null || val === undefined || val === '') return '--';
  const num = parseNumericValue(val);
  if (num === null) return String(val);

  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return unit ? `${formatted} ${unit}`.trim() : formatted;
};

/**
 * Evaluates alarm/warning/normal threshold status directly from backend-supplied setting limits
 */
export const getThresholdStatusFromSetting = (value, setting) => {
  if (!setting || value === null || value === undefined) return 'default';
  const numVal = parseNumericValue(value);
  if (numVal === null) return 'default';

  const criticalHigh = parseNumericValue(setting.criticalHigh ?? setting.critical_high);
  const criticalLow = parseNumericValue(setting.criticalLow ?? setting.critical_low);
  const warningHigh = parseNumericValue(setting.warningHigh ?? setting.warning_high);
  const warningLow = parseNumericValue(setting.warningLow ?? setting.warning_low);

  // If no thresholds are configured, return default
  if (criticalHigh === null && criticalLow === null && warningHigh === null && warningLow === null) {
    return 'default';
  }

  // Critical alarm conditions
  if (criticalHigh !== null && numVal >= criticalHigh) return 'alert';
  if (criticalLow !== null && numVal <= criticalLow) return 'alert';

  // Warning conditions
  if (warningHigh !== null && numVal >= warningHigh) return 'warning';
  if (warningLow !== null && numVal <= warningLow) return 'warning';

  return 'normal';
};

/**
 * Maps an individual setting to its corresponding telemetry event reading.
 * Uses 3-tier precedence:
 *   1. settingId match
 *   2. fieldKey / sochiotFieldName match
 *   3. Canonical display name match
 * 
 * Never fabricates values; returns null if telemetry is missing.
 */
export const mapSettingToTelemetry = (setting, eventsArray = []) => {
  if (!setting || !Array.isArray(eventsArray) || eventsArray.length === 0) {
    return null;
  }

  const sId = setting.id !== undefined && setting.id !== null
    ? String(setting.id)
    : (setting.settingId !== undefined && setting.settingId !== null ? String(setting.settingId) : null);

  const sFieldKey = String(setting.sochiotFieldName || setting.fieldKey || setting.fieldName || '').trim();
  const sFieldKeyNorm = normalizeKey(sFieldKey);
  const sDisplayName = String(setting.displayName || setting.name || '').trim();
  const sDisplayNameNorm = normalizeKey(sDisplayName);

  let matchedEvent = null;

  // Tier 1: Match by settingId / id
  if (sId) {
    matchedEvent = eventsArray.find(e => {
      if (!e) return false;
      const eId = e.settingId !== undefined && e.settingId !== null
        ? String(e.settingId)
        : (e.id !== undefined && e.id !== null ? String(e.id) : null);
      return eId && eId === sId;
    });
  }

  // Tier 2: Match by fieldKey / sochiotFieldName
  if (!matchedEvent && sFieldKeyNorm) {
    matchedEvent = eventsArray.find(e => {
      if (!e) return false;
      const eKey = String(e.fieldKey || e.sochiotFieldName || e.fieldName || e.key || '').trim();
      if (!eKey) return false;
      return normalizeKey(eKey) === sFieldKeyNorm;
    });
  }

  // Tier 3: Match by display name (fallback only if stable keys not matched)
  if (!matchedEvent && sDisplayNameNorm) {
    matchedEvent = eventsArray.find(e => {
      if (!e) return false;
      const eName = String(e.displayName || e.name || e.label || '').trim();
      if (!eName) return false;
      return normalizeKey(eName) === sDisplayNameNorm;
    });
  }

  if (!matchedEvent) {
    return null;
  }

  // Extract raw value without fabrication
  const rawValue = matchedEvent.currentValue !== undefined
    ? matchedEvent.currentValue
    : (matchedEvent.value !== undefined
        ? matchedEvent.value
        : (matchedEvent.lastValue !== undefined ? matchedEvent.lastValue : (matchedEvent.avgValue !== undefined ? matchedEvent.avgValue : null)));

  const parsedValue = parseNumericValue(rawValue);
  const finalValue = parsedValue !== null ? parsedValue : rawValue;

  // Backend dynamic unit with setting fallback
  const unit = matchedEvent.unit || setting.unit || '';
  const time = matchedEvent.time || matchedEvent.updatedAt || matchedEvent.timestamp || null;

  // Determine threshold status
  const status = getThresholdStatusFromSetting(finalValue, setting);

  return {
    settingId: sId || matchedEvent.settingId,
    fieldKey: sFieldKey || matchedEvent.fieldKey || '',
    displayName: sDisplayName, // PRESERVE frontend-defined displayName
    unit,
    value: finalValue,
    rawValue,
    time,
    status,
    isWarning: status === 'warning',
    isCritical: status === 'alert',
    isAlarm: status === 'warning' || status === 'alert'
  };
};

/**
 * Resolves all device settings against raw latest events payload.
 * 
 * @param {Object} device - Device object from GET /devices (contains `device.settings` or `device.template_settings`)
 * @param {Object|Array} eventsPayload - Response from GET /devices/:id/events/latest or batch endpoint
 * @param {string} [category] - Optional category override (e.g. MAIN_ENERGY_METER, SUB_ENERGY_METER)
 * @returns {{
 *   settingsTelemetryMap: Map<string, Object>,
 *   resolvedSettings: Array<Object>,
 *   lastEventTime: number|null,
 *   rawFields: Array<Object>
 * }}
 */
export const resolveDeviceTelemetry = (device, eventsPayload, category) => {
  const payload = eventsPayload?.data || eventsPayload || {};
  let fieldsArray = Array.isArray(payload.fields)
    ? payload.fields
    : (Array.isArray(payload) ? payload : (Array.isArray(payload.results) ? payload.results : []));

  // Support flat key-value dictionaries (e.g. { vR: 230, ebKwh: 120 })
  if (fieldsArray.length === 0 && payload && typeof payload === 'object') {
    const reserved = new Set(['data', 'fields', 'results', 'lastEventTime', 'timestamp', 'success', 'error', 'message']);
    fieldsArray = Object.entries(payload)
      .filter(([k]) => !reserved.has(k))
      .map(([k, v]) => ({
        fieldKey: k,
        displayName: k,
        value: typeof v === 'object' && v !== null ? (v.value ?? v.currentValue) : v,
        unit: typeof v === 'object' && v !== null ? v.unit : undefined
      }));
  }

  // Determine latest event timestamp
  let lastEventTime = payload.lastEventTime || null;
  for (const f of fieldsArray) {
    if (f?.time && (!lastEventTime || f.time > lastEventTime)) {
      lastEventTime = f.time;
    }
  }

  // 1. Gather device configured settings
  const deviceSettings = Array.isArray(device?.settings) && device.settings.length > 0
    ? device.settings
    : (Array.isArray(device?.template_settings) && device.template_settings.length > 0
        ? device.template_settings
        : (Array.isArray(device?.deviceSettings) && device.deviceSettings.length > 0 ? device.deviceSettings : []));

  // 2. Canonical template fallback parameters
  const targetCategory = category || device?.category || 'MAIN_ENERGY_METER';
  const canonicalTemplate = getCanonicalEnergyTemplate(targetCategory);
  const canonicalParams = canonicalTemplate?.parameters || [];

  const settingsTelemetryMap = new Map();
  const resolvedSettings = [];

  // Helper to add resolved setting
  const addResolvedSetting = (settingDef, telemetry) => {
    const sId = settingDef.id !== undefined && settingDef.id !== null ? String(settingDef.id) : (settingDef.settingId ? String(settingDef.settingId) : null);
    const key = sId ? `id:${sId}` : `name:${normalizeKey(settingDef.displayName || settingDef.name)}`;

    const resolved = {
      settingId: sId,
      fieldKey: settingDef.sochiotFieldName || settingDef.fieldKey || telemetry?.fieldKey || '',
      displayName: settingDef.displayName || settingDef.name || 'Telemetry Parameter',
      unit: telemetry?.unit || settingDef.unit || '',
      value: telemetry?.value !== undefined ? telemetry.value : null,
      rawValue: telemetry?.rawValue !== undefined ? telemetry.rawValue : null,
      time: telemetry?.time || lastEventTime,
      status: telemetry?.status || 'default',
      isWarning: Boolean(telemetry?.isWarning),
      isCritical: Boolean(telemetry?.isCritical),
      settingDef
    };

    settingsTelemetryMap.set(key, resolved);
    if (sId) settingsTelemetryMap.set(`id:${sId}`, resolved);
    if (resolved.fieldKey) settingsTelemetryMap.set(`key:${resolved.fieldKey}`, resolved);
    if (resolved.displayName) settingsTelemetryMap.set(`name:${normalizeKey(resolved.displayName)}`, resolved);

    resolvedSettings.push(resolved);
  };

  // A. First resolve all configured device settings
  if (deviceSettings.length > 0) {
    deviceSettings.forEach(s => {
      // Skip command-only settings without telemetry capability
      if (s.isCommand === true && s.isTelemetry === false) return;

      // Find matching canonical template parameter to guarantee frontend displayName accuracy
      const sNameNorm = normalizeKey(s.displayName || s.name);
      const canonicalMatch = canonicalParams.find(p => normalizeKey(p.name) === sNameNorm);

      const effectiveSetting = {
        ...s,
        displayName: canonicalMatch?.name || s.displayName || s.name
      };

      const telemetry = mapSettingToTelemetry(effectiveSetting, fieldsArray);
      addResolvedSetting(effectiveSetting, telemetry);
    });
  } else {
    // B. If device has no explicit settings array, map canonical template parameters
    canonicalParams.forEach(p => {
      const settingStub = {
        name: p.name,
        displayName: p.name,
        unit: p.unit || '',
        category: targetCategory
      };
      const telemetry = mapSettingToTelemetry(settingStub, fieldsArray);
      addResolvedSetting(settingStub, telemetry);
    });
  }

  // C. Also capture any raw event fields that might not be in template (safely without losing data)
  fieldsArray.forEach(f => {
    if (!f) return;
    const fId = f.settingId !== undefined && f.settingId !== null ? String(f.settingId) : (f.id ? String(f.id) : null);
    const keyById = fId ? `id:${fId}` : null;
    const keyByName = f.displayName ? `name:${normalizeKey(f.displayName)}` : null;

    if ((keyById && settingsTelemetryMap.has(keyById)) || (keyByName && settingsTelemetryMap.has(keyByName))) {
      return; // Already resolved
    }

    const rawVal = f.currentValue !== undefined ? f.currentValue : (f.value !== undefined ? f.value : null);
    const parsed = parseNumericValue(rawVal);
    const finalVal = parsed !== null ? parsed : rawVal;

    const unmappedItem = {
      settingId: fId,
      fieldKey: f.fieldKey || f.sochiotFieldName || '',
      displayName: f.displayName || f.name || f.fieldName || 'Parameter',
      unit: f.unit || '',
      value: finalVal,
      rawValue: rawVal,
      time: f.time || lastEventTime,
      status: 'default',
      isWarning: false,
      isCritical: false,
      settingDef: f
    };

    if (keyById) settingsTelemetryMap.set(keyById, unmappedItem);
    if (f.fieldKey) settingsTelemetryMap.set(`key:${f.fieldKey}`, unmappedItem);
    resolvedSettings.push(unmappedItem);
  });

  // Flat key-value dictionary for legacy callers
  const updates = {};
  resolvedSettings.forEach(item => {
    const safeKey = normalizeKey(item.displayName);
    if (safeKey && item.value !== null) {
      updates[safeKey] = item.value;
    }
    if (item.fieldKey && item.value !== null) {
      updates[item.fieldKey] = item.value;
    }
    if (item.settingId && item.value !== null) {
      updates[`setting_${item.settingId}`] = item.value;
    }
  });

  return {
    settingsTelemetryMap,
    resolvedSettings,
    lastEventTime,
    updates,
    rawFields: fieldsArray
  };
};
