const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.css') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/pages');
let darkColors = new Set();
let darkClasses = new Set();

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  
  // Find all hex codes in backgrounds
  const hexMatches = content.match(/background(?:-color)?:\s*['"]?(#[0-9a-fA-F]{3,8})['"]?/g);
  if (hexMatches) {
    hexMatches.forEach(m => {
      const colorMatch = m.match(/#[0-9a-fA-F]{3,8}/);
      if (colorMatch) {
          const color = colorMatch[0].toLowerCase();
          // Approximate dark check
          if (color !== '#ffffff' && color !== '#f8fafc' && color !== '#f1f5f9' && color !== '#e2e8f0' && color !== '#fff') {
              darkColors.add(color);
          }
      }
    });
  }

  // Find all rgba in backgrounds
  const rgbaMatches = content.match(/background(?:-color)?:\s*['"]?(rgba?\([^)]+\))['"]?/g);
  if (rgbaMatches) {
    rgbaMatches.forEach(m => {
      const colorMatch = m.match(/rgba?\([^)]+\)/);
      if(colorMatch) {
          const color = colorMatch[0];
          // Skip pure white backgrounds or light theme colors
          if (!color.includes('255, 255, 255') && !color.includes('248, 250, 252')) {
             darkColors.add(color);
          }
      }
    });
  }
});

console.log('--- DARK COLORS ---');
console.log(Array.from(darkColors).join(', '));
