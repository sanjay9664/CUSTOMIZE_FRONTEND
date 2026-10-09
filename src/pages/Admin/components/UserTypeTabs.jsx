import React from 'react';

/**
 * UserTypeTabs Component
 * Displays user category tabs with dynamic user counts matching reference:
 * - Administrator User [8]
 * - Installation User [12]
 * - Organisation User [24]
 * - All Users [44]
 *
 * @param {Object} props
 * @param {Array} props.tabs - Tabs definition array [{ id, label, count }]
 * @param {string} props.activeTab - Currently active tab ID
 * @param {Function} props.onSelectTab - Tab selection callback
 */
export const UserTypeTabs = ({
  tabs = [],
  activeTab = 'ADMIN',
  onSelectTab
}) => {
  return (
    <div className="user-type-tabs-wrapper d-flex align-items-center border-bottom mb-2.5 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const countDisplay = typeof tab.count === 'number' ? ` [${tab.count}]` : '';

        return (
          <button
            key={tab.id}
            type="button"
            className={`user-type-tab-btn py-1.5 px-3 border-0 bg-transparent text-nowrap position-relative fw-medium ${
              isActive ? 'active-user-type-tab' : ''
            }`}
            onClick={() => onSelectTab && onSelectTab(tab.id)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
          >
            <span className="tab-label-text">{tab.label}</span>
            <span className={`tab-count-text ${isActive ? 'active-tab-count' : ''}`}>
              {countDisplay}
            </span>

            {/* Active Bottom Glow Indicator */}
            {isActive && <div className="user-tab-indicator" />}
          </button>
        );
      })}

      <style dangerouslySetInnerHTML={{ __html: `
        .user-type-tabs-wrapper {
          border-bottom-color: rgba(255, 255, 255, 0.08) !important;
          scrollbar-width: none;
        }
        .user-type-tabs-wrapper::-webkit-scrollbar {
          display: none;
        }
        .user-type-tab-btn {
          color: #94a3b8;
          font-size: 13.5px;
          cursor: pointer;
          transition: color 0.15s ease, background-color 0.15s ease;
          border-radius: 4px 4px 0 0;
        }
        .user-type-tab-btn:hover {
          color: #f1f5f9;
        }
        .active-user-type-tab {
          color: #ffffff !important;
          font-weight: 600;
          background-color: rgba(37, 99, 235, 0.08);
        }
        .active-user-type-tab .tab-label-text {
          color: #ffffff;
        }
        .tab-count-text {
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
          margin-left: 2px;
        }
        .active-tab-count {
          color: #60a5fa !important;
          font-weight: 600;
        }
        .user-tab-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #3b82f6;
          box-shadow: 0 0 10px #3b82f6;
          border-radius: 2px 2px 0 0;
        }
      `}} />
    </div>
  );
};

export default UserTypeTabs;
