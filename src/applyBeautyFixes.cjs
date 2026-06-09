const fs = require('fs');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

let content = fs.readFileSync(globalCssPath, 'utf8');

const beautyFixes = `
/* =========================================================
   LIGHT MODE BEAUTIFICATION (PREMIUM LOOK)
   ========================================================= */

/* 1. Subtle Premium Background */
body.light-mode {
    --scada-bg: #f4f7f9 !important; 
    --scada-text: #0f172a !important; 
}

body.light-mode #root > div,
body.light-mode .min-vh-100,
body.light-mode .dashboard-wrapper {
    background: linear-gradient(135deg, #f8fafc 0%, #eef2f6 100%) !important;
}

/* 2. Beautiful Soft Shadows & Borders for Cards */
body.light-mode .scada-card,
body.light-mode .premium-figma-card,
body.light-mode .bg-panel,
body.light-mode .dash-card {
    background: #ffffff !important;
    border: 1px solid rgba(226, 232, 240, 0.9) !important;
    box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.06), 0 4px 10px -2px rgba(15, 23, 42, 0.03) !important;
    border-radius: 16px !important;
    backdrop-filter: none !important; /* Remove blur to keep it sharp and clean */
}

/* 3. Deep Text Gradient for Main Headings */
body.light-mode h2, 
body.light-mode h3, 
body.light-mode .page-header h2 {
    color: #0f172a !important;
    text-shadow: none !important;
    letter-spacing: -0.5px !important;
}

body.light-mode h6 {
    color: #475569 !important;
    font-weight: 800 !important;
}

/* 4. Elegant Inputs and Search boxes */
body.light-mode .premium-input,
body.light-mode .form-control {
    background: #ffffff !important;
    border: 1px solid #cbd5e1 !important;
    color: #0f172a !important;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02) !important;
}
body.light-mode .premium-input:focus,
body.light-mode .form-control:focus {
    border-color: #38bdf8 !important;
    box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.15) !important;
}

/* 5. Fix internal dark boxes (like the ones in panels) to look like soft inner cards */
body.light-mode .bg-dark.bg-opacity-50,
body.light-mode .bg-dark.bg-opacity-20,
body.light-mode .bg-black.bg-opacity-30 {
    background: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
}

/* 6. Fix bright borders (border-secondary etc) to be soft gray */
body.light-mode .border-secondary.border-opacity-10,
body.light-mode .border-white.border-opacity-5 {
    border-color: #e2e8f0 !important;
}

/* 7. Enhance DataBox labels (make them pop slightly in light mode) */
body.light-mode .data-box-label {
    background: #334155 !important;
    border-radius: 4px 0 0 4px !important;
}
body.light-mode .data-box-value {
    border-radius: 0 4px 4px 0 !important;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02) !important;
    border: 1px solid #e2e8f0 !important;
    border-left: none !important;
}
`;

if (!content.includes('LIGHT MODE BEAUTIFICATION')) {
  fs.writeFileSync(globalCssPath, content + '\n' + beautyFixes);
  console.log('Appended light mode beautification to global.css');
} else {
  console.log('Beautification already present');
}
