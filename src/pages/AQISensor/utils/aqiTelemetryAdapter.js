/**
 * AQI Sensor Telemetry Adapter
 * Decouples backend API responses from frontend presentation.
 * Preserves frontend-defined `displayName` values from `deviceTemplates.js`.
 * 
 * Precedence Order:
 * 1. Setting IDs from the device's configured settings (`device.settings`)
 * 2. Hardware register / field identifiers (`fieldKey`, `sochiotFieldName`)
 * 3. Canonical parameter definitions from `DEVICE_TEMPLATES.AQI_SENSOR`
 */

import { DEVICE_TEMPLATES } from '../../../constants/deviceTemplates.js';

// Valid physical sensor ranges for anomaly detection
export const VALID_RANGES = {
  aqi: { min: 0, max: 500, label: 'AQI' },
  pm25: { min: 0, max: 1000, label: 'PM2.5' },
  pm10: { min: 0, max: 1000, label: 'PM10' },
  co2: { min: 300, max: 5000, label: 'CO₂' },
  tvoc: { min: 0, max: 10000, label: 'TVOC' },
  tempC: { min: -40, max: 80, label: 'Temperature' },
  hum: { min: 0, max: 100, label: 'Humidity' }
};

// Canonical metric definitions & default visual configurations
export const CANONICAL_AQI_METRICS = {
  aqi: {
    key: 'aqi',
    canonicalName: 'AQI',
    defaultUnit: 'IV',
    fieldKeys: ['3,104', '3, 104', 'aqi', 'iaq'],
    badgeText: 'aqi',
    badgeClass: 'aqi-badge-pm',
    sublabel: 'Air Quality Index',
    decimals: 0
  },
  pm25: {
    key: 'pm25',
    canonicalName: 'PM2.5',
    defaultUnit: 'µg/m³',
    fieldKeys: ['pm2.5', 'pm25', 'pm_25', 'pm 2.5'],
    badgeText: 'pm',
    badgeClass: 'aqi-badge-pm',
    sublabel: 'Fine Particulates',
    decimals: 1
  },
  pm10: {
    key: 'pm10',
    canonicalName: 'PM10',
    defaultUnit: 'µg/m³',
    fieldKeys: ['pm10', 'pm_10', 'pm 10'],
    badgeText: 'pm',
    badgeClass: 'aqi-badge-pm',
    sublabel: 'Coarse Dust',
    decimals: 1
  },
  co2: {
    key: 'co2',
    canonicalName: 'CO₂',
    defaultUnit: 'ppm',
    fieldKeys: ['3,102', '3, 102', 'co2', 'co_2', 'carbon dioxide'],
    badgeText: 'co₂',
    badgeClass: 'aqi-badge-co2',
    sublabel: 'CO2 Concentration',
    decimals: 0
  },
  tvoc: {
    key: 'tvoc',
    canonicalName: 'TVOC',
    defaultUnit: 'PPM',
    fieldKeys: ['3,103', '3, 103', 'tvoc', 'voc'],
    badgeText: 'tvoc',
    badgeClass: 'aqi-badge-tvoc',
    sublabel: 'Volatile Compounds',
    decimals: 0
  },
  tempC: {
    key: 'tempC',
    canonicalName: 'Temperature',
    defaultUnit: 'Deg.C',
    fieldKeys: ['3,100', '3, 100', 'temp', 'temperature', 'deg.c', 'degc'],
    badgeText: 'temp',
    badgeClass: 'aqi-badge-temp',
    sublabel: 'Ambient Temperature',
    decimals: 1
  },
  hum: {
    key: 'hum',
    canonicalName: 'Humidity',
    defaultUnit: '%',
    fieldKeys: ['3,101', '3, 101', 'hum', 'humidity', 'rh'],
    badgeText: 'hum',
    badgeClass: 'aqi-badge-hum',
    sublabel: 'Relative Humidity',
    decimals: 0
  }
};

/**
 * Normalizes string keys for safe, robust comparison without losing phase/register identity
 */
export const normalizeKey = (str) => {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[\s\-_/()°%]+/g, '');
};

