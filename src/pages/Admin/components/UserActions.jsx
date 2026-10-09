import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { Edit3, Lock, Unlock, MoreHorizontal, Eye, Key, Trash2 } from 'lucide-react';
import { getUserStatus } from '../../../utils/userUtils';

/**
 * UserActions Component
 * Row-level action controls matching reference:
 * - Edit button (pencil)
 * - Lock/Unlock security button (padlock)
 * - Ellipsis dropdown for extended actions (view, password, delete)
 *
 * @param {Object} props
 * @param {Object} props.user - The target user object
 * @param {Function} [props.onView] - Callback when user clicks view details
 * @param {Function} [props.onEdit] - Callback when user clicks edit
 * @param {Function} [props.onLock] - Callback when user clicks lock
 * @param {Function} [props.onUnlock] - Callback when user clicks unlock / password modal
 * @param {Function} [props.onDelete] - Callback when user clicks delete
 * @param {boolean} [props.disabled] - Disabled state for actions
 */
export const UserActions = ({
  user,
  onView,
  onEdit,
  onLock,
  onUnlock,
  onDelete,
  disabled = false
}) => {
  if (!user) return null;

  const status = getUserStatus(user);
  const isLocked = status === 'Locked';

  return (
    <div className="d-flex align-items-center justify-content-end gap-1 user-actions-container">
      {/* Quick Edit Icon */}
      {onEdit && (
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(user);
          }}
          className="btn btn-link p-1 text-decoration-none user-action-btn action-btn-edit"
          title="Edit User"
          aria-label={`Edit ${user.name || 'user'}`}
        >
          <Edit3 size={15} />
        </button>
      )}

      {/* Lock / Unlock Icon */}
      {(onLock || onUnlock) && (
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (isLocked && onUnlock) {
              onUnlock(user);
            } else if (onLock) {
              onLock(user);
            } else if (onUnlock) {
              onUnlock(user);
            }
          }}
          className={`btn btn-link p-1 text-decoration-none user-action-btn ${
            isLocked ? 'action-btn-locked' : 'action-btn-lock'
          }`}
          title={isLocked ? 'Unlock Account or Reset Password' : 'Lock / Security Actions'}
          aria-label={isLocked ? `Unlock account for ${user.name}` : `Lock account for ${user.name}`}
        >
          {isLocked ? <Unlock size={15} /> : <Lock size={15} />}
        </button>
      )}

      {/* More Options Dropdown */}
      <Dropdown align="end" className="d-inline-block">
        <Dropdown.Toggle
          as="button"
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          className="btn btn-link p-1 text-decoration-none user-action-btn action-btn-more border-0 shadow-none"
          title="More Actions"
          aria-label="More actions"
        >
          <MoreHorizontal size={16} />
        </Dropdown.Toggle>

        <Dropdown.Menu
          className="user-actions-dropdown-menu shadow-lg border py-1"
          style={{
            backgroundColor: '#0f172a',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            minWidth: '180px',
            zIndex: 1050
          }}
        >
          {onView && (
            <Dropdown.Item
              onClick={() => onView(user)}
              className="d-flex align-items-center gap-2 py-2 px-3 text-light fs-13 dropdown-item-dark"
            >
              <Eye size={14} className="text-info" />
              <span>View Details</span>
            </Dropdown.Item>
          )}

          {onEdit && (
            <Dropdown.Item
              onClick={() => onEdit(user)}
              className="d-flex align-items-center gap-2 py-2 px-3 text-light fs-13 dropdown-item-dark"
            >
              <Edit3 size={14} className="text-primary" />
              <span>Edit User</span>
            </Dropdown.Item>
          )}

          {onUnlock && (
            <Dropdown.Item
              onClick={() => onUnlock(user)}
              className="d-flex align-items-center gap-2 py-2 px-3 text-light fs-13 dropdown-item-dark"
            >
              <Key size={14} className="text-warning" />
              <span>Reset Password / Unlock</span>
            </Dropdown.Item>
          )}

          {onDelete && (
            <>
              <Dropdown.Divider style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />
              <Dropdown.Item
                onClick={() => onDelete(user)}
                className="d-flex align-items-center gap-2 py-2 px-3 text-danger fs-13 dropdown-item-dark"
              >
                <Trash2 size={14} />
                <span>Delete User</span>
              </Dropdown.Item>
            </>
          )}
        </Dropdown.Menu>
      </Dropdown>

      <style dangerouslySetInnerHTML={{ __html: `
        .user-action-btn {
          color: #64748b;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          transition: all 0.15s ease;
        }
        .user-action-btn:hover {
          color: #f8fafc;
          background-color: rgba(255, 255, 255, 0.08);
        }
        .action-btn-edit:hover {
          color: #38bdf8 !important;
        }
        .action-btn-lock:hover {
          color: #fbbf24 !important;
        }
        .action-btn-locked {
          color: #fbbf24;
        }
        .dropdown-item-dark {
          transition: background-color 0.12s ease;
        }
        .dropdown-item-dark:hover,
        .dropdown-item-dark:focus {
          background-color: rgba(59, 130, 246, 0.15) !important;
          color: #ffffff !important;
        }
      `}} />
    </div>
  );
};

export default UserActions;
