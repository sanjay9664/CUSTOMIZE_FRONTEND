const fs = require('fs');
let code = fs.readFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', 'utf8');

// Fix dangling quote after theme.text }}
code = code.replace(/style=\{\{\s*color:\s*theme\.text\s*\}\}\"/g, 'style={{ color: theme.text }}');

// Fix any double styles generated: style={{ ... }} style={{ ... }}
code = code.replace(/style=\{\{(.*?)\}\}\s*style=\{\{(.*?)\}\}/g, 'style={{ $1, $2 }}');

fs.writeFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', code);
console.log('JSX Syntax fixes applied!');
