import {
  resolveDeviceTelemetry,
  mapSettingToTelemetry,
  formatTelemetryValue,
  getThresholdStatusFromSetting,
  getCanonicalEnergyTemplate
} from './energyTelemetryAdapter.js';

export {
  resolveDeviceTelemetry,
  mapSettingToTelemetry,
  formatTelemetryValue,
  getThresholdStatusFromSetting,
  getCanonicalEnergyTemplate
};

export const PARAMETER_SYNONYMS = {
  // Energy & Consumption
  // Includes SELEC_EM2M displayNames: 'Total Active Energy', 'Total Reactive Energy', ' Apparent Energy '
  ebKwh: ['3,151', '3,152', '4,91F', 'EB KWH', 'EB_KWH', 'EB ACTIVE ENERGY', 'CONSUMPTION', 'ACTIVE ENERGY', 'CUMULATIVE KWH', 'CUMULATIVE_KWH', 'KWH', 'EP', 'Total Active Energy', 'TOTAL ACTIVE ENERGY', '4,0F'],
  ebKvah: ['3,152', '3,157', '4,93F', 'EB KVAH', 'EB_KVAH', 'APPARENT ENERGY', 'KVAH', 'S', 'Apparent Energy', 'APPARENT ENERGY', '4,12F'],
  cumulativekWh: ['3,151', '3,152', '4,91F', 'EB KWH', 'EB_KWH', 'EB ACTIVE ENERGY', 'CONSUMPTION', 'ACTIVE ENERGY', 'CUMULATIVE KWH', 'CUMULATIVE_KWH', 'KWH', 'EP', 'Total Active Energy', 'TOTAL ACTIVE ENERGY'],
  dgKwh: ['3,180', '3,181', 'DG KWH', 'DG_KWH', 'DG ACTIVE', 'DG ENERGY', 'GENERATOR ENERGY', 'GEN KWH'],
  balance: ['3,162', 'BALANCE', 'PREPAID BALANCE', 'AMT', 'AMOUNT', 'CREDIT', 'PREPAID_BALANCE'],

  // Powers
  totalKw: ['3,190', 'TOTAL KW', 'TOTAL_KW', 'ACTIVE POWER', 'DEMAND', 'LOAD KW', 'ACTIVE_POWER', 'Total KW', 'KW'],
  activePower: ['3,190', 'TOTAL KW', 'TOTAL_KW', 'ACTIVE POWER', 'DEMAND', 'LOAD KW', 'ACTIVE_POWER', 'Total KW', 'KW'],
  totalKva: ['3,191', 'TOTAL KVA', 'TOTAL_KVA', 'APPARENT POWER', 'LOAD KVA', 'APPARENT_POWER', 'Total KVA', 'KVA'],
  apparentPower: ['3,191', 'TOTAL KVA', 'TOTAL_KVA', 'APPARENT POWER', 'LOAD KVA', 'APPARENT_POWER', 'Total KVA', 'KVA'],
  reactivePower: ['3,192', 'REACTIVE POWER', 'REACTIVE_POWER', 'KVAR', 'POWER KVAR', 'Eq'],

  // Voltages (Phase to Neutral)
  // Includes SELEC_EM2M 'Voltage LN' (single-phase line-to-neutral mapped to vR)
  vR: ['3,163', 'VOLTAGE R', 'VOLTAGE_R', 'VR', 'V_R', 'UA', 'U1', 'LINE VOLTS (R)', 'VOLTAGE R-PHASE', 'Voltage-R', 'R-PHASE VOLTAGE', 'R-Phase Voltage', 'Voltage LN', 'VOLTAGE LN', 'VLN', '4,20F'],
  vY: ['3,169', '3,164', 'VOLTAGE Y', 'VOLTAGE_Y', 'VY', 'V_Y', 'UB', 'U2', 'LINE VOLTS (Y)', 'VOLTAGE Y-PHASE', 'Voltage-Y', 'Y-PHASE VOLTAGE', 'Y-Phase Voltage'],
  vB: ['3,170', '3,165', 'VOLTAGE B', 'VOLTAGE_B', 'VB', 'V_B', 'UC', 'U3', 'LINE VOLTS (B)', 'VOLTAGE B-PHASE', 'Voltage-B', 'B-PHASE VOLTAGE', 'B-Phase Voltage'],

  // Voltages (Line to Line)
  vRY: ['VOLTAGE R-Y', 'V_RY', 'VRY', 'LINE VOLTS (RY)', 'VOLTAGE RY', 'Voltage R-Y'],
  vYB: ['VOLTAGE Y-B', 'V_YB', 'VYB', 'LINE VOLTS (YB)', 'VOLTAGE YB', 'Voltage Y-B'],
  vBR: ['VOLTAGE B-R', 'V_BR', 'VBR', 'LINE VOLTS (BR)', 'VOLTAGE BR', 'Voltage B-R'],
  vLLAvg: ['AVG VOLTAGE L-L', 'V_LL_AVG', 'AVG VLL', 'VLL AVG', 'Avg Voltage L-L'],
  vLNAvg: ['AVG VOLTAGE L-N', 'V_LN_AVG', 'AVG VLN', 'VLN AVG', 'Avg Voltage L-N'],

  // Currents
  // Includes SELEC_EM2M 'Current' (single-phase current mapped to iR)
  iR: ['3,171', '3,166', 'CURRENT R', 'CURRENT_R', 'IR', 'I_R', 'IA', 'A1', 'LINE AMPS (R)', 'R-CURRENT', 'R-Current', 'R-PHASE CURRENT', 'Current', 'CURRENT', '4,22F'],
  iY: ['3,172', '3,167', 'CURRENT Y', 'CURRENT_Y', 'IY', 'I_Y', 'A2', 'LINE AMPS (Y)', 'Y-CURRENT', 'Y-current', 'Y-Current', 'Y-PHASE CURRENT'],
  iB: ['3,173', 'CURRENT B', 'CURRENT_B', 'IB', 'I_B', 'IC', 'A3', 'LINE AMPS (B)', 'B-CURRENT', 'B-current', 'B-Current', 'B-PHASE CURRENT'],
  iAvg: ['AVG CURRENT', 'I_AVG', 'IAVG', 'Avg Current', 'AVERAGE CURRENT'],

  // Power Factors
  pf: ['3,174', 'POWER FACTOR', 'PF', 'SYSTEM PF', 'POWER_FACTOR', 'Power Factor'],
  pfAvg: ['AVG PF', 'PF_AVG', 'PFAVG', 'Avg PF', 'AVERAGE POWER FACTOR'],
  pfR: ['PF-R', 'PF_R', 'PFR', 'PF R', 'R-PHASE PF'],
  pfY: ['PF-Y', 'PF_Y', 'PFY', 'PF Y', 'Y-PHASE PF'],
  pfB: ['PF-B', 'PF_B', 'PFB', 'PF B', 'B-PHASE PF'],

  // Frequency
  freq: ['3,153', 'FREQUENCY', 'FREQ', '50HZ', 'F', 'HZ', 'Frequency'],

  // Power Averages
  kvaAvg: ['POWER KVA (AVG)', 'KVA_AVG', 'KVA AVG', 'Power KVA (AVG)'],
  kvarAvg: ['POWER KVAR (AVG)', 'KVAR_AVG', 'KVAR AVG', 'Power KVAR (AVG)'],

  // Load Hours & Metrics
  loadHrs: ['LOAD HRS', 'LOAD_HRS', 'Load Hrs', 'RUNTIME HRS'],
  loadMin: ['LOAD MIN', 'LOAD_MIN', 'Load Min', 'RUNTIME MIN'],
  noLoadHrs: ['NO LOAD HRS', 'NO_LOAD_HRS', 'No Load Hrs'],
  noLoadMin: ['NO LOAD MIN', 'NO_LOAD_MIN', 'No Load Min'],
  loadPct: ['LOAD %', 'LOAD_PCT', 'LOAD PCT', 'Load %', 'LOAD PERCENTAGE'],
  meterTarget: ['METER TARGET', 'METER_TARGET', 'Meter Target', 'TARGET'],

  // Tariffs & Limits
  ebTariff: ['3,160', 'EB TARIFF', 'GRID TARIFF', 'EB_RATE', 'EBTARIFF', 'EB Tariff'],
  dgTariff: ['3,172_DG', 'DG TARIFF', 'GEN RATE', 'DG_RATE', 'DGTARIFF', 'DG Tariff'],
  ebRLoadSet: ['3,173_LOAD', 'EB R LOAD', 'EB_R_LOAD', 'EB_R_LIMIT', 'EBRLOADSET'],
  ebYLoadSet: ['3,174_LOAD', 'EB Y LOAD', 'EB_Y_LOAD', 'EB_Y_LIMIT', 'EBYLOADSET'],
  ebBLoadSet: ['3,175_LOAD', 'EB B LOAD', 'EB_B_LOAD', 'EB_B_LIMIT', 'EBBLOADSET'],
  dgRLoadSet: ['3,176', 'DG R LOAD', 'DG_R_LOAD', 'DG_R_LIMIT', 'DGRLOADSET'],
  dgYLoadSet: ['3,177', 'DG Y LOAD', 'DG_Y_LOAD', 'DG_Y_LIMIT', 'DGYLOADSET'],
  dgBLoadSet: ['3,178', 'DG B LOAD', 'DG_B_LOAD', 'DG_B_LIMIT', 'DGBLOADSET'],
  rPhaseLoad: ['R-PHASE LOAD', 'R_PHASE_LOAD', 'R-Phase Load', 'R LOAD'],
  yPhaseLoad: ['Y-PHASE LOAD', 'Y_PHASE_LOAD', 'Y-Phase Load', 'Y LOAD'],
  bPhaseLoad: ['B-PHASE LOAD', 'B_PHASE_LOAD', 'B-Phase Load', 'B LOAD'],

  // Warnings & Relay Statuses
  lowBalanceCut: ['3,164', 'LOW BALANCE', 'BALANCE CUT', 'LOW_BAL', 'LOW_BALANCE_CUT'],
  overloadTrip: ['3,165', 'OVERLOAD TRIP', 'OL TRIP', 'OVERLOAD_TRIP', 'OVERLOAD TRIP STATUS'],
  overloadLimitReached: ['3,166', 'OVERLOAD LIMIT', 'OL LIMIT', 'OVERLOAD_WARN', 'OVERLOAD LIMIT REACHED'],
  connectedStatus: ['3,167', 'CONNECTED STATUS', 'RELAY STATUS', 'BREAKER STATUS', 'CONNECTED', 'CONNECTED_STATUS'],
  forceOff: ['3,168_OFF', 'FORCE OFF', 'REMOTE TRIP', 'FORCE_OFF', 'FORCE_OFF_STATUS'],
  meterSrno: ['3,150', 'METER SERIAL', 'SERIAL NUMBER', 'SR NO', 'METER SR', 'METER_NO', 'METERSRNO', 'Meter_Srno'],
  noOfOverloadCheck: ['3,169', 'OVERLOAD CHECK', 'OL CHECK', 'OVERLOAD_COUNT', 'NOOFOVERLOADCHECK'],
  ebDgStatus: ['3,170', 'EB DG STATUS', 'EB/DG STATUS', 'SOURCE STATUS', 'EB_DG', 'EBDGSTATUS'],
  fixedCharge: ['3,163', 'FIXED CHARGE', 'FIXED_CHARGE', 'CHARGES']
};

