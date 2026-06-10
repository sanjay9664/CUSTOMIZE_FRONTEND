const fs = require('fs');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

let content = fs.readFileSync(globalCssPath, 'utf8');

const transitionFix = `
/* =========================================================
   SMOOTH & BEAUTIFUL THEME TRANSITION
   ========================================================= */

/* Core layout elements transition smoothly */
body, 
#root > div,
.min-vh-100,
.vh-100,
.dashboard-wrapper,
.sidebar-container,
.scada-card,
.premium-figma-card,
.bg-panel,
.dash-card,
.card,
.card-header,
.card-body,
.modal-content,
.table-responsive,
.data-box-label,
.data-box-value {
    transition: background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), 
                background 0.5s cubic-bezier(0.4, 0, 0.2, 1), 
                border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), 
                box-shadow 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* Typography transitions smoothly */
body h1, body h2, body h3, body h4, body h5, body h6, body p, body th, body td {
    transition: color 0.4s cubic-bezier(0.4, 0, 0.2, 1), text-shadow 0.4s ease !important;
}

/* Specific background utilities used for cards/panels */
.bg-black, .bg-dark, .bg-white, .bg-transparent {
    transition: background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* Theme Toggle Button smooth spin animation */
.theme-toggle-btn svg {
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease !important;
}
.theme-toggle-btn:active svg {
    transform: rotate(180deg) scale(0.8) !important;
}
`;

if (!content.includes('SMOOTH & BEAUTIFUL THEME TRANSITION')) {
  fs.writeFileSync(globalCssPath, content + '\n' + transitionFix);
  console.log('Appended smooth theme transitions to global.css');
} else {
  console.log('Theme transitions already present');
}
