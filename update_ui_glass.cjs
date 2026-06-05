const fs = require('fs');
let code = fs.readFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', 'utf8');

// Add Home icon to import
if (!code.includes('Home,')) {
    code = code.replace('import { Sun, Battery, Zap, RefreshCw,', 'import { Sun, Battery, Zap, RefreshCw, Home,');
}

// Replace NodeBox definition
const oldNodeBoxStart = code.indexOf('const NodeBox = ({ children, x, y, width = 140');
const oldNodeBoxEnd = code.indexOf(');', oldNodeBoxStart) + 2;
const oldNodeBoxBlock = code.substring(oldNodeBoxStart, oldNodeBoxEnd);

const newNodeBoxBlock = `const NodeBox = ({ children, x, y, width = 160, height = 90, borderColor, glowColor = null, zIndex=10, theme }) => (
  <div style={{
    position: 'absolute', left: \`\${x}px\`, top: \`\${y}px\`, width: \`\${width}px\`, height: \`\${height}px\`,
    background: theme.isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    border: \`1px solid \${theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}\`,
    borderRadius: '24px',
    boxShadow: glowColor ? \`0 15px 35px \${glowColor}25, inset 0 1px 1px rgba(255,255,255,0.1)\` : '0 15px 35px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    zIndex: zIndex, transform: 'translate(-50%, -50%)', padding: '16px', overflow: 'hidden', boxSizing: 'border-box'
  }}>
    <div style={{ position: 'absolute', top: 0, left: '15%', width: '70%', height: '3px', background: \`linear-gradient(90deg, transparent, \${borderColor}, transparent)\` }}></div>
    {children}
  </div>
);`;
code = code.replace(oldNodeBoxBlock, newNodeBoxBlock);


// Replace SVG FlowLine definition to include animation css
const oldFlowLineStart = code.indexOf('const FlowLine = ({ path, color, flowing = true, reverse = false }) => (');
const oldFlowLineEnd = code.indexOf(');', oldFlowLineStart) + 2;
const oldFlowLineBlock = code.substring(oldFlowLineStart, oldFlowLineEnd);

const newFlowLineBlock = `const FlowLine = ({ path, color, flowing = true, reverse = false }) => (
  <>
    <path d={path} fill="none" stroke={color} strokeWidth="8" opacity="0.1" strokeLinecap="round" />
    <path d={path} fill="none" stroke={color} strokeWidth="2" opacity="0.3" strokeLinecap="round" />
    {flowing && (
      <path 
        d={path} 
        fill="none" 
        stroke={color} 
        strokeWidth="3" 
        strokeDasharray="6 15" 
        strokeLinecap="round"
        style={{
           animation: reverse ? 'flowAnimRev 1.5s linear infinite' : 'flowAnim 1.5s linear infinite',
           filter: \`drop-shadow(0 0 6px \${color})\`
        }}
      />
    )}
  </>
);`;
code = code.replace(oldFlowLineBlock, newFlowLineBlock);

// Replace the left panel content entirely
const oldPanelStart = code.indexOf('{/* Connection Lines (Clean, logical flow) */}');
if (oldPanelStart === -1) {
    console.error("Could not find the old panel block start!");
    process.exit(1);
}
const oldPanelEnd = code.indexOf('{/* RIGHT PANEL */}');
const oldPanelBlock = code.substring(oldPanelStart, oldPanelEnd);