/**
 * Validates whether a value is a real, non-malfunctioning sensor reading
 * Rejects hardware error sentinels (-999, 65535, 32767, 99999) and out-of-bounds readings
 */
export const validateSensorVal = (val, type) => {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  if (isNaN(num) || !Number.isFinite(num)) return null;

  // Check known hardware error/malfunction sentinel values
  if (num === -999 || num === 65535 || num === 32767 || num === 99999 || num === 9999 || num === -32768 || num === 6553.5) {
    return null;
  }

  const range = VALID_RANGES[type];
  if (range && (num < range.min || num > range.max)) {
    return null;
  }

  return num;
};

/**
 * Calculates standard US EPA AQI from raw PM2.5 (µg/m³)
 */
export const calculateAqiFromPm25 = (pm25) => {
  if (pm25 === null || pm25 === undefined || isNaN(pm25)) return null;
  const c = Math.max(0, Number(pm25));

  const breakpoints = [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 }
  ];

  for (const bp of breakpoints) {
    if (c >= bp.cLow && c <= bp.cHigh) {
      const aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (c - bp.cLow) + bp.iLow;
      return Math.round(aqi);
    }
  }

  if (c > 500.4) return 500;
  return null;
};

/**
 * Resolves standard AQI Category strictly from a real numeric value
 */
export const getAqiCategory = (val) => {
  if (val === null || val === undefined || isNaN(val)) {
    return {
      label: 'NO DATA',
      colorClass: 'text-secondary',
      capsuleClass: 'bg-secondary bg-opacity-25 text-secondary border border-secondary border-opacity-25',
      colorHex: '#94a3b8',
      description: 'Awaiting sensor telemetry.'
    };
  }

  const num = Number(val);
  if (num <= 50) {
    return {
      label: 'GOOD',
      colorClass: 'aqi-good',
      capsuleClass: 'aqi-capsule-good',
      colorHex: '#10b981',
      description: 'Air quality is satisfactory and poses little or no risk.'
    };
  }
  if (num <= 100) {
    return {
      label: 'MODERATE',
      colorClass: 'aqi-moderate',
      capsuleClass: 'aqi-capsule-moderate',
      colorHex: '#eab308',
      description: 'Air quality is acceptable. Elevated particles may affect sensitive individuals.'
    };
  }
  if (num <= 150) {
    return {
      label: 'UNHEALTHY FOR SENSITIVE',
      colorClass: 'aqi-unhealthy-sensitive',
      capsuleClass: 'aqi-capsule-unhealthy-sensitive',
      colorHex: '#f97316',
      description: 'Members of sensitive groups may experience health effects.'
    };
  }
  return {
    label: 'UNHEALTHY',
    colorClass: 'aqi-unhealthy',
    capsuleClass: 'aqi-capsule-unhealthy',
    colorHex: '#ef4444',
    description: 'Everyone may begin to experience health effects.'
  };
};

