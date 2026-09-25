/**
 * AG Tank & Water Telemetry Adapter
 * Decouples backend API responses from presentation.
 * Drives AG Tank SCADA metrics dynamically from device templates & backend events.
 * 
 * Category source of truth: 'AG_TANK' (from constants/deviceTemplates.js)
 */

import { DEVICE_TEMPLATES, isCategoryMatch } from '../../../constants/deviceTemplates.js';

/**
 * Returns canonical template definition for AG Tank
 */
export const getCanonicalAgTankTemplate = () => {
  return DEVICE_TEMPLATES.AG_TANK || {
    id: 'AG_TANK',
    label: 'Above Ground (AG) Tank',
    parameters: [
      { name: 'WATER LEVEL', parameter: 'Tank Level', required: true },
      { name: 'WATER LEVEL %', parameter: 'Tank Level %', required: true },
      { name: 'TANK CAPACITY', parameter: 'Tank Capacity', required: false },
      { name: 'INLET FLOW', parameter: 'Inlet Flow', required: false },
      { name: 'OUTLET FLOW', parameter: 'Outlet Flow', required: false },
      { name: 'OPEN VALVE', parameter: 'Inlet Valve', required: false },
      { name: 'CLOSE VALVE', parameter: 'Outlet Valve', required: false },
      { name: 'VALVE STATUS START', parameter: 'Valve Status Start', required: false },
      { name: 'VALVE STATUS STOP', parameter: 'Valve Status Stop', required: false },
      { name: 'LOWER LIMITS', parameter: 'Low-Level Alarm', required: false },
      { name: 'UPPER LIMITS', parameter: 'High-Level Alarm', required: false },
      { name: 'OVERFLOW ALARM', parameter: 'Overflow Alarm', required: false }
    ]
  };
};

/**
 * Normalizes string keys for safe, robust comparison without losing identity
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
 * Formats a telemetry value cleanly with specified decimal places and optional unit.
 * Never returns 'undefined', 'null', or 'NaN'.
 */
export const formatWaterTelemetryValue = (val, decimals = 1, unit = '') => {
  if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val)) || String(val).trim().toUpperCase() === 'NAN') {
    return '--';
  }
  const num = parseNumericValue(val);
  if (num === null) return String(val);

  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(num) && decimals === 0 ? 0 : Math.min(decimals, 1),
    maximumFractionDigits: decimals
  });

  return unit ? `${formatted} ${unit}`.trim() : formatted;
};

/**
 * Evaluates alarm/warning/normal threshold status directly from setting limits
 */
export const getWaterThresholdStatus = (value, setting) => {
  if (!setting || value === null || value === undefined) return 'default';
  const numVal = parseNumericValue(value);
  if (numVal === null) return 'default';

  const criticalHigh = parseNumericValue(setting.criticalHigh ?? setting.critical_high ?? setting.maxLevel);
  const criticalLow = parseNumericValue(setting.criticalLow ?? setting.critical_low ?? setting.minLevel);
  const warningHigh = parseNumericValue(setting.warningHigh ?? setting.warning_high);
  const warningLow = parseNumericValue(setting.warningLow ?? setting.warning_low);

  if (criticalHigh === null && criticalLow === null && warningHigh === null && warningLow === null) {
    return 'default';
  }

  if (criticalHigh !== null && numVal >= criticalHigh) return 'alert';
  if (criticalLow !== null && numVal <= criticalLow) return 'alert';
  if (warningHigh !== null && numVal >= warningHigh) return 'warning';
  if (warningLow !== null && numVal <= warningLow) return 'warning';

  return 'normal';
};

/**
 * Synonym mapping for AG Tank parameters to ensure robust matching across vendors
 */
