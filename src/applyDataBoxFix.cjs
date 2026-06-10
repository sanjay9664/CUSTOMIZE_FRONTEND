const fs = require('fs');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

let content = fs.readFileSync(globalCssPath, 'utf8');

const dataBoxFix = `
/* =========================================================
   DATABOX FIX FOR LIGHT MODE (DG SET)
   ========================================================= */

body.light-mode .data-box-label {
    /* If the label background is a dark color, we want the text to remain white, 
       so we don't force var(--scada-text) like we did for .text-white */
    color: #ffffff !important;
}

body.light-mode .data-box-value {
    background-color: var(--scada-card) !important;
    /* Force text to be dark since background is now light */
    color: var(--scada-text) !important;
}
`;

if (!content.includes('DATABOX FIX FOR LIGHT MODE (DG SET)')) {
  fs.writeFileSync(globalCssPath, content + '\n' + dataBoxFix);
  console.log('Appended DataBox fix to global.css');
} else {
  console.log('DataBox fix already present');
}
