const fs = require('fs');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

let content = fs.readFileSync(globalCssPath, 'utf8');

const svgFixes = `
/* =========================================================
   SVG NEEDLE & TEXT FIXES FOR LIGHT MODE
   ========================================================= */

/* The gauge needle and center dot use #1e293b. We previously turned this white. 
   We must turn it dark (scada-text) so it's visible on the white gauge face! */
body.light-mode svg path[fill="#1e293b"],
body.light-mode svg circle[fill="#1e293b"] {
  fill: var(--scada-text) !important;
}

/* The gauge text ("12.6 BAR") uses fill="#fff". 
   Since the background is now white, white text is invisible. 
   Convert it to dark text! */
body.light-mode svg text[fill="#fff"],
body.light-mode svg text[fill="#ffffff"] {
  fill: var(--scada-text) !important;
  text-shadow: none !important; /* Remove any glowing shadow if present */
}

/* Also fix the line ticks in the gauge if they became invisible */
body.light-mode svg line[stroke="#1e293b"] {
  stroke: var(--scada-text) !important;
}
`;

if (!content.includes('SVG NEEDLE & TEXT FIXES')) {
  fs.writeFileSync(globalCssPath, content + '\n' + svgFixes);
  console.log('Appended SVG needle & text fixes to global.css');
} else {
  console.log('SVG needle & text fixes already present');
}