export const AG_TANK_FIELD_SYNONYMS = {
  waterLevelPct: [
    'water level %', 'tank level %', 'water_level_%', 'level %', 'level_percent',
    'tank_level_pct', 'level pct', 'water level percentage', 'tank level percentage',
    'level percentage', 'water level', 'waterlevel', 'tank level', 'tanklevel', 'level'
  ],
  waterLevel: [
    'water level', 'tank level', 'water_level', 'tank_level', 'water level (m)',
    'water level (cm)', 'level (m)', 'level (cm)', 'water depth', 'depth'
  ],
  tankCapacity: [
    'tank capacity', 'capacity', 'total capacity', 'tank_capacity', 'capacity (l)',
    'capacity (kl)', 'volume', 'tank volume', 'max volume'
  ],
  inletFlow: [
    'inlet flow', 'inlet_flow', 'inflow', 'inflow rate', 'inlet flow rate',
    'water inflow', 'inlet water flow', 'inlet lpm', 'inlet'
  ],
  outletFlow: [
    'outlet flow', 'outlet_flow', 'outflow', 'outflow rate', 'outlet flow rate',
    'water outflow', 'outlet water flow', 'outlet lpm', 'discharge flow'
  ],
  inletValve: [
    'open valve', 'inlet valve', 'inlet_valve', 'open_valve', 'inlet valve status',
    'inlet valve open', 'inlet valve state'
  ],
  outletValve: [
    'close valve', 'outlet valve', 'outlet_valve', 'close_valve', 'outlet valve status',
    'outlet valve close', 'outlet valve state'
  ],
  valveStatus: [
    'valve status', 'valve_status', 'valve status start', 'valve status stop',
    'valve status on', 'valve state', 'valve'
  ],
  pumpStatus: [
    'pump status', 'pump_status', 'pump running', 'pump on/off', 'motor status',
    'pump state', 'running status'
  ],
  lowerLimit: [
    'lower limits', 'lower limit', 'low-level alarm', 'low level alarm', 'min level',
    'min_level', 'low level threshold', 'low alarm', 'lower_limit'
  ],
  upperLimit: [
    'upper limits', 'upper limit', 'high-level alarm', 'high level alarm', 'max level',
    'max_level', 'high level threshold', 'high alarm', 'upper_limit'
  ],
  overflowAlarm: [
    'overflow alarm', 'overflow_alarm', 'high-high level alarm', 'overflow warning',
    'tank overflow', 'spill alarm'
  ],
  currentAmps: [
    'current', 'amps', 'current (a)', 'flow current', 'motor current', 'phase current'
  ]
};

/**
 * Maps a single setting or field synonym against an events array.
 * Resolution precedence:
 *   1. settingId / id match
 *   2. fieldKey / sochiotFieldName match
 *   3. displayName normalized match
 *   4. Synonym array matching
 */
export const findEventField = (settingOrKey, eventsArray = [], synonyms = []) => {
  if (!Array.isArray(eventsArray) || eventsArray.length === 0) return null;

  const targetId = settingOrKey?.id !== undefined ? String(settingOrKey.id) : (settingOrKey?.settingId ? String(settingOrKey.settingId) : null);
  const targetKey = String(settingOrKey?.sochiotFieldName || settingOrKey?.fieldKey || settingOrKey?.fieldName || (typeof settingOrKey === 'string' ? settingOrKey : '')).trim();
  const targetKeyNorm = normalizeKey(targetKey);
  const targetName = String(settingOrKey?.displayName || settingOrKey?.name || targetKey).trim();
  const targetNameNorm = normalizeKey(targetName);

  // 1. Match by setting ID
  if (targetId) {
    const match = eventsArray.find(e => {
      const eId = e.settingId !== undefined ? String(e.settingId) : (e.id !== undefined ? String(e.id) : null);
      return eId && eId === targetId;
    });
    if (match) return match;
  }

  // 2. Match by exact field key / register
  if (targetKeyNorm) {
    const match = eventsArray.find(e => {
      const eKey = String(e.fieldKey || e.sochiotFieldName || e.fieldName || e.key || '').trim();
      return eKey && normalizeKey(eKey) === targetKeyNorm;
    });
    if (match) return match;
  }

  // 3. Match by display name
  if (targetNameNorm) {
    const match = eventsArray.find(e => {
      const eName = String(e.displayName || e.name || e.label || '').trim();
      return eName && normalizeKey(eName) === targetNameNorm;
    });
    if (match) return match;
  }

  // 4. Match via synonym list
  if (Array.isArray(synonyms) && synonyms.length > 0) {
    const normSynonyms = synonyms.map(normalizeKey);
    const match = eventsArray.find(e => {
      const eName = normalizeKey(e.displayName || e.name || e.label || '');
      const eKey = normalizeKey(e.fieldKey || e.sochiotFieldName || e.fieldName || '');
      return normSynonyms.includes(eName) || normSynonyms.includes(eKey);
    });
    if (match) return match;
  }

  return null;
};