/**
 * 42 Canonical Parameters for Main Energy Meter with units and categories
 */
export const MAIN_METER_FIELDS_METADATA = [
  { key: 'ebKwh', label: 'EB KWH', unit: 'kWh', category: 'Energy', min: 0, max: 999999 },
  { key: 'ebKvah', label: 'EB KVAH', unit: 'kVAh', category: 'Energy', min: 0, max: 999999 },
  { key: 'dgKwh', label: 'DG KWH', unit: 'kWh', category: 'Energy', min: 0, max: 999999 },
  { key: 'balance', label: 'Balance', unit: '₹', category: 'Commercial', min: 0, max: 100000 },
  { key: 'totalKw', label: 'Total KW', unit: 'kW', category: 'Power', min: 0, max: 500 },
  { key: 'totalKva', label: 'Total KVA', unit: 'kVA', category: 'Power', min: 0, max: 600 },
  { key: 'reactivePower', label: 'Reactive Power', unit: 'kVAR', category: 'Power', min: 0, max: 300 },
  { key: 'pf', label: 'Power Factor', unit: '', category: 'Quality', min: 0, max: 1 },
  { key: 'freq', label: 'Frequency', unit: 'Hz', category: 'Quality', min: 45, max: 55 },
  { key: 'vR', label: 'R-Phase Voltage', unit: 'V', category: 'Voltage', min: 0, max: 300 },
  { key: 'vY', label: 'Y-Phase Voltage', unit: 'V', category: 'Voltage', min: 0, max: 300 },
  { key: 'vB', label: 'B-Phase Voltage', unit: 'V', category: 'Voltage', min: 0, max: 300 },
  { key: 'iR', label: 'R-Current', unit: 'A', category: 'Current', min: 0, max: 500 },
  { key: 'iY', label: 'Y-Current', unit: 'A', category: 'Current', min: 0, max: 500 },
  { key: 'iB', label: 'B-Current', unit: 'A', category: 'Current', min: 0, max: 500 },
  { key: 'vRY', label: 'Voltage R-Y', unit: 'V', category: 'Voltage', min: 0, max: 500 },
  { key: 'vYB', label: 'Voltage Y-B', unit: 'V', category: 'Voltage', min: 0, max: 500 },
  { key: 'vBR', label: 'Voltage B-R', unit: 'V', category: 'Voltage', min: 0, max: 500 },
  { key: 'vLLAvg', label: 'Avg Voltage L-L', unit: 'V', category: 'Voltage', min: 0, max: 500 },
  { key: 'vLNAvg', label: 'Avg Voltage L-N', unit: 'V', category: 'Voltage', min: 0, max: 300 },
  { key: 'iAvg', label: 'Avg Current', unit: 'A', category: 'Current', min: 0, max: 500 },
  { key: 'pfAvg', label: 'Avg PF', unit: '', category: 'Quality', min: 0, max: 1 },
  { key: 'pfR', label: 'PF-R', unit: '', category: 'Quality', min: 0, max: 1 },
  { key: 'pfY', label: 'PF-Y', unit: '', category: 'Quality', min: 0, max: 1 },
  { key: 'pfB', label: 'PF-B', unit: '', category: 'Quality', min: 0, max: 1 },
  { key: 'kvaAvg', label: 'Power KVA (AVG)', unit: 'kVA', category: 'Power', min: 0, max: 600 },
  { key: 'kvarAvg', label: 'Power KVAR (AVG)', unit: 'kVAR', category: 'Power', min: 0, max: 300 },
  { key: 'loadPct', label: 'Load %', unit: '%', category: 'Load', min: 0, max: 100 },
  { key: 'loadHrs', label: 'Load Hrs', unit: 'hrs', category: 'Runtime', min: 0, max: 99999 },
  { key: 'loadMin', label: 'Load Min', unit: 'min', category: 'Runtime', min: 0, max: 59 },
  { key: 'noLoadHrs', label: 'No Load Hrs', unit: 'hrs', category: 'Runtime', min: 0, max: 99999 },
  { key: 'noLoadMin', label: 'No Load Min', unit: 'min', category: 'Runtime', min: 0, max: 59 },
  { key: 'rPhaseLoad', label: 'R-Phase Load', unit: 'kW', category: 'Load', min: 0, max: 200 },
  { key: 'yPhaseLoad', label: 'Y-Phase Load', unit: 'kW', category: 'Load', min: 0, max: 200 },
  { key: 'bPhaseLoad', label: 'B-Phase Load', unit: 'kW', category: 'Load', min: 0, max: 200 },
  { key: 'ebTariff', label: 'EB Tariff', unit: '₹/kWh', category: 'Commercial', min: 0, max: 50 },
  { key: 'dgTariff', label: 'DG Tariff', unit: '₹/kWh', category: 'Commercial', min: 0, max: 50 },
  { key: 'meterTarget', label: 'Meter Target', unit: 'kWh', category: 'Commercial', min: 0, max: 100000 }
];

