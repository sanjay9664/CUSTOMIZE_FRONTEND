const fs = require('fs');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

let content = fs.readFileSync(globalCssPath, 'utf8');

const additions = `
/* BOOTSTRAP DARK UTILITY OVERRIDES FOR LIGHT MODE */
body.light-mode .bg-black,
body.light-mode .bg-dark,
body.light-mode .bg-secondary,
body.light-mode .table-dark,
body.light-mode .table-dark th,
body.light-mode .table-dark td,
body.light-mode .table-dark tr {
  background-color: var(--scada-card) !important;
  background: var(--scada-card) !important;
}

body.light-mode .table-dark {
  color: var(--scada-text) !important;
  border-color: var(--scada-border) !important;
}

body.light-mode .table-dark th,
body.light-mode .table-dark td {
  border-color: var(--scada-border) !important;
}

/* Also handle any text-white or text-light inside these containers if they need to be readable */
body.light-mode .bg-black .text-white,
body.light-mode .bg-dark .text-white,
body.light-mode .bg-black .text-light,
body.light-mode .bg-dark .text-light {
  color: var(--scada-text) !important;
}

body.light-mode .bg-black .text-muted,
body.light-mode .bg-dark .text-muted {
  color: var(--scada-text-muted) !important;
}
`;

if (!content.includes('BOOTSTRAP DARK UTILITY OVERRIDES FOR LIGHT MODE')) {
  fs.writeFileSync(globalCssPath, content + '\n' + additions);
  console.log('Appended bootstrap utility overrides to global.css');
} else {
  console.log('Bootstrap utility overrides already present');
}
