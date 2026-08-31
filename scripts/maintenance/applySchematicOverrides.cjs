const fs = require('fs');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

let content = fs.readFileSync(globalCssPath, 'utf8');

const additions = `
/* ADDITIONAL SCHEMATIC LIGHT MODE OVERRIDES */
body.light-mode .fullscreen-scada-page,
body.light-mode .scada-schematic-bg,
body.light-mode .scada-selector-tile,
body.light-mode [class*="scada-schematic-bg"],
body.light-mode [class*="fullscreen-scada-page"] {
  background-color: var(--scada-card) !important;
  background-image: none !important;
  background: var(--scada-card) !important;
}

/* Water Tank specific dark colors */
body.light-mode [style*="#0c121e"],
body.light-mode [style*="#111827"],
body.light-mode [style*="#0a1118"],
body.light-mode [style*="#020408"] {
  background-color: var(--scada-card) !important;
  background-image: none !important;
}

/* Override any inline background colors that use standard dark tailwind colors */
body.light-mode [style*="background: #0f172a"],
body.light-mode [style*="background: '#0f172a'"],
body.light-mode [style*="background-color: #0f172a"],
body.light-mode [style*="background-color: '#0f172a'"],
body.light-mode [style*="background: #1e293b"],
body.light-mode [style*="background: '#1e293b'"],
body.light-mode [style*="background-color: #1e293b"],
body.light-mode [style*="background-color: '#1e293b'"],
body.light-mode [style*="background: #020617"],
body.light-mode [style*="background: '#020617'"],
body.light-mode [style*="background-color: #020617"],
body.light-mode [style*="background-color: '#020617'"],
body.light-mode [style*="background: #111827"],
body.light-mode [style*="background: '#111827'"],
body.light-mode [style*="background-color: #111827"],
body.light-mode [style*="background-color: '#111827'"] {
  background: var(--scada-card) !important;
  background-color: var(--scada-card) !important;
  background-image: none !important;
}
`;

if (!content.includes('ADDITIONAL SCHEMATIC LIGHT MODE OVERRIDES')) {
  fs.writeFileSync(globalCssPath, content + '\n' + additions);
  console.log('Appended schematic overrides to global.css');
} else {
  console.log('Schematic overrides already present');
}
