/**
 * User & Role Management Utility Functions
 */

/**
 * Determine if a user is active/enabled across all schema variants
 * (BMS enum status 'ACTIVE' | 'INACTIVE', or boolean enabled)
 */
/**
 * Determine if a user is active/enabled across all schema variants
 * (BMS enum status 'ACTIVE' | 'INACTIVE', or boolean enabled)
 */
export const isUserActive = (u) => {
  if (!u) return false;
  if (u.isLocked || String(u.status).toUpperCase() === 'LOCKED') return false;
  if (typeof u.enabled === 'boolean') return u.enabled;
  if (u.status) return String(u.status).toUpperCase() === 'ACTIVE';
  return false;
};

/**
 * Resolve display status: 'Active' | 'Locked' | 'Pending' | 'Inactive'
 */
export const getUserStatus = (u) => {
  if (!u) return 'Inactive';
  const statusUpper = String(u.status || '').toUpperCase();
  if (u.isLocked || statusUpper === 'LOCKED') return 'Locked';
  if (statusUpper === 'PENDING' || statusUpper === 'PENDING_VERIFICATION' || statusUpper === 'INVITED') {
    return 'Pending';
  }
  if (statusUpper === 'SUSPENDED' || statusUpper === 'DISABLED') return 'Locked';
  if (statusUpper === 'INACTIVE' || u.enabled === false) return 'Inactive';
  if (statusUpper === 'ACTIVE' || u.enabled === true) return 'Active';
  return 'Active';
};

/**
 * Derive user category type for the 3 reference categories:
 * - ADMINISTRATOR (Super Admin, Admin)
 * - INSTALLATION (Operator, Installer)
 * - ORGANISATION (Manager, Viewer, Custom Org roles)
 */
export const deriveUserType = (user) => {
  if (user?.user_type) return String(user.user_type).toUpperCase();
  if (user?.userType) return String(user.userType).toUpperCase();
  const role = String(user?.role || '').toUpperCase();
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return 'ADMINISTRATOR';
  if (role === 'OPERATOR' || role.includes('INSTALLER') || role.includes('OPERATOR')) return 'INSTALLATION';
  if (role === 'MANAGER' || role === 'VIEWER' || role.includes('VIEWER') || role.includes('MANAGER')) return 'ORGANISATION';
  return role.replace(/_/g, ' ') || 'USER';
};

/**
 * Derive user role display name, checking dynamic roles list first
 */
export const deriveRoleName = (user, roles = []) => {
  if (user?.roleId && Array.isArray(roles) && roles.length > 0) {
    const match = roles.find((r) => String(r.id) === String(user.roleId));
    if (match?.name) return String(match.name).toUpperCase();
  }
  if (user?.assignedRole?.name) return String(user.assignedRole.name).toUpperCase();
  if (user?.roleName) return String(user.roleName).toUpperCase();
  const role = String(user?.role || '').toUpperCase();
  return role.replace(/_/g, ' ') || 'REPORT ADMIN';
};

/**
 * Derive user subtitle/designation (e.g., 'Organization Administrator', 'Area Manager')
 */
export const getUserSubtitle = (user, roles = []) => {
  if (user?.subtitle) return user.subtitle;
  if (user?.roleId && Array.isArray(roles) && roles.length > 0) {
    const match = roles.find((r) => String(r.id) === String(user.roleId));
    if (match?.name) return formatRoleDisplay(match.name);
  }
  if (user?.assignedRole?.name) return formatRoleDisplay(user.assignedRole.name);
  if (user?.roleName) return formatRoleDisplay(user.roleName);
  if (user?.role) return formatRoleDisplay(user.role);
  return 'System User';
};

/**
 * Format raw role enum to readable title
 */
const formatRoleDisplay = (role) => {
  const r = String(role || '').toUpperCase();
  switch (r) {
    case 'SUPER_ADMIN': return 'System Super Administrator';
    case 'ADMIN': return 'Organization Administrator';
    case 'MANAGER': return 'Area Manager';
    case 'OPERATOR': return 'System Operator';
    case 'VIEWER': return 'Organization Viewer';
    default:
      return r.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  }
};

/**
 * Extract 2-letter uppercase initials for user avatar
 */
export const getUserInitials = (name = '') => {
  if (!name) return 'U';
  const clean = String(name).trim().replace(/[_\W]+/g, ' ');
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return 'U';
};

/**
 * Curated color palettes for avatars matching the dark reference aesthetic
 */
const AVATAR_PALETTES = [
  { bg: 'rgba(20, 83, 45, 0.5)', text: '#86efac', border: 'rgba(34, 197, 94, 0.4)' },    // Forest green (AU)
  { bg: 'rgba(120, 53, 15, 0.5)', text: '#fde047', border: 'rgba(234, 179, 8, 0.4)' },    // Warm amber (AM)
  { bg: 'rgba(124, 45, 18, 0.5)', text: '#fdba74', border: 'rgba(249, 115, 22, 0.4)' },   // Bronze (OP)
  { bg: 'rgba(30, 58, 138, 0.5)', text: '#93c5fd', border: 'rgba(59, 130, 246, 0.4)' },   // Slate blue (HY)
  { bg: 'rgba(49, 46, 129, 0.5)', text: '#c7d2fe', border: 'rgba(99, 102, 241, 0.4)' },   // Indigo (PZ)
  { bg: 'rgba(88, 28, 135, 0.5)', text: '#d8b4fe', border: 'rgba(168, 85, 247, 0.4)' },   // Purple (HA)
  { bg: 'rgba(67, 56, 202, 0.5)', text: '#a5b4fc', border: 'rgba(129, 140, 248, 0.4)' },  // Lavender (HL)
  { bg: 'rgba(15, 76, 92, 0.5)', text: '#67e8f9', border: 'rgba(6, 182, 212, 0.4)' },     // Dark Cyan (HP)
];

export const getAvatarColor = (name = '') => {
  if (!name) return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
};

/**
 * Derive clean username handle from user object
 */
export const getUserUsername = (user) => {
  if (!user) return 'user';
  if (user.username) return user.username.startsWith('@') ? user.username.slice(1) : user.username;
  if (user.user_name) return user.user_name.startsWith('@') ? user.user_name.slice(1) : user.user_name;
  if (user.email) return user.email.split('@')[0];
  if (user.name) return String(user.name).toLowerCase().replace(/\s+/g, '');
  return 'user';
};

/**
 * Format joined date to 'Month DD, YYYY' matching Figma
 */
export const formatJoinedDate = (dateVal) => {
  if (!dateVal) return 'March 12, 2023';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'March 12, 2023';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return 'March 12, 2023';
  }
};

/**
 * Format last active to relative time string matching Figma
 */
export const formatLastActive = (dateVal, user) => {
  if (!dateVal && user?.updatedAt) dateVal = user.updatedAt;
  if (!dateVal && user?.lastLogin) dateVal = user.lastLogin;
  if (!dateVal) return '1 minute ago';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '1 minute ago';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)} days ago`;
    return `${Math.floor(diffSec / 2592000)} months ago`;
  } catch {
    return '1 minute ago';
  }
};

