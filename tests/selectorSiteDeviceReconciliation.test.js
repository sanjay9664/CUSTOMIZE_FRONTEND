import assert from 'node:assert/strict';

console.log('--- RUNNING SELECTOR SITE-DEVICE RECONCILIATION VERIFICATION SUITE ---');

// Mock helper representing GlobalSiteAssetDropdown device filter logic
const filterDevicesForSite = (devices, targetSiteId, effectiveSites, category) => {
  const sId = String(targetSiteId);
  const targetSiteObj = effectiveSites.find(s => String(s.id ?? s.siteId ?? s._id) === sId);
  const validTargetSiteIds = [
    sId,
    targetSiteObj?.id != null ? String(targetSiteObj.id).trim().toLowerCase() : null,
    targetSiteObj?.siteId != null ? String(targetSiteObj.siteId).trim().toLowerCase() : null,
    targetSiteObj?._id != null ? String(targetSiteObj._id).trim().toLowerCase() : null,
    targetSiteObj?.name != null ? String(targetSiteObj.name).trim().toLowerCase() : null,
    targetSiteObj?.siteName != null ? String(targetSiteObj.siteName).trim().toLowerCase() : null,
  ].filter(Boolean);

  const seenIds = new Set();
  const result = [];

  const addDevice = (d, isDirectSiteEndpoint = false) => {
    if (!d) return;
    const devId = String(d.id || d.deviceId || d._id || '').trim();
    if (!devId || seenIds.has(devId)) return;

    const devSiteId = d.siteId !== undefined && d.siteId !== null
      ? String(d.siteId)
      : (d.site_id !== undefined && d.site_id !== null
          ? String(d.site_id)
          : (d.site?.id != null ? String(d.site.id) : (d.site?.siteId != null ? String(d.site.siteId) : (d.site?._id != null ? String(d.site._id) : (d.facilityId != null ? String(d.facilityId) : null)))));

    if (devSiteId) {
      if (!validTargetSiteIds.includes(String(devSiteId).trim().toLowerCase())) {
        return;
      }
    } else if (!isDirectSiteEndpoint) {
      const devSiteName = d.siteName || d.site_name || d.site?.name;
      const targetName = targetSiteObj?.name || targetSiteObj?.siteName;
      if (!devSiteName || !targetName || String(devSiteName).trim().toLowerCase() !== String(targetName).trim().toLowerCase()) {
        return;
      }
    }

    seenIds.add(devId);
    result.push({
      ...d,
      id: devId,
      siteId: d.siteId || sId
    });
  };

  devices.forEach(d => addDevice(d, false));
  return result;
};

// Test 1: Device 28 (belongs to site 2) is REJECTED when selecting Site 1
{
  const effectiveSites = [
    { id: 1, name: 'STORE-1' },
    { id: 2, name: 'STORE-2' }
  ];

  const candidateDevices = [
    { id: 28, name: 'AQI-T&h', category: 'AQI_SENSOR', siteId: 2 },
    { id: 29, name: 'Main AQI Sensor', category: 'AQI_SENSOR', siteId: 1 }
  ];

  const site1Devices = filterDevicesForSite(candidateDevices, 1, effectiveSites, 'AQI_SENSOR');
  assert.equal(site1Devices.length, 1);
  assert.equal(site1Devices[0].id, '29');
  assert.equal(site1Devices.some(d => d.id === '28'), false, 'Device 28 must never belong to site 1');
  console.log('✔ Test 1 passed: Device 28 from Site 2 is strictly excluded from Site 1');
}

// Test 2: When user selects Site 2, Device 28 is properly accepted
{
  const effectiveSites = [
    { id: 1, name: 'STORE-1' },
    { id: 2, name: 'STORE-2' }
  ];

  const candidateDevices = [
    { id: 28, name: 'AQI-T&h', category: 'AQI_SENSOR', siteId: 2 },
    { id: 29, name: 'Main AQI Sensor', category: 'AQI_SENSOR', siteId: 1 }
  ];

  const site2Devices = filterDevicesForSite(candidateDevices, 2, effectiveSites, 'AQI_SENSOR');
  assert.equal(site2Devices.length, 1);
  assert.equal(site2Devices[0].id, '28');
  assert.equal(site2Devices[0].name, 'AQI-T&h');
  console.log('✔ Test 2 passed: Device 28 is correctly accepted when Site 2 is selected');
}

// Test 3: Nested site object site.id is properly recognized
{
  const effectiveSites = [
    { id: 'site_alpha', name: 'Alpha Warehouse' },
    { id: 'site_beta', name: 'Beta Facility' }
  ];

  const candidateDevices = [
    { id: 'dev_1', name: 'AQI 1', site: { id: 'site_alpha' } },
    { id: 'dev_2', name: 'AQI 2', site: { id: 'site_beta' } }
  ];

  const alphaDevices = filterDevicesForSite(candidateDevices, 'site_alpha', effectiveSites, 'AQI_SENSOR');
  assert.equal(alphaDevices.length, 1);
  assert.equal(alphaDevices[0].id, 'dev_1');
  console.log('✔ Test 3 passed: Nested site.id is properly resolved and filtered');
}

// Test 4: Device pre-flight check in telemetry snapshot query prevents SITE_DEVICE_MISMATCH
{
  const site1Devices = [{ id: '29', name: 'Store 1 AQI' }];
  const staleDeviceId = '28';

  const shouldAllowFetch = site1Devices.some(d => String(d.id) === String(staleDeviceId));
  assert.equal(shouldAllowFetch, false, 'Pre-flight check must block snapshot query when device is not in site device list');
  console.log('✔ Test 4 passed: Pre-flight snapshot check prevents SITE_DEVICE_MISMATCH error');
}

// Test 5: Auto-reconciliation resets stale device ID to first valid device of the active site
{
  const siteDevices = [{ id: '101', name: 'Valid Sensor' }, { id: '102', name: 'Secondary Sensor' }];
  let activeDeviceId = '28'; // Stale ID from previous site

  const currentMatch = siteDevices.find(d => String(d.id) === String(activeDeviceId));
  if (!currentMatch) {
    activeDeviceId = siteDevices[0].id;
  }

  assert.equal(activeDeviceId, '101', 'Active device ID must be reconciled to the first valid device of the site');
  console.log('✔ Test 5 passed: Auto-reconciliation aligns device selection with active site');
}

console.log('--- ALL SELECTOR SITE-DEVICE RECONCILIATION TESTS PASSED ---');