const newPanelBlock = `{/* Ambient Background Glows */}
                 <style>{\`
                   @keyframes flowAnim { from { stroke-dashoffset: 42; } to { stroke-dashoffset: 0; } }
                   @keyframes flowAnimRev { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 42; } }
                 \`}</style>
                 <div style={{ position: 'absolute', top: '150px', left: '200px', width: '300px', height: '300px', background: '#facc15', filter: 'blur(150px)', opacity: theme.isDark ? 0.05 : 0.02, borderRadius: '50%', pointerEvents: 'none' }}></div>
                 <div style={{ position: 'absolute', top: '350px', left: '400px', width: '300px', height: '300px', background: '#10b981', filter: 'blur(150px)', opacity: theme.isDark ? 0.05 : 0.02, borderRadius: '50%', pointerEvents: 'none' }}></div>
                 
                 {/* Connection Lines */}
                 <FlowLine path="M 200 135 C 200 230, 350 230, 350 260" color="#eab308" flowing={true} /> {/* PV1 to Inverter */}
                 <FlowLine path="M 500 135 C 500 230, 350 230, 350 260" color="#eab308" flowing={true} /> {/* PV2 to Inverter */}
                 
                 <FlowLine path="M 190 350 L 260 350" color="#ef4444" flowing={false} reverse={true} /> {/* Grid to Inverter */}
                 <FlowLine path="M 440 350 L 510 350" color="#a855f7" flowing={true} /> {/* Inverter to Battery */}
                 
                 <FlowLine path="M 350 440 L 350 510" color="#0ea5e9" flowing={true} /> {/* Inverter to Load */}

                 {/* Nodes */}
                 
                 {/* PV 1 (Top Left) */}
                 <NodeBox theme={theme} x={200} y={120} width={150} height={90} borderColor="#eab308" glowColor="#eab308">
                    <div className="d-flex align-items-center justify-content-center gap-2 mb-1 w-100">
                       <Sun size={14} color="#eab308" />
                       <span className="text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>SOLAR 1</span>
                    </div>
                    <div className="fw-bold fs-3 mb-1" style={{ color: theme.text }}>{liveData.pv1.toFixed(0)} <span className="fs-6 text-muted">W</span></div>
                    <div className="text-muted" style={{ fontSize: '10px' }}>148.8 V • 4.3 A</div>
                 </NodeBox>

                 {/* PV 2 (Top Right) */}
                 <NodeBox theme={theme} x={500} y={120} width={150} height={90} borderColor="#eab308" glowColor="#eab308">
                    <div className="d-flex align-items-center justify-content-center gap-2 mb-1 w-100">
                       <Sun size={14} color="#eab308" />
                       <span className="text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>SOLAR 2</span>
                    </div>
                    <div className="fw-bold fs-3 mb-1" style={{ color: theme.text }}>{liveData.pv2.toFixed(0)} <span className="fs-6 text-muted">W</span></div>
                    <div className="text-muted" style={{ fontSize: '10px' }}>312.8 V • 3.9 A</div>
                 </NodeBox>

                 {/* Grid (Middle Left) */}
                 <NodeBox theme={theme} x={120} y={350} width={140} height={100} borderColor="#ef4444" glowColor="#ef4444">
                    <div className="d-flex align-items-center justify-content-center gap-2 mb-1 w-100">
                       <Zap size={14} color="#ef4444" />
                       <span className="text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>GRID</span>
                    </div>
                    <div className="fw-bold fs-2 mb-1" style={{ color: theme.text }}>0 <span className="fs-5 text-muted">W</span></div>
                    <div className="d-flex gap-3 text-muted fw-bold" style={{ fontSize: '10px' }}>
                       <span className="text-success">↑ 0 kWh</span>
                       <span className="text-danger">↓ 0 kWh</span>
                    </div>
                 </NodeBox>

                 {/* INVERTER (Center Hub) */}
                 <NodeBox theme={theme} x={350} y={350} width={200} height={180} borderColor="#10b981" glowColor="#10b981">
                    <div className="w-100 d-flex justify-content-between align-items-center mb-3">
                       <div className="d-flex align-items-center gap-2">
                         <Activity size={18} color="#10b981" />
                         <span className="fw-bold" style={{ fontSize: "14px", color: theme.text, letterSpacing: "1px" }}>INVERTER</span>
                       </div>
                       <div className="text-success fw-bold" style={{ fontSize: '10px', background: 'rgba(16,185,129,0.1)', padding: '3px 6px', borderRadius: '4px' }}>98.5% EFF</div>
                    </div>
                    <div className="text-center w-100 mb-3" style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>
                       CONVERTS DC ↔ AC
                    </div>
                    <div className="w-100 flex-grow-1 d-flex flex-column gap-2" style={{ fontSize: '12px', color: theme.muted }}>
                       <div className="d-flex justify-content-between"><span>Voltage</span><span className="fw-bold" style={{ color: theme.text }}>232.9 V</span></div>
                       <div className="d-flex justify-content-between"><span>Current</span><span className="fw-bold" style={{ color: theme.text }}>9.8 A</span></div>
                       <div className="d-flex justify-content-between"><span>Frequency</span><span className="fw-bold" style={{ color: theme.text }}>60.0 Hz</span></div>
                    </div>
                 </NodeBox>

                 {/* Battery (Middle Right) */}
                 <NodeBox theme={theme} x={580} y={350} width={140} height={130} borderColor="#a855f7" glowColor="#a855f7">
                    <div className="d-flex align-items-center justify-content-center gap-2 mb-2 w-100">
                       <Battery size={14} color="#a855f7" />
                       <span className="text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>BATTERY</span>
                    </div>
                    <div className="fw-bold fs-2 mb-1" style={{ color: theme.text }}>{liveData.soc} <span className="fs-5 text-muted">%</span></div>
                    <div className="text-info fw-bold mb-2" style={{ fontSize: '10px', background: 'rgba(14,165,233,0.1)', padding: '3px 8px', borderRadius: '10px' }}>{liveData.batteryMode}</div>
                    <div className="w-100 d-flex justify-content-between text-muted fw-bold" style={{ fontSize: '10px' }}>
                       <span className="text-success">↑ 9.2</span>
                       <span className="text-danger">↓ 3.3</span>
                    </div>
                 </NodeBox>

                 {/* Load (Bottom Center) */}
                 <NodeBox theme={theme} x={350} y={560} width={150} height={100} borderColor="#0ea5e9" glowColor="#0ea5e9">
                    <div className="d-flex align-items-center justify-content-center gap-2 mb-1 w-100">
                       <Home size={14} color="#0ea5e9" />
                       <span className="text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>HOME LOAD</span>
                    </div>
                    <div className="fw-bold fs-2 mb-1" style={{ color: theme.text }}>{liveData.load.toFixed(0)} <span className="fs-5 text-muted">W</span></div>
                    <div className="fw-bold" style={{ fontSize: '11px', color: '#0ea5e9' }}>Daily: 9.9 kWh</div>
                 </NodeBox>

                 {/* Production & Load Summary Stats */}
                 <div style={{ position: 'absolute', bottom: '15px', left: '0', width: '100%', display: 'flex', gap: '20px', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div className="p-3 rounded" style={{ pointerEvents: 'auto', background: theme.isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: \`1px solid \${theme.cardBorder}\`, borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                       <div className="text-center text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '1px' }}>PRODUCTION MIX</div>
                       <div className="d-flex gap-4 text-center" style={{ fontSize: '11px' }}>
                          <div><Sun size={14} className="text-warning mb-1" /><br/>Solar<br/><span className="text-muted">(7.6 kWh)</span><br/><b style={{ fontSize: '12px', color: theme.text }}>45.0 %</b></div>
                          <div><Battery size={14} className="text-success mb-1" /><br/>Battery<br/><span className="text-muted">(9.2 kWh)</span><br/><b style={{ fontSize: '12px', color: theme.text }}>55.0 %</b></div>
                          <div><Zap size={14} className="text-danger mb-1" /><br/>Grid<br/><span className="text-muted">(0.0 kWh)</span><br/><b style={{ fontSize: '12px', color: theme.text }}>0.0 %</b></div>
                       </div>
                    </div>
                    <div className="p-3 rounded" style={{ pointerEvents: 'auto', background: theme.isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: \`1px solid \${theme.cardBorder}\`, borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                       <div className="text-center text-muted fw-bold mb-2" style={{ fontSize: '10px', letterSpacing: '1px' }}>LOAD CONSUMPTION</div>
                       <div className="d-flex gap-4 text-center" style={{ fontSize: '11px' }}>
                          <div><Sun size={14} className="text-warning mb-1" /><br/>Solar<br/><span className="text-muted">(7.6 kWh)</span><br/><b style={{ fontSize: '12px', color: theme.text }}>77.0 %</b></div>
                          <div><Battery size={14} className="text-success mb-1" /><br/>Battery<br/><span className="text-muted">(3.3 kWh)</span><br/><b style={{ fontSize: '12px', color: theme.text }}>33.0 %</b></div>
                          <div><Zap size={14} className="text-danger mb-1" /><br/>Grid<br/><span className="text-muted">(0.0 kWh)</span><br/><b style={{ fontSize: '12px', color: theme.text }}>0.0 %</b></div>
                       </div>
                    </div>
                 </div>

              </Card>
           </Col>
`;
code = code.replace(oldPanelBlock, newPanelBlock);

fs.writeFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', code);
console.log('UI Premium Upgrade applied!');
