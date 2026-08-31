const fs = require('fs');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

let content = fs.readFileSync(globalCssPath, 'utf8');

const shadowFix = `
/* =========================================================
   TEXT SHADOW & GLOW FIX FOR LIGHT MODE
   ========================================================= */

/* Remove dark text-shadows from colored text/arcs that look dirty on white backgrounds */
body.light-mode .current-temp {
    text-shadow: none !important;
}

body.light-mode .VRV-dial-svg {
    filter: none !important;
}

/* Fix any generic text-glows that use dark shadows */
body.light-mode .text-glow,
body.light-mode .text-glow-blue,
body.light-mode .text-glow-white,
body.light-mode .shadow-glow-blue,
body.light-mode .shadow-glow-green,
body.light-mode .glow-text-info,
body.light-mode .glow-text-warning,
body.light-mode .glow-text-success,
body.light-mode .glow-text-danger {
    text-shadow: none !important;
    filter: none !important;
}

/* For SVG filters causing dirty shadows in light mode (e.g. TempHumidity gauge) */
body.light-mode svg filter#shadow feDropShadow,
body.light-mode svg filter#glow feDropShadow {
    flood-opacity: 0.1 !important; /* Make shadows very faint in light mode if they can't be removed */
}
`;

if (!content.includes('TEXT SHADOW & GLOW FIX FOR LIGHT MODE')) {
  fs.writeFileSync(globalCssPath, content + '\n' + shadowFix);
  console.log('Appended shadow/glow fixes to global.css');
} else {
  console.log('Shadow/glow fixes already present');
}
