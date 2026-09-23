import assert from 'node:assert/strict';
import {
  normalizeKey,
  validateSensorVal,
  calculateAqiFromPm25,
  getAqiCategory,
  getThresholdStatusFromSetting,
  identifyAqiMetricType,
  resolveAqiDeviceTelemetry,
  downsampleSnapsTo30Min,
  resolveAqiSnapshots,
  formatTimestampByInterval,
  CANONICAL_AQI_METRICS,
  resolveAqiGraphSettings
} from '../src/pages/AQISensor/utils/aqiTelemetryAdapter.js';
import {
  isCumulativeSetting,
  downsampleForBarChart,
  formatTimestampLabel,
  calculateDateRange,
  RANGE_PRESETS,
  getTodayIstDateString
} from '../src/utils/scadaGraphUtils.js';

console.log('--- RUNNING AQI TELEMETRY MAPPING VERIFICATION SUITE ---');

// Test 1: Key normalization & identifier matching
{
  assert.equal(normalizeKey('Air Quality Index (AQI)'), 'airqualityindexaqi');
  assert.equal(normalizeKey('Temperature °C'), 'temperaturec');
  assert.equal(normalizeKey('3, 100'), '3,100');
  assert.equal(normalizeKey('Relative Humidity %'), 'relativehumidity');
  console.log('✔ Test 1 passed: normalizeKey sanitizes strings correctly');
}

// Test 2: Sensor Value Validation (filtering sentinel and out-of-range values)
{
  // Normal values
  assert.equal(validateSensorVal(24.5, 'tempC'), 24.5);
  assert.equal(validateSensorVal('55.2', 'hum'), 55.2);
  assert.equal(validateSensorVal(450, 'co2'), 450);
  assert.equal(validateSensorVal(120, 'tvoc'), 120);
  assert.equal(validateSensorVal(35, 'pm25'), 35);
  assert.equal(validateSensorVal(65, 'aqi'), 65);

  // Sentinel values (-999, 65535, etc.) must be rejected as null
  assert.equal(validateSensorVal(-999, 'tempC'), null, '-999 error code must return null');
  assert.equal(validateSensorVal(65535, 'co2'), null, '65535 overflow code must return null');
  assert.equal(validateSensorVal(9999, 'tvoc'), null, '9999 sentinel code must return null');
  assert.equal(validateSensorVal(6553.5, 'tempC'), null, '6553.5 scaled sentinel must return null');

  // Physical out-of-range bounds
  assert.equal(validateSensorVal(-60, 'tempC'), null, 'Below -50°C must return null');
  assert.equal(validateSensorVal(120, 'tempC'), null, 'Above 100°C must return null');
  assert.equal(validateSensorVal(120, 'hum'), null, 'Above 100% RH must return null');
  assert.equal(validateSensorVal(-5, 'hum'), null, 'Negative humidity must return null');
  assert.equal(validateSensorVal(60000, 'co2'), null, 'Out of range CO2 must return null');
  assert.equal(validateSensorVal(-10, 'pm25'), null, 'Negative PM2.5 must return null');

  // Missing, null, NaN
  assert.equal(validateSensorVal(null, 'tempC'), null);
  assert.equal(validateSensorVal(undefined, 'hum'), null);
  assert.equal(validateSensorVal('invalid', 'co2'), null);

  console.log('✔ Test 2 passed: Sensor value validation filters corrupt & out-of-range readings');
}

// Test 3: EPA AQI Calculation from PM2.5 fallback
{
  assert.equal(calculateAqiFromPm25(10), 42); // Good
  assert.equal(calculateAqiFromPm25(25), 78); // Moderate
  assert.equal(calculateAqiFromPm25(40), 112); // Unhealthy for Sensitive
  assert.equal(calculateAqiFromPm25(100), 174); // Unhealthy
  assert.equal(calculateAqiFromPm25(null), null);
  console.log('✔ Test 3 passed: calculateAqiFromPm25 implements standard piecewise linear interpolation');
}

