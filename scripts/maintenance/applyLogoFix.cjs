const fs = require('fs');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

let content = fs.readFileSync(globalCssPath, 'utf8');

const logoFix = `
/* =========================================================
   LOGO VISIBILITY FIX FOR LIGHT MODE
   ========================================================= */

/* Place the white/blue dark-mode logo inside a beautiful premium dark badge */
body.light-mode img[src*="logo.png"] {
    background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%) !important;
    padding: 10px 20px !important;
    border-radius: 14px !important;
    box-shadow: 0 8px 25px -5px rgba(15, 23, 42, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(10px) !important;
    
    /* Ensure the image scales correctly within its new padding */
    object-fit: contain !important;
}
`;

if (!content.includes('LOGO VISIBILITY FIX FOR LIGHT MODE')) {
  fs.writeFileSync(globalCssPath, content + '\n' + logoFix);
  console.log('Appended logo fix to global.css');
} else {
  console.log('Logo fix already present');
}
