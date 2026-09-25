import assert from 'assert';
import {
  getCanonicalAgTankTemplate,
  normalizeKey,
  parseNumericValue,
  formatWaterTelemetryValue,
  getWaterThresholdStatus,
  findEventField,
  resolveAgTankDevice,
  mapBatchEventsToAgTanks
} from './waterTelemetry.js';
import { isCategoryMatch, DEVICE_CATEGORIES, DEVICE_TEMPLATES } from '../../../constants/deviceTemplates.js';

console.log('--- Starting AG Tank Telemetry & Template Verification Tests ---');

// Test 1: Category existence and validation
assert.strictEqual(DEVICE_CATEGORIES.includes('AG_TANK'), true, 'AG_TANK must exist in DEVICE_CATEGORIES');
assert.strictEqual(isCategoryMatch('AG_TANK', 'AG_TANK'), true, 'AG_TANK should match AG_TANK');
assert.strictEqual(isCategoryMatch('ABOVE_GROUND_TANK', 'AG_TANK'), true, 'ABOVE_GROUND_TANK alias should match AG_TANK');
assert.strictEqual(isCategoryMatch('above-ground-tank', 'AG_TANK'), true, 'Kebab-case category should match');
assert.strictEqual(isCategoryMatch('UG_TANK', 'AG_TANK'), false, 'UG_TANK should not match AG_TANK');
console.log('✓ Test 1: Category validation passed');

// Test 2: Canonical Template Parameters
const agTemplate = getCanonicalAgTankTemplate();
assert.strictEqual(agTemplate.id, 'AG_TANK');
assert.strictEqual(Array.isArray(agTemplate.parameters), true);
const paramNames = agTemplate.parameters.map(p => p.name);
assert.strictEqual(paramNames.includes('WATER LEVEL'), true);
assert.strictEqual(paramNames.includes('WATER LEVEL %'), true);
assert.strictEqual(paramNames.includes('TANK CAPACITY'), true);
assert.strictEqual(paramNames.includes('OPEN VALVE'), true);
assert.strictEqual(paramNames.includes('CLOSE VALVE'), true);
console.log('✓ Test 2: Canonical template parameters verified');

// Test 3: Value Formatting (No undefined, null, NaN)
assert.strictEqual(formatWaterTelemetryValue(null), '--');
assert.strictEqual(formatWaterTelemetryValue(undefined), '--');
assert.strictEqual(formatWaterTelemetryValue(''), '--');
assert.strictEqual(formatWaterTelemetryValue(NaN), '--');
assert.strictEqual(formatWaterTelemetryValue(75.4), '75.4');
assert.strictEqual(formatWaterTelemetryValue(75.456, 2, 'LPM'), '75.46 LPM');
assert.strictEqual(formatWaterTelemetryValue(0, 0, '%'), '0 %');
console.log('✓ Test 3: Value formatting passed');

// Test 4: Threshold evaluation
const mockSetting = { minLevel: 25, maxLevel: 85, criticalLow: 15, criticalHigh: 95, warningLow: 30, warningHigh: 80 };
assert.strictEqual(getWaterThresholdStatus(50, mockSetting), 'normal');
assert.strictEqual(getWaterThresholdStatus(96, mockSetting), 'alert');
assert.strictEqual(getWaterThresholdStatus(10, mockSetting), 'alert');
assert.strictEqual(getWaterThresholdStatus(82, mockSetting), 'warning');
assert.strictEqual(getWaterThresholdStatus(28, mockSetting), 'warning');
assert.strictEqual(getWaterThresholdStatus(null, mockSetting), 'default');
console.log('✓ Test 4: Threshold evaluation passed');

// Test 5: Field finding with synonyms
const mockEvents = [
  { fieldName: '4,10F', displayName: 'Water Level %', currentValue: 68.5, unit: '%' },
  { fieldName: '4,12F', displayName: 'Inlet Flow Rate', currentValue: 120.0, unit: 'LPM' },
  { fieldName: '4,14F', displayName: 'Valve Status', currentValue: 1 },
  { fieldName: '4,16F', displayName: 'Tank Capacity', currentValue: 25000, unit: 'L' }
];

const foundLevel = findEventField({ name: 'WATER LEVEL %' }, mockEvents, ['water level %', 'tank level %']);
assert.notStrictEqual(foundLevel, null);
assert.strictEqual(foundLevel.currentValue, 68.5);

