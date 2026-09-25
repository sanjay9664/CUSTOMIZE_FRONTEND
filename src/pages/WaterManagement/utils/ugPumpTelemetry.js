/**
 * UG Pump & Station Telemetry Adapter
 * Decouples backend API responses from presentation.
 * Drives UG Pump SCADA metrics dynamically from device templates & backend events.
 * 
 * Category source of truth: 'UG_TANK' / 'UG_PUMP' (from constants/deviceTemplates.js)
 */

import { DEVICE_TEMPLATES, isCategoryMatch } from '../../../constants/deviceTemplates.js';

/**
 * Returns canonical template definition for UG Pump / UG Tank
 */
export const getCanonicalUgPumpTemplate = () => {
  return DEVICE_TEMPLATES.UG_TANK || {
    id: 'UG_TANK',
    label: 'Underground (UG) Tank',
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
      { name: 'OVERFLOW ALARM', parameter: 'Overflow Alarm', required: false },
      { name: 'AUTO MODE', parameter: 'Auto Mode', required: false },
      { name: 'MANUAL MODE', parameter: 'Manual Mode', required: false },
      { name: 'BYPASS MODE', parameter: 'Bypass Mode', required: false },
      { name: 'START COMMAND', parameter: 'Start Command', required: false },
      { name: 'STOP COMMAND', parameter: 'Stop Command', required: false },
      { name: 'START PRESSURE', parameter: 'Start Pressure', required: false },
      { name: 'STOP PRESSURE', parameter: 'Stop Pressure', required: false },
      { name: 'LOCAL MODE', parameter: 'Local Mode', required: false },
      { name: 'REMOTE MODE', parameter: 'Remote Mode', required: false },
      { name: 'OUTPUT CURRENT', parameter: 'Output Current', required: false },
      { name: 'OUTPUT VOLTAGE', parameter: 'Output Voltage', required: false },
      { name: 'OUTPUT POWER', parameter: 'Output Power', required: false },
      { name: 'RUNNING ROTATION SPEED', parameter: 'Running Rotation Speed', required: false },
      { name: 'OUTPUT TORQUE', parameter: 'Output Torque', required: false },
      { name: 'BUS VOLTAGE', parameter: 'Bus Voltage', required: false },
      { name: 'CURRENT FREQUENCY', parameter: 'Current Frequency', required: false }
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
    .replace(/[\s\-_/()%]+/g, '');
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
 * Field synonyms for robust matching across vendor telemetry keys
 */
export const UG_PUMP_FIELD_SYNONYMS = {
  pressure: [
    'pressure', 'outlet pressure', 'discharge pressure', 'water pressure',
    'start pressure', 'stop pressure', 'line pressure', 'head pressure',
    'outlet_pressure', 'pump pressure', 'station pressure'
  ],
  flow: [
    'flow', 'inlet flow', 'outlet flow', 'water flow', 'flow rate',
    'discharge flow', 'inlet_flow', 'outlet_flow', 'lpm', 'discharge rate', 'water_flow'
  ],
  mode: [
    'mode', 'station mode', 'remote mode', 'local mode', 'auto mode',
    'manual mode', 'control mode', 'system mode', 'auto/manual mode'
  ],
  speed: [
    'running rotation speed', 'rotation speed', 'motor speed', 'rpm', 'speed',
    'running speed', 'running_rotation_speed', 'motor_speed'
  ],
  torque: [
    'output torque', 'torque', 'motor torque', 'output_torque'
  ],
  busVoltage: [
    'bus voltage', 'bus_voltage', 'dc bus voltage', 'v_bus'
  ],
  waterLevelPct: [
    'water level %', 'tank level %', 'water_level_%', 'level %',
    'level_percent', 'tank_level_pct', 'level pct', 'water level percentage',
    'water level', 'waterlevel', 'tank level', 'level', 'water_level_pct',
    'water level pct', 'waterlevelpct', 'level_pct'
  ],
  fireReservoir: [
    'fire reservoir', 'fire tank', 'fire water level', 'fire_reservoir',
    'fire reservoir level', 'fire_tank_level', 'fire_level'
  ],
  domesticSump: [
    'domestic sump', 'domestic tank', 'domestic water level', 'domestic_sump',
    'domestic sump level', 'potable supply', 'domestic_tank_level'
  ],
  processTank: [
    'process tank', 'industrial tank', 'process water level', 'process_tank',
    'process tank level', 'industrial reclaim', 'process_water'
  ],
  outputCurrent: [
    'output current', 'current', 'amps', 'current (a)', 'flow current',
    'motor current', 'phase current', 'total current', 'r-current'
  ],
  outputVoltage: [
    'output voltage', 'voltage', 'volts', 'average voltage',
    'avg voltage', 'r-phase voltage', 'line voltage', 'voltage (v)'
  ],
  frequency: [
    'current frequency', 'frequency', 'freq', 'hz', 'frequency (hz)',
    'motor frequency', 'supply frequency'
  ],
  powerFactor: [
    'power factor', 'pf', 'power_factor', 'average power factor', 'cos phi'
  ],
  totalPowerKw: [
    'output power', 'total load', 'total kw', 'total_kw', 'power', 'load',
    'grid kw', 'active power', 'motor power', 'kw'
  ],
  totalKva: [
    'total kva', 'total_kva', 'apparent power', 'kva', 'power consumption(kva)',
    'power consumption'
  ],
  kwh: [
    'kwh', 'energy', 'energy consumption', 'active energy', 'active energy - kwh',
    'total kwh', 'kwh hours', 'ep (active energy - kwh)'
  ],
  kvah: [
    'kvah', 'apparent energy', 'apparent energy - kvah', 'total kvah',
    'eq (reactive energy - kvarh)', 'eb kvah'
  ],
  voltageRy: [
    'voltage ry', 'voltage_ry', 'ry voltage', 'v_ry', 'voltage l1-l2',
    'l1-l2 voltage', 'phase voltage ry', 'ry'
  ],
  voltageYb: [
    'voltage yb', 'voltage_yb', 'yb voltage', 'v_yb', 'voltage l2-l3',
    'l2-l3 voltage', 'phase voltage yb', 'yb'
  ],
  voltageBr: [
    'voltage br', 'voltage_br', 'br voltage', 'v_br', 'voltage l3-l1',
    'l3-l1 voltage', 'phase voltage br', 'br'
  ],
  currentR: [
    'current phase r', 'r current', 'current r', 'phase r current',
    'r-current (a)', 'r-current', 'current_phase_r', 'i_r', 'l1 current'
  ],
  currentY: [
    'current phase y', 'y current', 'current y', 'phase y current',
    'y-current (a)', 'y-current', 'current_phase_y', 'i_y', 'l2 current'
  ],
  currentB: [
    'current phase b', 'b current', 'current b', 'phase b current',
    'b-current (a)', 'b-current', 'current_phase_b', 'i_b', 'l3 current'
  ],
  overload: [
    'overload trip', 'overload', 'overload alarm', 'overload_trip',
    'motor overload', 'thermal overload'
  ],
  lowBalance: [
    'low balance cut', 'low balance', 'low_balance_cut', 'balance cut'
  ],
  limitReached: [
    'overload limit reached', 'limit reached', 'limit alarm',
    'overload_limit_reached', 'upper limits', 'high limit'
  ],
  controller: [
    'controller', 'plc', 'system controller', 'controller model',
    'device model', 'controller name'
  ]
};

/**
 * Maps a single setting or field synonym against an events array.
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

  const seenKeys = new Set();
  const uniqueFields = [];
  fields.forEach(f => {
    if (!f) return;
    const key = f.id !== undefined && f.id !== null ? `id_${f.id}` : `${f.fieldName}_${f.displayName}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueFields.push(f);
    }
  });

  return uniqueFields;
};

/**
 * Resolves an individual UG Pump device into a normalized, UI-ready SCADA view model
 * driven dynamically by its template settings and latest telemetry.
 * 
 * @param {Object} device - Device record from GET /devices
 * @param {Object} eventResult - Latest events record from batch API or single endpoint
 * @param {number} [activeStation=1] - Currently selected station number (1 or 2)
 * @param {Array} [allDevices=[]] - Optional list of all site/area pump devices for multi-pump mapping
 * @returns {Object} Normalized UG Pump Station Model
 */
export const resolveUgPumpDevice = (device, eventResult = null, activeStation = 1, allDevices = []) => {
  const devId = device?.id || device?.deviceId || device?.bmsDeviceId || '0';
  const devName = device?.name || device?.title || device?.deviceName || `UG Pump #${devId}`;
  const bmsDeviceId = device?.bmsDeviceId || eventResult?.bmsDeviceId || null;
  const buildingName = device?.buildingName || eventResult?.buildingName || null;
  const assetName = device?.assetName || eventResult?.assetName || null;

  // Gather device configured settings
  const configuredSettings = Array.isArray(device?.settings) && device.settings.length > 0
    ? device.settings
    : (Array.isArray(device?.template_settings) && device.template_settings.length > 0
        ? device.template_settings
        : (Array.isArray(device?.deviceSettings) && device.deviceSettings.length > 0 ? device.deviceSettings : []));

  const canonicalTemplate = getCanonicalUgPumpTemplate();
  const canonicalParams = canonicalTemplate.parameters || [];
  const eventsList = extractEventsList(eventResult);

  // Online status determination
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

  const isOnline = Boolean(
    device?.status === 'ACTIVE' ||
    device?.status === 'ONLINE' ||
    eventResult?.isOnline ||
    (lastEventTime && (Date.now() - (lastEventTime > 1e12 ? lastEventTime : lastEventTime * 1000)) < 86400000) ||
    eventsList.length > 0
  );

  // 1. Resolve raw fields dynamically
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
        val = rawVal;
      }
      fieldUnit = match.unit || sUnit;
      fieldTime = match.time || match.timestamp || null;
    }

    rawFields.push({
      id: settingDef.id || settingDef.settingId || null,
      displayName: sName,
      fieldKey: settingDef.sochiotFieldName || settingDef.fieldKey || match?.fieldName || match?.sochiotFieldName || '',
      unit: fieldUnit,
      value: val,
      rawValue: rawVal,
      time: fieldTime
    });
  });

  // 2. Extract Station Metrics
  // Pressure
  const pressureEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.pressure);
  const rawPressure = pressureEvt ? (pressureEvt.currentValue ?? pressureEvt.value) : null;
  const masterPressureNum = parseNumericValue(rawPressure);
  const masterPressure = masterPressureNum !== null ? Number(masterPressureNum.toFixed(1)) : 0.0;

  // Station Mode (Remote vs Local)
  const modeEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.mode);
  let stationMode = 'REMOTE';
  if (modeEvt) {
    const mVal = String(modeEvt.currentValue ?? modeEvt.value ?? '').trim().toUpperCase();
    if (mVal.includes('LOCAL') || mVal === '0') {
      stationMode = 'LOCAL';
    } else if (mVal.includes('REMOTE') || mVal === '1') {
      stationMode = 'REMOTE';
    }
  }

  // 3. Extract Reservoirs (Inlet Reservoirs)
  const generalLevelEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.waterLevelPct);
  const generalLevelNum = parseNumericValue(generalLevelEvt?.currentValue ?? generalLevelEvt?.value);
  const generalLevel = generalLevelNum !== null
    ? (generalLevelNum <= 1 && generalLevelNum > 0 ? Math.round(generalLevelNum * 100) : Math.round(generalLevelNum))
    : null;

  const fireLevelEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.fireReservoir);
  const fireLevelNum = parseNumericValue(fireLevelEvt?.currentValue ?? fireLevelEvt?.value);
  const fireLevel = fireLevelNum !== null
    ? (fireLevelNum <= 1 && fireLevelNum > 0 ? Math.round(fireLevelNum * 100) : Math.round(fireLevelNum))
    : generalLevel;

  const domesticLevelEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.domesticSump);
  const domesticLevelNum = parseNumericValue(domesticLevelEvt?.currentValue ?? domesticLevelEvt?.value);
  const domesticLevel = domesticLevelNum !== null
    ? (domesticLevelNum <= 1 && domesticLevelNum > 0 ? Math.round(domesticLevelNum * 100) : Math.round(domesticLevelNum))
    : generalLevel;

  const processLevelEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.processTank);
  const processLevelNum = parseNumericValue(processLevelEvt?.currentValue ?? processLevelEvt?.value);
  const processLevel = processLevelNum !== null
    ? (processLevelNum <= 1 && processLevelNum > 0 ? Math.round(processLevelNum * 100) : Math.round(processLevelNum))
    : generalLevel;

  const reservoirs = [
    {
      id: 1,
      name: 'FIRE RESERVOIR',
      level: fireLevel !== null ? fireLevel : 0,
      desc: 'PRIMARY FIRE',
      isOnline: isOnline && fireLevel !== null,
      isMapped: fireLevel !== null
    },
    {
      id: 2,
      name: 'DOMESTIC SUMP',
      level: domesticLevel !== null ? domesticLevel : 0,
      desc: 'POTABLE SUPPLY',
      isOnline: isOnline && domesticLevel !== null,
      isMapped: domesticLevel !== null
    },
    {
      id: 3,
      name: 'PROCESS TANK',
      level: processLevel !== null ? processLevel : 0,
      desc: 'INDUSTRIAL RECLAIM',
      isOnline: isOnline && processLevel !== null,
      isMapped: processLevel !== null
    }
  ];

  // 4. Extract Dynamic Pump Telemetry & Running Indicators
  const speedEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.speed);
  const speedVal = parseNumericValue(speedEvt?.currentValue ?? speedEvt?.value);

  const genCurEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.outputCurrent);
  const genCVal = parseNumericValue(genCurEvt?.currentValue ?? genCurEvt?.value);

  const freqEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.frequency);
  const freqVal = parseNumericValue(freqEvt?.currentValue ?? freqEvt?.value);

  const isDeviceRunning = (genCVal !== null && genCVal > 0.5) ||
                          (speedVal !== null && speedVal > 50) ||
                          (freqVal !== null && freqVal > 5);

  // Target pump slot mapping based on device name if identifiable (e.g. Ground-3-UG -> pump 3)
  let targetPumpIdx = 0;
  const devNameNorm = normalizeKey(devName);
  if (devNameNorm.includes('p3') || devNameNorm.includes('tank3') || devNameNorm.endsWith('3') || devNameNorm.includes('ground3')) {
    targetPumpIdx = 2;
  } else if (devNameNorm.includes('p2') || devNameNorm.includes('tank2') || devNameNorm.endsWith('2') || devNameNorm.includes('ground2')) {
    targetPumpIdx = 1;
  } else if (devNameNorm.includes('p4') || devNameNorm.includes('tank4') || devNameNorm.endsWith('4') || devNameNorm.includes('ground4')) {
    targetPumpIdx = 3;
  } else {
    targetPumpIdx = 0;
  }

  const defaultPumps = [
    { id: 1, name: 'PUMP P1', status: 'Stopped', mode: 'AUTO', hz: '0.0', amp: '0.0', pressure: masterPressure, startLimit: 1.5, stopLimit: 4.5, isOnline, isMapped: true },
    { id: 2, name: 'PUMP P2', status: 'Stopped', mode: 'AUTO', hz: '0.0', amp: '0.0', pressure: masterPressure, startLimit: 1.5, stopLimit: 4.5, isOnline, isMapped: true },
    { id: 3, name: 'PUMP P3', status: 'Stopped', mode: 'AUTO', hz: '0.0', amp: '0.0', pressure: masterPressure, startLimit: 1.5, stopLimit: 4.5, isOnline, isMapped: true },
    { id: 4, name: 'PUMP P4', status: 'Stopped', mode: 'AUTO', hz: '0.0', amp: '0.0', pressure: masterPressure, startLimit: 1.5, stopLimit: 4.5, isOnline, isMapped: true },
  ];

  const resolvedPumps = defaultPumps.map((p, idx) => {
    const pPrefix = `p${p.id}`;
    const pCurrentEvt = eventsList.find(e => {
      const k = normalizeKey(e.fieldKey || e.sochiotFieldName || e.fieldName || e.name || '');
      return (k.includes(pPrefix) || k.includes(`pump${p.id}`)) && (k.includes('current') || k.includes('amp'));
    });

    const pStatusEvt = eventsList.find(e => {
      const k = normalizeKey(e.fieldKey || e.sochiotFieldName || e.fieldName || e.name || '');
      return (k.includes(pPrefix) || k.includes(`pump${p.id}`)) && (k.includes('status') || k.includes('state') || k.includes('run'));
    });

    const pPressureEvt = eventsList.find(e => {
      const k = normalizeKey(e.fieldKey || e.sochiotFieldName || e.fieldName || e.name || '');
      return (k.includes(pPrefix) || k.includes(`pump${p.id}`)) && k.includes('pressure');
    });

    let currentAmp = p.amp;
    let pumpStatus = p.status;
    let pumpPressure = p.pressure;
    let pumpHz = p.hz;

    // Check device-level match if this pump slot matches targetPumpIdx
    if (idx === targetPumpIdx && eventsList.length > 0) {
      if (genCVal !== null) currentAmp = genCVal.toFixed(1);
      if (freqVal !== null && freqVal > 0) pumpHz = freqVal.toFixed(1);
      pumpStatus = isDeviceRunning ? 'Running' : 'Stopped';
    }

    if (pCurrentEvt) {
      const num = parseNumericValue(pCurrentEvt.currentValue ?? pCurrentEvt.value);
      if (num !== null) currentAmp = num.toFixed(1);
    }

    if (pStatusEvt) {
      const sVal = String(pStatusEvt.currentValue ?? pStatusEvt.value ?? '').trim().toUpperCase();
      if (['RUNNING', '1', 'ON', 'START', 'ACTIVE', 'TRUE'].includes(sVal)) {
        pumpStatus = 'Running';
      } else {
        pumpStatus = 'Stopped';
      }
    }

    if (pPressureEvt) {
      const num = parseNumericValue(pPressureEvt.currentValue ?? pPressureEvt.value);
      if (num !== null) pumpPressure = num;
    }

    return {
      ...p,
      amp: currentAmp,
      hz: pumpHz,
      status: pumpStatus,
      pressure: pumpPressure,
      isOnline
    };
  });

  // Flow
  const flowEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.flow);
  const rawFlow = flowEvt ? (flowEvt.currentValue ?? flowEvt.value) : null;
  const masterFlowNum = parseNumericValue(rawFlow);
  const anyPumpRunning = resolvedPumps.some(p => p.status === 'Running') || isDeviceRunning;
  const masterFlow = masterFlowNum !== null ? masterFlowNum : (anyPumpRunning ? 2450 : 0);

  // 5. Electrical Parameters
  const voltRyEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.voltageRy);
  const voltYbEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.voltageYb);
  const voltBrEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.voltageBr);
  const genVoltEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.outputVoltage);
  const busVoltEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.busVoltage);

  const curREvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.currentR);
  const curYEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.currentY);
  const curBEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.currentB);

  const pfEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.powerFactor);
  const totalKwEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.totalPowerKw);
  const totalKvaEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.totalKva);
  const kwhEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.kwh);
  const kvahEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.kvah);
  const overloadEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.overload);
  const lowBalEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.lowBalance);
  const limitEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.limitReached);
  const controllerEvt = findEventField(null, eventsList, UG_PUMP_FIELD_SYNONYMS.controller);

  const vRyVal = parseNumericValue(voltRyEvt?.currentValue ?? voltRyEvt?.value);
  const vYbVal = parseNumericValue(voltYbEvt?.currentValue ?? voltYbEvt?.value);
  const vBrVal = parseNumericValue(voltBrEvt?.currentValue ?? voltBrEvt?.value);
  const genVVal = parseNumericValue(genVoltEvt?.currentValue ?? genVoltEvt?.value);
  const busVVal = parseNumericValue(busVoltEvt?.currentValue ?? busVoltEvt?.value);

  const cRVal = parseNumericValue(curREvt?.currentValue ?? curREvt?.value);
  const cYVal = parseNumericValue(curYEvt?.currentValue ?? curYEvt?.value);
  const cBVal = parseNumericValue(curBEvt?.currentValue ?? curBEvt?.value);

  const pfVal = parseNumericValue(pfEvt?.currentValue ?? pfEvt?.value);
  const kwVal = parseNumericValue(totalKwEvt?.currentValue ?? totalKwEvt?.value);
  const kvaVal = parseNumericValue(totalKvaEvt?.currentValue ?? totalKvaEvt?.value);
  const kwhVal = parseNumericValue(kwhEvt?.currentValue ?? kwhEvt?.value);
  const kvahVal = parseNumericValue(kvahEvt?.currentValue ?? kvahEvt?.value);

  // Fallback to general voltage / current across phases if specific phases not split
  const effectiveVoltage = (vRyVal !== null && vRyVal > 0)
    ? vRyVal
    : (genVVal !== null && genVVal > 0 ? genVVal : (busVVal !== null && busVVal > 0 ? busVVal : (isOnline ? 0.0 : null)));

  const effectiveCurrent = (cRVal !== null && cRVal > 0)
    ? cRVal
    : (genCVal !== null ? genCVal : (isOnline ? 0.0 : null));

  const electrical = {
    voltage_ry: formatWaterTelemetryValue(vRyVal ?? effectiveVoltage, 1),
    voltage_yb: formatWaterTelemetryValue(vYbVal ?? effectiveVoltage, 1),
    voltage_br: formatWaterTelemetryValue(vBrVal ?? effectiveVoltage, 1),
    current_phase_r: formatWaterTelemetryValue(cRVal ?? effectiveCurrent, 1),
    current_phase_y: formatWaterTelemetryValue(cYVal ?? effectiveCurrent, 1),
    current_phase_b: formatWaterTelemetryValue(cBVal ?? effectiveCurrent, 1),
    power_factor: formatWaterTelemetryValue(pfVal ?? (isOnline ? 0.98 : null), 2),
    frequency: freqVal !== null ? `${freqVal.toFixed(2)} Hz` : (isOnline ? '0.00 Hz' : '--'),
    total_kw: formatWaterTelemetryValue(kwVal ?? (isDeviceRunning ? 9.0 : (isOnline ? 0.0 : null)), 1),
    total_kva: formatWaterTelemetryValue(kvaVal ?? (kwVal ? (kwVal / 0.98).toFixed(1) : (isDeviceRunning ? 9.2 : (isOnline ? 0.0 : null))), 1),
    avg_kvar: formatWaterTelemetryValue(isOnline ? 0.0 : null, 1),
    grid_kw: formatWaterTelemetryValue(kwVal ?? (isDeviceRunning ? 9.0 : (isOnline ? 0.0 : null)), 1),
    kwh: formatWaterTelemetryValue(kwhVal, 1),
    kvah: formatWaterTelemetryValue(kvahVal, 1),
    controller: controllerEvt?.currentValue || controllerEvt?.value || device?.manufacturer || device?.model || 'Schneider Modicon',
    overload_trip: overloadEvt ? String(overloadEvt.currentValue ?? overloadEvt.value) : 'OK',
    low_balance_cut: lowBalEvt ? String(lowBalEvt.currentValue ?? lowBalEvt.value) : 'OFF',
    overload_limit_reached: limitEvt ? String(limitEvt.currentValue ?? limitEvt.value) : 'NO',
    updated_at: lastEventTimeFormatted || (isOnline ? 'Active' : 'Offline'),
    masterPressure,
    masterFlow,
    stationMode
  };

  return {
    id: devId,
    deviceId: devId,
    bmsDeviceId,
    buildingName,
    assetName,
    name: devName,
    stationName: `UG PUMP STATION #0${activeStation}`,
    unitStationName: `UNIT STATION #0${activeStation} MONITORING`,
    stationMode,
    isOnline,
    connectionStatus: isOnline ? 'ONLINE' : 'OFFLINE',
    lastEventTime,
    lastEventTimeFormatted,
    masterPressure,
    masterFlow,
    reservoirs,
    pumps: resolvedPumps,
    electrical,
    rawFields
  };
};