/**
 * Extracts all event fields safely from an API event response or batch result
 */
export const extractEventsList = (eventsRes) => {
  if (!eventsRes) return [];
  const fields = [];

  const payload = eventsRes?.data?.results?.[0] || eventsRes?.data || eventsRes;

  if (Array.isArray(payload?.fields)) {
    fields.push(...payload.fields);
  } else if (Array.isArray(eventsRes?.fields)) {
    fields.push(...eventsRes.fields);
  }

  const rawList = Array.isArray(payload) ? payload
    : Array.isArray(eventsRes) ? eventsRes
    : Array.isArray(payload?.modules) ? payload.modules
    : (Array.isArray(payload?.results) ? payload.results : [payload]);

  rawList.forEach(item => {
    if (!item) return;
    if (Array.isArray(item.eventFields)) fields.push(...item.eventFields);
    if (Array.isArray(item.fields)) fields.push(...item.fields);
    if (item.fieldName || item.displayName) fields.push(item);
  });

  return fields;
};

/**
 * Resolves an individual AG Tank device into a normalized, UI-ready model
 * driven dynamically by its template settings and latest telemetry.
 * 
 * @param {Object} device - Device record from GET /devices
 * @param {Object} eventResult - Latest events record from batch API or single endpoint
 * @returns {Object} Normalized AG Tank Model
 */
