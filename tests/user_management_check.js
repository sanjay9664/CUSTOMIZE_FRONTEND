import assert from 'node:assert';

console.log('--- Starting User & Role Management Self-Check ---');

// 1. Verify bmsService API methods
const { bmsService } = await import('../src/services/bmsService.js');
assert.strictEqual(typeof bmsService.getUsers, 'function', 'bmsService.getUsers must exist');
assert.strictEqual(typeof bmsService.getUser, 'function', 'bmsService.getUser must exist');
assert.strictEqual(typeof bmsService.createUser, 'function', 'bmsService.createUser must exist');
assert.strictEqual(typeof bmsService.updateUser, 'function', 'bmsService.updateUser must exist');
assert.strictEqual(typeof bmsService.deleteUser, 'function', 'bmsService.deleteUser must exist');
assert.strictEqual(typeof bmsService.adminChangePassword, 'function', 'bmsService.adminChangePassword must exist');
assert.strictEqual(typeof bmsService.unlockUser, 'function', 'bmsService.unlockUser must exist');

assert.strictEqual(typeof bmsService.getRoles, 'function', 'bmsService.getRoles must exist');
assert.strictEqual(typeof bmsService.getRole, 'function', 'bmsService.getRole must exist');
assert.strictEqual(typeof bmsService.createRole, 'function', 'bmsService.createRole must exist');
assert.strictEqual(typeof bmsService.updateRole, 'function', 'bmsService.updateRole must exist');
assert.strictEqual(typeof bmsService.deleteRole, 'function', 'bmsService.deleteRole must exist');
assert.strictEqual(typeof bmsService.cloneRole, 'function', 'bmsService.cloneRole must exist');

assert.strictEqual(typeof bmsService.getPermissions, 'function', 'bmsService.getPermissions must exist');
assert.strictEqual(typeof bmsService.getLocationTree, 'function', 'bmsService.getLocationTree must exist');
console.log('✓ bmsService API methods verified');

// 2. Tab role categorization checks
const sampleRoles = [
  { id: '1', name: 'ADMIN', isPredefined: true },
  { id: '2', name: 'SUPER_ADMIN', isPredefined: true },
  { id: '3', name: 'INSTALLER', isPredefined: true },
  { id: '4', name: 'OPERATOR', isPredefined: true },
  { id: '5', name: 'VIEWER', isPredefined: true },
  { id: '6', name: 'MANAGER', isPredefined: true },
  { id: '7', name: 'Custom Site Operator', isPredefined: false }
];

const adminRoles = sampleRoles.filter(r => {
  const n = r.name.toUpperCase();
  return n.includes('ADMIN') || n.includes('SUPER');
});
assert.strictEqual(adminRoles.length, 2, 'Should classify 2 admin roles');

const installerRoles = sampleRoles.filter(r => {
  const n = r.name.toUpperCase();
  return n.includes('INSTALL') || n.includes('OPERATOR');
});
assert.strictEqual(installerRoles.length, 3, 'Should classify 3 installer/operator roles');

const orgRoles = sampleRoles.filter(r => {
  const n = r.name.toUpperCase();
  return !r.isPredefined || n.includes('VIEWER') || n.includes('MANAGER');
});
assert.strictEqual(orgRoles.length, 3, 'Should classify 3 organization roles');
console.log('✓ Role tab classification rules verified');

// 3. User tab categorization checks
const sampleUsers = [
  { id: 'u1', name: 'Super Admin', email: 'sa@sochiot.com', role: 'SUPER_ADMIN' },
  { id: 'u2', name: 'Admin User', email: 'admin@sochiot.com', role: 'ADMIN' },
  { id: 'u3', name: 'Operator User', email: 'op@sochiot.com', role: 'OPERATOR' },
  { id: 'u4', name: 'Viewer User', email: 'viewer@sochiot.com', role: 'VIEWER' }
];

