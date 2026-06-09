const fs = require('fs');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

let content = fs.readFileSync(globalCssPath, 'utf8');

const additions = `
/* =========================================================
   NUCLEAR OPTION FOR INLINE BACKGROUNDS IN LIGHT MODE
   ========================================================= */

body.light-mode .fade-in,
body.light-mode .min-vh-100,
body.light-mode .vh-100,
body.light-mode .energy-overview-page,
body.light-mode .VRV-full-panel,
body.light-mode .scada-config-page,
body.light-mode [style*="min-height: 100vh"],
body.light-mode [style*="minHeight: 100vh"],
body.light-mode [style*="height: 100vh"] {
  background: var(--scada-bg) !important;
  background-color: var(--scada-bg) !important;
  background-image: none !important; /* Removes inline dark gradients */
}

/* Ensure CARDS remain card-colored even if they have fade-in */
body.light-mode .card,
body.light-mode .scada-card,
body.light-mode .glass-card,
body.light-mode .premium-figma-card,
body.light-mode .scada-data-box {
  background: var(--scada-card) !important;
  background-color: var(--scada-card) !important;
}

/* Specific fix for Ticket Manifest table header which might be pitch black */
body.light-mode thead,
body.light-mode .table-dark thead,
body.light-mode [style*="background: black"],
body.light-mode [style*="background: #000"] {
  background: var(--scada-card) !important;
  background-color: var(--scada-card) !important;
  color: var(--scada-text) !important;
}

/* Fix for HMI Control Center top black bar */
body.light-mode .bg-black.border-opacity-10 {
  background: var(--scada-card) !important;
}
`;

if (!content.includes('NUCLEAR OPTION FOR INLINE BACKGROUNDS')) {
  fs.writeFileSync(globalCssPath, content + '\n' + additions);
  console.log('Appended nuclear background overrides to global.css');
} else {
  console.log('Nuclear background overrides already present');
}
