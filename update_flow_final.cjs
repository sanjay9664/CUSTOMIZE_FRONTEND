const fs = require('fs');
let code = fs.readFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', 'utf8');

// 1. Fix the crashing bug: liveData.battery -> liveData.batteryFlow
code = code.replace(/liveData\.battery\.toFixed/g, 'liveData.batteryFlow.toFixed');

// 2. Inject CSS Keyframes
const injectCSS = `{/* Connection Lines */}
                 <style>{\`
                   @keyframes flowAnim { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
                   @keyframes flowAnimRev { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 24; } }
                 \`}</style>
                 <svg width="0" height="0">
                    <defs>
                       <filter id="glow-line" x="-20%" y="-20%" width="140%" height="140%">
                         <feGaussianBlur stdDeviation="3" result="blur" />
                         <feComposite in="SourceGraphic" in2="blur" operator="over" />
                       </filter>
                    </defs>
                 </svg>`;
code = code.replace('{/* Connection Lines */}', injectCSS);

// 3. Update FlowLine component
const oldFlowLineStart = code.indexOf('const FlowLine = ({');
const oldFlowLineEnd = code.indexOf(');', oldFlowLineStart) + 2;
const oldFlowLineBlock = code.substring(oldFlowLineStart, oldFlowLineEnd);

const newFlowLineBlock = `const FlowLine = ({ path, color, flowing = true, reverse = false }) => (
  <>
    {/* Base semi-transparent track */}
    <path d={path} fill="none" stroke={color} strokeWidth="2.5" opacity="0.15" />
    {/* Animated glowing dashes */}
    <path 
      d={path} 
      fill="none" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeDasharray={flowing ? "8 12" : "none"} 
      opacity={flowing ? "0.9" : "0.5"} 
      filter="url(#glow-line)"
      style={flowing ? { animation: reverse ? 'flowAnimRev 1s linear infinite' : 'flowAnim 1s linear infinite' } : {}}
    />
  </>
);`;
code = code.replace(oldFlowLineBlock, newFlowLineBlock);

fs.writeFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', code);
console.log('Re-applied the Solis layout with glowing CSS animations and fixed the battery crash!');