export const getThresholdStatusFromSetting = (arg1, arg2) => {
  let value = arg1;
  let setting = arg2;

  // Support both (value, setting) and (setting, value)
  if (typeof arg1 === 'object' && arg1 !== null && (typeof arg2 === 'number' || typeof arg2 === 'string' || arg2 === null || arg2 === undefined)) {
    setting = arg1;
    value = arg2;
  }

  if (!setting || value === null || value === undefined) return 'default';
  const numVal = Number(value);
  if (isNaN(numVal)) return 'default';

  const parseNum = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  const criticalHigh = parseNum(setting.criticalHigh ?? setting.critical_high);
  const criticalLow = parseNum(setting.criticalLow ?? setting.critical_low);
  const warningHigh = parseNum(setting.warningHigh ?? setting.warning_high);
  const warningLow = parseNum(setting.warningLow ?? setting.warning_low);

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
 * Matches an arbitrary field or setting against canonical AQI metrics
 * using 3-tier precedence:
 * 1. Setting ID match against device.settings
 * 2. Hardware fieldKey / sochiotFieldName match
 * 3. Canonical displayName match
 */
export const identifyAqiMetricType = (item, deviceSettings = []) => {
  if (!item) return null;

  const sId = item.settingId !== undefined && item.settingId !== null
    ? String(item.settingId)
    : (item.id !== undefined && item.id !== null ? String(item.id) : null);

  const fieldKey = String(item.fieldKey || item.sochiotFieldName || item.fieldName || item.key || '').trim();
  const fieldKeyNorm = normalizeKey(fieldKey);
  const displayName = String(item.displayName || item.name || item.label || '').trim();
  const displayNameNorm = normalizeKey(displayName);

  // Tier 1: Match against deviceSettings by ID
  if (sId && Array.isArray(deviceSettings) && deviceSettings.length > 0) {
    const matchedDeviceSetting = deviceSettings.find(ds => {
      const dsId = ds.id !== undefined && ds.id !== null ? String(ds.id) : (ds.settingId ? String(ds.settingId) : null);
      return dsId && dsId === sId;
    });

    if (matchedDeviceSetting) {
      const dsFieldKey = normalizeKey(matchedDeviceSetting.sochiotFieldName || matchedDeviceSetting.fieldKey || '');
      const dsName = normalizeKey(matchedDeviceSetting.displayName || matchedDeviceSetting.name || '');

      for (const [mType, def] of Object.entries(CANONICAL_AQI_METRICS)) {
        if (def.fieldKeys.some(fk => normalizeKey(fk) === dsFieldKey)) return mType;
        if (normalizeKey(def.canonicalName) === dsName) return mType;
      }
    }
  }

  // Tier 2: Match by hardware fieldKey
  if (fieldKeyNorm) {
    for (const [mType, def] of Object.entries(CANONICAL_AQI_METRICS)) {
      if (def.fieldKeys.some(fk => normalizeKey(fk) === fieldKeyNorm)) return mType;
    }
  }

  // Tier 3: Match by canonical displayName
  if (displayNameNorm) {
    for (const [mType, def] of Object.entries(CANONICAL_AQI_METRICS)) {
      if (normalizeKey(def.canonicalName) === displayNameNorm) return mType;
      if (displayNameNorm.includes(normalizeKey(def.canonicalName))) return mType;
    }

    // Secondary regex matching on displayName
    if (/aqi|iaq|air\s*quality/i.test(displayName)) return 'aqi';
    if (/pm\s*2\.?5/i.test(displayName)) return 'pm25';
    if (/pm\s*10/i.test(displayName)) return 'pm10';
    if (/co\s*2|carbon/i.test(displayName)) return 'co2';
    if (/tvoc|voc/i.test(displayName)) return 'tvoc';
    if (/temp|temperature/i.test(displayName)) return 'tempC';
    if (/hum|humidity|rh/i.test(displayName)) return 'hum';
  }

  return null;
};

/**
 * Resolves live telemetry fields from GET /devices/:id/events/latest or socket payload
 * according to 3-tier precedence.
 * 
 * Never fabricates values; returns null for missing readings.
 */
export const resolveAqiDeviceTelemetry = (device, eventsPayload) => {
  const payload = eventsPayload?.data || eventsPayload || {};
  let fieldsArray = Array.isArray(payload.fields)
    ? payload.fields
    : (Array.isArray(payload) ? payload : (Array.isArray(payload.results) ? payload.results : []));

  // Support flat key-value dictionaries (e.g. from socket updates or test payloads)
  if (fieldsArray.length === 0 && payload && typeof payload === 'object') {
    const reserved = new Set(['data', 'fields', 'results', 'lastEventTime', 'timestamp', 'alarmState', 'success']);
    fieldsArray = Object.entries(payload)
      .filter(([k]) => !reserved.has(k))
      .map(([k, v]) => ({
        fieldKey: k,
        displayName: k,
        value: typeof v === 'object' && v !== null ? (v.value ?? v.currentValue) : v,
        unit: typeof v === 'object' && v !== null ? v.unit : undefined
      }));
  }

  const deviceSettings = Array.isArray(device?.settings) ? device.settings : [];
  const canonicalTemplate = DEVICE_TEMPLATES.AQI_SENSOR;

  // Build resolved metrics map
  const resolvedMetrics = {};
  const availableMetricKeys = new Set();
  let latestTime = payload.lastEventTime || null;

  // Initialize slots for all canonical metrics
  for (const [mKey, def] of Object.entries(CANONICAL_AQI_METRICS)) {
    // Look for matching setting configured on the device to preserve frontend displayName & limits
    const configuredSetting = deviceSettings.find(ds => {
      return identifyAqiMetricType(ds, deviceSettings) === mKey;
    });

    const canonicalParam = canonicalTemplate?.parameters?.find(p => normalizeKey(p.name) === normalizeKey(def.canonicalName));

    resolvedMetrics[mKey] = {
      metricKey: mKey,
      settingId: configuredSetting?.id || configuredSetting?.settingId || null,
      fieldKey: configuredSetting?.sochiotFieldName || configuredSetting?.fieldKey || def.fieldKeys[0],
      displayName: configuredSetting?.displayName || canonicalParam?.name || def.canonicalName,
      unit: configuredSetting?.unit || def.defaultUnit,
      value: null,
      rawValue: null,
      status: 'default',
      isWarning: false,
      isCritical: false,
      time: null,
      settingDef: configuredSetting || null
    };

    if (configuredSetting) {
      availableMetricKeys.add(mKey);
    }
  }

  // Map incoming events to metrics
  for (const f of fieldsArray) {
    if (!f) continue;
    if (f.time && (!latestTime || f.time > latestTime)) {
      latestTime = f.time;
    }

    const mType = identifyAqiMetricType(f, deviceSettings);
    if (!mType || !resolvedMetrics[mType]) continue;

    const rawVal = f.currentValue !== undefined
      ? f.currentValue
      : (f.value !== undefined ? f.value : (f.lastValue !== undefined ? f.lastValue : (f.avgValue !== undefined ? f.avgValue : null)));

    const validVal = validateSensorVal(rawVal, mType);
    if (validVal === null && rawVal !== null) continue; // Malfunction sentinel discarded

    const currentSlot = resolvedMetrics[mType];
    const finalVal = validVal;
    const unit = f.unit || currentSlot.unit;
    const status = getThresholdStatusFromSetting(finalVal, currentSlot.settingDef);

    currentSlot.value = finalVal;
    currentSlot.rawValue = rawVal;
    currentSlot.unit = unit;
    currentSlot.time = f.time || latestTime;
    currentSlot.status = status;
    currentSlot.isWarning = status === 'warning';
    currentSlot.isCritical = status === 'alert';

    if (finalVal !== null) {
      availableMetricKeys.add(mType);
    }
  }

  // If AQI was not reported directly, but valid PM2.5 is present, calculate official EPA AQI
  if (resolvedMetrics.aqi.value === null && resolvedMetrics.pm25.value !== null) {
    const computedAqi = calculateAqiFromPm25(resolvedMetrics.pm25.value);
    if (computedAqi !== null) {
      resolvedMetrics.aqi.value = computedAqi;
      resolvedMetrics.aqi.rawValue = computedAqi;
      resolvedMetrics.aqi.status = getThresholdStatusFromSetting(computedAqi, resolvedMetrics.aqi.settingDef);
      availableMetricKeys.add('aqi');
    }
  }

  // Fahrenheit calculation for temperature display
  const tempCVal = resolvedMetrics.tempC.value;
  const tempFVal = tempCVal !== null ? +(tempCVal * 1.8 + 32).toFixed(1) : null;

  // Convenient flat telemetry structure for backward compatibility
  const parsedTelemetry = {
    aqi: resolvedMetrics.aqi.value,
    pm25: resolvedMetrics.pm25.value,
    pm10: resolvedMetrics.pm10.value,
    co2: resolvedMetrics.co2.value,
    tvoc: resolvedMetrics.tvoc.value,
    tempC: tempCVal,
    tempF: tempFVal,
    hum: resolvedMetrics.hum.value,
    tvocUnit: resolvedMetrics.tvoc.unit || 'PPM',
    co2Unit: resolvedMetrics.co2.unit || 'ppm',
    tempUnit: resolvedMetrics.tempC.unit || 'Deg.C',
    humUnit: resolvedMetrics.hum.unit || '%',
    lastEventTime: latestTime,
    alarmState: payload.alarmState || null
  };

  return {
    resolvedMetrics,
    parsedTelemetry,
    availableMetricKeys: Array.from(availableMetricKeys),
    lastEventTime: latestTime
  };
};

/**
/**
 * Downsamples 15-minute snapshot records into 30-minute buckets on client
 * Strictly sets delta = null for instantaneous environmental measurements
 */
export const downsampleSnapsTo30Min = (snaps) => {
  if (!Array.isArray(snaps) || snaps.length === 0) return [];
  const buckets = new Map();

  snaps.forEach(snap => {
    const t = new Date(snap.windowStart || snap.windowEnd || 0).getTime();
    if (isNaN(t) || t <= 0) return;
    const bucketKey = Math.floor(t / (30 * 60 * 1000)) * (30 * 60 * 1000);

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        ...snap,
        windowStart: new Date(bucketKey).toISOString(),
        windowEnd: new Date(bucketKey + 30 * 60 * 1000).toISOString(),
        _values: [],
        _minValues: [],
        _maxValues: [],
        _readingsCount: 0,
        _lastPoint: snap
      });
    }

    const b = buckets.get(bucketKey);
    b._lastPoint = snap;
    if (snap.readingCount) b._readingsCount += Number(snap.readingCount);

    const v = snap.avgValue !== null && snap.avgValue !== undefined ? snap.avgValue : snap.lastValue;
    if (v !== null && v !== undefined && !isNaN(Number(v))) {
      b._values.push(Number(v));
    }
    if (snap.minValue !== null && snap.minValue !== undefined && !isNaN(Number(snap.minValue))) {
      b._minValues.push(Number(snap.minValue));
    }
    if (snap.maxValue !== null && snap.maxValue !== undefined && !isNaN(Number(snap.maxValue))) {
      b._maxValues.push(Number(snap.maxValue));
    }
  });

  return Array.from(buckets.values()).map(b => {
    const sum = b._values.reduce((acc, c) => acc + c, 0);
    const avg = b._values.length > 0 ? +(sum / b._values.length).toFixed(2) : b.avgValue;
    const min = b._minValues.length > 0 ? Math.min(...b._minValues) : (b._values.length > 0 ? Math.min(...b._values) : b.minValue);
    const max = b._maxValues.length > 0 ? Math.max(...b._maxValues) : (b._values.length > 0 ? Math.max(...b._values) : b.maxValue);
    return {
      ...b,
      avgValue: avg,
      minValue: min,
      maxValue: max,
      lastValue: b._lastPoint?.lastValue !== undefined ? b._lastPoint.lastValue : (b._values.length > 0 ? b._values[b._values.length - 1] : b.lastValue),
      firstValue: b._values.length > 0 ? b._values[0] : b.firstValue,
      readingCount: b._readingsCount || b.readingCount || (b._values.length ? b._values.length : 1),
      delta: null // Environmental metrics are not cumulative
    };
  });
};