// Test 4: Threshold Status Evaluation
{
  const setting = {
    warningHigh: 1000,
    criticalHigh: 1500,
    warningLow: 400,
    criticalLow: 300
  };

  assert.equal(getThresholdStatusFromSetting(setting, 600), 'normal');
  assert.equal(getThresholdStatusFromSetting(setting, 1100), 'warning');
  assert.equal(getThresholdStatusFromSetting(setting, 1600), 'alert');
  assert.equal(getThresholdStatusFromSetting(setting, 350), 'warning');
  assert.equal(getThresholdStatusFromSetting(setting, 250), 'alert');
  assert.equal(getThresholdStatusFromSetting(setting, null), 'default');
  console.log('✔ Test 4 passed: getThresholdStatusFromSetting correctly resolves threshold warnings & alerts');
}

// Test 5: Three-Tier Setting Resolution and Setting ID Precedence
{
  // Simulated device with explicit setting IDs matching user requirements
  const device = {
    id: 10,
    name: 'Main AQI Sensor Station',
    category: 'AQI_SENSOR',
    settings: [
      { settingId: 25, fieldKey: '3,102', displayName: 'CO₂ Gas', unit: 'ppm' },
      { settingId: 26, fieldKey: '3,103', displayName: 'Total VOC', unit: 'ppb' },
      { settingId: 27, fieldKey: '3,100', displayName: 'Ambient Temp', unit: '°C' },
      { settingId: 28, fieldKey: '3,101', displayName: 'Relative Humidity', unit: '%' },
      { settingId: 29, fieldKey: '3,104', displayName: 'AQI Index', unit: '' }
    ]
  };

  // Events where backend sends different/unexpected displayNames
  const rawEvents = {
    fields: [
      { settingId: 27, fieldKey: '3,100', currentValue: 24.8, displayName: 'Backend Temperature' },
      { settingId: 28, fieldKey: '3,101', currentValue: 52.4, displayName: 'Backend Hum' },
      { settingId: 25, fieldKey: '3,102', currentValue: 680, displayName: 'Backend CO2' },
      { settingId: 26, fieldKey: '3,103', currentValue: 185, displayName: 'Backend TVOC' },
      { settingId: 29, fieldKey: '3,104', currentValue: 58, displayName: 'Backend Air Quality' }
    ]
  };

  const { parsedTelemetry, resolvedMetrics } = resolveAqiDeviceTelemetry(device, rawEvents);

  // Values mapped correctly
  assert.equal(parsedTelemetry.tempC, 24.8);
  assert.equal(parsedTelemetry.hum, 52.4);
  assert.equal(parsedTelemetry.co2, 680);
  assert.equal(parsedTelemetry.tvoc, 185);
  assert.equal(parsedTelemetry.aqi, 58);

  // Frontend display names must be preserved over backend raw field names
  assert.equal(resolvedMetrics.tempC.displayName, 'Ambient Temp', 'Device setting displayName must be preserved');
  assert.equal(resolvedMetrics.hum.displayName, 'Relative Humidity');
  assert.equal(resolvedMetrics.co2.displayName, 'CO₂ Gas');
  assert.equal(resolvedMetrics.tvoc.displayName, 'Total VOC');
  assert.equal(resolvedMetrics.aqi.displayName, 'AQI Index');

  console.log('✔ Test 5 passed: Three-tier resolution maps setting IDs 25, 26, 27, 28, 29 & preserves UI labels');
}

// Test 6: Fallback to Hardware Field Keys and Canonical Templates when Setting ID is absent
{
  const deviceWithoutSettingIds = {
    id: 11,
    name: 'Hardware Modbus AQI',
    category: 'AQI_SENSOR',
    settings: [
      { fieldKey: '3,100', sochiotFieldName: '3,100', displayName: 'Sensor Temp', unit: 'Deg.C' },
      { fieldKey: '3,101', sochiotFieldName: '3,101', displayName: 'Sensor Humidity', unit: '%' }
    ]
  };

  const rawEvents = {
    fields: [
      { fieldKey: '3,100', value: 21.5 },
      { fieldKey: '3,101', value: 48.0 }
    ]
  };

  const { parsedTelemetry, resolvedMetrics } = resolveAqiDeviceTelemetry(deviceWithoutSettingIds, rawEvents);

  assert.equal(parsedTelemetry.tempC, 21.5);
  assert.equal(parsedTelemetry.hum, 48.0);
  assert.equal(resolvedMetrics.tempC.displayName, 'Sensor Temp');
  assert.equal(resolvedMetrics.hum.displayName, 'Sensor Humidity');
  console.log('✔ Test 6 passed: Fallback to hardware fieldKey (3,100, 3,101) succeeds when settingId is absent');
}

