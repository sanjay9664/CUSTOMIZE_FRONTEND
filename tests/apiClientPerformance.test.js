import test from 'node:test';
import assert from 'node:assert/strict';
import { apiClient, invalidateCache } from '../src/services/apiClient.js';

test('--- RUNNING API CLIENT PERFORMANCE & DEDUPLICATION TEST SUITE ---', async (t) => {

  // Mock global.fetch to track real network calls
  let fetchCallCount = 0;
  const originalFetch = global.fetch;

  t.beforeEach(() => {
    fetchCallCount = 0;
    invalidateCache(); // Clear any previous cache
    global.fetch = async (url, config = {}) => {
      if (config.signal?.aborted) {
        const err = new Error('The user aborted a request.');
        err.name = 'AbortError';
        throw err;
      }
      fetchCallCount++;
      // Simulate 50ms network delay with abort listener
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 50);
        if (config.signal) {
          config.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            const err = new Error('The user aborted a request.');
            err.name = 'AbortError';
            reject(err);
          });
        }
      });
      return {
        ok: true,
        status: 200,
        headers: {
          get: (header) => (header.toLowerCase() === 'content-type' ? 'application/json' : null)
        },
        json: async () => ({
          success: true,
          url,
          callIndex: fetchCallCount,
          timestamp: Date.now()
        })
      };
    };
  });

  t.after(() => {
    global.fetch = originalFetch;
    invalidateCache();
  });

  await t.test('Test 1: Parallel in-flight GET requests to the same endpoint are deduplicated to a single fetch', async () => {
    fetchCallCount = 0;
    const url = '/api/v1/sites/1/devices/4/telemetry/snapshots';
    const params = { interval: 'HOURLY', settingId: 27 };

    // Fire 4 parallel requests at the exact same instant
    const [res1, res2, res3, res4] = await Promise.all([
      apiClient.get(url, params),
      apiClient.get(url, params),
      apiClient.get(url, params),
      apiClient.get(url, params)
    ]);

    assert.equal(fetchCallCount, 1, 'Only 1 network fetch should be executed for 4 concurrent identical requests');
    assert.equal(res1.callIndex, 1);
    assert.equal(res2.callIndex, 1);
    assert.equal(res3.callIndex, 1);
    assert.equal(res4.callIndex, 1);
    console.log('✔ Test 1 passed: 4 parallel requests deduplicated into 1 network socket call');
  });

  await t.test('Test 2: Sequential GET calls within TTL window hit in-memory cache with 0 network calls', async () => {
    fetchCallCount = 0;
    const url = '/api/v1/sites/1/devices';
    const params = { category: 'AQI_SENSOR' };

    // First call fires network fetch
    const res1 = await apiClient.get(url, params);
    assert.equal(fetchCallCount, 1, 'Initial call triggers network fetch');

    // Second call immediately hits memory cache
    const res2 = await apiClient.get(url, params);
    assert.equal(fetchCallCount, 1, 'Second call within TTL must hit cache without network fetch');
    assert.equal(res1.callIndex, res2.callIndex);
    console.log('✔ Test 2 passed: Cache hit within TTL window required 0 network calls');
  });

  await t.test('Test 3: Query parameters are sorted deterministically so varying key orders share cache & deduplication', async () => {
    fetchCallCount = 0;
    const url = '/api/v1/sites/1/devices/4/telemetry/snapshots';
    const paramsOrderA = { interval: 'HOURLY', limit: 1000, settingId: 27 };
    const paramsOrderB = { settingId: 27, interval: 'HOURLY', limit: 1000 };

    const [resA, resB] = await Promise.all([
      apiClient.get(url, paramsOrderA),
      apiClient.get(url, paramsOrderB)
    ]);

    assert.equal(fetchCallCount, 1, 'Different param order should normalize to identical cache key');
    assert.equal(resA.callIndex, resB.callIndex);
    console.log('✔ Test 3 passed: Param sorting guarantees deterministic cache keys');
  });

  await t.test('Test 4: forceRefresh/skipCache bypasses cache when fresh live data is explicitly required', async () => {
    fetchCallCount = 0;
    const url = '/api/v1/sites/1/devices';

    await apiClient.get(url);
    assert.equal(fetchCallCount, 1);

    // Call with forceRefresh: true
    const resFresh = await apiClient.get(url, {}, { forceRefresh: true });
    assert.equal(fetchCallCount, 2, 'forceRefresh must trigger a new network fetch');
    assert.equal(resFresh.callIndex, 2);
    console.log('✔ Test 4 passed: forceRefresh flag bypasses memory cache as expected');
  });

  await t.test('Test 5: Mutations (POST, PUT, PATCH, DELETE) automatically invalidate related cache', async () => {
    fetchCallCount = 0;
    const getUrl = '/api/v1/sites/1/devices';

    await apiClient.get(getUrl);
    assert.equal(fetchCallCount, 1);

    // Trigger a POST mutation
    await apiClient.post('/api/v1/sites/1/devices', { name: 'New Sensor' });

    // Subsequent GET should trigger a fresh network fetch because cache was invalidated
    await apiClient.get(getUrl);
    assert.equal(fetchCallCount, 3, 'Post mutation invalidated cached devices, causing fresh GET');
    console.log('✔ Test 5 passed: Mutations invalidate matching cached entries');
  });

  await t.test('Test 6: AbortSignal cancels request cleanly with AbortError', async () => {
    const controller = new AbortController();
    const url = '/api/v1/slow-telemetry';

    controller.abort(); // Pre-aborted

    await assert.rejects(
      async () => {
        await apiClient.get(url, {}, { signal: controller.signal });
      },
      (err) => err.name === 'AbortError',
      'Should reject with AbortError when signal is aborted'
    );
    console.log('✔ Test 6 passed: AbortController signal cleanly aborts with AbortError');
  });

  console.log('\nALL 6 API CLIENT PERFORMANCE & DEDUPLICATION TESTS PASSED! 🚀');
});