/**
 * Resolves historical snapshots from GET /telemetry/snapshots
 * 
 * FIXES DATA-WIPE BUG:
 * Retains snapshots that contain AT LEAST ONE valid reading
 * (AQI, Temperature, Humidity, CO2, TVOC, or PM2.5).
 * Never discards Temperature & Humidity readings when AQI is null!
 */
export const resolveAqiSnapshots = (arg1, arg2, arg3, arg4) => {
  let device = arg1;
  let settingsResponse = arg2;
  let timeRange = arg3 || '7d';
  let samplingInterval = arg4 || 'DAILY';

  if (arg1 && typeof arg1 === 'object' && !arg2 && ('settingsResponse' in arg1 || 'device' in arg1)) {
    device = arg1.device;
    settingsResponse = arg1.settingsResponse;
    timeRange = arg1.timeRange || '7d';
    samplingInterval = arg1.samplingInterval || 'DAILY';
  }

  // Handle accidental swap of timeRange and samplingInterval
  if (['MIN_15', 'MIN_30', 'HOURLY', 'DAILY'].includes(timeRange)) {
    const temp = timeRange;
    timeRange = samplingInterval || '7d';
    samplingInterval = temp;
  }

  const settings = Array.isArray(settingsResponse)
    ? settingsResponse
    : (Array.isArray(settingsResponse?.settings) ? settingsResponse.settings : []);

  if (settings.length === 0) {
    return {
      points: [],
      historicalPoints: [],
      availableMetrics: [],
      primaryMetric: 'aqi'
    };
  }

  const deviceSettings = Array.isArray(device?.settings) ? device.settings : [];
  const shouldDownsample30Min = samplingInterval === 'MIN_30';

  // Map settings in response to canonical metrics
  const metricSettingsMap = new Map();
  const availableMetricsSet = new Set();

  settings.forEach(s => {
    const mType = identifyAqiMetricType(s, deviceSettings);
    if (mType) {
      let rawSnaps = Array.isArray(s.snapshots) ? s.snapshots : [];
      if (shouldDownsample30Min) {
        rawSnaps = downsampleSnapsTo30Min(rawSnaps);
      }
      metricSettingsMap.set(mType, {
        ...s,
        snapshots: rawSnaps
      });
      if (rawSnaps.length > 0) {
        availableMetricsSet.add(mType);
      }
    }
  });

  // Determine primary setting for chronological timeline
  const preferenceOrder = ['aqi', 'pm25', 'tempC', 'co2', 'tvoc', 'hum', 'pm10'];
  let primaryType = preferenceOrder.find(t => metricSettingsMap.has(t) && metricSettingsMap.get(t).snapshots.length > 0);
  if (!primaryType) {
    primaryType = Array.from(metricSettingsMap.keys())[0] || 'aqi';
  }

  const primarySetting = metricSettingsMap.get(primaryType);
  const primarySnaps = primarySetting?.snapshots || [];

  if (primarySnaps.length === 0) {
    return {
      points: [],
      historicalPoints: [],
      availableMetrics: Array.from(availableMetricsSet),
      primaryMetric: primaryType
    };
  }

  // Build tolerance-based lookups for companion settings
  const createLookup = (settingDef, metricType) => {
    if (!settingDef || !Array.isArray(settingDef.snapshots) || settingDef.snapshots.length === 0) {
      return () => null;
    }

    const map = new Map();
    const sortedTimes = [];

    settingDef.snapshots.forEach(s => {
      const t = new Date(s.windowStart || s.windowEnd || 0).getTime();
      if (!isNaN(t) && t > 0) {
        const v = s.avgValue !== null && s.avgValue !== undefined ? s.avgValue : s.lastValue;
        const valid = validateSensorVal(v, metricType);
        if (valid !== null) {
          map.set(t, valid);
          sortedTimes.push(t);
        }
      }
    });

    sortedTimes.sort((a, b) => a - b);

    return (targetTime, toleranceMs = 30 * 60 * 1000) => {
      if (map.has(targetTime)) return map.get(targetTime);
      let closestTime = null;
      let minDiff = Infinity;
      for (const t of sortedTimes) {
        const diff = Math.abs(t - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestTime = t;
        }
      }
      if (closestTime !== null && minDiff <= toleranceMs) {
        return map.get(closestTime);
      }
      return null;
    };
  };

  const lookupAqi = createLookup(metricSettingsMap.get('aqi'), 'aqi');
  const lookupPm25 = createLookup(metricSettingsMap.get('pm25'), 'pm25');
  const lookupPm10 = createLookup(metricSettingsMap.get('pm10'), 'pm10');
  const lookupCo2 = createLookup(metricSettingsMap.get('co2'), 'co2');
  const lookupTvoc = createLookup(metricSettingsMap.get('tvoc'), 'tvoc');
  const lookupTemp = createLookup(metricSettingsMap.get('tempC'), 'tempC');
  const lookupHum = createLookup(metricSettingsMap.get('hum'), 'hum');

  // Sort primary snapshots chronologically ascending
  const sortedSnaps = [...primarySnaps].sort((a, b) => new Date(a.windowStart || 0) - new Date(b.windowStart || 0));

  const historicalPoints = sortedSnaps.map(snap => {
    const d = new Date(snap.windowStart || snap.windowEnd);
    const targetMs = d.getTime();

    let aqiVal = lookupAqi(targetMs);
    const pm25Val = lookupPm25(targetMs);
    const pm10Val = lookupPm10(targetMs);
    const co2Val = lookupCo2(targetMs);
    const tvocVal = lookupTvoc(targetMs);
    const tempCVal = lookupTemp(targetMs);
    const humVal = lookupHum(targetMs);

    // If primary was AQI itself, use the snapshot's value directly
    if (primaryType === 'aqi') {
      const snapVal = snap.avgValue !== null && snap.avgValue !== undefined ? snap.avgValue : snap.lastValue;
      const validSnapAqi = validateSensorVal(snapVal, 'aqi');
      if (validSnapAqi !== null) aqiVal = validSnapAqi;
    }

    // Fallback: If AQI is null but real PM2.5 is present, compute standard EPA AQI
    if (aqiVal === null && pm25Val !== null) {
      aqiVal = calculateAqiFromPm25(pm25Val);
    }

    const tempFVal = tempCVal !== null ? +(tempCVal * 1.8 + 32).toFixed(1) : null;

    return {
      time: formatTimestampByInterval(d, timeRange, samplingInterval),
      fullDate: d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
      aqi: aqiVal,
      pm25: pm25Val,
      pm10: pm10Val,
      co2: co2Val,
      tvoc: tvocVal,
      tempC: tempCVal,
      tempF: tempFVal,
      hum: humVal,
      rawTimestamp: targetMs
    };
  }).filter(p => {
    // CRITICAL BUG FIX: Retain point if ANY supported metric is valid!
    // Prevents discarding Temperature & Humidity data on T&H sensors when AQI is null.
    return (
      p.aqi !== null ||
      p.tempC !== null ||
      p.hum !== null ||
      p.co2 !== null ||
      p.tvoc !== null ||
      p.pm25 !== null ||
      p.pm10 !== null
    );
  });

  return {
    points: historicalPoints,
    historicalPoints,
    availableMetrics: Array.from(availableMetricsSet),
    primaryMetric: primaryType
  };
};

