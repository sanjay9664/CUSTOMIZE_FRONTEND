/**
 * Unified Energy Telemetry Utility
 * Centralizes parameter synonyms, register mapping, extraction helpers,
 * limit checks, and SVG gauge math across Main Meter, Sub Meters, Overview, and Graphs.
 */

export const PARAMETER_SYNONYMS = {
  // Energy & Consumption
  ebKwh: ['3,151', '3,152', '4,91F', 'EB KWH', 'EB_KWH', 'EB ACTIVE ENERGY', 'CONSUMPTION', 'ACTIVE ENERGY', 'CUMULATIVE KWH', 'CUMULATIVE_KWH', 'KWH', 'EP'],
  ebKvah: ['3,152', '3,157', '4,93F', 'EB KVAH', 'EB_KVAH', 'APPARENT ENERGY', 'KVAH', 'S'],
  cumulativekWh: ['3,151', '3,152', '4,91F', 'EB KWH', 'EB_KWH', 'EB ACTIVE ENERGY', 'CONSUMPTION', 'ACTIVE ENERGY', 'CUMULATIVE KWH', 'CUMULATIVE_KWH', 'KWH', 'EP'],
  dgKwh: ['3,180', '3,181', 'DG KWH', 'DG_KWH', 'DG ACTIVE', 'DG ENERGY', 'GENERATOR ENERGY', 'GEN KWH'],
  balance: ['3,162', '3,168', 'BALANCE', 'PREPAID BALANCE', 'AMT', 'AMOUNT', 'CREDIT', 'PREPAID_BALANCE'],

  // Powers
  totalKw: ['3,190', '3,151', 'TOTAL KW', 'TOTAL_KW', 'ACTIVE POWER', 'DEMAND', 'LOAD KW', 'ACTIVE_POWER', 'Total KW', 'KW'],
  activePower: ['3,190', '3,151', 'TOTAL KW', 'TOTAL_KW', 'ACTIVE POWER', 'DEMAND', 'LOAD KW', 'ACTIVE_POWER', 'Total KW', 'KW'],
  totalKva: ['3,191', 'TOTAL KVA', 'TOTAL_KVA', 'APPARENT POWER', 'LOAD KVA', 'APPARENT_POWER', 'Total KVA', 'KVA'],
  apparentPower: ['3,191', 'TOTAL KVA', 'TOTAL_KVA', 'APPARENT POWER', 'LOAD KVA', 'APPARENT_POWER', 'Total KVA', 'KVA'],
  reactivePower: ['3,192', 'REACTIVE POWER', 'REACTIVE_POWER', 'KVAR', 'POWER KVAR', 'Eq'],

  // Voltages (Phase to Neutral)
  vR: ['3,168', '3,163', 'VOLTAGE R', 'VOLTAGE_R', 'VR', 'V_R', 'UA', 'U1', 'LINE VOLTS (R)', 'VOLTAGE R-PHASE', 'Voltage-R', 'R-PHASE VOLTAGE', 'R-Phase Voltage'],
  vY: ['3,169', '3,164', 'VOLTAGE Y', 'VOLTAGE_Y', 'VY', 'V_Y', 'UB', 'U2', 'LINE VOLTS (Y)', 'VOLTAGE Y-PHASE', 'Voltage-Y', 'Y-PHASE VOLTAGE', 'Y-Phase Voltage'],
  vB: ['3,170', '3,165', 'VOLTAGE B', 'VOLTAGE_B', 'VB', 'V_B', 'UC', 'U3', 'LINE VOLTS (B)', 'VOLTAGE B-PHASE', 'Voltage-B', 'B-PHASE VOLTAGE', 'B-Phase Voltage'],

  // Voltages (Line to Line)
  vRY: ['VOLTAGE R-Y', 'V_RY', 'VRY', 'LINE VOLTS (RY)', 'VOLTAGE RY', 'Voltage R-Y'],
  vYB: ['VOLTAGE Y-B', 'V_YB', 'VYB', 'LINE VOLTS (YB)', 'VOLTAGE YB', 'Voltage Y-B'],
  vBR: ['VOLTAGE B-R', 'V_BR', 'VBR', 'LINE VOLTS (BR)', 'VOLTAGE BR', 'Voltage B-R'],
  vLLAvg: ['AVG VOLTAGE L-L', 'V_LL_AVG', 'AVG VLL', 'VLL AVG', 'Avg Voltage L-L'],
  vLNAvg: ['AVG VOLTAGE L-N', 'V_LN_AVG', 'AVG VLN', 'VLN AVG', 'Avg Voltage L-N'],

  // Currents
  iR: ['3,171', '3,166', 'CURRENT R', 'CURRENT_R', 'IR', 'I_R', 'IA', 'A1', 'LINE AMPS (R)', 'R-CURRENT', 'R-Current', 'R-PHASE CURRENT'],
  iY: ['3,172', '3,167', 'CURRENT Y', 'CURRENT_Y', 'IY', 'I_Y', 'A2', 'LINE AMPS (Y)', 'Y-CURRENT', 'Y-current', 'Y-Current', 'Y-PHASE CURRENT'],
  iB: ['3,173', '3,168', 'CURRENT B', 'CURRENT_B', 'IB', 'I_B', 'IC', 'A3', 'LINE AMPS (B)', 'B-CURRENT', 'B-current', 'B-Current', 'B-PHASE CURRENT'],
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
  dgTariff: ['3,172', 'DG TARIFF', 'GEN RATE', 'DG_RATE', 'DGTARIFF', 'DG Tariff'],
  ebRLoadSet: ['3,173', 'EB R LOAD', 'EB_R_LOAD', 'EB_R_LIMIT', 'EBRLOADSET'],
  ebYLoadSet: ['3,174', 'EB Y LOAD', 'EB_Y_LOAD', 'EB_Y_LIMIT', 'EBYLOADSET'],
  ebBLoadSet: ['3,175', 'EB B LOAD', 'EB_B_LOAD', 'EB_B_LIMIT', 'EBBLOADSET'],
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
  forceOff: ['3,168', 'FORCE OFF', 'REMOTE TRIP', 'FORCE_OFF', 'FORCE_OFF_STATUS'],
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
 */
export const mapLatestEventsToTelemetry = (eventsPayload, templateMapping = {}) => {
  if (!eventsPayload) return { updates: {}, lastEventTime: null };

  const payload = eventsPayload.data || eventsPayload;
  const fieldsArray = Array.isArray(payload.fields)
    ? payload.fields
    : (Array.isArray(payload) ? payload : null);

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
      ib: 'iB',
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
      noofoverloadcheck: 'noOfOverloadCheck'
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

        // Complementary bidirectional state syncing
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

  return { updates, lastEventTime: maxTime, rawFields: fieldsArray || [] };
};