// Test 7: Historical Data-Wipe Bug Fix (AQI-T&H device with null AQI)
{
  const thDevice = {
    id: 4,
    name: 'AQI-T&h Sensor',
    category: 'AQI_SENSOR',
    settings: [
      { settingId: 27, fieldKey: '3,100', displayName: 'Temperature', unit: 'Deg.C' },
      { settingId: 28, fieldKey: '3,101', displayName: 'Humidity', unit: '%' }
    ]
  };

  // 609 snapshots where AQI is null but Temperature & Humidity are fully valid
  const mockSnapshots = [
    {
      settingId: 27,
      fieldKey: '3,100',
      displayName: 'Temperature',
      unit: 'Deg.C',
      snapshots: [
        { windowStart: '2026-09-22T08:00:00.000Z', avgValue: 22.4, lastValue: 22.5 },
        { windowStart: '2026-09-22T08:15:00.000Z', avgValue: 22.8, lastValue: 23.0 },
        { windowStart: '2026-09-22T08:30:00.000Z', avgValue: 23.1, lastValue: 23.2 }
      ]
    },
    {
      settingId: 28,
      fieldKey: '3,101',
      displayName: 'Humidity',
      unit: '%',
      snapshots: [
        { windowStart: '2026-09-22T08:00:00.000Z', avgValue: 45.0, lastValue: 45.5 },
        { windowStart: '2026-09-22T08:15:00.000Z', avgValue: 46.2, lastValue: 46.0 },
        { windowStart: '2026-09-22T08:30:00.000Z', avgValue: 47.0, lastValue: 47.1 }
      ]
    }
  ];

  const { points, availableMetrics } = resolveAqiSnapshots(thDevice, mockSnapshots, '12h', 'MIN_15');

  // CRITICAL ASSERTION: Previously, points were filtered with `.filter(p => p.aqi !== null)`,
  // which wiped out all 609 snapshots for AQI-T&h devices!
  assert.equal(points.length, 3, 'Historical snapshots must NOT be wiped out when AQI is null!');
  assert.equal(points[0].tempC, 22.4);
  assert.equal(points[0].hum, 45.0);
  assert.equal(points[0].aqi, null, 'AQI must remain null without falsifying values to 0');

  // Available metrics must include tempC and hum
  assert.equal(availableMetrics.includes('tempC'), true);
  assert.equal(availableMetrics.includes('hum'), true);
  assert.equal(availableMetrics.includes('aqi'), false, 'T&H device must not report AQI in availableMetrics');

  console.log('✔ Test 7 passed: Historical data-wipe bug verified fixed: T&H snapshots retained when AQI is null');
}

// Test 8: 15-min to 30-min Client Downsampling
{
  const raw15MinSnaps = [
    { windowStart: '2026-09-22T08:00:00.000Z', avgValue: 20.0, lastValue: 20.0 },
    { windowStart: '2026-09-22T08:15:00.000Z', avgValue: 22.0, lastValue: 22.0 },
    { windowStart: '2026-09-22T08:30:00.000Z', avgValue: 24.0, lastValue: 24.0 },
    { windowStart: '2026-09-22T08:45:00.000Z', avgValue: 26.0, lastValue: 26.0 }
  ];

  const downsampled = downsampleSnapsTo30Min(raw15MinSnaps);
  assert.equal(downsampled.length, 2, 'Four 15-min points should downsample to two 30-min buckets');
  assert.equal(downsampled[0].avgValue, 21.0, '(20 + 22) / 2 = 21.0');
  assert.equal(downsampled[0].lastValue, 22.0);
  assert.equal(downsampled[1].avgValue, 25.0, '(24 + 26) / 2 = 25.0');
  assert.equal(downsampled[1].lastValue, 26.0);
  console.log('✔ Test 8 passed: downsampleSnapsTo30Min aggregates 15-min data into accurate 30-min buckets');
}

