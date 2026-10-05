import assert from 'assert';
import {
  getCanonicalUgPumpTemplate,
  formatWaterTelemetryValue,
  findEventField,
  resolveUgPumpDevice,
  mapBatchEventsToUgPumps,
  buildCompositeStationModel,
  UG_PUMP_FIELD_SYNONYMS
} from './ugPumpTelemetry.js';
import { isCategoryMatch, DEVICE_CATEGORIES, DEVICE_TEMPLATES } from '../../../constants/deviceTemplates.js';

console.log('--- Starting UG Pump Telemetry & Template Verification Tests ---');

// 1. Verify Category and Aliases
assert.strictEqual(DEVICE_CATEGORIES.includes('UG_TANK'), true, 'UG_TANK must exist in DEVICE_CATEGORIES');
assert.strictEqual(isCategoryMatch('UG_TANK', 'UG_TANK'), true, 'UG_TANK matches UG_TANK');
assert.strictEqual(isCategoryMatch('UG_PUMP', 'UG_TANK'), true, 'UG_PUMP alias matches UG_TANK');
assert.strictEqual(isCategoryMatch('UGTANK', 'UG_TANK'), true, 'UGTANK alias matches UG_TANK');
assert.strictEqual(isCategoryMatch('UNDERGROUND_TANK', 'UG_TANK'), true, 'UNDERGROUND_TANK alias matches UG_TANK');
assert.strictEqual(isCategoryMatch('PUMP', 'PUMP'), true, 'PUMP matches PUMP');
console.log('✓ Test 1: Category and aliases validation passed');

// 2. Canonical template inspection
const template = getCanonicalUgPumpTemplate();
assert.strictEqual(template.id, 'UG_TANK', 'Canonical template ID should be UG_TANK');
assert.strictEqual(Array.isArray(template.parameters), true, 'Canonical template parameters should be an array');
assert(template.parameters.some(p => p.name === 'START PRESSURE'), 'START PRESSURE should exist in template');
assert(template.parameters.some(p => p.name === 'STOP PRESSURE'), 'STOP PRESSURE should exist in template');
assert(template.parameters.some(p => p.name === 'OUTPUT CURRENT'), 'OUTPUT CURRENT should exist in template');
assert(template.parameters.some(p => p.name === 'WATER LEVEL'), 'WATER LEVEL should exist in template');
console.log('✓ Test 2: Canonical template parameters verified');

// 3. Telemetry formatting
assert.strictEqual(formatWaterTelemetryValue(null), '--', 'null formatting');
assert.strictEqual(formatWaterTelemetryValue(undefined), '--', 'undefined formatting');
assert.strictEqual(formatWaterTelemetryValue(NaN), '--', 'NaN formatting');
assert.strictEqual(formatWaterTelemetryValue('NaN'), '--', 'string NaN formatting');
assert.strictEqual(formatWaterTelemetryValue(''), '--', 'empty string formatting');
assert.strictEqual(formatWaterTelemetryValue(0.9, 1, 'BAR'), '0.9 BAR', 'number with unit formatting');
assert.strictEqual(formatWaterTelemetryValue(2450, 0, 'LPM'), '2,450 LPM', 'thousands formatting');
console.log('✓ Test 3: Value formatting passed');

// 4. Synonym Matching
const mockEvents = [
  { fieldName: 'outlet_pressure', currentValue: '1.2' },
  { fieldName: 'inlet_flow', currentValue: '1850' },
  { fieldName: 'station_mode', currentValue: 'LOCAL' },
  { fieldName: 'output_current', currentValue: '24.5' },
  { fieldName: 'voltage_ry', currentValue: '418.0' },
  { fieldName: 'power_factor', currentValue: '0.95' },
  { fieldName: 'water_level_pct', currentValue: '72' }
];

const pressureMatch = findEventField(null, mockEvents, UG_PUMP_FIELD_SYNONYMS.pressure);
assert(pressureMatch !== null, 'Pressure match should be found');
assert.strictEqual(pressureMatch.currentValue, '1.2');

const flowMatch = findEventField(null, mockEvents, UG_PUMP_FIELD_SYNONYMS.flow);
assert(flowMatch !== null, 'Flow match should be found');
assert.strictEqual(flowMatch.currentValue, '1850');

const modeMatch = findEventField(null, mockEvents, UG_PUMP_FIELD_SYNONYMS.mode);
assert(modeMatch !== null, 'Mode match should be found');
assert.strictEqual(modeMatch.currentValue, 'LOCAL');
console.log('✓ Test 4: Synonym field matching passed');

// 5. Offline Device Resolution
const mockOfflineDevice = {
  id: 101,
  name: 'UG Pump Station Basement',
  category: 'UG_TANK',
  status: 'OFFLINE'
};

