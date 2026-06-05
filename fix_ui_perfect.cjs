const fs = require('fs');
let code = fs.readFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', 'utf8');

// 1. Fix NodeBox padding and height to prevent text clipping
const oldNodeBoxDef = `const NodeBox = ({ children, x, y, width = 140, height = 70, borderColor, glowColor = null, zIndex=10, theme, borderRadius = '12px' }) => (
  <div style={{
    position: 'absolute', left: \`\${x}px\`, top: \`\${y}px\`, width: \`\${width}px\`, height: \`\${height}px\`,
    background: theme.isDark ? '#181a1f' : '#ffffff',
    border: \`1px solid \${theme.isDark ? '#2e3238' : '#e2e8f0'}\`,
    borderTop: \`2px solid \${borderColor}\`,
    borderRadius: borderRadius,
    boxShadow: glowColor ? \`0 0 15px \${glowColor}30\` : '0 4px 6px rgba(0,0,0,0.1)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    zIndex: zIndex, transform: 'translate(-50%, -50%)', padding: '4px 10px', overflow: 'visible', boxSizing: 'border-box'
  }}>
    {children}
  </div>
);`;

// Let's fallback if the old NodeBox isn't exactly this string
code = code.replace(/height: `\$\{height\}px`,/g, "minHeight: `${height}px`, height: 'auto',");
code = code.replace(/padding: '10px'/g, "padding: '8px 10px'");
code = code.replace(/padding: '4px 10px'/g, "padding: '8px 10px'");

// 2. Make Solar realistic
const oldSolarIcon = `                 {/* Solar Panel Icon Array */}
                 <div style={{ position: 'absolute', top: '150px', left: '350px', transform: 'translate(-50%, -50%)', zIndex: 11, textAlign: 'center' }}>
                    <Sun className="text-warning mb-1" size={32} />
                    <div style={{ background: '#3b82f6', border: '2px solid #60a5fa', width: '90px', height: '40px', borderRadius: '4px' }}></div>
                 </div>`;

const newSolarIcon = `                 {/* Solar Panel Icon Array */}
                 <div style={{ position: 'absolute', top: '150px', left: '350px', transform: 'translate(-50%, -50%)', zIndex: 11, textAlign: 'center' }}>
                    <Sun className="text-warning mb-1" size={32} style={{ filter: 'drop-shadow(0 0 10px #facc15)' }} />
                    <svg width="100" height="45" viewBox="0 0 100 50">
                       <rect x="0" y="0" width="100" height="50" rx="4" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
                       {/* Grid lines to make it look like a real solar panel */}
                       <line x1="25" y1="0" x2="25" y2="50" stroke="#3b82f6" strokeWidth="2" />
                       <line x1="50" y1="0" x2="50" y2="50" stroke="#3b82f6" strokeWidth="2" />
                       <line x1="75" y1="0" x2="75" y2="50" stroke="#3b82f6" strokeWidth="2" />
                       <line x1="0" y1="25" x2="100" y2="25" stroke="#3b82f6" strokeWidth="2" />
                    </svg>
                 </div>`;

code = code.replace(oldSolarIcon, newSolarIcon);

// 3. Fix Battery Pill overlap by moving it left
const oldBatteryPill = `<NodeBox x={500} y={350} width={120} height={40} borderColor="#a855f7">
                    <div className="text-white fw-bold fs-4">{liveData.batteryFlow.toFixed(0)} W</div>
                 </NodeBox>`;

const newBatteryPill = `<NodeBox x={480} y={350} width={100} height={40} borderColor="#a855f7">
                    <div className="text-white fw-bold fs-4">{liveData.batteryFlow.toFixed(0)} W</div>
                 </NodeBox>`;

code = code.replace(oldBatteryPill, newBatteryPill);

