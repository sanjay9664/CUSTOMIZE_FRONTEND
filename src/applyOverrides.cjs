const fs = require('fs');
const globalCssPath = 'c:/Users/SANJAY GUPTA/Desktop/BMS/Frontend/src/global.css';

let content = fs.readFileSync(globalCssPath, 'utf8');

const additions = `
/* GLOBAL LIGHT MODE OVERRIDES FOR BOOTSTRAP AND INLINE STYLES */
body.light-mode .text-white,
body.light-mode .text-light,
body.light-mode [class*="text-white"] {
  color: var(--scada-text) !important;
}

body.light-mode .bg-dark,
body.light-mode [class*="bg-dark"] {
  background-color: var(--scada-sidebar) !important;
}

body.light-mode .text-secondary,
body.light-mode .text-muted {
  color: var(--scada-text-muted) !important;
}

body.light-mode .border-secondary,
body.light-mode .border-white,
body.light-mode [class*="border-white"] {
  border-color: var(--scada-border) !important;
}

body.light-mode [style*="rgba(15, 23, 42"],
body.light-mode [style*="rgba(30, 41, 59"],
body.light-mode [style*="rgba(0, 0, 0, 0.4)"] {
  background-color: var(--scada-card) !important;
  background-image: none !important;
}

body.light-mode .modal-content,
body.light-mode .modal-header,
body.light-mode .modal-body,
body.light-mode .modal-footer {
  background-color: var(--scada-card) !important;
  background: var(--scada-card) !important;
  color: var(--scada-text) !important;
  border-color: var(--scada-border) !important;
}

body.light-mode .VRV-room-card {
  background: var(--scada-card) !important;
  border-color: var(--scada-border) !important;
}

body.light-mode .bg-info.bg-opacity-10 {
  background-color: rgba(2, 132, 199, 0.15) !important;
}

body.light-mode .scada-card {
  background: var(--scada-card) !important;
  background-color: var(--scada-card) !important;
}

body.light-mode [style*="color: #f8fafc"],
body.light-mode [style*="color: '#f8fafc'"],
body.light-mode [style*="color: #fff"],
body.light-mode [style*="color: '#fff'"] {
  color: var(--scada-text) !important;
}

body.light-mode .room-title {
  color: var(--scada-text) !important;
}

body.light-mode .text-info {
    color: #0284c7 !important;
}

body.light-mode .bg-opacity-50 {
    background-color: rgba(248, 250, 252, 0.5) !important;
}
`;

if (!content.includes('GLOBAL LIGHT MODE OVERRIDES FOR BOOTSTRAP AND INLINE STYLES')) {
  fs.writeFileSync(globalCssPath, content + '\n' + additions);
  console.log('Appended light mode overrides to global.css');
} else {
  console.log('Overrides already present in global.css');
}
