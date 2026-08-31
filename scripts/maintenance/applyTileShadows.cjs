const fs = require('fs');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

let content = fs.readFileSync(globalCssPath, 'utf8');

const shadowFix = `
/* =========================================================
   LIGHT MODE: ELEVATED TILES / CARDS (USER REQUESTED SHADOW)
   ========================================================= */

body.light-mode .card,
body.light-mode .scada-card,
body.light-mode .premium-figma-card,
body.light-mode .dash-card,
body.light-mode .bg-panel,
body.light-mode .VRV-room-card,
body.light-mode .login-form-container,
body.light-mode .scada-data-box {
    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px !important;
}

/* On hover, maybe lift them slightly more to make them feel interactive */
body.light-mode .card:hover,
body.light-mode .scada-card:hover,
body.light-mode .VRV-room-card:hover {
    box-shadow: rgba(0, 0, 0, 0.45) 0px 8px 20px !important;
    transform: translateY(-2px);
}
`;

if (!content.includes('LIGHT MODE: ELEVATED TILES / CARDS')) {
  fs.writeFileSync(globalCssPath, content + '\n' + shadowFix);
  console.log('Appended elevated shadow styles to global.css');
} else {
  console.log('Elevated shadow styles already present');
}
