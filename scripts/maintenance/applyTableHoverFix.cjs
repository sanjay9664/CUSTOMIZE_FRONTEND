const fs = require('fs');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

let content = fs.readFileSync(globalCssPath, 'utf8');

const tableHoverFix = `
/* =========================================================
   TABLE HOVER FIX FOR LIGHT MODE
   ========================================================= */

/* Override Bootstrap's dark table hover in light mode */
body.light-mode .table-dark.table-hover > tbody > tr:hover > *,
body.light-mode .table.table-hover > tbody > tr:hover > *,
body.light-mode .table-hover > tbody > tr:hover > td,
body.light-mode .table-hover > tbody > tr:hover > th {
    background-color: #f1f5f9 !important;
    color: var(--scada-text) !important;
}

/* Also ensure text inside hover state remains dark */
body.light-mode .table-hover > tbody > tr:hover td .text-white,
body.light-mode .table-hover > tbody > tr:hover td .text-secondary {
    color: var(--scada-text) !important;
}

/* Fix specific custom hover classes */
body.light-mode .hover-bg-blue:hover {
    background: #e0f2fe !important; /* light blue for light mode */
}
`;

if (!content.includes('TABLE HOVER FIX FOR LIGHT MODE')) {
  fs.writeFileSync(globalCssPath, content + '\n' + tableHoverFix);
  console.log('Appended Table Hover fix to global.css');
} else {
  console.log('Table Hover fix already present');
}
