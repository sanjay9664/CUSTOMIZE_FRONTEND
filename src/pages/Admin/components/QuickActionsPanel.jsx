import React, { useRef, useEffect } from 'react';
import { UserPlus, ShieldCheck, Building2, SlidersHorizontal, Users } from 'lucide-react';
import QuickActionCard from './QuickActionCard';

/**
 * QuickActionsPanel Component
 * Floating/overlay actions panel triggered from the top-right "Actions Panel" button:
 * - Card 1: Users -> Create a new user and assign them a role
 * - Card 2: Manage Roles -> Create new roles with different permissions
 * - Card 3: Manage Organisation -> Create new Company and Client
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether panel is open
 * @param {Function} props.onToggle - Toggle open state
 * @param {Function} props.onAddUser - Quick action: Add user
 * @param {Function} props.onManageRoles - Quick action: Switch to roles
 * @param {Function} props.onManageOrg - Quick action: Manage organisation
 */
export const QuickActionsPanel = ({
  isOpen = false,
  onToggle,
  onAddUser,
  onManageRoles,
  onManageOrg
}) => {
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  // Close on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        onToggle(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onToggle(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onToggle]);

  return (
    <div className="position-relative d-inline-block quick-actions-panel-wrapper">
      {/* Top Header Trigger Button matching reference "Actions Panel" */}
      <button
        ref={btnRef}
        type="button"
        className={`btn d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-2 fs-13 fw-semibold actions-panel-toggle-btn ${
          isOpen ? 'active-actions-btn' : ''
        }`}
        onClick={() => onToggle(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Toggle Actions Panel"
      >
        <Users size={16} className={isOpen ? 'text-primary' : 'text-light'} />
        <span className="text-white">Actions Panel</span>
      </button>

      {/* Floating Panel Overlay */}
      {isOpen && (
        <div
          ref={panelRef}
          className="position-absolute end-0 mt-2 p-2.5 rounded-3 shadow-lg quick-actions-popover-box"
          style={{
            zIndex: 1060,
            minWidth: '440px',
            maxWidth: '95vw',
            backgroundColor: '#0c162e',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65), 0 0 25px rgba(37, 99, 235, 0.2)',
            animation: 'panelSlideIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          role="region"
          aria-label="Quick Actions"
        >
          <div className="d-flex align-items-stretch justify-content-between gap-2 flex-wrap">
            {/* Card 1: Users */}
            <QuickActionCard
              icon={UserPlus}
              title="Users"
              description="Create a new user and assign them a role"
              color="#38bdf8"
              onClick={() => {
                onToggle(false);
                if (onAddUser) onAddUser();
              }}
            />

            {/* Card 2: Manage Roles */}
            <QuickActionCard
              icon={ShieldCheck}
              title="Manage Roles"
              description="Create new roles with different permissions"
              color="#60a5fa"
              onClick={() => {
                onToggle(false);
                if (onManageRoles) onManageRoles();
              }}
            />

            {/* Card 3: Manage Organisation */}
            <QuickActionCard
              icon={Building2}
              title="Manage Organisation"
              description="Create new Company and Client"
              color="#38bdf8"
              onClick={() => {
                onToggle(false);
                if (onManageOrg) onManageOrg();
              }}
            />
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .actions-panel-toggle-btn {
          background-color: #121c35 !important;
          border: 1px solid rgba(59, 130, 246, 0.35) !important;
          color: #ffffff !important;
          transition: all 0.15s ease;
        }
        .actions-panel-toggle-btn:hover {
          background-color: #1a274a !important;
          border-color: rgba(59, 130, 246, 0.6) !important;
          box-shadow: 0 0 12px rgba(37, 99, 235, 0.25);
        }
        .active-actions-btn {
          background-color: #1d3368 !important;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.35);
        }
        @keyframes panelSlideIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}} />
    </div>
  );
};

export default QuickActionsPanel;
