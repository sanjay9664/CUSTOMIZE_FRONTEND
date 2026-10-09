import React from 'react';
import { Pencil, Lock, Unlock, Trash2, Key } from 'lucide-react';
import {
  getUserInitials,
  getAvatarColor,
  getUserSubtitle,
  getUserUsername,
  formatJoinedDate,
  formatLastActive,
  isUserActive
} from '../../../utils/userUtils';
import UserStatusBadge from './UserStatusBadge';

/**
 * UserTableRow Component
 * Matches Figma Community design "User Management UI – Social Media Admin Dashboard":
 * - Checkbox select
 * - Full Name (circular avatar + bold name)
 * - Email
 * - Username
 * - Status (solid pill badge)
 * - Role
 * - Joined Date
 * - Last Active
 * - Actions (Edit pencil, Lock/Unlock, Delete trash)
 *
 * @param {Object} props
 * @param {Object} props.user - User entity
 * @param {Array} [props.roles] - Roles catalog
 * @param {boolean} [props.isSelected] - Whether row is selected
 * @param {Function} [props.onToggleSelect] - Selection toggle handler
 * @param {Function} [props.onView] - View user handler
 * @param {Function} [props.onEdit] - Edit user handler
 * @param {Function} [props.onLock] - Lock user handler
 * @param {Function} [props.onUnlock] - Unlock/Password user handler
 * @param {Function} [props.onDelete] - Delete user handler
 */
export const UserTableRow = ({
  user,
  roles = [],
  isSelected = false,
  onToggleSelect,
  onView,
  onEdit,
  onLock,
  onUnlock,
  onDelete
}) => {
  if (!user) return null;

  const displayName = user.name || user.user_name || user.username || 'Unnamed User';
  const displayEmail = user.email || user.Email || 'No email';
  const username = getUserUsername(user);
  const roleName = getUserSubtitle(user, roles);
  const initials = getUserInitials(displayName);
  const avatarColors = getAvatarColor(displayName);
  const joinedDate = formatJoinedDate(user.createdAt || user.created_at || user.dateJoined);
  const lastActive = formatLastActive(user.lastLogin || user.updatedAt, user);
  const active = isUserActive(user);

  return (
    <tr className={`user-figma-table-row align-middle border-bottom ${isSelected ? 'selected-row' : ''}`}>
      {/* 1. Checkbox Select */}
      <td className="ps-3 py-2.5" style={{ width: '40px' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelect && onToggleSelect(user.id || user._id, e.target.checked)}
          className="form-check-input user-row-checkbox m-0"
          aria-label={`Select ${displayName}`}
        />
      </td>

      {/* 2. Full Name Column */}
      <td className="py-2.5">
        <div className="d-flex align-items-center gap-2.5">
          {/* Avatar Initial Circle */}
          <div
            className="flex-shrink-0 d-flex align-items-center justify-content-center fw-semibold rounded-circle user-avatar-figma"
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: avatarColors.bg,
              color: avatarColors.text,
              border: `1px solid ${avatarColors.border}`,
              fontSize: '12px',
              letterSpacing: '0.02em',
              userSelect: 'none'
            }}
            title={displayName}
          >
            {initials}
          </div>

          {/* Full Name (Clickable) */}
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none text-start fw-semibold text-white fs-13 user-name-link text-truncate"
            style={{ maxWidth: '180px' }}
            onClick={() => (onView ? onView(user) : onEdit ? onEdit(user) : null)}
            title={`View ${displayName}`}
          >
            {displayName}
          </button>
        </div>
      </td>

      {/* 3. Email Column */}
      <td className="py-2.5">
        <span
          className="fs-13 text-truncate d-inline-block user-email-text"
          style={{ maxWidth: '200px', color: '#94a3b8' }}
          title={displayEmail}
        >
          {displayEmail}
        </span>
      </td>

      {/* 4. Username Column */}
      <td className="py-2.5">
        <span
          className="fs-13 text-truncate d-inline-block user-handle-text"
          style={{ maxWidth: '140px', color: '#cbd5e1' }}
          title={`@${username}`}
        >
          {username}
        </span>
      </td>

      {/* 5. Status Column (Solid Pill) */}
      <td className="py-2.5">
        <UserStatusBadge user={user} />
      </td>

      {/* 6. Role Column */}
      <td className="py-2.5">
        <span
          className="fs-13 text-truncate d-inline-block user-role-text"
          style={{ maxWidth: '160px', color: '#94a3b8' }}
          title={roleName}
        >
          {roleName}
        </span>
      </td>

      {/* 7. Joined Date Column */}
      <td className="py-2.5">
        <span className="fs-13 text-nowrap user-date-text" style={{ color: '#94a3b8' }}>
          {joinedDate}
        </span>
      </td>

      {/* 8. Last Active Column */}
      <td className="py-2.5">
        <span className="fs-13 text-nowrap user-active-text" style={{ color: '#94a3b8' }}>
          {lastActive}
        </span>
      </td>

      {/* 9. Actions Column (Edit, Lock/Unlock, Delete) */}
      <td className="py-2.5 pe-3 text-end">
        <div className="d-inline-flex align-items-center gap-1.5">
          {/* Edit Button */}
          {onEdit && (
            <button
              type="button"
              className="btn btn-sm btn-link p-1 text-secondary user-action-icon-btn"
              onClick={() => onEdit(user)}
              title="Edit user"
              aria-label={`Edit ${displayName}`}
            >
              <Pencil size={15} style={{ color: '#94a3b8' }} />
            </button>
          )}

          {/* Lock / Password Reset Button */}
          {(onLock || onUnlock) && (
            <button
              type="button"
              className="btn btn-sm btn-link p-1 text-secondary user-action-icon-btn"
              onClick={() => (active ? (onLock ? onLock(user) : onUnlock(user)) : (onUnlock ? onUnlock(user) : onLock(user)))}
              title={active ? 'Lock account / Change password' : 'Unlock user account'}
              aria-label={`Security controls for ${displayName}`}
            >
              {active ? <Lock size={15} style={{ color: '#94a3b8' }} /> : <Unlock size={15} style={{ color: '#eab308' }} />}
            </button>
          )}

          {/* Delete Button */}
          {onDelete && (
            <button
              type="button"
              className="btn btn-sm btn-link p-1 text-danger user-action-icon-btn delete-icon-btn"
              onClick={() => onDelete(user)}
              title="Delete user"
              aria-label={`Delete ${displayName}`}
            >
              <Trash2 size={15} style={{ color: '#ef4444' }} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default UserTableRow;