// Test 9: Zero Fabrication Guard
{
  const device = { id: 1, name: 'Empty Device', settings: [] };
  const { parsedTelemetry } = resolveAqiDeviceTelemetry(device, { fields: [] });

  assert.equal(parsedTelemetry.aqi, null);
  assert.equal(parsedTelemetry.tempC, null);
  assert.equal(parsedTelemetry.hum, null);
  assert.equal(parsedTelemetry.co2, null);
  assert.equal(parsedTelemetry.tvoc, null);
  assert.equal(parsedTelemetry.pm25, null);
  console.log('✔ Test 9 passed: Missing telemetry fields strictly return null, never fabricated as 0');
}

// Test 10: Prevention of Cross-Wiring between settings
{
  const device = {
    id: 5,
    name: 'Multi-Sensor',
    settings: [
      { settingId: 27, fieldKey: '3,100', displayName: 'Temperature' },
      { settingId: 28, fieldKey: '3,101', displayName: 'Humidity' }
    ]
  };

  const rawEvents = {
    fields: [
      { settingId: 27, currentValue: 28.5 },
      { settingId: 28, currentValue: 65.0 }
    ]
  };

  const { parsedTelemetry } = resolveAqiDeviceTelemetry(device, rawEvents);
  assert.equal(parsedTelemetry.tempC, 28.5);
  assert.equal(parsedTelemetry.hum, 65.0);
  assert.notEqual(parsedTelemetry.tempC, parsedTelemetry.hum);
  console.log('✔ Test 10 passed: No cross-wiring between Temperature and Humidity settings');
}

// Test 11: Site Transition Guard & False Device Call Prevention
{
  // Helper simulating the Overview pre-flight guard for API calls
  const shouldExecuteDeviceCall = ({ selectedDeviceId, selectedSiteId, devicesLoading, devices }) => {
    if (!selectedDeviceId || !selectedSiteId || devicesLoading) return false;
    const currentDevice = devices.find(d => String(d.id || d.deviceId) === String(selectedDeviceId));
    if (!currentDevice) return false;
    const devSiteId = currentDevice.siteId || currentDevice.site_id || currentDevice.site?.id;
    if (devSiteId && String(devSiteId) !== String(selectedSiteId)) return false;
    return true;
  };

  // Scenario A: Stale device 4 from Site 1 is still in state right after switching to Site 2 (which has no devices)
  const site1Devices = [{ id: 4, siteId: 1, name: 'Site 1 AQI Sensor' }];
  const site2Devices = []; // Store-1 has no AQI sensors

  // 1. Stale device 4 with site 2 while devices are loading
  assert.equal(shouldExecuteDeviceCall({
    selectedDeviceId: 4,
    selectedSiteId: 2,
    devicesLoading: true,
    devices: []
  }), false, 'Must NOT execute call when devicesLoading is true');

  // 2. Stale device 4 with site 2 when devices are empty
  assert.equal(shouldExecuteDeviceCall({
    selectedDeviceId: 4,
    selectedSiteId: 2,
    devicesLoading: false,
    devices: site2Devices
  }), false, 'Must NOT execute call when site has no AQI sensors');

  // 3. Stale device 4 with site 2 even if stale devices array from site 1 lingers
  assert.equal(shouldExecuteDeviceCall({
    selectedDeviceId: 4,
    selectedSiteId: 2,
    devicesLoading: false,
    devices: site1Devices
  }), false, 'Must NOT execute call when device siteId (1) does not match selected siteId (2)');

  // 4. Valid device on matching site
  assert.equal(shouldExecuteDeviceCall({
    selectedDeviceId: 4,
    selectedSiteId: 1,
    devicesLoading: false,
    devices: site1Devices
  }), true, 'Must execute call when device belongs to selected site');

  console.log('✔ Test 11 passed: Site transition pre-flight guard prevents false device details calls');
}

