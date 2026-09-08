import assert from 'node:assert';
import { store } from './store.js';
import { setDeviceStatus, setGatewayStatus, resetDeviceStatuses } from './deviceStatusSlice.js';
import { toggleTheme, setTheme } from './themeSlice.js';
import { setSession, logout } from './authSlice.js';

console.log('--- Starting Redux Store Security & Setup Self-Check ---');

// 1. Verify Initial State Shape
const initial = store.getState();
assert(initial.auth !== undefined, 'auth slice must exist');
assert(initial.theme !== undefined, 'theme slice must exist');
assert(initial.deviceStatus !== undefined, 'deviceStatus slice must exist');
assert.strictEqual(typeof initial.auth.isAuthenticated, 'boolean', 'auth.isAuthenticated must be boolean');
assert.strictEqual(initial.auth.data, undefined, 'Raw tokens or backend data dump must NOT exist on auth state');
console.log('✓ Initial state schema verified');

// 2. Test Device Status & Prototype Pollution Protection
store.dispatch(setDeviceStatus({ id: 'sensor-101', online: true }));
assert.strictEqual(store.getState().deviceStatus.deviceStatuses['sensor-101'], true, 'Normal status update failed');

// Attempt prototype pollution
store.dispatch(setDeviceStatus({ id: '__proto__', online: true }));
store.dispatch(setGatewayStatus({ id: 'constructor', online: true }));
store.dispatch(setGatewayStatus({ id: 'prototype', online: true }));
assert.strictEqual(Object.prototype.online, undefined, 'CRITICAL: Prototype pollution vulnerability detected!');
assert.strictEqual(Object.prototype.hasOwnProperty.call(store.getState().deviceStatus.deviceStatuses, '__proto__'), false, '__proto__ key was added as own property');
console.log('✓ Prototype pollution protection verified');

// 3. Test Theme Slice
const currentTheme = store.getState().theme.isDark;
store.dispatch(toggleTheme());
assert.strictEqual(store.getState().theme.isDark, !currentTheme, 'Theme toggle failed');
store.dispatch(setTheme(false));
assert.strictEqual(store.getState().theme.isDark, false, 'setTheme(false) failed');
store.dispatch(setTheme(true));
assert.strictEqual(store.getState().theme.isDark, true, 'setTheme(true) failed');
console.log('✓ Theme slice controls verified');

// 4. Test Auth Slice Security & Sensitive Data Stripping
store.dispatch(setSession({
  user: {
    id: 42,
    username: 'admin_test',
    email: 'admin@sochiot.com',
    password: 'super-secret-password-123',
    token: 'jwt-leak-token',
    refreshToken: 'refresh-leak-token'
  },
  userRole: 'SUPERADMIN'
}));

const authState = store.getState().auth;
assert.strictEqual(authState.isAuthenticated, true, 'User should be authenticated');
assert.strictEqual(authState.userRole, 'SUPERADMIN', 'Role should be SUPERADMIN');
assert.strictEqual(authState.user.password, undefined, 'CRITICAL: Password leaked into user state');
assert.strictEqual(authState.user.token, undefined, 'CRITICAL: Token leaked into user state');
assert.strictEqual(authState.user.refreshToken, undefined, 'CRITICAL: Refresh token leaked into user state');
assert.strictEqual(authState.user.id, 42, 'User id should be preserved');
console.log('✓ Auth user data sanitization verified');

// 5. Test Cross-Slice Logout Cleanup (Session Isolation)
store.dispatch(setDeviceStatus({ id: 'tenant-dev-1', online: true }));
assert.strictEqual(store.getState().deviceStatus.deviceStatuses['tenant-dev-1'], true);

store.dispatch(logout());
const postLogoutAuth = store.getState().auth;
const postLogoutDevs = store.getState().deviceStatus;
assert.strictEqual(postLogoutAuth.isAuthenticated, false, 'Should be unauthenticated after logout');
assert.strictEqual(postLogoutAuth.user, null, 'User should be null after logout');
assert.deepStrictEqual(postLogoutDevs.deviceStatuses, {}, 'Device statuses must be cleared on logout');
assert.deepStrictEqual(postLogoutDevs.gatewayStatuses, {}, 'Gateway statuses must be cleared on logout');
console.log('✓ Cross-slice logout cleanup verified (session isolation confirmed)');

console.log('--- ALL REDUX CHECKS PASSED SUCCESSFULLY ---');