const foundFlow = findEventField({ name: 'INLET FLOW' }, mockEvents, ['inlet flow', 'inlet flow rate']);
assert.notStrictEqual(foundFlow, null);
assert.strictEqual(foundFlow.currentValue, 120.0);
console.log('✓ Test 5: Field finding with synonyms passed');

// Test 6: resolveAgTankDevice with and without events
const mockDevice = {
  id: 101,
  bmsDeviceId: 'DEV-AG-101',
  name: 'Tower A Domestic Tank',
  category: 'AG_TANK',
  buildingName: 'Tower A',
  settings: [
    { id: 1, displayName: 'Water Level %', sochiotFieldName: '4,10F', unit: '%' },
    { id: 2, displayName: 'Inlet Flow', sochiotFieldName: '4,12F', unit: 'LPM' },
    { id: 3, displayName: 'Valve Status', sochiotFieldName: '4,14F' }
  ]
};

// 6a: Device with null events (offline/no telemetry)
const unmapped = resolveAgTankDevice(mockDevice, null);
assert.strictEqual(unmapped.id, 101);
assert.strictEqual(unmapped.name, 'Tower A Domestic Tank');
assert.strictEqual(unmapped.level, null);
assert.strictEqual(unmapped.valveStatus, 'CLOSE');
assert.strictEqual(unmapped.status, 'Offline');
assert.strictEqual(unmapped.rawFields.length, 3);
assert.strictEqual(unmapped.rawFields[0].value, null);

// 6b: Device with live event payload
const eventData = {
  deviceId: 101,
  bmsDeviceId: 'DEV-AG-101',
  lastEventTime: Date.now(),
  fields: mockEvents
};

const resolved = resolveAgTankDevice(mockDevice, eventData);
assert.strictEqual(resolved.id, 101);
assert.strictEqual(resolved.level, 69); // Math.round(68.5)
assert.strictEqual(resolved.inletFlow, 120.0);
assert.strictEqual(resolved.capacity, 25000);
assert.strictEqual(resolved.valveStatus, 'OPEN');
assert.strictEqual(resolved.isOnline, true);
assert.strictEqual(resolved.status, 'Running');
assert.strictEqual(resolved.sectorType, 'DOMESTIC');
console.log('✓ Test 6: resolveAgTankDevice passed (offline and live cases)');

// Test 7: Batch events mapping for multiple devices
const dev1 = { id: 1, bmsDeviceId: 'AG-01', name: 'Tower A Domestic Tank', category: 'AG_TANK' };
const dev2 = { id: 2, bmsDeviceId: 'AG-02', name: 'Tower A Flushing Tank', category: 'AG_TANK' };
const dev3 = { id: 3, bmsDeviceId: 'AG-03', name: 'Rooftop Utility Tank', category: 'AG_TANK' };

const batchResults = [
  {
    bmsDeviceId: 'AG-01',
    deviceId: 1,
    lastEventTime: Date.now(),
    fields: [{ displayName: 'Water Level %', currentValue: 82 }]
  },
  {
    bmsDeviceId: 'AG-02',
    deviceId: 2,
    lastEventTime: Date.now(),
    fields: [{ displayName: 'Water Level %', currentValue: 18 }] // Below 20 -> Warning
  }
  // AG-03 has no events
];

const mappedList = mapBatchEventsToAgTanks([dev1, dev2, dev3], batchResults);
assert.strictEqual(mappedList.length, 3);

// dev1 check
assert.strictEqual(mappedList[0].id, 1);
assert.strictEqual(mappedList[0].level, 82);
assert.strictEqual(mappedList[0].isOnline, true);

// dev2 check (flushing & warning level)
assert.strictEqual(mappedList[1].id, 2);
assert.strictEqual(mappedList[1].level, 18);
assert.strictEqual(mappedList[1].sectorType, 'FLUSHING');
assert.strictEqual(mappedList[1].status, 'Warning');

// dev3 check (no telemetry)
assert.strictEqual(mappedList[2].id, 3);
assert.strictEqual(mappedList[2].level, null);
assert.strictEqual(mappedList[2].isOnline, false);
assert.strictEqual(mappedList[2].status, 'Offline');
console.log('✓ Test 7: mapBatchEventsToAgTanks passed with partial and missing events');

console.log('\n========================================');
console.log('ALL AG TANK TELEMETRY & ADAPTER TESTS PASSED!');
console.log('========================================');
