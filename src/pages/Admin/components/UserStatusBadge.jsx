import React from 'react';
import { getUserStatus } from '../../../utils/userUtils';

/**
 * UserStatusBadge Component
 * Displays solid status pill matching Figma Social Media Admin Dashboard design:
 * - Active: Solid vibrant green (#16a34a) with white text
 * - Inactive: Solid slate gray (#64748b) with white text
 * - Banned / Locked: Solid bold red (#dc2626) with white text
 * - Pending: Solid dark navy (#0f172a) with white text
 * - Suspended: Solid orange (#f97316) with white text
 *
 * @param {Object} props
 * @param {string} [props.status] - Raw status string or resolved status
 * @param {Object} [props.user] - Optional user object to resolve status automatically
 * @param {string} [props.className] - Additional CSS classes
 */
export const UserStatusBadge = ({ status, user, className = '' }) => {
  const resolvedStatus = status || (user ? getUserStatus(user) : 'Active');
  const normalized = String(resolvedStatus).toLowerCase();

  let bg = '#16a34a';
  let text = '#ffffff';
  let label = 'Active';
  let border = 'none';

  if (normalized === 'banned') {
    bg = '#dc2626';
    text = '#ffffff';
    label = 'Banned';
  } else if (normalized === 'locked') {
    bg = '#dc2626';
    text = '#ffffff';
    label = 'Banned';
  } else if (normalized === 'suspended') {
    bg = '#f97316';
    text = '#ffffff';
    label = 'Suspended';
  } else if (normalized === 'pending' || normalized === 'pending_verification' || normalized === 'invited') {
    bg = '#0f172a';
    text = '#ffffff';
    border = '1px solid rgba(255, 255, 255, 0.2)';
    label = 'Pending';
  } else if (normalized === 'inactive' || normalized === 'disabled') {
    bg = '#64748b';
    text = '#ffffff';
    label = 'Inactive';
  } else {
    bg = '#16a34a';
    text = '#ffffff';
    label = 'Active';
  }

  return (
    <span
      className={`d-inline-flex align-items-center justify-content-center px-2.5 py-0.5 rounded-pill fw-semibold user-select-none ${className}`}
      style={{
        backgroundColor: bg,
        color: text,
        border: border,
        fontSize: '11.5px',
        lineHeight: 1.25,
        letterSpacing: '0.01em',
        minWidth: '58px',
        textAlign: 'center',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)'
      }}
    >
      {label}
    </span>
  );
};

export default UserStatusBadge;