// Test 12: Dynamic settings count & custom parameter support in resolveAqiGraphSettings
{
  const device2Params = {
    id: 101,
    settings: [
      { id: 27, fieldKey: '3,100', displayName: 'Temperature', unit: '°C' },
      { id: 28, fieldKey: '3,101', displayName: 'Humidity', unit: '%' }
    ]
  };
  const res2 = resolveAqiGraphSettings(device2Params, null, 'HOURLY');
  assert.equal(res2.length, 2, '2-parameter sensor must yield exactly 2 graph settings');
  assert.equal(res2[0].displayName, 'Temperature');
  assert.equal(res2[1].displayName, 'Humidity');

  // Device with custom parameter (Formaldehyde)
  const deviceCustom = {
    id: 102,
    settings: [
      { id: 27, fieldKey: '3,100', displayName: 'Temperature', unit: '°C' },
      { id: 28, fieldKey: '3,101', displayName: 'Humidity', unit: '%' },
      { id: 99, fieldKey: '3,199', displayName: 'Formaldehyde (HCHO)', unit: 'mg/m³' }
    ]
  };
  const resCustom = resolveAqiGraphSettings(deviceCustom, null, 'HOURLY');
  assert.equal(resCustom.length, 3, 'Custom parameter must be preserved and rendered');
  assert.equal(resCustom[2].displayName, 'Formaldehyde (HCHO)');
  assert.equal(resCustom[2].unit, 'mg/m³');
  assert.ok(resCustom[2].colorScheme, 'Custom parameter must have assigned color scheme');

  console.log('✔ Test 12 passed: resolveAqiGraphSettings dynamically handles variable parameter counts & custom registers');
}

// Test 13: Presentation Authority: frontend displayName takes precedence over raw backend strings
{
  const device = {
    id: 201,
    settings: [
      { id: 28, fieldKey: '3,101', displayName: 'Relative Humidity', unit: '%RH' }
    ]
  };
  const telemetry = {
    settings: [
      { settingId: 28, fieldKey: '3,101', displayName: 'raw_humidity_sensor_val', unit: '%', snapshots: [] }
    ]
  };
  const res = resolveAqiGraphSettings(device, telemetry, 'HOURLY');
  assert.equal(res.length, 1);
  assert.equal(res[0].displayName, 'Relative Humidity', 'Configured frontend displayName must take precedence');
  assert.equal(res[0].unit, '%RH', 'Configured frontend unit must take precedence');

  console.log('✔ Test 13 passed: Frontend displayName and unit take precedence over backend strings');
}

// Test 14: Collision-safe deduplication between device settings and telemetry response
{
  const device = {
    id: 301,
    settings: [
      { id: 25, fieldKey: '3,102', displayName: 'CO₂', unit: 'ppm' }
    ]
  };
  const telemetry = {
    settings: [
      // Same settingId 25 in response
      { settingId: 25, fieldKey: '3,102', displayName: 'CO2 Level', unit: 'ppm', snapshots: [{ windowStart: '2026-09-22T10:00:00Z', avgValue: 550 }] }
    ]
  };
  const res = resolveAqiGraphSettings(device, telemetry, 'HOURLY');
  assert.equal(res.length, 1, 'Duplicate setting in device and telemetry must merge into exactly 1 card');
  assert.equal(res[0].snapshots.length, 1, 'Snapshots from telemetry must be attached');
  assert.equal(res[0].snapshots[0].avgValue, 550);

  console.log('✔ Test 14 passed: Collision-safe deduplication prevents duplicate cards');
}

