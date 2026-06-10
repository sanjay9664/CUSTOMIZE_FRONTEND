const fs = require('fs');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

let content = fs.readFileSync(globalCssPath, 'utf8');

const svgAdditions = `
/* =========================================================
   SVG NUCLEAR OVERRIDES FOR LIGHT MODE
   ========================================================= */

/* Override dark fills in SVGs */
body.light-mode svg rect[fill="#0c121e"],
body.light-mode svg rect[fill="#0f172a"],
body.light-mode svg rect[fill="#111827"],
body.light-mode svg rect[fill="#1e293b"],
body.light-mode svg circle[fill="#0c121e"],
body.light-mode svg circle[fill="#0f172a"],
body.light-mode svg circle[fill="#111827"],
body.light-mode svg circle[fill="#1e293b"],
body.light-mode svg path[fill="#0c121e"],
body.light-mode svg path[fill="#0f172a"],
body.light-mode svg path[fill="#111827"],
body.light-mode svg path[fill="#1e293b"] {
  fill: var(--scada-card) !important;
}

/* Override dark strokes in SVGs */
body.light-mode svg rect[stroke="#334155"],
body.light-mode svg rect[stroke="#1e293b"],
body.light-mode svg circle[stroke="#334155"],
body.light-mode svg circle[stroke="#475569"],
body.light-mode svg path[stroke="#334155"],
body.light-mode svg path[stroke="#1e293b"] {
  stroke: #cbd5e1 !important;
}

/* 
  Fix for boxes that might use bg-black with bg-opacity-X 
  Bootstrap uses --bs-bg-opacity, but we need to force it to 1 
  if we are replacing black with white, otherwise white becomes transparent!
*/
body.light-mode .bg-black,
body.light-mode .bg-dark,
body.light-mode .bg-black.bg-opacity-10,
body.light-mode .bg-black.bg-opacity-20,
body.light-mode .bg-black.bg-opacity-50 {
  background-color: var(--scada-card) !important;
  --bs-bg-opacity: 1 !important;
  opacity: 1 !important;
}

/* Ensure text inside these formally dark boxes is dark */
body.light-mode .bg-black .text-white,
body.light-mode .bg-dark .text-white {
  color: var(--scada-text) !important;
}

/* Specific fix for Power & Billing boxes */
body.light-mode .data-grid.bg-black {
  background-color: var(--scada-card) !important;
  border-color: #e2e8f0 !important;
}
`;

if (!content.includes('SVG NUCLEAR OVERRIDES')) {
  fs.writeFileSync(globalCssPath, content + '\n' + svgAdditions);
  console.log('Appended SVG overrides to global.css');
} else {
  console.log('SVG overrides already present');
}
