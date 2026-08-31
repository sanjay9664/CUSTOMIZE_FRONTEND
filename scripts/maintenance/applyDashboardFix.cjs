const fs = require('fs');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

let content = fs.readFileSync(globalCssPath, 'utf8');

const dashboardFix = `
/* =========================================================
   DASHBOARD FIX FOR LIGHT MODE
   ========================================================= */

body.light-mode .dashboard-wrapper {
    background: var(--scada-bg) !important;
}

body.light-mode .bg-panel {
    background-color: var(--scada-card) !important;
    border-color: #e2e8f0 !important;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important;
}

body.light-mode .dash-card {
    background: var(--scada-card) !important;
    border: 1px solid #e2e8f0 !important;
}

body.light-mode .dash-card:hover {
    border-color: #0ea5e9 !important;
}

body.light-mode .dashboard-wrapper .text-white {
    color: var(--scada-text) !important;
}

/* Specific text color fixes for Dashboard */
body.light-mode .dashboard-wrapper h1,
body.light-mode .dashboard-wrapper h3,
body.light-mode .dashboard-wrapper h4,
body.light-mode .dashboard-wrapper h6 {
    color: var(--scada-text) !important;
}

/* Fix table text colors */
body.light-mode .scada-table tbody td {
    color: var(--scada-text) !important;
    border-bottom-color: rgba(0, 0, 0, 0.05) !important;
}

body.light-mode .scada-table thead th {
    background: rgba(0, 0, 0, 0.05) !important;
    color: #64748b !important;
}

/* Ensure background of inline style linear gradients is overwritten */
body.light-mode [style*="linear-gradient(145deg, #0f172a"] {
    background: var(--scada-card) !important;
}
`;

if (!content.includes('DASHBOARD FIX FOR LIGHT MODE')) {
  fs.writeFileSync(globalCssPath, content + '\n' + dashboardFix);
  console.log('Appended Dashboard fix to global.css');
} else {
  console.log('Dashboard fix already present');
}