const resolvedOffline = resolveUgPumpDevice(mockOfflineDevice, null, 1);
assert.strictEqual(resolvedOffline.id, 101);
assert.strictEqual(resolvedOffline.isOnline, false);
assert.strictEqual(resolvedOffline.connectionStatus, 'OFFLINE');
assert.strictEqual(resolvedOffline.masterPressure, 0.0);
assert.strictEqual(resolvedOffline.masterFlow, 0);
assert.strictEqual(resolvedOffline.stationName, 'UG PUMP STATION #01');
assert.strictEqual(resolvedOffline.pumps.length, 4, 'Should have 4 pumps');
assert.strictEqual(resolvedOffline.reservoirs.length, 3, 'Should have 3 reservoirs');
console.log('✓ Test 5: Offline device resolution passed');

// 6. Online Device Resolution with Live Telemetry
const mockOnlineDevice = {
  id: 202,
  name: 'UG Pump Station Crystal',
  category: 'UG_TANK',
  status: 'ACTIVE',
  settings: [
    { id: 1, displayName: 'Outlet Pressure', sochiotFieldName: 'outlet_pressure', unit: 'BAR' },
    { id: 2, displayName: 'Inlet Flow', sochiotFieldName: 'inlet_flow', unit: 'LPM' }
  ]
};

const mockEventResult = {
  deviceId: 202,
  isOnline: true,
  lastEventTime: Date.now(),
  fields: mockEvents
};

const resolvedOnline = resolveUgPumpDevice(mockOnlineDevice, mockEventResult, 1);
assert.strictEqual(resolvedOnline.isOnline, true);
assert.strictEqual(resolvedOnline.connectionStatus, 'ONLINE');
assert.strictEqual(resolvedOnline.masterPressure, 1.2);
assert.strictEqual(resolvedOnline.masterFlow, 1850);
assert.strictEqual(resolvedOnline.stationMode, 'LOCAL');
assert.strictEqual(resolvedOnline.reservoirs[0].level, 72);
assert.strictEqual(resolvedOnline.electrical.voltage_ry, '418.0');
assert.strictEqual(resolvedOnline.electrical.power_factor, '0.95');
console.log('✓ Test 6: Online device resolution passed');

// 7. Batch Events Mapping
const batchDevices = [mockOfflineDevice, mockOnlineDevice];
const batchResults = [mockEventResult];

const mappedBatch = mapBatchEventsToUgPumps(batchDevices, batchResults, 1);
assert.strictEqual(mappedBatch.length, 2);
assert.strictEqual(mappedBatch[0].isOnline, false);
assert.strictEqual(mappedBatch[1].isOnline, true);
assert.strictEqual(mappedBatch[1].masterPressure, 1.2);
console.log('✓ Test 7: Batch events mapping passed');

// 8. User Payload Verification (CUID ID matching + Distributed Multi-Pump Station)
const userPayloadBatch = [
  {
    deviceId: 33,
    bmsDeviceId: "cmugrl4f200at01mi0qci4d1t",
    name: "Ground-Ug-Tank-1",
    category: "UG_TANK",
    lastEventTime: 1790335285000,
    lastEventTimeFormatted: "25 Sep 2026 04:51 pm",
    fields: [
      { id: 406, displayName: "OUTPUT CURRENT", currentValue: 0, unit: "A" },
      { id: 407, displayName: "OUTPUT VOLTAGE", currentValue: 0, unit: "V" },
      { id: 408, displayName: "OUTPUT POWER", currentValue: 0, unit: "KW" },
      { id: 409, displayName: "RUNNING ROTATION SPEED", currentValue: 0, unit: "RPM" },
      { id: 410, displayName: "OUTPUT TORQUE", currentValue: 0 },
      { id: 411, displayName: "BUS VOLTAGE", currentValue: 581, unit: "V" },
      { id: 412, displayName: "CURRENT FREQUENCY", currentValue: 0, unit: "Hz" }
    ]
  },
  {
    deviceId: 32,
    bmsDeviceId: "cmugqt4demvpp01o9fqr3lo4i",
    name: "Ug-Tank-Ground",
    category: "UG_TANK",
    lastEventTime: 1790335307000,
    lastEventTimeFormatted: "25 Sep 2026 04:51 pm",
    fields: [
      { id: 398, displayName: "OUTPUT CURRENT", currentValue: 0, unit: "A" },
      { id: 403, displayName: "BUS VOLTAGE", currentValue: 581, unit: "V" },
      { id: 405, displayName: "STOP PRESSURE", currentValue: 11.052167892456055 }
    ]
  },
  {
    deviceId: 34,
    bmsDeviceId: "cmugru8w30fa801mifuc4zhfn",
    name: "Ground-2-UG",
    category: "UG_TANK",
    lastEventTime: 1790335277000,
    lastEventTimeFormatted: "25 Sep 2026 04:51 pm",
    fields: [
      { id: 413, displayName: "OUTPUT CURRENT", currentValue: 0, unit: "A" },
      { id: 417, displayName: "OUTPUT TORQUE", currentValue: 583, unit: "V" }
    ]
  },
  {
    deviceId: 35,
    bmsDeviceId: "cmugrz2890fa901mis6jv18om",
    name: "Ground-3-UG",
    category: "UG_TANK",
    lastEventTime: 1790335293000,
    lastEventTimeFormatted: "25 Sep 2026 04:51 pm",
    fields: [
      { id: 419, displayName: "OUTPUT CURRENT", currentValue: 16.700000762939453, unit: "A" },
      { id: 420, displayName: "OUTPUT VOLTAGE", currentValue: 409, unit: "V" },
      { id: 421, displayName: "OUTPUT POWER", currentValue: 9, unit: "KW" },
      { id: 422, displayName: "RUNNING ROTATION SPEED", currentValue: 1500, unit: "RPM" },
      { id: 423, displayName: "OUTPUT TORQUE", currentValue: 8.97999954223633 },
      { id: 424, displayName: "CURRENT FREQUENCY", currentValue: 50, unit: "Hz" }
    ]
  }
];