/**
 * Extracts numeric or string value from a device config and live stats array.
 */
export const getValueForField = (config, fieldKey, stats, isNumeric = true) => {
  if (!config || config.enabled === false || !config[fieldKey] || !Array.isArray(stats)) {
    return null;
  }

  const fieldVal = config[fieldKey];
  let cleanKey = fieldVal;
  let targetModuleId = config.module;

  if (typeof fieldVal === 'string' && fieldVal.includes(':')) {
    const parts = fieldVal.split(':');
    targetModuleId = parts[0];
    cleanKey = parts.pop();
  }

  const stat = stats.find(s =>
    String(s.moduleId) === String(targetModuleId) ||
    String(s.meta?.module_id) === String(targetModuleId)
  );

  if (!stat || !stat.meta) return null;

  const resolve = (val) => {
    if (val === undefined || val === null) return null;
    if (!isNumeric) return val;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  // 1. Direct match on cleanKey
  if (stat.meta[cleanKey] !== undefined) {
    return resolve(stat.meta[cleanKey]);
  }

  // 2. Direct match on raw fieldVal
  if (stat.meta[fieldVal] !== undefined) {
    return resolve(stat.meta[fieldVal]);
  }

  // 3. Synonym search
  const synonyms = PARAMETER_SYNONYMS[fieldKey] || [];
  for (const sym of synonyms) {
    if (stat.meta[sym] !== undefined) {
      return resolve(stat.meta[sym]);
    }
    // Normalized comparison
    const symNormalized = sym.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const matchedKey = Object.keys(stat.meta).find(k => {
      return k.toUpperCase().replace(/[^A-Z0-9]/g, '') === symNormalized;
    });
    if (matchedKey && stat.meta[matchedKey] !== undefined) {
      return resolve(stat.meta[matchedKey]);
    }
  }

  return null;
};

/**
 * Direct lookup from a telemetry `meta` object using key and synonyms.
 */
export const getMetaValue = (meta, fieldKey, defaultValue = 0) => {
  if (!meta || typeof meta !== 'object') return defaultValue;

  if (meta[fieldKey] !== undefined) {
    const n = Number(meta[fieldKey]);
    return isNaN(n) ? meta[fieldKey] : n;
  }

  const synonyms = PARAMETER_SYNONYMS[fieldKey] || [];
  for (const sym of synonyms) {
    if (meta[sym] !== undefined) {
      const n = Number(meta[sym]);
      return isNaN(n) ? meta[sym] : n;
    }
    const symNorm = sym.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const matched = Object.keys(meta).find(k => k.toUpperCase().replace(/[^A-Z0-9]/g, '') === symNorm);
    if (matched && meta[matched] !== undefined) {
      const n = Number(meta[matched]);
      return isNaN(n) ? meta[matched] : n;
    }
  }

  return defaultValue;
};

/**
 * Parses user limit values safely
 */
export const parseLimit = (val) => {
  if (val === '' || val === undefined || val === null) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
};

/**
 * Computes warning / alert / normal status based on thresholds
 */
export const getThresholdStatus = (value, limitObj) => {
  if (!limitObj) return 'default';

  const low = parseLimit(limitObj.low);
  const normalMin = parseLimit(limitObj.normalMin);
  const normalMax = parseLimit(limitObj.normalMax);
  const high = parseLimit(limitObj.high);

  if (low === null && normalMin === null && normalMax === null && high === null) {
    return 'default';
  }

  if (low !== null && value <= low) return 'alert';
  if (high !== null && value >= high) return 'alert';

  const hasNormalMin = normalMin !== null;
  const hasNormalMax = normalMax !== null;

  if (hasNormalMin && hasNormalMax) {
    if (value >= normalMin && value <= normalMax) return 'normal';
  } else if (hasNormalMin) {
    if (value >= normalMin) return 'normal';
  } else if (hasNormalMax) {
    if (value <= normalMax) return 'normal';
  }

  return 'warning';
};

/**
 * Polar coordinate conversion for SVG gauge drawing
 */
export const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angle = isNaN(angleInDegrees) ? 0 : angleInDegrees;
  const angleInRadians = (angle * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
};

/**
 * Creates SVG arc path string
 */
export const describeArc = (x, y, radius, startAngle, endAngle) => {
  if (isNaN(startAngle) || isNaN(endAngle)) return "M 0 0";
  const start = polarToCartesian(x, y, radius, startAngle);
  const end = polarToCartesian(x, y, radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y
  ].join(" ");
};

/**
 * Number formatting with tabular numbers and units
 */
export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(Number(num))) return '--';
  return Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Maps raw events payload from GET /devices/:deviceId/events/latest
 * to canonical telemetry fields for Main Meter, Sub Meters and Digital Twin displays.
 * Incorporates settingId and fieldKey priority with adapter resolution.
 */