// 4. Fix Battery Icon flex layout so it doesn't overlap leftward, and text is aligned right
const oldBatteryIcon = `                 {/* Battery */}
                 <div style={{ position: 'absolute', top: '350px', left: '600px', transform: 'translate(-50%, -50%)', zIndex: 11, display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="text-center">
                       <div className="text-white fw-bold mb-1" style={{ fontSize: '12px' }}>↑ 9.20 kWh</div>
                       <div style={{ width: '40px', height: '80px', border: '3px solid #10b981', borderRadius: '4px', position: 'relative', background: '#064e3b', padding: '2px' }}>
                          <div style={{ position: 'absolute', top: '-6px', left: '10px', width: '14px', height: '4px', background: '#10b981', borderRadius: '2px 2px 0 0' }}></div>
                          <div style={{ width: '100%', height: '95%', background: '#10b981', position: 'absolute', bottom: '2px', left: '0' }}></div>
                          <div className="w-100 h-100 d-flex flex-column justify-content-around align-items-center position-relative z-1">
                            <div style={{ width:'4px', height:'4px', background:'rgba(255,255,255,0.5)', borderRadius:'50%'}}></div>
                            <div style={{ width:'4px', height:'4px', background:'rgba(255,255,255,0.5)', borderRadius:'50%'}}></div>
                            <div style={{ width:'4px', height:'4px', background:'rgba(255,255,255,0.5)', borderRadius:'50%'}}></div>
                          </div>
                       </div>
                       <div className="text-white fw-bold mt-1" style={{ fontSize: '12px' }}>↓ 3.30 kWh</div>
                    </div>
                    <div>
                       <div className="text-white fw-bold" style={{ fontSize: '36px', lineHeight: '1' }}>{liveData.soc} %</div>
                       <div className="p-2 px-3 mt-2 rounded border fw-bold" style={{ borderColor: '#a855f7', background: 'rgba(168, 85, 247, 0.1)', fontSize: '13px' }}>
                          <div>53.2 V</div>
                          <div>7.3 A</div>
                          <div className="text-info mt-1">{liveData.batteryMode}</div>
                       </div>
                       <div className="text-muted mt-2 fw-bold" style={{ fontSize: '12px' }}>~ 31h 17m (to 20%)</div>
                    </div>
                 </div>`;

const newBatteryIcon = `                 {/* Battery Icon */}
                 <div style={{ position: 'absolute', top: '350px', left: '570px', transform: 'translate(-50%, -50%)', zIndex: 11, textAlign: 'center' }}>
                    <div className="text-white fw-bold mb-1" style={{ fontSize: '12px' }}>↑ 9.20 kWh</div>
                    <div style={{ width: '40px', height: '80px', border: '3px solid #10b981', borderRadius: '4px', position: 'relative', background: '#064e3b', padding: '2px', margin: '0 auto', boxShadow: '0 0 15px rgba(16,185,129,0.2)' }}>
                       <div style={{ position: 'absolute', top: '-6px', left: '10px', width: '14px', height: '4px', background: '#10b981', borderRadius: '2px 2px 0 0' }}></div>
                       <div style={{ width: '100%', height: '95%', background: '#10b981', position: 'absolute', bottom: '2px', left: '0' }}></div>
                       <div className="w-100 h-100 d-flex flex-column justify-content-around align-items-center position-relative z-1">
                         <div style={{ width:'4px', height:'4px', background:'rgba(255,255,255,0.5)', borderRadius:'50%'}}></div>
                         <div style={{ width:'4px', height:'4px', background:'rgba(255,255,255,0.5)', borderRadius:'50%'}}></div>
                         <div style={{ width:'4px', height:'4px', background:'rgba(255,255,255,0.5)', borderRadius:'50%'}}></div>
                       </div>
                    </div>
                    <div className="text-white fw-bold mt-1" style={{ fontSize: '12px' }}>↓ 3.30 kWh</div>
                 </div>

                 {/* Battery Stats (Right aligned) */}
                 <div style={{ position: 'absolute', top: '350px', left: '610px', transform: 'translate(0%, -50%)', zIndex: 11, textAlign: 'left' }}>
                    <div className="text-white fw-bold mb-2" style={{ fontSize: '36px', lineHeight: '1' }}>{liveData.soc} %</div>
                    <div className="p-2 px-3 rounded border fw-bold" style={{ borderColor: '#a855f7', background: theme.isDark ? '#181a1f' : '#ffffff', fontSize: '13px' }}>
                       <div>53.2 V</div>
                       <div>7.3 A</div>
                       <div className="text-info mt-1">{liveData.batteryMode}</div>
                    </div>
                    <div className="text-muted mt-2 fw-bold" style={{ fontSize: '12px' }}>~ 31h 17m (to 20%)</div>
                 </div>`;

code = code.replace(oldBatteryIcon, newBatteryIcon);

fs.writeFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', code);
console.log('Fixed UI clipping, improved solar realism, and corrected battery overlap!');
