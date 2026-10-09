import React from 'react';

/**
 * QuickActionCard Component
 * Interactive action card inside QuickActionsPanel matching reference:
 * - Icon container
 * - Card title
 * - Explanatory subtitle
 * - Clean hover effects with border glow
 *
 * @param {Object} props
 * @param {React.ElementType} props.icon - Lucide icon component
 * @param {string} props.title - Action title
 * @param {string} props.description - Supporting description
 * @param {Function} props.onClick - Click handler
 * @param {string} [props.color] - Accent color
 */
export const QuickActionCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  color = '#38bdf8'
}) => {
  return (
    <button
      type="button"
      className="quick-action-card text-center d-flex flex-column align-items-center justify-content-center p-3 rounded-3 border-0 bg-transparent"
      onClick={onClick}
      style={{
        width: '136px',
        minHeight: '120px',
        cursor: 'pointer',
        transition: 'all 0.18s ease-in-out',
        userSelect: 'none'
      }}
    >
      {/* Icon */}
      <div
        className="quick-action-icon-box d-flex align-items-center justify-content-center mb-2"
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: `${color}15`,
          color: color,
          border: `1px solid ${color}30`
        }}
      >
        {Icon && <Icon size={20} />}
      </div>

      {/* Title */}
      <div
        className="quick-action-title fw-semibold fs-13 mb-1"
        style={{ color: '#60a5fa', lineHeight: 1.2 }}
      >
        {title}
      </div>

      {/* Description */}
      <div
        className="quick-action-desc fs-11"
        style={{ color: '#94a3b8', lineHeight: 1.3 }}
      >
        {description}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .quick-action-card {
          background-color: rgba(255, 255, 255, 0.02) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .quick-action-card:hover {
          background-color: rgba(37, 99, 235, 0.12) !important;
          border-color: rgba(59, 130, 246, 0.5) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        .quick-action-card:hover .quick-action-title {
          color: #ffffff !important;
        }
        .quick-action-card:hover .quick-action-icon-box {
          transform: scale(1.08);
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
        }
      `}} />
    </button>
  );
};

export default QuickActionCard;