export const mapLatestEventsToTelemetry = (eventsPayload, templateMapping = {}) => {
  if (!eventsPayload) {
    return { updates: {}, lastEventTime: null, rawFields: [], settingsTelemetryMap: new Map(), resolvedSettings: [] };
  }

  const payload = eventsPayload.data || eventsPayload;
  const fieldsArray = Array.isArray(payload.fields)
    ? payload.fields
    : (Array.isArray(payload) ? payload : (Array.isArray(payload.results) ? payload.results : null));

  // If templateMapping contains device with settings, delegate to resolveDeviceTelemetry
  const device = templateMapping?.device || (templateMapping?.settings ? templateMapping : null);
  if (device) {
    const resolved = resolveDeviceTelemetry(device, eventsPayload, templateMapping?.category);
    // Also merge canonical legacy keys for backward-compatible consumption in data state
    const canonicalUpdates = { ...resolved.updates };
    
    // Map resolved values to standard MFM state keys if available
    resolved.resolvedSettings.forEach(item => {
      if (item.value === null || item.value === undefined) return;
      const sName = (item.displayName || '').toLowerCase().trim();
      const num = typeof item.value === 'number' ? item.value : Number(item.value);
      const val = isNaN(num) ? item.value : num;

      if (
        sName.includes('r-phase volt') || sName === 'voltage-r' || sName === 'voltage r' ||
        sName === 'voltage ln' || sName.includes('voltage ln') || sName === 'vln' || sName === 'ua' || sName === 'vr'
      ) canonicalUpdates.vR = val;
      else if (sName.includes('y-phase volt') || sName === 'voltage-y' || sName === 'voltage y' || sName === 'ub' || sName === 'vy') canonicalUpdates.vY = val;
      else if (sName.includes('b-phase volt') || sName === 'voltage-b' || sName === 'voltage b' || sName === 'uc' || sName === 'vb') canonicalUpdates.vB = val;
      else if (
        sName.includes('r-current') || sName === 'current-r' || sName === 'current r' ||
        sName === 'current' || sName === 'line amps (r)' || sName === 'ia' || sName === 'ir'
      ) canonicalUpdates.iR = val;
      else if (sName.includes('y-current') || sName === 'current-y' || sName === 'current y' || sName === 'ib' || sName === 'iy') canonicalUpdates.iY = val;
      else if (sName.includes('b-current') || sName === 'current-b' || sName === 'current b' || sName === 'ic' || sName === 'ib') canonicalUpdates.iB = val;
      else if (
        sName.includes('max.dmd-kwh') || sName.includes('max.dmd kwh') || sName.includes('max demand kwh')
      ) canonicalUpdates.maxDmdKwh = val;
      else if (
        sName.includes('max.dmd-kvah') || sName.includes('max.dmd kvah') || sName.includes('max demand kvah')
      ) canonicalUpdates.maxDmdKvah = val;
      else if (
        sName.includes('total kw') || sName.includes('active power') || sName === 'kw' || sName === 'p'
      ) {
        canonicalUpdates.totalKw = val;
        canonicalUpdates.activePower = val;
      } else if (
        sName.includes('total reactive energy') || sName.includes('reactive energy') || sName.includes('kvarh')
      ) {
        canonicalUpdates.reactiveEnergy = val;
      } else if (
        sName.includes('eb kwh') || sName.includes('total active energy') || (sName.includes('active energy') && !sName.includes('reactive')) || sName === 'kwh' || sName === 'ep'
      ) {
        canonicalUpdates.ebKwh = val;
        canonicalUpdates.cumulativekWh = val;
      } else if (
        sName.includes('eb kvah') || sName.includes('apparent energy') || sName === 'kvah' || sName === 's'
      ) {
        canonicalUpdates.ebKvah = val;
      } else if (
        sName.includes('total kva') || sName.includes('apparent power') || sName === 'kva'
      ) {
        canonicalUpdates.totalKva = val;
        canonicalUpdates.apparentPower = val;
      } else if (
        sName.includes('reactive power') || sName === 'kvar' || sName === 'q'
      ) {
        canonicalUpdates.reactivePower = val;
      } else if (sName === 'power factor' || sName === 'pf') canonicalUpdates.pf = val;
      else if (sName === 'frequency' || sName === 'freq' || sName === 'hz') canonicalUpdates.freq = val;
      else if (sName.includes('balance')) canonicalUpdates.balance = val;
      else if (sName.includes('dg kwh')) canonicalUpdates.dgKwh = val;
    });

    return {
      updates: canonicalUpdates,
      lastEventTime: resolved.lastEventTime,
      rawFields: fieldsArray || [],
      settingsTelemetryMap: resolved.settingsTelemetryMap,
      resolvedSettings: resolved.resolvedSettings
    };
  }

  const updates = {};
  let maxTime = payload.lastEventTime || null;

  if (fieldsArray && fieldsArray.length > 0) {
    // Build normalized lookup map from PARAMETER_SYNONYMS
    const synonymMap = new Map();
    for (const [stateKey, synList] of Object.entries(PARAMETER_SYNONYMS)) {
      synonymMap.set(stateKey.toLowerCase().replace(/[^a-z0-9]/g, ''), stateKey);
      for (const syn of synList) {
        synonymMap.set(String(syn).toLowerCase().replace(/[^a-z0-9]/g, ''), stateKey);
      }
    }

    // Explicit common aliases from industrial MFM & OpenAPI spec samples
    const extraAliases = {
      eq: 'ebKvah',
      ep: 'ebKwh',
      ua: 'vR',
      ub: 'vY',
      uc: 'vB',
      vr: 'vR',
      vy: 'vY',
      vb: 'vB',
      ia: 'iR',
      ib: 'iY',
      ic: 'iB',
      ir: 'iR',
      iy: 'iY',
      kw: 'totalKw',
      p: 'totalKw',
      totalkw: 'totalKw',
      activepower: 'totalKw',
      kva: 'totalKva',
      s: 'totalKva',
      totalkva: 'totalKva',
      apparentpower: 'totalKva',
      kvar: 'reactivePower',
      q: 'reactivePower',
      reactivepower: 'reactivePower',
      pf: 'pf',
      powerfactor: 'pf',
      f: 'freq',
      freq: 'freq',
      frequency: 'freq',
      hz: 'freq',
      bal: 'balance',
      balance: 'balance',
      dg: 'dgKwh',
      dgkwh: 'dgKwh',
      src: 'ebDgStatus',
      ebdgtoggle: 'ebDgStatus',
      ebdgstatus: 'ebDgStatus',
      ry: 'connectedStatus',
      relay: 'connectedStatus',
      connectedstatus: 'connectedStatus',
      vry: 'vRY',
      vyb: 'vYB',
      vbr: 'vBR',
      vll: 'vLLAvg',
      vllavg: 'vLLAvg',
      vln: 'vLNAvg',
      vlnavg: 'vLNAvg',
      iavg: 'iAvg',
      pfavg: 'pfAvg',
      pfr: 'pfR',
      pfy: 'pfY',
      pfb: 'pfB',
      kvaavg: 'kvaAvg',
      kvaravg: 'kvarAvg',
      loadhrs: 'loadHrs',
      loadmin: 'loadMin',
      noloadhrs: 'noLoadHrs',
      noloadmin: 'noLoadMin',
      loadpct: 'loadPct',
      ebtariff: 'ebTariff',
      dgtariff: 'dgTariff',
      ebrloadset: 'ebRLoadSet',
      ebyloadset: 'ebYLoadSet',
      ebbloadset: 'ebBLoadSet',
      dgrloadset: 'dgRLoadSet',
      dgyloadset: 'dgYLoadSet',
      dgbloadset: 'dgBLoadSet',
      lowbalancecut: 'lowBalanceCut',
      overloadtrip: 'overloadTrip',
      overloadlimitreached: 'overloadLimitReached',
      forceoff: 'forceOff',
      metersrno: 'meterSrno',
      noofoverloadcheck: 'noOfOverloadCheck',
      voltageln: 'vR',
      current: 'iR',
      totalactiveenergy: 'ebKwh',
      totalreactiveenergy: 'reactiveEnergy',
      apparentenergy: 'ebKvah',
      maxdmdkwh: 'maxDmdKwh',
      maxdmdkvah: 'maxDmdKvah'
    };

    for (const [alias, key] of Object.entries(extraAliases)) {
      synonymMap.set(alias.toLowerCase().replace(/[^a-z0-9]/g, ''), key);
    }

    for (const field of fieldsArray) {
      if (!field) continue;
      const rawVal = field.currentValue !== undefined ? field.currentValue : field.value;
      if (rawVal === undefined || rawVal === null) continue;

      if (field.time && (!maxTime || field.time > maxTime)) {
        maxTime = field.time;
      }

      const candidates = [
        field.displayName,
        field.fieldName,
        field.name,
        field.fieldKey,
        field.key,
        field.label
      ].filter(Boolean);

      let matchedKey = null;

      // Special unit-based disambiguation for Eq / EP
      const unitUpper = String(field.unit || '').toUpperCase();
      const dispUpper = String(field.displayName || '').toUpperCase();
      if (dispUpper === 'EQ') {
        if (unitUpper.includes('KVAR')) {
          matchedKey = 'reactivePower';
        } else {
          matchedKey = 'ebKvah';
        }
      } else if (dispUpper === 'EP') {
        matchedKey = 'ebKwh';
      }

      // Check synonyms
      if (!matchedKey) {
        for (const cand of candidates) {
          const norm = String(cand).toLowerCase().replace(/[^a-z0-9]/g, '');
          if (synonymMap.has(norm)) {
            matchedKey = synonymMap.get(norm);
            break;
          }
        }
      }

      // Check device template mapping configurations
      if (!matchedKey && templateMapping) {
        for (const [cfgName, cfgObj] of Object.entries(templateMapping)) {
          if (!cfgObj || typeof cfgObj !== 'object') continue;
          for (const [k, v] of Object.entries(cfgObj)) {
            if (typeof v === 'string') {
              const cleanV = v.includes(':') ? v.split(':').pop() : v;
              const matches = candidates.some(c => {
                const s = String(c).trim();
                return s === cleanV.trim() || s === v.trim();
              });
              if (matches) {
                matchedKey = k;
                break;
              }
            }
          }
          if (matchedKey) break;
        }
      }

      if (matchedKey) {
        const num = Number(rawVal);
        const parsedVal = (field.dataType === 'NUMBER' || (!isNaN(num) && typeof rawVal !== 'boolean')) ? num : rawVal;
        updates[matchedKey] = parsedVal;

        if (matchedKey === 'totalKw' && updates.activePower === undefined) {
          updates.activePower = parsedVal;
        } else if (matchedKey === 'activePower' && updates.totalKw === undefined) {
          updates.totalKw = parsedVal;
        }

        if (matchedKey === 'ebKwh' && updates.cumulativekWh === undefined) {
          updates.cumulativekWh = parsedVal;
        } else if (matchedKey === 'cumulativekWh' && updates.ebKwh === undefined) {
          updates.ebKwh = parsedVal;
        }

        if (matchedKey === 'totalKva' && updates.apparentPower === undefined) {
          updates.apparentPower = parsedVal;
        } else if (matchedKey === 'apparentPower' && updates.totalKva === undefined) {
          updates.totalKva = parsedVal;
        }
      }
    }
  } else if (payload && typeof payload === 'object') {
    // Plain object with key-value pairs (fallback)
    for (const [k, v] of Object.entries(payload)) {
      if (v !== undefined && v !== null && typeof v !== 'object') {
        const num = Number(v);
        updates[k] = isNaN(num) ? v : num;
      }
    }
  }

  return {
    updates,
    lastEventTime: maxTime,
    rawFields: fieldsArray || [],
    settingsTelemetryMap: new Map(),
    resolvedSettings: []
  };
};