/**
 * Format timestamp display label according to range and interval
 */
export const formatTimestampByInterval = (date, range, interval) => {
  if (!date || isNaN(date.getTime())) return '';

  if (interval === 'DAILY' || range === '7d') {
    return date.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

/**
 * Resolves settings and snapshots for AQI Graphs page.
 * Uses 3-tier mapping, collision-safe deduplication, frontend displayName authority,
 * client-side 30-min downsampling, and distinct SCADA color palette assignment.
 */
export const resolveAqiGraphSettings = (device, telemetryData, activeInterval = 'HOURLY') => {
  if (!device) return [];

  const telemetryMap = new Map();
  const apiSettings = telemetryData?.settings || [];
  if (Array.isArray(apiSettings)) {
    apiSettings.forEach(s => {
      if (s.settingId !== undefined && s.settingId !== null) {
        telemetryMap.set(`id:${s.settingId}`, s);
      }
      if (s.fieldKey) {
        telemetryMap.set(`key:${s.fieldKey}`, s);
      }
    });
  }

  const deviceSettings = Array.isArray(device.settings) ? device.settings : [];
  // Filter out command-only settings
  const configuredSettings = deviceSettings.filter(s => {
    if (s.isCommand === true && s.isTelemetry === false) return false;
    return true;
  });

  const shouldDownsample30Min = activeInterval === 'MIN_30';
  const settingsMap = new Map();

  // 1. Process configured settings from device (Frontend is presentation authority)
  configuredSettings.forEach(s => {
    const sId = s.id !== undefined && s.id !== null ? s.id : s.settingId;
    // Strict priority key: id > key > name
    const stableKey = (sId !== undefined && sId !== null)
      ? `id:${sId}`
      : (s.sochiotFieldName ? `key:${s.sochiotFieldName}` : `name:${normalizeKey(s.displayName || s.name)}`);

    // Match telemetry by id, then fieldKey, then controlled normalized name
    const sNameNorm = normalizeKey(s.displayName || s.name);
    const tel = (sId !== undefined && sId !== null ? telemetryMap.get(`id:${sId}`) : null) ||
                (s.sochiotFieldName ? telemetryMap.get(`key:${s.sochiotFieldName}`) : null) ||
                (sNameNorm ? apiSettings.find(a => normalizeKey(a.displayName) === sNameNorm) : null);

    let rawSnaps = tel?.snapshots || [];
    if (shouldDownsample30Min && Array.isArray(rawSnaps) && rawSnaps.length > 0) {
      rawSnaps = downsampleSnapsTo30Min(rawSnaps);
    }

    const mType = identifyAqiMetricType(s, deviceSettings);
    const canonicalDef = mType ? CANONICAL_AQI_METRICS[mType] : null;

    // DisplayName from device setting takes precedence; fallback to canonical definition
    const displayName = s.displayName || s.name || canonicalDef?.canonicalName || tel?.displayName || 'Telemetry Parameter';
    const unit = s.unit || canonicalDef?.defaultUnit || tel?.unit || '';

    settingsMap.set(stableKey, {
      settingId: sId,
      fieldKey: s.sochiotFieldName || s.fieldName || tel?.fieldKey || '',
      displayName,
      unit,
      metricType: mType || null,
      isCumulative: false, // Environmental metrics are not cumulative
      snapshots: rawSnaps
    });
  });

  // 2. Include any settings returned by API not already captured
  apiSettings.forEach(apiS => {
    const sId = apiS.settingId;
    const stableKey = (sId !== undefined && sId !== null)
      ? `id:${sId}`
      : (apiS.fieldKey ? `key:${apiS.fieldKey}` : `name:${normalizeKey(apiS.displayName)}`);

    if (!settingsMap.has(stableKey)) {
      const mType = identifyAqiMetricType(apiS, deviceSettings);
      const canonicalDef = mType ? CANONICAL_AQI_METRICS[mType] : null;

      let rawSnaps = apiS.snapshots || [];
      if (shouldDownsample30Min && Array.isArray(rawSnaps) && rawSnaps.length > 0) {
        rawSnaps = downsampleSnapsTo30Min(rawSnaps);
      }

      settingsMap.set(stableKey, {
        settingId: sId,
        fieldKey: apiS.fieldKey || '',
        displayName: canonicalDef?.canonicalName || apiS.displayName || 'Telemetry Parameter',
        unit: apiS.unit || canonicalDef?.defaultUnit || '',
        metricType: mType || null,
        isCumulative: false,
        snapshots: rawSnaps
      });
    }
  });

  // 3. Assign color palettes
  const metricColorMap = {
    aqi: { stroke: '#10b981', fill: '#059669', name: 'Emerald' },
    tempC: { stroke: '#38bdf8', fill: '#0284c7', name: 'Sky' },
    hum: { stroke: '#06b6d4', fill: '#0891b2', name: 'Cyan' },
    co2: { stroke: '#8b5cf6', fill: '#7c3aed', name: 'Purple' },
    tvoc: { stroke: '#ec4899', fill: '#db2777', name: 'Pink' },
    pm25: { stroke: '#f59e0b', fill: '#d97706', name: 'Amber' },
    pm10: { stroke: '#f97316', fill: '#ea580c', name: 'Orange' }
  };

  const fallbackPalettes = [
    { stroke: '#14b8a6', fill: '#0d9488', name: 'Teal' },
    { stroke: '#6366f1', fill: '#4f46e5', name: 'Indigo' },
    { stroke: '#ef4444', fill: '#dc2626', name: 'Red' },
    { stroke: '#eab308', fill: '#ca8a04', name: 'Yellow' }
  ];

  let fallbackIdx = 0;
  const result = Array.from(settingsMap.values()).map(s => {
    let colorScheme = null;
    if (s.metricType && metricColorMap[s.metricType]) {
      colorScheme = metricColorMap[s.metricType];
    } else {
      colorScheme = fallbackPalettes[fallbackIdx % fallbackPalettes.length];
      fallbackIdx++;
    }
    return {
      ...s,
      colorScheme
    };
  });

  return result;
};