// In frontend, GET /devices returns items with id = cuid (bmsDeviceId)
const frontendDevices = [
  { id: "cmugrl4f200at01mi0qci4d1t", bmsDeviceId: "cmugrl4f200at01mi0qci4d1t", name: "Ground-Ug-Tank-1", category: "UG_TANK" },
  { id: "cmugqt4demvpp01o9fqr3lo4i", bmsDeviceId: "cmugqt4demvpp01o9fqr3lo4i", name: "Ug-Tank-Ground", category: "UG_TANK" },
  { id: "cmugru8w30fa801mifuc4zhfn", bmsDeviceId: "cmugru8w30fa801mifuc4zhfn", name: "Ground-2-UG", category: "UG_TANK" },
  { id: "cmugrz2890fa901mis6jv18om", bmsDeviceId: "cmugrz2890fa901mis6jv18om", name: "Ground-3-UG", category: "UG_TANK" }
];

const mappedUserBatch = mapBatchEventsToUgPumps(frontendDevices, userPayloadBatch, 1);
assert.strictEqual(mappedUserBatch.length, 4, 'Should map all 4 devices');
assert.strictEqual(mappedUserBatch.every(d => d.isOnline), true, 'All 4 devices must be online');

// Verify individual device resolution: Ground-3-UG
const dev3 = mappedUserBatch.find(d => d.name === "Ground-3-UG");
assert(dev3, 'Ground-3-UG must exist');
assert.strictEqual(dev3.isOnline, true);
assert.strictEqual(dev3.electrical.voltage_ry, '409.0');
assert.strictEqual(dev3.electrical.current_phase_r, '16.7');
assert.strictEqual(dev3.electrical.total_kw, '9.0');
assert.strictEqual(dev3.electrical.frequency, '50.00 Hz');

// Verify composite station twin
const compositeStation = buildCompositeStationModel(mappedUserBatch, 1);
assert.strictEqual(compositeStation.isOnline, true, 'Composite station must be ONLINE');
assert.strictEqual(compositeStation.connectionStatus, 'ONLINE');
assert.strictEqual(compositeStation.masterPressure, 11.1, 'Master pressure should be 11.1 BAR (from Ug-Tank-Ground)');
assert.strictEqual(compositeStation.masterFlow, 2450, 'Master flow should be active 2450 LPM');
assert.strictEqual(compositeStation.pumps.some(p => p.status === 'Running'), true, 'At least one pump must be Running');

// Verify Pump 3 is running with 16.7 A
const runningPump = compositeStation.pumps.find(p => p.status === 'Running');
assert(runningPump, 'Running pump must be present');
assert.strictEqual(runningPump.amp, '16.7');
assert.strictEqual(runningPump.hz, '50.0');

// Verify composite electrical panel
assert.strictEqual(compositeStation.electrical.voltage_ry, '409.0');
assert.strictEqual(compositeStation.electrical.current_phase_r, '16.7');
assert.strictEqual(compositeStation.electrical.total_kw, '9.0');
assert.strictEqual(compositeStation.electrical.frequency, '50.00 Hz');
assert.strictEqual(compositeStation.electrical.updated_at, '25 Sep 2026 04:51 pm');

console.log('✓ Test 8: CUID matching & User Batch Payload verification passed');

console.log('\n========================================');
console.log('ALL UG PUMP TELEMETRY & ADAPTER TESTS PASSED!');
console.log('========================================\n');