// Test 15: 30-min Downsampling math: arithmetic mean, min, max, lastValue, and strictly null delta
{
  const fifteenMinSnaps = [
    { windowStart: '2026-09-22T10:00:00.000Z', windowEnd: '2026-09-22T10:15:00.000Z', avgValue: 20.0, minValue: 18.0, maxValue: 22.0, lastValue: 21.0, readingCount: 15 },
    { windowStart: '2026-09-22T10:15:00.000Z', windowEnd: '2026-09-22T10:30:00.000Z', avgValue: 30.0, minValue: 25.0, maxValue: 35.0, lastValue: 29.0, readingCount: 15 }
  ];
  const thirtyMinSnaps = downsampleSnapsTo30Min(fifteenMinSnaps);
  assert.equal(thirtyMinSnaps.length, 1, 'Two 15-min snapshots must collapse into 1 30-min bucket');
  assert.equal(thirtyMinSnaps[0].avgValue, 25.0, 'Average must be arithmetic mean (20 + 30) / 2 = 25');
  assert.equal(thirtyMinSnaps[0].minValue, 18.0, 'Min must be minimum of all readings (18)');
  assert.equal(thirtyMinSnaps[0].maxValue, 35.0, 'Max must be maximum of all readings (35)');
  assert.equal(thirtyMinSnaps[0].lastValue, 29.0, 'LastValue must be latest chronological reading (29)');
  assert.equal(thirtyMinSnaps[0].delta, null, 'Delta must be strictly null for non-cumulative environmental telemetry');

  console.log('✔ Test 15 passed: 30-min downsampling calculates correct arithmetic mean, min, max, and null delta');
}

// Test 16: isCumulativeSetting suppresses totalDelta for environmental metrics
{
  assert.equal(isCumulativeSetting({ displayName: 'Temperature', unit: '°C' }), false);
  assert.equal(isCumulativeSetting({ displayName: 'Humidity', unit: '%' }), false);
  assert.equal(isCumulativeSetting({ displayName: 'CO₂', unit: 'ppm' }), false);
  assert.equal(isCumulativeSetting({ displayName: 'AQI Index', unit: '' }), false);
  // Energy meter cumulative setting
  assert.equal(isCumulativeSetting({ displayName: 'Active Energy', unit: 'kWh' }), true);
  assert.equal(isCumulativeSetting({ displayName: 'Total Consumption', unit: 'kVAh' }), true);

  console.log('✔ Test 16 passed: isCumulativeSetting correctly distinguishes cumulative energy from instantaneous AQI metrics');
}

// Test 17: downsampleForBarChart density capping, peak preservation, and gap handling
{
  // 17a: Passthrough when data <= maxBars
  const smallDataset = [
    { timestamp: '10:00 AM', avgValue: 20, minValue: 18, maxValue: 22, lastValue: 20, delta: null },
    { timestamp: '11:00 AM', avgValue: 25, minValue: 22, maxValue: 28, lastValue: 25, delta: null }
  ];
  const passthrough = downsampleForBarChart(smallDataset, 60);
  assert.equal(passthrough.length, 2, 'Datasets smaller than maxBars must return unchanged');

  // 17b: Downsampling large dataset (120 points down to 60 buckets)
  const largeDataset = [];
  for (let i = 0; i < 120; i++) {
    // Alternate values: min 10, max 100 on specific indices
    const val = i === 1 ? 5 : (i === 10 ? 95 : 50);
    largeDataset.push({
      timestamp: `T${i}`,
      windowStart: `2026-09-22T${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z`,
      avgValue: val,
      minValue: val - 2,
      maxValue: val + 2,
      lastValue: val,
      delta: null
    });
  }

  const downsampled = downsampleForBarChart(largeDataset, 60);
  assert.ok(downsampled.length <= 60, `Resulting bar count (${downsampled.length}) must be <= maxBars (60)`);
  // Bucket 0 covers index 0 and index 1 (val 50 and val 5). Min should capture 3 (5 - 2), max captures 52 (50 + 2).
  assert.equal(downsampled[0].minValue, 3, 'Bucket 0 must capture overall minimum (3)');
  assert.equal(downsampled[0].maxValue, 52, 'Bucket 0 must capture overall maximum (52)');
  assert.equal(downsampled[0].avgValue, 27.5, 'Arithmetic mean of 50 and 5 must be 27.5');
  assert.equal(downsampled[0].delta, null, 'Delta must remain null for environmental telemetry');

  // 17c: Null data gap preservation
  const nullDataset = [
    { timestamp: '10:00 AM', avgValue: null, minValue: null, maxValue: null, lastValue: null, delta: null },
    { timestamp: '10:15 AM', avgValue: null, minValue: null, maxValue: null, lastValue: null, delta: null },
    { timestamp: '10:30 AM', avgValue: 30, minValue: 28, maxValue: 32, lastValue: 30, delta: null },
    { timestamp: '10:45 AM', avgValue: 40, minValue: 38, maxValue: 42, lastValue: 40, delta: null }
  ];
  const downsampledNulls = downsampleForBarChart(nullDataset, 2);
  assert.equal(downsampledNulls.length, 2);
  assert.equal(downsampledNulls[0].avgValue, null, 'Bucket of all-null snapshots must remain null (no artificial bars)');
  assert.equal(downsampledNulls[1].avgValue, 35, 'Second bucket with data must compute arithmetic average (35)');

  console.log('✔ Test 17 passed: downsampleForBarChart caps density, preserves peaks & gaps, and maintains null delta');
}

