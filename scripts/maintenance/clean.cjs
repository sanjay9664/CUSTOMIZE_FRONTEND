const fs = require('fs');
const path = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/index.css';
let content = fs.readFileSync(path, 'utf8');

const brokenIndex = content.indexOf('select option, option {');
if (brokenIndex !== -1) {
  content = content.substring(0, brokenIndex);
}

const goodSuffix = `select option, option {
  background-color: #1e293b !important;
  color: #f8fafc !important;
  padding: 10px !important;
}

/* Fix browser autocomplete / datalist list options */
datalist, select:focus, .form-select:focus {
  background-color: #1e293b !important;
  color: #f8fafc !important;
}

body.light-mode {
  color-scheme: light;
  --scada-bg: #d2d3db;
  --scada-sidebar: #e2e8f0;
  --scada-card: #f8fafc;
  --scada-header: #d2d3db;
  --scada-border: rgba(0, 0, 0, 0.08);
  --scada-text: #1e293b;
  --scada-text-muted: #475569;
  --scada-accent: #0284c7;

  --status-running: #047857;
  --status-fault: #b91c1c;
  --status-warning: #b45309;
  --status-stopped: #475569;
}

body.light-mode .scada-header {
  background-color: rgba(210, 211, 219, 0.9);
}

body.light-mode .scada-table thead th {
  background-color: rgba(0, 0, 0, 0.04) !important;
  color: var(--scada-text-muted) !important;
  border-bottom: 2px solid var(--scada-border) !important;
}

body.light-mode .scada-table tbody tr:hover td {
  background-color: rgba(0, 0, 0, 0.03) !important;
  color: var(--scada-text) !important;
}

body.light-mode .scada-table tbody td {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
}

body.light-mode select, 
body.light-mode .form-select, 
body.light-mode select.form-control, 
body.light-mode input.form-control {
  background-color: #f1f5f9 !important;
  color: #1e293b !important;
}

body.light-mode select option, 
body.light-mode option {
  background-color: #f1f5f9 !important;
  color: #1e293b !important;
}

body.light-mode datalist, 
body.light-mode select:focus, 
body.light-mode .form-select:focus {
  background-color: #f1f5f9 !important;
  color: #1e293b !important;
}

/* Update Header dropdown text color for light mode */
body.light-mode .dropdown-menu {
  background-color: #f8fafc !important;
}
body.light-mode .dropdown-menu .dropdown-item {
  color: #1e293b !important;
}
body.light-mode .dropdown-menu .dropdown-item:hover {
  background-color: rgba(0,0,0,0.05) !important;
}
`;

content += goodSuffix;
fs.writeFileSync(path, content);
console.log('Fixed index.css');
