const fs = require('fs');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

let content = fs.readFileSync(globalCssPath, 'utf8');

const additions = `
/* MEGA GLOBAL LIGHT MODE OVERRIDES FOR CUSTOM CLASSES */

/* Cards, Panels, and Containers */
body.light-mode .premium-figma-card,
body.light-mode .scada-data-box,
body.light-mode .card-action-bar-premium,
body.light-mode .selected-premium-card,
body.light-mode .configuration-form-wrapper,
body.light-mode .bg-panel,
body.light-mode .bg-gradient-scada,
body.light-mode .scada-glass-card,
body.light-mode .scada-tabs-container,
body.light-mode .scada-section-box,
body.light-mode .parameter-glass-card,
body.light-mode .scada-gauge-card,
body.light-mode .scada-glass-section,
body.light-mode .telemetry-card-glow,
body.light-mode .grouping-panel,
body.light-mode .glass-card,
body.light-mode .glass-tabs,
body.light-mode .glass-panel,
body.light-mode .admin-header-card,
body.light-mode .submodule-grid,
body.light-mode .hs-card-glow,
body.light-mode .control-box,
body.light-mode .filter-tile,
body.light-mode .status-filter-card,
body.light-mode .mgmt-header,
body.light-mode .mini-sidebar-preview,
body.light-mode .preview-item {
  background: var(--scada-card) !important;
  background-color: var(--scada-card) !important;
  border-color: var(--scada-border) !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
}

body.light-mode .selected-premium-card {
  background: rgba(2, 132, 199, 0.05) !important;
  border-color: var(--scada-accent) !important;
}

/* Inputs, Selects, and Controls */
body.light-mode .premium-input,
body.light-mode .premium-select,
body.light-mode .scada-select,
body.light-mode .grouping-input,
body.light-mode .role-selector-container,
body.light-mode .hs-select,
body.light-mode .hs-small-select,
body.light-mode .hs-segmented-control,
body.light-mode .hs-value-display,
body.light-mode .scada-input {
  background: #f1f5f9 !important;
  background-color: #f1f5f9 !important;
  color: var(--scada-text) !important;
  border-color: var(--scada-border) !important;
}

body.light-mode .premium-input option,
body.light-mode .premium-select option,
body.light-mode .scada-select option,
body.light-mode .hs-select option {
  background: #f1f5f9 !important;
  color: var(--scada-text) !important;
}

/* Checkboxes and Radios */
body.light-mode .scada-checkbox .form-check-input,
body.light-mode .scada-radio .form-check-input {
  background-color: #f8fafc !important;
  border-color: #94a3b8 !important;
}

body.light-mode .scada-checkbox .form-check-input:checked,
body.light-mode .scada-radio .form-check-input:checked {
  background-color: var(--scada-accent) !important;
  border-color: var(--scada-accent) !important;
}

/* Buttons, Pills, and Chips */
body.light-mode .icon-box-premium,
body.light-mode .group-ungrouped-chip,
body.light-mode .hs-status-indicator,
body.light-mode .valve-mode-pill,
body.light-mode .sub-pill,
body.light-mode .module-icon-box {
  background: rgba(0, 0, 0, 0.05) !important;
  color: var(--scada-text) !important;
  border-color: var(--scada-border) !important;
}

body.light-mode .sub-pill.active,
body.light-mode .module-icon-box.active {
  background: rgba(2, 132, 199, 0.1) !important;
  color: var(--scada-accent) !important;
  border-color: rgba(2, 132, 199, 0.2) !important;
}

/* Toggle Switches */
body.light-mode .modern-toggle {
  background: #cbd5e1 !important;
  border-color: #94a3b8 !important;
}
body.light-mode .modern-toggle.on {
  background: rgba(2, 132, 199, 0.15) !important;
  border-color: rgba(2, 132, 199, 0.4) !important;
}
body.light-mode .toggle-slider {
  background: #ffffff !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
}
body.light-mode .on .toggle-slider {
  background: var(--scada-accent) !important;
}
body.light-mode .toggle-label {
  color: var(--scada-text-muted) !important;
}

/* Catch-all for black/dark transparent backgrounds */
body.light-mode [style*="background: rgba(0, 0, 0"],
body.light-mode [style*="background: rgba(255, 255, 255, 0.0"],
body.light-mode [style*="background: 'rgba(0,0,0"],
body.light-mode [style*="background: 'rgba(255,255,255,0.0"],
body.light-mode [style*="background-color: rgba(0, 0, 0"],
body.light-mode [style*="backgroundColor: rgba(0, 0, 0"],
body.light-mode [style*="background: #000"],
body.light-mode [style*="background: '#000"],
body.light-mode [style*="background: #111"] {
  background: var(--scada-card) !important;
  background-color: var(--scada-card) !important;
}
`;

if (!content.includes('MEGA GLOBAL LIGHT MODE OVERRIDES FOR CUSTOM CLASSES')) {
  fs.writeFileSync(globalCssPath, content + '\n' + additions);
  console.log('Appended mega light mode overrides to global.css');
} else {
  console.log('Mega overrides already present in global.css');
}
