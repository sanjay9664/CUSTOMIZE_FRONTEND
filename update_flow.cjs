const fs = require('fs');
let code = fs.readFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', 'utf8');

const oldFlowLineBlock = `const FlowLine = ({ path, color, flowing = true, reverse = false }) => (
  <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray={flowing ? "6 6" : "none"} opacity="0.8" />
);`;

const newFlowLineBlock = `const FlowLine = ({ path, color, flowing = true, reverse = false }) => (
  <>
    <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray={flowing ? "6 6" : "none"} opacity="0.8" 
          style={flowing ? { animation: reverse ? 'flowAnimRev 0.8s linear infinite' : 'flowAnim 0.8s linear infinite' } : {}} />
  </>
);`;

code = code.replace(oldFlowLineBlock, newFlowLineBlock);

const injectCSS = `{/* Connection Lines */}
                 <style>{\`
                   @keyframes flowAnim { from { stroke-dashoffset: 12; } to { stroke-dashoffset: 0; } }
                   @keyframes flowAnimRev { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 12; } }
                 \`}</style>`;

code = code.replace('{/* Connection Lines */}', injectCSS);

fs.writeFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', code);
console.log('Flow animation successfully added.');
