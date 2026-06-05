const fs = require('fs');
let code = fs.readFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', 'utf8');

// Fix the corrupted className replacements
code = code.replace(/className="fw-bold" style=\{\{\s*color:\s*theme\.text\s*\}\}\s+([^">]+)"/g, 'className="fw-bold $1" style={{ color: theme.text }}');

fs.writeFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', code);
console.log("Fixed syntax");
