const fs = require('fs');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

let content = fs.readFileSync(globalCssPath, 'utf8');

const annunciatorFix = `
/* =========================================================
   ANNUNCIATOR STATUS FIX FOR LIGHT MODE
   ========================================================= */

body.light-mode .annunciator-cell {
    background-color: var(--scada-card) !important;
    border-color: #cbd5e1 !important;
    color: #94a3b8 !important; /* Inactive text color */
}

body.light-mode .annunciator-cell.active {
    background-color: #ef4444 !important;
    color: #fff !important;
    border-color: #f87171 !important;
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.5) !important;
}
`;

if (!content.includes('ANNUNCIATOR STATUS FIX FOR LIGHT MODE')) {
  fs.writeFileSync(globalCssPath, content + '\n' + annunciatorFix);
  console.log('Appended Annunciator Status fix to global.css');
} else {
  console.log('Annunciator Status fix already present');
}