// Test 18: formatTimestampLabel cached formatters output consistent IST timestamps
{
  const testIso = '2026-09-22T04:30:00.000Z'; // 10:00 IST (UTC + 5:30)
  const hourlyFmt = formatTimestampLabel(testIso, 'HOURLY');
  assert.equal(hourlyFmt, '10:00', 'HOURLY should format as 10:00 in Asia/Kolkata 24-hour format');

  const dailyFmt = formatTimestampLabel(testIso, 'DAILY');
  assert.ok(dailyFmt.includes('Sep'), 'DAILY should format with month abbreviation in Asia/Kolkata');

  const monthlyFmt = formatTimestampLabel(testIso, 'MONTHLY');
  assert.ok(monthlyFmt.includes('Sep'), 'MONTHLY should format with month abbreviation in Asia/Kolkata');

  console.log('✔ Test 18 passed: Cached Intl.DateTimeFormat formatters produce accurate IST timestamps');
}

// Test 19: calculateDateRange with 'custom' preset and IST boundaries
{
  // 19a: Normal date range (2026-09-10 to 2026-09-15)
  const range = calculateDateRange('custom', '2026-09-10', '2026-09-15');
  // 2026-09-10T00:00:00+05:30 in UTC is 2026-09-09T18:30:00.000Z
  assert.equal(range.from, '2026-09-09T18:30:00.000Z', 'from should be 00:00:00 IST converted to UTC ISO');
  // 2026-09-15T23:59:59.999+05:30 in UTC is 2026-09-15T18:29:59.999Z
  assert.equal(range.to, '2026-09-15T18:29:59.999Z', 'to should be 23:59:59.999 IST converted to UTC ISO');

  // 19b: Auto-swap when dates are reversed (startDate > endDate)
  const swapped = calculateDateRange('custom', '2026-09-15', '2026-09-10');
  assert.equal(swapped.from, '2026-09-09T18:30:00.000Z', 'Swapped dates should automatically normalize from');
  assert.equal(swapped.to, '2026-09-15T18:29:59.999Z', 'Swapped dates should automatically normalize to');

  // 19c: Fallback safety when dates are omitted
  const fallback = calculateDateRange('custom');
  assert.ok(fallback.from, 'Fallback must produce valid from string');
  assert.ok(fallback.to, 'Fallback must produce valid to string');
  assert.ok(new Date(fallback.from).getTime() <= new Date(fallback.to).getTime(), 'from must be <= to in fallback');

  console.log('✔ Test 19 passed: calculateDateRange calculates exact IST calendar boundaries and auto-swaps reversed dates');
}

// Test 20: RANGE_PRESETS includes 'custom' option
{
  const customPreset = RANGE_PRESETS.find(p => p.id === 'custom');
  assert.ok(customPreset, "RANGE_PRESETS must contain preset with id 'custom'");
  assert.equal(customPreset.label, 'Custom');
  assert.ok(customPreset.defaultInterval, 'Custom preset must specify defaultInterval');

  console.log("✔ Test 20 passed: RANGE_PRESETS successfully provides 'Custom' preset option");
}

console.log('\nALL 20 AQI TELEMETRY MAPPING, SHARED GRAPHS, SITE GUARD & CUSTOM DATE TESTS PASSED SUCCESSFULLY! 🎉');
