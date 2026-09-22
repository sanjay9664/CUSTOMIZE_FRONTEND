import assert from 'node:assert/strict';
import {
  resolveDeviceTelemetry,
  mapSettingToTelemetry,
  formatTelemetryValue,
  getThresholdStatusFromSetting,
  normalizeKey
} from '../src/pages/EnergyMetering/utils/energyTelemetryAdapter.js';
import {
  PARAMETER_SYNONYMS,
  getValueForField,
  mapLatestEventsToTelemetry
} from '../src/pages/EnergyMetering/utils/energyTelemetry.js';

console.log('--- RUNNING ENERGY TELEMETRY MAPPING VERIFICATION SUITE ---');

// Test 1: normalizeKey properly strips punctuation, spaces, and case
{
  assert.equal(normalizeKey('Total Active Power (kW)'), 'totalactivepowerkw');
  assert.equal(normalizeKey('Voltage - R Phase'), 'voltagerphase');
  assert.equal(normalizeKey('3, 100'), '3,100');
  console.log('✔ Test 1 passed: normalizeKey sanitizes strings accurately');
}

// Test 2: Threshold status evaluation
{
  const setting = {
    warningHigh: 240,
    criticalHigh: 260,
    warningLow: 200,
    criticalLow: 180
  };

  assert.equal(getThresholdStatusFromSetting(220, setting), 'normal');
  assert.equal(getThresholdStatusFromSetting(245, setting), 'warning');
  assert.equal(getThresholdStatusFromSetting(265, setting), 'alert');
  assert.equal(getThresholdStatusFromSetting(195, setting), 'warning');
  assert.equal(getThresholdStatusFromSetting(170, setting), 'alert');
  assert.equal(getThresholdStatusFromSetting(null, setting), 'default');
  console.log('✔ Test 2 passed: Threshold status correctly returns normal, warning, alert, and default');
}

// Test 3: 3-Tier Precedence in mapSettingToTelemetry
{
  const events = [
    { settingId: 101, fieldKey: '3,100', currentValue: 230.5, displayName: 'Backend Wrong Name' },
    { settingId: 102, fieldKey: '3,101', currentValue: 231.2, displayName: 'Y-Voltage' },
    { settingId: 999, fieldKey: '3,999', currentValue: 415.0, displayName: 'Total Active Power' }
  ];

  // Setting matched by settingId: preserves frontend displayName
  const setting1 = { id: 101, displayName: 'Voltage - R', sochiotFieldName: 'different_key' };
  const res1 = mapSettingToTelemetry(setting1, events);
  assert.notEqual(res1, null);
  assert.equal(res1.value, 230.5);
  assert.equal(res1.displayName, 'Voltage - R', 'Frontend displayName must be preserved over backend name');

  // Setting matched by fieldKey when ID is missing
  const setting2 = { displayName: 'Voltage - Y', sochiotFieldName: '3,101' };
  const res2 = mapSettingToTelemetry(setting2, events);
  assert.notEqual(res2, null);
  assert.equal(res2.value, 231.2);
  assert.equal(res2.displayName, 'Voltage - Y');

  // Setting matched by canonical displayName fallback
  const setting3 = { displayName: 'Total Active Power', sochiotFieldName: 'unmatched_key' };
  const res3 = mapSettingToTelemetry(setting3, events);
  assert.notEqual(res3, null);
  assert.equal(res3.value, 415.0);

  // Missing setting never fabricates values
  const settingMissing = { id: 888, displayName: 'Non-Existent', sochiotFieldName: 'unknown' };
  const resMissing = mapSettingToTelemetry(settingMissing, events);
  assert.equal(resMissing, null, 'Unmatched setting must return null, never fabricate values');

  console.log('✔ Test 3 passed: 3-tier precedence prioritizes ID -> fieldKey -> displayName & preserves UI labels');
}

// Test 4: Conflicting register resolution (3,151 and 3,168)
{
  // PARAMETER_SYNONYMS must not cross-map 3,151 to both totalKw and ebKwh
  assert.equal(PARAMETER_SYNONYMS.totalKw.includes('3,151'), false, '3,151 must not be in totalKw');
  assert.equal(PARAMETER_SYNONYMS.ebKwh.includes('3,151'), true, '3,151 belongs to ebKwh');

  // PARAMETER_SYNONYMS must not cross-map 3,168 to balance, vR, iB, etc.
  assert.equal(PARAMETER_SYNONYMS.balance.includes('3,168'), false, '3,168 must not be in balance');
  assert.equal(PARAMETER_SYNONYMS.vR.includes('3,168'), false, '3,168 must not be in vR');
  assert.equal(PARAMETER_SYNONYMS.iB.includes('3,168'), false, '3,168 must not be in iB');

  console.log('✔ Test 4 passed: Conflicting registers 3,151 and 3,168 are decoupled and no cross-wiring occurs');
}

// Test 5: Full resolveDeviceTelemetry with template fallback & zero fabrication
{
  const device = {
    id: 1,
    name: 'Main Meter HT',
    category: 'MAIN_ENERGY_METER',
    settings: [
      { id: 10, displayName: 'Voltage - R', sochiotFieldName: '3,100', unit: 'V' },
      { id: 11, displayName: 'Voltage - Y', sochiotFieldName: '3,101', unit: 'V' },
      { id: 12, displayName: 'EB Tariff', sochiotFieldName: 'eb_tariff', unit: 'Rs' }
    ]
  };

  const rawEvents = {
    data: {
      lastEventTime: 1726980000000,
      fields: [
        { settingId: 10, currentValue: 232.4, time: 1726980000000 },
        { settingId: 11, currentValue: 233.1, time: 1726980000000 }
        // Note: settingId 12 (EB Tariff) is intentionally omitted from backend
      ]
    }
  };

  const resolved = resolveDeviceTelemetry(device, rawEvents, 'MAIN_ENERGY_METER');
  assert.equal(resolved.resolvedSettings.length >= 3, true);

  const vR = resolved.settingsTelemetryMap.get('id:10');
  assert.equal(vR.value, 232.4);
  assert.equal(vR.displayName, 'Voltage - R');

  const tariff = resolved.settingsTelemetryMap.get('id:12');
  assert.equal(tariff.value, null, 'Omitted telemetry must have value: null without fake fallbacks');

  console.log('✔ Test 5 passed: Full resolveDeviceTelemetry maps accurately without fabricating data');
}

// Test 6: Legacy mapLatestEventsToTelemetry compatibility
{
  const legacyResult = mapLatestEventsToTelemetry({
    fields: [
      { fieldKey: '3,151', currentValue: 12345.6 }, // ebKwh
      { fieldKey: '3,153', currentValue: 50.0 }     // freq
    ]
  });

  assert.equal(legacyResult.updates.ebKwh, 12345.6);
  assert.equal(legacyResult.updates.freq, 50.0);
  assert.equal(legacyResult.updates.totalKw, undefined, 'totalKw must not steal 3,151');
  assert.equal(legacyResult.updates.balance, undefined, 'balance must not steal 3,168');

  console.log('✔ Test 6 passed: Legacy mapLatestEventsToTelemetry backwards compatibility verified');
}

console.log('\nALL 6 VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀');