export const resolveAgTankDevice = (device, eventResult = null) => {
  const devId = device?.id || device?.deviceId || device?.bmsDeviceId;
  const devName = device?.name || device?.title || device?.deviceName || `AG Tank #${devId}`;

  // Gather device settings
  const configuredSettings = Array.isArray(device?.settings) && device.settings.length > 0
    ? device.settings
    : (Array.isArray(device?.template_settings) && device.template_settings.length > 0
        ? device.template_settings
        : (Array.isArray(device?.deviceSettings) && device.deviceSettings.length > 0 ? device.deviceSettings : []));

  // Canonical template fallback parameters
  const canonicalTemplate = getCanonicalAgTankTemplate();
  const canonicalParams = canonicalTemplate.parameters || [];

  // Extract raw fields from eventResult
  const eventsList = extractEventsList(eventResult);

  // Extract timestamp
  const lastEventTime = eventResult?.lastEventTime || device?.lastSeenAt || null;
  let lastEventTimeFormatted = eventResult?.lastEventTimeFormatted || null;
  if (!lastEventTimeFormatted && lastEventTime) {
    try {
      const d = new Date(lastEventTime > 1e12 ? lastEventTime : lastEventTime * 1000);
      lastEventTimeFormatted = d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
    } catch (e) {
      lastEventTimeFormatted = null;
    }
  }

  // 1. Resolve raw fields dynamically from configured settings or canonical template
  const rawFields = [];
  const settingsToProcess = configuredSettings.length > 0 ? configuredSettings : canonicalParams;

  settingsToProcess.forEach(settingDef => {
    const sName = settingDef.displayName || settingDef.name || settingDef.parameter || 'Parameter';
    const sUnit = settingDef.unit || '';
    const match = findEventField(settingDef, eventsList);

    let val = null;
    let rawVal = null;
    let fieldUnit = sUnit;
    let fieldTime = null;

    if (match) {
      rawVal = match.currentValue !== undefined ? match.currentValue : (match.value !== undefined ? match.value : null);
      val = parseNumericValue(rawVal);
      if (val === null && rawVal !== null && rawVal !== undefined) {
        val = rawVal; // preserve string statuses like "OPEN" / "CLOSE"
      }
      fieldUnit = match.unit || sUnit;
      fieldTime = match.time || match.timestamp || null;
    }

    const thresholdStatus = getWaterThresholdStatus(val, settingDef);

    rawFields.push({
      id: settingDef.id || settingDef.settingId || null,
      displayName: sName,
      fieldKey: settingDef.sochiotFieldName || settingDef.fieldKey || match?.fieldName || match?.sochiotFieldName || '',
      unit: fieldUnit,
      value: val,
      rawValue: rawVal,
      status: thresholdStatus,
      isWarning: thresholdStatus === 'warning',
      isCritical: thresholdStatus === 'alert',
      isAlarm: thresholdStatus === 'warning' || thresholdStatus === 'alert',
      time: fieldTime
    });
  });

  // 2. Extract Primary SCADA Metrics using synonym matching
  // Water Level %
  const levelPctEvt = findEventField(null, eventsList, AG_TANK_FIELD_SYNONYMS.waterLevelPct);
  let level = null;
  if (levelPctEvt) {
    const raw = levelPctEvt.currentValue ?? levelPctEvt.value;
    const num = parseNumericValue(raw);
    if (num !== null) {
      // If reading is between 0-1 (e.g. 0.75), convert to percentage
      level = num <= 1 && num > 0 ? Math.round(num * 100) : Math.round(num);
    }
  }

  // Water Level (absolute / depth)
  const levelEvt = findEventField(null, eventsList, AG_TANK_FIELD_SYNONYMS.waterLevel);
  const waterLevel = levelEvt ? (levelEvt.currentValue ?? levelEvt.value ?? null) : null;
  const waterLevelUnit = levelEvt?.unit || 'm';

  // Tank Capacity
  const capEvt = findEventField(null, eventsList, AG_TANK_FIELD_SYNONYMS.tankCapacity);
  const capacity = capEvt ? (capEvt.currentValue ?? capEvt.value ?? null) : null;
  const capacityUnit = capEvt?.unit || 'L';

  // Inlet Flow
  const inFlowEvt = findEventField(null, eventsList, AG_TANK_FIELD_SYNONYMS.inletFlow);
  const inletFlow = inFlowEvt ? parseNumericValue(inFlowEvt.currentValue ?? inFlowEvt.value) : null;
  const inletFlowUnit = inFlowEvt?.unit || 'LPM';

  // Outlet Flow
  const outFlowEvt = findEventField(null, eventsList, AG_TANK_FIELD_SYNONYMS.outletFlow);
  const outletFlow = outFlowEvt ? parseNumericValue(outFlowEvt.currentValue ?? outFlowEvt.value) : null;
  const outletFlowUnit = outFlowEvt?.unit || 'LPM';

  // Current / Amps
  const ampsEvt = findEventField(null, eventsList, AG_TANK_FIELD_SYNONYMS.currentAmps);
  const currentAmps = ampsEvt ? parseNumericValue(ampsEvt.currentValue ?? ampsEvt.value) : null;

  // Valve State (OPEN / CLOSE)
  const valveEvt = findEventField(null, eventsList, AG_TANK_FIELD_SYNONYMS.valveStatus) ||
                   findEventField(null, eventsList, AG_TANK_FIELD_SYNONYMS.inletValve) ||
                   findEventField(null, eventsList, AG_TANK_FIELD_SYNONYMS.outletValve);
  
  let valveState = 'CLOSE';
  if (valveEvt) {
    const rawV = valveEvt.currentValue ?? valveEvt.value;
    if (typeof rawV === 'number' || (!isNaN(Number(rawV)) && rawV !== '')) {
      valveState = Number(rawV) >= 50 || Number(rawV) === 1 ? 'OPEN' : 'CLOSE';
    } else if (rawV) {
      const vStr = String(rawV).trim().toUpperCase();
      if (['OPEN', '1', 'ON', 'RUNNING', 'HIGH', 'TRUE'].includes(vStr)) {
        valveState = 'OPEN';
      } else {
        valveState = 'CLOSE';
      }
    }
  }

  // Alarms & Limits
  const lowerLimitEvt = findEventField(null, eventsList, AG_TANK_FIELD_SYNONYMS.lowerLimit);
  const upperLimitEvt = findEventField(null, eventsList, AG_TANK_FIELD_SYNONYMS.upperLimit);
  const overflowEvt = findEventField(null, eventsList, AG_TANK_FIELD_SYNONYMS.overflowAlarm);

  const minLevel = lowerLimitEvt ? parseNumericValue(lowerLimitEvt.currentValue ?? lowerLimitEvt.value) : (device?.minLevel ?? 20);
  const maxLevel = upperLimitEvt ? parseNumericValue(upperLimitEvt.currentValue ?? upperLimitEvt.value) : (device?.maxLevel ?? 90);
  const hasOverflow = overflowEvt ? Boolean(parseNumericValue(overflowEvt.currentValue ?? overflowEvt.value)) : false;

  // Determine Online Status
  let isOnline = false;
  if (device?.status) {
    const s = String(device.status).toUpperCase();
    if (s === 'ONLINE' || s === 'ACTIVE') isOnline = true;
  }
  if (!isOnline && lastEventTime) {
    const lastTimeMs = lastEventTime > 1e12 ? lastEventTime : lastEventTime * 1000;
    // Consider online if telemetry received within last 2 hours
    if (Math.abs(Date.now() - lastTimeMs) < 2 * 3600 * 1000) {
      isOnline = true;
    }
  }
  if (!isOnline && eventsList.length > 0) {
    isOnline = true;
  }

  // Determine Operating Status
  let status = 'Stopped';
  if (!isOnline) {
    status = 'Offline';
  } else if (hasOverflow || (level !== null && maxLevel !== null && level >= maxLevel)) {
    status = 'Fault';
  } else if (level !== null && minLevel !== null && level <= minLevel) {
    status = 'Warning';
  } else if (valveState === 'OPEN' || (inletFlow && inletFlow > 0) || (outletFlow && outletFlow > 0)) {
    status = 'Running';
  } else {
    status = 'Stopped';
  }

  // Identify Sector / Type dynamically (DOMESTIC vs FLUSHING vs GENERAL)
  let sectorType = 'DOMESTIC';
  const upperDevName = devName.toUpperCase();
  if (upperDevName.includes('FLUSH') || upperDevName.includes('-F-') || upperDevName.includes('TOWER-F')) {
    sectorType = 'FLUSHING';
  } else if (upperDevName.includes('DOM') || upperDevName.includes('-D-') || upperDevName.includes('TOWER-D')) {
    sectorType = 'DOMESTIC';
  } else if (upperDevName.includes('FIRE') || upperDevName.includes('RAW')) {
    sectorType = 'UTILITY';
  }

  return {
    id: devId,
    bmsDeviceId: device?.bmsDeviceId || devId,
    name: devName,
    category: device?.category || 'AG_TANK',
    templateName: device?.templateName || 'Above Ground Tank',
    sectorType,
    buildingName: device?.buildingName || device?.building?.name || null,
    assetName: device?.assetName || device?.asset?.name || null,
    level: level !== null ? Math.min(100, Math.max(0, level)) : null,
    waterLevel,
    waterLevelUnit,
    capacity,
    capacityUnit,
    inletFlow,
    inletFlowUnit,
    outletFlow,
    outletFlowUnit,
    currentAmps,
    valveStatus: valveState,
    valveMode: device?.valveMode || 'AUTO',
    minLevel: minLevel !== null ? minLevel : 20,
    maxLevel: maxLevel !== null ? maxLevel : 90,
    hasOverflow,
    status,
    isOnline,
    isMapped: true,
    lastEventTime,
    lastEventTimeFormatted,
    rawFields,
    device
  };
};