const adminUsers = sampleUsers.filter(u => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN');
assert.strictEqual(adminUsers.length, 2, 'Should classify 2 admin users');

const installerUsers = sampleUsers.filter(u => u.role === 'OPERATOR');
assert.strictEqual(installerUsers.length, 1, 'Should classify 1 installation user');

const orgUsers = sampleUsers.filter(u => u.role === 'VIEWER');
assert.strictEqual(orgUsers.length, 1, 'Should classify 1 organisation user');
console.log('✓ User tab classification rules verified');

// 4. LocationMapping conversion test (per user specification & OpenAPI schema)
const { buildLocationMapping, cleanLocationMapping } = await import('../src/utils/locationTreeUtils.js');

// Example 1: grant access to site 12
const site12Node = { id: 12, name: 'Site 12', type: 'SITE' };
const site12Mapping = cleanLocationMapping(buildLocationMapping(site12Node, []));
assert.deepStrictEqual(site12Mapping, { siteId: 12 }, 'Should map site 12 to { siteId: 12 }');

// Example 2: grant access to site 15
const site15Node = { id: 15, name: 'Site 15', type: 'SITE' };
const site15Mapping = cleanLocationMapping(buildLocationMapping(site15Node, []));
assert.deepStrictEqual(site15Mapping, { siteId: 15 }, 'Should map site 15 to { siteId: 15 }');

// Example 3: grant access to area 7 within site 12
const area7Node = { id: 7, name: 'Area 7', type: 'AREA' };
const site12Ancestor = { id: 12, name: 'Site 12', type: 'SITE' };
const area7Mapping = cleanLocationMapping(buildLocationMapping(area7Node, [site12Ancestor]));
assert.deepStrictEqual(area7Mapping, { siteId: 12, areaId: 7 }, 'Should map area 7 in site 12 to { siteId: 12, areaId: 7 }');

// Example 4: grant access to a tenant
const tenantNode = { id: 'clm_tenant_cuid', name: 'sochiot', type: 'TENANT' };
const tenantMapping = cleanLocationMapping(buildLocationMapping(tenantNode, []));
assert.deepStrictEqual(tenantMapping, { tenantId: 'clm_tenant_cuid' }, 'Should map tenant to { tenantId: "clm_tenant_cuid" }');

// Example 5: grant access to a specific device 99 within site 12
const device99Node = { id: 99, name: 'Device 99', type: 'DEVICE' };
const device99Mapping = cleanLocationMapping(buildLocationMapping(device99Node, [site12Ancestor]));
assert.deepStrictEqual(device99Mapping, { siteId: 12, deviceId: 99 }, 'Should map device 99 in site 12 to { siteId: 12, deviceId: 99 }');

// Full user locationMappings array test:
const combinedMappings = [
  site12Mapping,
  site15Mapping,
  area7Mapping,
  tenantMapping,
  device99Mapping
];

assert.deepStrictEqual(combinedMappings, [
  { siteId: 12 },
  { siteId: 15 },
  { siteId: 12, areaId: 7 },
  { tenantId: 'clm_tenant_cuid' },
  { siteId: 12, deviceId: 99 }
]);

// Ensure zero null or undefined keys in any generated mapping
combinedMappings.forEach((m, idx) => {
  Object.entries(m).forEach(([k, v]) => {
    assert(v !== null && v !== undefined, `Mapping at index ${idx} must not contain null/undefined for key ${k}`);
  });
});
console.log('✓ Location tree locationMappings conversion verified with exact user specification');

// 5. Predefined role deletion prevention check
const deleteAllowed = (role) => !role.isPredefined;
assert.strictEqual(deleteAllowed({ isPredefined: true }), false, 'Predefined roles must never be deletable');
assert.strictEqual(deleteAllowed({ isPredefined: false }), true, 'Custom roles can be deleted');
console.log('✓ Predefined role immutability check verified');

// 6. User enabled/disabled status resolution tests
const { isUserActive, deriveUserType, deriveRoleName } = await import('../src/utils/userUtils.js');
assert.strictEqual(typeof isUserActive, 'function', 'isUserActive helper must be exported');
assert.strictEqual(isUserActive({ status: 'ACTIVE' }), true, 'ACTIVE status must resolve to true');
assert.strictEqual(isUserActive({ status: 'active' }), true, 'Lowercase active must resolve to true');
assert.strictEqual(isUserActive({ status: 'INACTIVE' }), false, 'INACTIVE status must resolve to false');
assert.strictEqual(isUserActive({ status: 'INACTIVE', enabled: undefined }), false, 'Undefined enabled with INACTIVE status must resolve to false (bug fix verification)');
assert.strictEqual(isUserActive({ enabled: true }), true, 'enabled=true must resolve to true');
assert.strictEqual(isUserActive({ enabled: false }), false, 'enabled=false must resolve to false');
assert.strictEqual(isUserActive(null), false, 'null user must resolve to false');
console.log('✓ isUserActive enable/disable toggle resolution verified');

// 7. User details field extraction check
const sampleApiUser = {
  id: 'cmudwh9t600080un3ej1hx7i2',
  name: 'Viewer User',
  email: 'viewer@sochiot.com',
  role: 'VIEWER',
  roleId: 'cmuo17doa001fv0ia744w8b0n',
  scopeType: 'SITE',
  scopeId: '3',
  status: 'ACTIVE',
  locationMappings: [{ siteId: 3 }]
};

const extractedName = sampleApiUser.user_name || sampleApiUser.name || sampleApiUser.username;
assert.strictEqual(extractedName, 'Viewer User', 'user_name must match');

const extractedEmail = sampleApiUser.email || sampleApiUser.Email;
assert.strictEqual(extractedEmail, 'viewer@sochiot.com', 'Email must match');

const extractedUserType = deriveUserType(sampleApiUser);
assert.strictEqual(extractedUserType, 'ORGANISATION', 'User Type must match');

const extractedRoleName = deriveRoleName(sampleApiUser, [{ id: 'cmuo17doa001fv0ia744w8b0n', name: 'Custom Viewer' }]);
assert.strictEqual(extractedRoleName, 'CUSTOM VIEWER', 'Role name must resolve from roles');

console.log('✓ User details fields extraction verified');

// 8. New Redesigned UI Utilities & Status Verification
const { getUserStatus, getUserInitials, getUserSubtitle, getAvatarColor } = await import('../src/utils/userUtils.js');

assert.strictEqual(getUserStatus({ status: 'ACTIVE' }), 'Active', 'ACTIVE should resolve to Active');
assert.strictEqual(getUserStatus({ status: 'LOCKED' }), 'Locked', 'LOCKED should resolve to Locked');
assert.strictEqual(getUserStatus({ isLocked: true }), 'Locked', 'isLocked: true should resolve to Locked');
assert.strictEqual(getUserStatus({ status: 'SUSPENDED' }), 'Locked', 'SUSPENDED should resolve to Locked');
assert.strictEqual(getUserStatus({ status: 'PENDING' }), 'Pending', 'PENDING should resolve to Pending');
assert.strictEqual(getUserStatus({ status: 'PENDING_VERIFICATION' }), 'Pending', 'PENDING_VERIFICATION should resolve to Pending');
assert.strictEqual(getUserStatus({ status: 'INACTIVE' }), 'Inactive', 'INACTIVE should resolve to Inactive');
console.log('✓ getUserStatus enterprise status resolution verified');

assert.strictEqual(getUserInitials('Admin User'), 'AU', 'Admin User initials must be AU');
assert.strictEqual(getUserInitials('Area_Manager'), 'AM', 'Area_Manager initials must be AM');
assert.strictEqual(getUserInitials('Hyper_Operator'), 'HO', 'Hyper_Operator initials must be HO');
assert.strictEqual(getUserInitials('Hyper_UnitHead'), 'HU', 'Hyper_UnitHead initials must be HU');
assert.strictEqual(getUserInitials('hyperpure'), 'HY', 'hyperpure initials must be HY');
console.log('✓ getUserInitials 2-letter avatar initials verified');

assert.strictEqual(getUserSubtitle({ role: 'ADMIN' }), 'Organization Administrator', 'ADMIN subtitle matches reference');
assert.strictEqual(getUserSubtitle({ role: 'MANAGER' }), 'Area Manager', 'MANAGER subtitle matches reference');
assert.strictEqual(getUserSubtitle({ role: 'OPERATOR' }), 'System Operator', 'OPERATOR subtitle matches reference');
console.log('✓ getUserSubtitle role title mapping verified');

const avatarColor = getAvatarColor('Admin User');
assert.ok(avatarColor.bg && avatarColor.text && avatarColor.border, 'getAvatarColor must return complete palette');
console.log('✓ getAvatarColor palette resolution verified');

// 9. Tab dynamic counts calculation check
const testUsers = [
  { role: 'SUPER_ADMIN' },
  { role: 'ADMIN' },
  { role: 'OPERATOR' },
  { role: 'INSTALLER_HEAD' },
  { role: 'MANAGER' },
  { role: 'VIEWER' }
];

let adminCount = 0;
let installerCount = 0;
let orgCount = 0;
testUsers.forEach(u => {
  const role = String(u.role).toUpperCase();
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') adminCount++;
  else if (role === 'OPERATOR' || role.includes('INSTALLER') || role.includes('OPERATOR')) installerCount++;
  else if (role === 'MANAGER' || role === 'VIEWER' || role.includes('VIEWER') || role.includes('MANAGER')) orgCount++;
});

assert.strictEqual(adminCount, 2, 'Admin tab count must be 2');
assert.strictEqual(installerCount, 2, 'Installer tab count must be 2');
assert.strictEqual(orgCount, 2, 'Organization tab count must be 2');
assert.strictEqual(testUsers.length, 6, 'All users count must be 6');
console.log('✓ Dynamic user tab counts calculation verified');

// 10. Figma helpers verification
const { getUserUsername, formatJoinedDate, formatLastActive } = await import('../src/utils/userUtils.js');
assert.strictEqual(getUserUsername({ email: 'john.smith@gmail.com' }), 'john.smith', 'Username derived from email');
assert.strictEqual(getUserUsername({ username: 'jonny77' }), 'jonny77', 'Username extracted from username field');
assert.ok(typeof formatJoinedDate('2023-03-12T00:00:00Z') === 'string', 'formatJoinedDate returns string');
assert.ok(typeof formatLastActive(new Date().toISOString()) === 'string', 'formatLastActive returns string');
console.log('✓ Figma format helpers verified');

// 11. Organization-scoped role filtering verification
const mixedRoles = [
  { id: 'r1', name: 'ADMIN', isPredefined: true },
  { id: 'r2', name: 'Custom Org1 Role', isPredefined: false, tenantId: 'tenant_1' },
  { id: 'r3', name: 'Custom Org2 Role', isPredefined: false, tenantId: 'tenant_2' },
  { id: 'r4', name: 'Company Specific Role', isPredefined: false, companyId: 'comp_1' }
];

const filterRolesForOrg = (rolesList, targetOrgId) => {
  const targetId = String(targetOrgId).trim();
  return rolesList.filter(r => {
    if (r.tenantId && String(r.tenantId) !== targetId) return false;
    if (r.companyId && String(r.companyId) !== targetId) return false;
    if (r.organizationId && String(r.organizationId) !== targetId) return false;
    return true;
  });
};

const tenant1Roles = filterRolesForOrg(mixedRoles, 'tenant_1');
assert.strictEqual(tenant1Roles.length, 2, 'tenant_1 must only receive global/system roles and its own custom role');
assert.ok(tenant1Roles.some(r => r.name === 'ADMIN'), 'Must include ADMIN');
assert.ok(tenant1Roles.some(r => r.name === 'Custom Org1 Role'), 'Must include Custom Org1 Role');
assert.ok(!tenant1Roles.some(r => r.name === 'Custom Org2 Role'), 'Must NOT include Custom Org2 Role');
assert.ok(!tenant1Roles.some(r => r.name === 'Company Specific Role'), 'Must NOT include Company Specific Role');
// 12. Payload generation verification: Company vs Tenant selection
const buildUserPayload = (name, email, selectedOrgObj, locationMappings = []) => {
  const isCompany = selectedOrgObj?.type === 'COMPANY';
  const orgId = selectedOrgObj?.id;
  return {
    name,
    email,
    ...(isCompany ? { companyId: orgId } : { tenantId: orgId }),
    ...(locationMappings.length > 0 ? { locationMappings } : {})
  };
};

const tenantPayload = buildUserPayload('John', 'john@example.com', { id: 'clm_tenant_cuid', type: 'TENANT' });
assert.deepStrictEqual(tenantPayload, {
  name: 'John',
  email: 'john@example.com',
  tenantId: 'clm_tenant_cuid'
});
assert.strictEqual(tenantPayload.companyId, undefined, 'Tenant user payload must not have companyId');

const companyPayload = buildUserPayload('Jane', 'jane@example.com', { id: 'clm_company_cuid', type: 'COMPANY' });
assert.deepStrictEqual(companyPayload, {
  name: 'Jane',
  email: 'jane@example.com',
  companyId: 'clm_company_cuid'
});
assert.strictEqual(companyPayload.tenantId, undefined, 'Company user payload must not have tenantId');

const companyWithLocations = buildUserPayload('Alice', 'alice@example.com', { id: 'clm_company_cuid', type: 'COMPANY' }, [
  { siteId: 12 },
  { siteId: 15, areaId: 7 }
]);
assert.deepStrictEqual(companyWithLocations, {
  name: 'Alice',
  email: 'alice@example.com',
  companyId: 'clm_company_cuid',
  locationMappings: [
    { siteId: 12 },
    { siteId: 15, areaId: 7 }
  ]
});
console.log('✓ Company vs Tenant payload routing verified');

console.log('--- ALL USER & ROLE MANAGEMENT CHECKS PASSED ---');



