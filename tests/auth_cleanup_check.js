import assert from 'node:assert';

// Mock browser globals for Node test environment
const mockStorage = new Map();
global.localStorage = {
  getItem: (k) => mockStorage.get(k) || null,
  setItem: (k, v) => mockStorage.set(k, String(v)),
  removeItem: (k) => mockStorage.delete(k),
  clear: () => mockStorage.clear(),
  get length() { return mockStorage.size; },
  key: (i) => Array.from(mockStorage.keys())[i] || null
};

const mockSession = new Map();
global.sessionStorage = {
  getItem: (k) => mockSession.get(k) || null,
  setItem: (k, v) => mockSession.set(k, String(v)),
  removeItem: (k) => mockSession.delete(k),
  clear: () => mockSession.clear()
};

let cookieJar = '';
global.document = {
  get cookie() { return cookieJar; },
  set cookie(val) {
    if (val.includes('expires=Thu, 01 Jan 1970')) {
      const name = val.split('=')[0].trim();
      const parts = cookieJar.split('; ').filter(row => !row.startsWith(name + '='));
      cookieJar = parts.join('; ');
    } else {
      const pair = val.split(';')[0].trim();
      const name = pair.split('=')[0];
      const parts = cookieJar.split('; ').filter(row => row && !row.startsWith(name + '='));
      parts.push(pair);
      cookieJar = parts.join('; ');
    }
  }
};

global.window = {
  location: { protocol: 'http:', pathname: '/dashboard', replace: () => {} },
  dispatchEvent: () => {}
};

console.log('--- Starting Auth Cleanup & Refresh Security Checks ---');

const {
  getRefreshToken,
  setAuthSession,
  clearAuthSession,
  getCookie
} = await import('../src/utils/cookieUtils.js');

// Test 1: Storing a login JWT refresh token is preserved
const loginJwtRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJ0eXBlIjoicmVmcmVzaCJ9.abc';
localStorage.setItem('refreshToken', loginJwtRefreshToken);
assert.strictEqual(getRefreshToken(), loginJwtRefreshToken, 'Login JWT refresh token must be returned');
console.log('✓ Login JWT refresh token preservation verified');

// Test 2: Storing a valid opaque token is preserved
const validOpaqueToken = 'f730d32629cea0e64333bd891db363704cbd75699f687f22bd1cc2ddcc90b88dfc9a247ad1f6043f6af66d15c4e625bb';
localStorage.setItem('refreshToken', validOpaqueToken);
assert.strictEqual(getRefreshToken(), validOpaqueToken, 'Valid opaque token must be returned');
console.log('✓ Valid opaque refresh token preservation verified');

// Test 3: setAuthSession does NOT leak refresh_token into client-side document.cookie
setAuthSession({
  token: 'mock-access-token',
  refreshToken: validOpaqueToken,
  userRole: 'ADMIN',
  userData: { id: 1, name: 'Test' }
});

assert.strictEqual(getCookie('refresh_token'), null, 'refresh_token MUST NOT be set in document.cookie (HttpOnly server managed)');
assert.strictEqual(getCookie('refreshToken'), null, 'refreshToken MUST NOT be set in document.cookie');
assert.strictEqual(getCookie('access_token'), 'mock-access-token', 'access_token should be set in cookie');
assert.strictEqual(localStorage.getItem('token'), 'mock-access-token');
console.log('✓ Client-side refresh_token cookie shadowing prevention verified');

// Test 4: clearAuthSession allowlist purge
localStorage.setItem('app_theme', 'dark');
localStorage.setItem('remember_me', 'true');
localStorage.setItem('remembered_identifier', 'admin@example.com');
localStorage.setItem('scada_sites_db', '[{"id":1}]');
localStorage.setItem('scada_users_db', '[{"id":2}]');
localStorage.setItem('cache_tenants', '[{"id":3}]');
localStorage.setItem('Sochiot-accesstoken', 'sochiot-secret');

clearAuthSession();

assert.strictEqual(localStorage.getItem('app_theme'), 'dark', 'app_theme must be preserved');
assert.strictEqual(localStorage.getItem('remember_me'), 'true', 'remember_me must be preserved');
assert.strictEqual(localStorage.getItem('remembered_identifier'), 'admin@example.com', 'remembered_identifier must be preserved');

assert.strictEqual(localStorage.getItem('token'), null, 'token must be purged');
assert.strictEqual(localStorage.getItem('refreshToken'), null, 'refreshToken must be purged');
assert.strictEqual(localStorage.getItem('scada_sites_db'), null, 'scada_sites_db must be purged');
assert.strictEqual(localStorage.getItem('scada_users_db'), null, 'scada_users_db must be purged');
assert.strictEqual(localStorage.getItem('cache_tenants'), null, 'cache_tenants must be purged');
assert.strictEqual(localStorage.getItem('Sochiot-accesstoken'), null, 'Sochiot-accesstoken must be purged');
assert.strictEqual(getCookie('access_token'), null, 'access_token cookie must be erased');
assert.strictEqual(getCookie('isAuthenticated'), null, 'isAuthenticated cookie must be erased');
console.log('✓ Allowlist-based storage and cookie purging verified');

// Test 5: getRefreshToken immunity from rogue document.cookie values
localStorage.removeItem('refreshToken');
localStorage.removeItem('refresh_token');
cookieJar = 'refresh_token=rogue_stale_cookie_from_past_run; other=value';
assert.strictEqual(getRefreshToken(), null, 'getRefreshToken must ignore document.cookie entirely');
console.log('✓ getRefreshToken immunity from rogue client cookies verified');

// Test 6: sanitizeClientCookies strips rogue cookies
const { sanitizeClientCookies } = await import('../src/utils/cookieUtils.js');
sanitizeClientCookies();
assert.strictEqual(getCookie('refresh_token'), null, 'sanitizeClientCookies must strip refresh_token from document.cookie');
console.log('✓ sanitizeClientCookies rogue cookie stripping verified');

console.log('--- ALL AUTH CLEANUP & REFRESH CHECKS PASSED ---');