/**
 * Maps batch latest events results to a list of AG Tank devices
 * 
 * @param {Array<Object>} devices - List of AG Tank devices from backend
 * @param {Array<Object>} batchResults - Results array from bmsService.getDeviceEventsLatestBatch
 * @returns {Array<Object>} Normalized AG Tanks
 */
export const mapBatchEventsToAgTanks = (devices = [], batchResults = []) => {
  if (!Array.isArray(devices)) return [];

  return devices.map(dev => {
    const devIdStr = String(dev.id ?? dev.deviceId ?? '');
    const bmsDevIdStr = String(dev.bmsDeviceId ?? '');
    const devNameNorm = normalizeKey(dev.name || dev.deviceName || '');

    const matchingResult = Array.isArray(batchResults)
      ? batchResults.find(r => {
          if (!r) return false;
          const rDevId = String(r.deviceId ?? r.id ?? '');
          const rBmsId = String(r.bmsDeviceId ?? '');
          const rNameNorm = normalizeKey(r.name || r.deviceName || '');

          return (
            (bmsDevIdStr && rBmsId && rBmsId === bmsDevIdStr) ||
            (devIdStr && rDevId && rDevId === devIdStr) ||
            (bmsDevIdStr && rDevId && rDevId === bmsDevIdStr) ||
            (devIdStr && rBmsId && rBmsId === devIdStr) ||
            (devNameNorm && rNameNorm && devNameNorm === rNameNorm)
          );
        })
      : null;

    return resolveAgTankDevice(dev, matchingResult);
  });
};
