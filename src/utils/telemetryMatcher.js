/**
 * Telemetry and Event Matcher
 * Maps real-time hardware telemetry (from Sochiot socket/REST) to device template_settings
 * using standardized display names.
 */

/**
 * Normalizes parameter/display name for comparison
 */
export const normalizeDisplayName = (name) => {
  if (!name) return '';
  return String(name).trim().toLowerCase().replace(/[\s\-_/()]+/g, ' ');
};

/**
 * Extracts setting definitions from device object
 */
export const getDeviceTemplateSettings = (device) => {
  if (!device) return [];
  if (Array.isArray(device.template_settings) && device.template_settings.length > 0) {
    return device.template_settings;
  }
  if (Array.isArray(device.settings) && device.settings.length > 0) {
    return device.settings;
  }
  if (Array.isArray(device.deviceSettings) && device.deviceSettings.length > 0) {
    return device.deviceSettings;
  }
  if (Array.isArray(device.templateFields) && device.templateFields.length > 0) {
    return device.templateFields;
  }
  return [];
};

/**
 * Finds a specific template setting by its standardized display name
 */
export const getSettingByDisplayName = (deviceOrSettings, targetDisplayName) => {
  const settings = Array.isArray(deviceOrSettings)
    ? deviceOrSettings
    : getDeviceTemplateSettings(deviceOrSettings);

  if (!settings || settings.length === 0 || !targetDisplayName) return null;

  const targetNorm = normalizeDisplayName(targetDisplayName);

  // Exact or normalized match
  return settings.find(s => {
    const sName = normalizeDisplayName(s.displayName || s.sochiotFieldName || s.name);
    return sName === targetNorm;
  }) || null;
};

/**
 * Extracts a telemetry reading for a given setting from a live stats array or object
 * @param {Object} setting - Setting object from template_settings
 * @param {Array|Object} liveStats - Array of module telemetry objects or single stat
 */
