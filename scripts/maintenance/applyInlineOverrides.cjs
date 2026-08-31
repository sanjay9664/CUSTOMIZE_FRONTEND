const fs = require('fs');
const path = require('path');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

const hexes = ['#0f172a', '#1e293b', '#020617', '#111827', '#0c121e', '#0b1121', '#0b1120', '#11151c', '#0f131a', '#030712', '#05070a', '#0d1525', '#334155', '#1e1e1e', '#121212', '#0a0a0a', '#000000', '#111111', '#1a1a1a', '#1a202c', '#2d3748', '#202a3b'];

const rgbas = [
  'rgba(0, 0, 0, 0.2)', 'rgba(0,0,0,0.2)',
  'rgba(0, 0, 0, 0.3)', 'rgba(0,0,0,0.3)',
  'rgba(0, 0, 0, 0.4)', 'rgba(0,0,0,0.4)',
  'rgba(0, 0, 0, 0.5)', 'rgba(0,0,0,0.5)',
  'rgba(0, 0, 0, 0.6)', 'rgba(0,0,0,0.6)',
  'rgba(0, 0, 0, 0.7)', 'rgba(0,0,0,0.7)',
  'rgba(0, 0, 0, 0.8)', 'rgba(0,0,0,0.8)',
  'rgba(0, 0, 0, 0.9)', 'rgba(0,0,0,0.9)',
  'rgba(15, 23, 42, 0.4)', 'rgba(15, 23, 42, 0.6)', 'rgba(15, 23, 42, 0.8)', 'rgba(15, 23, 42, 0.95)', 'rgba(15, 23, 42, 0.55)', 'rgba(15, 23, 42, 0.94)', 'rgba(15, 23, 42, 0.7)', 'rgba(15, 23, 42, 0.85)', 'rgba(15, 23, 42, 0.5)', 'rgba(15, 23, 42, 0.9)', 'rgba(15, 23, 42, 1)', 'rgba(15, 23, 42, 0.45)', 'rgba(15, 23, 42, 0.2)',
  'rgba(15,23,42,0.6)', 'rgba(15,23,42,0.72)', 'rgba(15,23,42,0.92)',
  'rgba(30, 41, 59, 0.3)', 'rgba(30, 41, 59, 0.4)', 'rgba(30, 41, 59, 0.55)', 'rgba(30, 41, 59, 0.8)',
  'rgba(10, 15, 30, 0.7)', 'rgba(2, 6, 23, 0.6)', 'rgba(20, 22, 27, 0.65)'
];

const cssLines = [];

// Convert Hex to RGB for attribute selector matching
const hexToRgb = hex => {
  if(hex.length === 4) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 'rgb(' + r + ', ' + g + ', ' + b + ')';
};

hexes.forEach(h => {
  const rgb = hexToRgb(h);
  // React renders <div style={{ background: '#0f172a' }}> as style="background: rgb(15, 23, 42);" or style="background-color: rgb(...);"
  cssLines.push('body.light-mode [style*="' + rgb + '"]');
  // It also might just be the hex string if it's set as a string in raw HTML somehow
  cssLines.push('body.light-mode [style*="' + h + '"]');
});

rgbas.forEach(rgba => {
  cssLines.push('body.light-mode [style*="' + rgba + '"]');
  // Handle spacing variations that React might produce
  const noSpace = rgba.replace(/,\s+/g, ',');
  const withSpace = rgba.replace(/,/g, ', ');
  if (rgba !== noSpace) cssLines.push('body.light-mode [style*="' + noSpace + '"]');
  if (rgba !== withSpace) cssLines.push('body.light-mode [style*="' + withSpace + '"]');
});

// For text colors that were rendered white on dark backgrounds, make them dark text
// Example: style={{ color: '#fff' }} on a dark background
const cssTextLines = [];
['#fff', '#ffffff', 'rgb(255, 255, 255)'].forEach(c => {
  // We can't safely override ALL white text globally because some text is legitimately white on colored buttons.
  // We only target white text if it's inside one of our dark-overridden panels.
});

let finalCss = '\\n/* ULTIMATE INLINE STYLE OVERRIDES FOR DARK BACKGROUNDS */\\n';
finalCss += cssLines.join(',\\n') + ' {\\n  background: var(--scada-card) !important;\\n  background-color: var(--scada-card) !important;\\n  background-image: none !important;\\n}\\n';

let content = fs.readFileSync(globalCssPath, 'utf8');
if (!content.includes('ULTIMATE INLINE STYLE OVERRIDES')) {
  fs.writeFileSync(globalCssPath, content + finalCss);
  console.log('Appended ultimate inline style overrides');
} else {
  // Replace the old one just in case
  const updated = content.replace(/\/\* ULTIMATE INLINE STYLE OVERRIDES[\s\S]*?\}\n/, finalCss);
  fs.writeFileSync(globalCssPath, updated);
  console.log('Updated ultimate inline style overrides');
}