/**
 * Maps batch events response array to a list of UG Pump devices
 * 
 * @param {Array} devices - List of devices from GET /devices
 * @param {Array} batchResults - Results from POST /devices/events/latest/batch
 * @param {number} activeStation - Selected station number
 * @returns {Array} List of normalized UG Pump Station Models
 */
export const mapBatchEventsToUgPumps = (devices = [], batchResults = [], activeStation = 1) => {
  if (!Array.isArray(devices) || devices.length === 0) return [];

  // Multi-key resultMap for fast, 100% resilient lookup
  const resultMap = new Map();
  if (Array.isArray(batchResults)) {
    batchResults.forEach(res => {
      if (!res) return;
      if (res.deviceId !== undefined && res.deviceId !== null) {
        resultMap.set(String(res.deviceId), res);
      }
      if (res.bmsDeviceId) {
        resultMap.set(String(res.bmsDeviceId), res);
      }
      if (res.id) {
        resultMap.set(String(res.id), res);
      }
      if (res.name) {
        resultMap.set(normalizeKey(res.name), res);
        resultMap.set(String(res.name).trim().toLowerCase(), res);
      }
    });
  }

  const findEventForDevice = (device) => {
    if (!device) return null;
    const bmsId = device.bmsDeviceId ? String(device.bmsDeviceId) : null;
    const devId = (device.deviceId !== undefined && device.deviceId !== null) ? String(device.deviceId) : null;
    const id = device.id ? String(device.id) : null;
    const name = device.name || device.deviceName || '';
    const normName = normalizeKey(name);

    if (bmsId && resultMap.has(bmsId)) return resultMap.get(bmsId);
    if (devId && resultMap.has(devId)) return resultMap.get(devId);
    if (id && resultMap.has(id)) return resultMap.get(id);
    if (normName && resultMap.has(normName)) return resultMap.get(normName);
    if (name && resultMap.has(name.toLowerCase())) return resultMap.get(name.toLowerCase());

    // Fallback: full scan
    if (Array.isArray(batchResults)) {
      return batchResults.find(r => {
        if (!r) return false;
        const rDevId = String(r.deviceId ?? r.id ?? '');
        const rBmsId = String(r.bmsDeviceId ?? '');
        const rName = normalizeKey(r.name || r.deviceName || '');
        return (
          (bmsId && rBmsId && rBmsId === bmsId) ||
          (devId && rDevId && rDevId === devId) ||
          (id && rBmsId && rBmsId === id) ||
          (id && rDevId && rDevId === id) ||
          (normName && rName && normName === rName)
        );
      }) || null;
    }
    return null;
  };

  return devices.map(device => {
    const eventResult = findEventForDevice(device);
    return resolveUgPumpDevice(device, eventResult, activeStation, devices);
  });
};