export const extractTelemetryValue = (setting, liveStats) => {
  if (!setting || !liveStats) return null;

  // Unpack liveStats if wrapped in an object like { data: ... }, { fields: ... }, { events: ... }
  let targetStats = liveStats;
  if (!Array.isArray(targetStats) && typeof targetStats === 'object') {
    if (Array.isArray(targetStats.fields)) targetStats = targetStats.fields;
    else if (Array.isArray(targetStats.data)) targetStats = targetStats.data;
    else if (Array.isArray(targetStats.events)) targetStats = targetStats.events;
    else if (Array.isArray(targetStats.results)) targetStats = targetStats.results;
    else if (targetStats.data && typeof targetStats.data === 'object') {
      if (Array.isArray(targetStats.data.fields)) targetStats = targetStats.data.fields;
      else if (Array.isArray(targetStats.data.events)) targetStats = targetStats.data.events;
    }
  }

  const targetModuleId = setting.moduleId ? String(setting.moduleId) : null;
  const targetField = setting.sochiotFieldName || setting.fieldName || setting.fieldKey || setting.eventField;
  const targetFieldClean = targetField ? String(targetField).trim().replace(/,/g, '.') : '';
  const targetDisplayNameNorm = normalizeDisplayName(setting.displayName || setting.name);
  const settingIdStr = setting.id !== undefined && setting.id !== null ? String(setting.id) : null;

  let matchedStat = null;
  let rawValue = undefined;

  if (Array.isArray(targetStats)) {
    matchedStat = targetStats.find(s => {
      if (!s) return false;
      // 1. Match by setting id
      if (settingIdStr && (String(s.settingId || s.id || '') === settingIdStr)) return true;
      // 2. Match by normalized display name
      const sNameNorm = normalizeDisplayName(s.displayName || s.name || s.label);
      if (targetDisplayNameNorm && sNameNorm && sNameNorm === targetDisplayNameNorm) return true;
      // 3. Match by fieldName / key with comma/dot normalization
      const sKey = String(s.fieldName || s.fieldKey || s.sochiotFieldName || s.key || '').trim();
      const sKeyClean = sKey.replace(/,/g, '.');
      if (targetFieldClean && sKeyClean && (sKeyClean.toLowerCase() === targetFieldClean.toLowerCase() || sKey.toLowerCase() === String(targetField).toLowerCase())) return true;
      // 4. Match by module id & meta
      if (targetModuleId) {
        const mId = String(s.moduleId || s.meta?.module_id || s.module_id || '');
        if (mId && mId === targetModuleId && s.meta && s.meta[targetField] !== undefined) return true;
      }
      return Boolean(s.meta && targetField && s.meta[targetField] !== undefined);
    });

    if (matchedStat) {
      rawValue = matchedStat.currentValue !== undefined
        ? matchedStat.currentValue
        : (matchedStat.value !== undefined
            ? matchedStat.value
            : (matchedStat.lastValue !== undefined
                ? matchedStat.lastValue
                : (matchedStat.meta && targetField ? matchedStat.meta[targetField] : undefined)));
    }
  } else if (typeof targetStats === 'object') {
    matchedStat = targetStats;
    if (matchedStat.meta && targetField && matchedStat.meta[targetField] !== undefined) {
      rawValue = matchedStat.meta[targetField];
    } else if (targetField && matchedStat[targetField] !== undefined) {
      rawValue = matchedStat[targetField];
    } else if (targetFieldClean && matchedStat[targetFieldClean] !== undefined) {
      rawValue = matchedStat[targetFieldClean];
    }
  }

  if (rawValue === undefined || rawValue === null) return null;

  let numericValue = Number(rawValue);
  const isNumber = !isNaN(numericValue);

  let finalValue = isNumber ? numericValue : rawValue;

  // Apply multiplier if defined in meta, guarding against double-scaling already converted decimals
  const multiplier = setting.meta?.multiplier ?? setting.multiplier;
  if (isNumber && multiplier !== undefined && multiplier !== null && !isNaN(Number(multiplier))) {
    const multNum = Number(multiplier);
    if (multNum !== 1) {
      if (Number.isInteger(numericValue) || multNum > 1) {
        finalValue = finalValue * multNum;
      }
    }
  }

  // Check threshold alarms
  let isWarning = false;
  let isCritical = false;

  if (isNumber) {
    if (setting.criticalHigh !== null && setting.criticalHigh !== undefined && finalValue >= Number(setting.criticalHigh)) {
      isCritical = true;
    } else if (setting.criticalLow !== null && setting.criticalLow !== undefined && finalValue <= Number(setting.criticalLow)) {
      isCritical = true;
    } else if (setting.warningHigh !== null && setting.warningHigh !== undefined && finalValue >= Number(setting.warningHigh)) {
      isWarning = true;
    } else if (setting.warningLow !== null && setting.warningLow !== undefined && finalValue <= Number(setting.warningLow)) {
      isWarning = true;
    }
  }

  return {
    value: finalValue,
    rawValue,
    unit: setting.unit || null,
    isWarning,
    isCritical,
    isAlarm: isWarning || isCritical,
    moduleId: targetModuleId,
    fieldName: targetField,
    displayName: setting.displayName || targetField,
    updatedAt: matchedStat.updatedAt || matchedStat.timestamp || matchedStat.time || new Date().toISOString()
  };
};

/**
 * Returns a complete map of { [displayName]: telemetryReading } for a given device
 */
export const getDeviceTelemetryMap = (device, liveStats) => {
  const settings = getDeviceTemplateSettings(device);
  const result = {};

  if (!settings || settings.length === 0 || !liveStats) return result;

  settings.forEach(s => {
    const dName = s.displayName || s.sochiotFieldName;
    if (!dName) return;

    const reading = extractTelemetryValue(s, liveStats);
    if (reading) {
      result[dName] = reading;
    }
  });

  return result;
};

/**
 * Convenience getter for a specific display name on a device
 */
export const getTelemetryByDisplayName = (device, targetDisplayName, liveStats) => {
  const setting = getSettingByDisplayName(device, targetDisplayName);
  if (!setting) return null;
  return extractTelemetryValue(setting, liveStats);
};