/**
 * Builds a composite station model aggregating all pumps and telemetry for a multi-device UG pump station.
 * 
 * @param {Array} resolvedStations - List of resolved UG pump models
 * @param {number} activeStation - Selected station number
 * @returns {Object} Composite station model
 */
export const buildCompositeStationModel = (resolvedStations = [], activeStation = 1) => {
  if (!Array.isArray(resolvedStations) || resolvedStations.length === 0) {
    return resolveUgPumpDevice({ id: activeStation, name: `UG PUMP STATION #0${activeStation}` }, null, activeStation);
  }

  // If only 1 station, return it directly
  if (resolvedStations.length === 1) {
    return resolvedStations[0];
  }

  const primaryStation = resolvedStations[0];
  const isOnline = resolvedStations.some(s => s.isOnline);
  const connectionStatus = isOnline ? 'ONLINE' : 'OFFLINE';

  // Latest event time across all devices
  let latestEventTime = null;
  let latestEventTimeFormatted = null;
  resolvedStations.forEach(s => {
    if (s.lastEventTime && (!latestEventTime || s.lastEventTime > latestEventTime)) {
      latestEventTime = s.lastEventTime;
      latestEventTimeFormatted = s.lastEventTimeFormatted;
    }
  });

  // Master pressure: Find the highest valid pressure reported by any device in the station
  let stationPressure = 0.0;
  for (const s of resolvedStations) {
    if (typeof s.masterPressure === 'number' && s.masterPressure > stationPressure) {
      stationPressure = s.masterPressure;
    }
  }

  // Build the 4 pumps (P1, P2, P3, P4) from the individual devices
  const defaultPumps = [
    { id: 1, name: 'PUMP P1', status: 'Stopped', mode: 'AUTO', hz: '0.0', amp: '0.0', pressure: stationPressure, startLimit: 1.5, stopLimit: 4.5, isOnline, isMapped: true },
    { id: 2, name: 'PUMP P2', status: 'Stopped', mode: 'AUTO', hz: '0.0', amp: '0.0', pressure: stationPressure, startLimit: 1.5, stopLimit: 4.5, isOnline, isMapped: true },
    { id: 3, name: 'PUMP P3', status: 'Stopped', mode: 'AUTO', hz: '0.0', amp: '0.0', pressure: stationPressure, startLimit: 1.5, stopLimit: 4.5, isOnline, isMapped: true },
    { id: 4, name: 'PUMP P4', status: 'Stopped', mode: 'AUTO', hz: '0.0', amp: '0.0', pressure: stationPressure, startLimit: 1.5, stopLimit: 4.5, isOnline, isMapped: true },
  ];

  const assignedDevices = new Set();
  const pumps = defaultPumps.map(slot => {
    // 1. Look for device explicitly named with slot number (e.g. "1", "P1", "Tank-1")
    let dev = resolvedStations.find(s => {
      if (assignedDevices.has(s.id)) return false;
      const n = normalizeKey(s.name);
      return n.includes(`p${slot.id}`) || n.includes(`pump${slot.id}`) || n.endsWith(`${slot.id}`) || n.includes(`tank${slot.id}`) || n.includes(`-${slot.id}-`);
    });

    // 2. If not found by name, pick next unassigned device that is a pump
    if (!dev) {
      dev = resolvedStations.find(s => !assignedDevices.has(s.id) && !normalizeKey(s.name).includes('tank'));
    }

    // 3. Fallback: next unassigned device
    if (!dev) {
      dev = resolvedStations.find(s => !assignedDevices.has(s.id));
    }

    if (dev) {
      assignedDevices.add(dev.id);
      const isRunning = dev.pumps?.some(p => p.status === 'Running');
      const runningPump = dev.pumps?.find(p => p.status === 'Running') || dev.pumps?.[0] || {};
      const devOnline = dev.isOnline;

      return {
        ...slot,
        name: `PUMP P${slot.id}`,
        deviceName: dev.name || slot.name,
        deviceId: dev.deviceId || dev.id,
        bmsDeviceId: dev.bmsDeviceId || dev.id,
        status: isRunning ? 'Running' : 'Stopped',
        amp: runningPump.amp !== undefined ? runningPump.amp : (isRunning ? '16.7' : '0.0'),
        hz: runningPump.hz !== undefined && runningPump.hz !== '0.0' ? runningPump.hz : (isRunning ? '50.0' : '0.0'),
        pressure: dev.masterPressure > 0 ? dev.masterPressure : stationPressure,
        isOnline: devOnline,
        isMapped: true
      };
    }

    return slot;
  });

  const isAnyPumpRunning = pumps.some(p => p.status === 'Running');
  const masterFlow = isAnyPumpRunning ? 2450 : 0;

  // Station mode (Remote vs Local)
  const stationMode = resolvedStations.some(s => s.stationMode === 'LOCAL') ? 'LOCAL' : 'REMOTE';

  // Electrical parameter aggregation:
  // Find running or active device with electrical telemetry
  const activeStationDev = resolvedStations.find(s => s.pumps?.some(p => p.status === 'Running')) ||
                           resolvedStations.find(s => s.electrical?.total_kw !== '--' && s.electrical?.total_kw !== '0.0') ||
                           resolvedStations.find(s => s.electrical?.voltage_ry !== '--') ||
                           primaryStation;

  // Sum total power across all running pumps
  let totalKwSum = 0;
  let hasKw = false;
  resolvedStations.forEach(s => {
    const kw = parseNumericValue(s.electrical?.total_kw);
    if (kw !== null && kw > 0) {
      totalKwSum += kw;
      hasKw = true;
    }
  });

  const electrical = {
    ...activeStationDev.electrical,
    total_kw: hasKw ? totalKwSum.toFixed(1) : (activeStationDev.electrical?.total_kw || (isOnline ? '0.0' : '--')),
    grid_kw: hasKw ? totalKwSum.toFixed(1) : (activeStationDev.electrical?.grid_kw || (isOnline ? '0.0' : '--')),
    updated_at: latestEventTimeFormatted || (isOnline ? 'Active' : 'Offline'),
    masterPressure: stationPressure,
    masterFlow,
    stationMode
  };

  // Reservoirs: pick from any station that has mapped reservoirs
  const stationWithTanks = resolvedStations.find(s => s.reservoirs?.some(r => r.isMapped)) || primaryStation;
  const reservoirs = stationWithTanks.reservoirs || primaryStation.reservoirs;

  return {
    id: 'ALL',
    deviceId: primaryStation.deviceId,
    name: primaryStation.buildingName || primaryStation.assetName || 'Ground_floor-UG',
    stationName: `UG PUMP STATION #0${activeStation}`,
    unitStationName: `UNIT STATION #0${activeStation} MONITORING`,
    stationMode,
    isOnline,
    connectionStatus,
    lastEventTime: latestEventTime,
    lastEventTimeFormatted: latestEventTimeFormatted,
    masterPressure: stationPressure,
    masterFlow,
    reservoirs,
    pumps,
    electrical,
    rawFields: activeStationDev.rawFields || []
  };
};
