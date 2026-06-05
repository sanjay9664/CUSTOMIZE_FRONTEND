const fs = require('fs');
let code = fs.readFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', 'utf8');

// Replace the entire left panel layout (up to RIGHT PANEL)
const oldPanelStart = code.indexOf('{/* Connection Lines');
if (oldPanelStart === -1) {
    console.error("Could not find the start of the panel block!");
    process.exit(1);
}
const oldPanelEnd = code.indexOf('{/* RIGHT PANEL */}');
const oldPanelBlock = code.substring(oldPanelStart, oldPanelEnd);

const newPanelBlock = `{/* Background Overlay for deeper contrast similar to reference image */}
                 <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at center, rgba(14,165,233,0.05) 0%, transparent 60%)', pointerEvents: 'none' }}></div>

                 {/* Connection Lines (Thin grey lines) */}
                 <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                    <path d="M 200 300 L 350 300" stroke="#475569" strokeWidth="2" fill="none" />
                    <path d="M 450 300 L 600 300" stroke="#475569" strokeWidth="2" fill="none" />
                    <path d="M 400 350 L 400 430" stroke="#475569" strokeWidth="2" fill="none" />
                    <path d="M 400 250 L 400 150 L 600 150" stroke="#475569" strokeWidth="2" fill="none" />
                 </svg>

                 {/* Solar Panels (Left) */}
                 <div style={{ position: 'absolute', left: '150px', top: '300px', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center' }}>
                    <svg width="80" height="80" viewBox="0 0 100 100">
                      <rect x="10" y="20" width="80" height="50" fill="none" stroke="#94a3b8" strokeWidth="4" />
                      <line x1="10" y1="45" x2="90" y2="45" stroke="#94a3b8" strokeWidth="4" />
                      <line x1="36" y1="20" x2="36" y2="70" stroke="#94a3b8" strokeWidth="4" />
                      <line x1="63" y1="20" x2="63" y2="70" stroke="#94a3b8" strokeWidth="4" />
                      <rect x="45" y="70" width="10" height="20" fill="#94a3b8" />
                      <line x1="20" y1="90" x2="80" y2="90" stroke="#94a3b8" strokeWidth="4" />
                      {/* Little Sun */}
                      <circle cx="20" cy="15" r="8" fill="#facc15" />
                    </svg>
                    <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>solar panels</div>
                 </div>

                 {/* Flow Arrow: Solar to Inverter */}
                 <div style={{ position: 'absolute', left: '275px', top: '300px', transform: 'translate(-50%, -50%)', zIndex: 11, textAlign: 'center' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 0 10px rgba(14,165,233,0.5)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                    <div style={{ color: '#0ea5e9', fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}>{totalPv} W</div>
                 </div>

                 {/* Inverter (Center) */}
                 <div style={{ position: 'absolute', left: '400px', top: '300px', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center' }}>
                    <svg width="80" height="80" viewBox="0 0 100 100">
                      <rect x="10" y="20" width="80" height="60" rx="10" fill="none" stroke="#94a3b8" strokeWidth="4" />
                      <rect x="30" y="35" width="40" height="15" fill="none" stroke="#94a3b8" strokeWidth="4" rx="4" />
                      <line x1="20" y1="65" x2="20" y2="75" stroke="#94a3b8" strokeWidth="3" />
                      <line x1="30" y1="65" x2="30" y2="75" stroke="#94a3b8" strokeWidth="3" />
                      <line x1="40" y1="65" x2="40" y2="75" stroke="#94a3b8" strokeWidth="3" />
                      <line x1="50" y1="65" x2="50" y2="75" stroke="#94a3b8" strokeWidth="3" />
                      <line x1="60" y1="65" x2="60" y2="75" stroke="#94a3b8" strokeWidth="3" />
                      <line x1="70" y1="65" x2="70" y2="75" stroke="#94a3b8" strokeWidth="3" />
                      <line x1="80" y1="65" x2="80" y2="75" stroke="#94a3b8" strokeWidth="3" />
                    </svg>
                    <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>inverter</div>
                 </div>

                 {/* Flow Arrow: Inverter to House */}
                 <div style={{ position: 'absolute', left: '525px', top: '300px', transform: 'translate(-50%, -50%)', zIndex: 11, textAlign: 'center' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 0 10px rgba(14,165,233,0.5)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                    <div style={{ color: '#0ea5e9', fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}>{liveData.load.toFixed(0)} W</div>
                 </div>

                 {/* House (Right) */}
                 <div style={{ position: 'absolute', left: '650px', top: '300px', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center' }}>
                    <svg width="70" height="70" viewBox="0 0 100 100">
                      <path d="M 10 50 L 50 15 L 90 50 L 90 90 L 10 90 Z" fill="none" stroke="#94a3b8" strokeWidth="4" />
                      <rect x="25" y="60" width="15" height="15" fill="none" stroke="#94a3b8" strokeWidth="4" />
                      <rect x="60" y="60" width="15" height="15" fill="none" stroke="#94a3b8" strokeWidth="4" />
                      <rect x="40" y="60" width="20" height="30" fill="none" stroke="#94a3b8" strokeWidth="4" />
                    </svg>
                    <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>house</div>
                 </div>

                 {/* Flow Arrow: Inverter to Battery */}
                 <div style={{ position: 'absolute', left: '400px', top: '390px', transform: 'translate(-50%, -50%)', zIndex: 11, textAlign: 'center' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 0 10px rgba(14,165,233,0.5)', transform: 'rotate(90deg)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                    <div style={{ position: 'absolute', left: '35px', top: '6px', color: '#0ea5e9', fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap' }}>{liveData.batteryFlow.toFixed(0)} W</div>
                 </div>

                 {/* Battery Bank (Bottom Center) */}
                 <div style={{ position: 'absolute', left: '400px', top: '480px', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center' }}>
                    <svg width="120" height="60" viewBox="0 0 200 100">
                      {/* Bat 1 */}
                      <rect x="10" y="40" width="35" height="50" rx="4" fill="none" stroke="#94a3b8" strokeWidth="4" />
                      <rect x="15" y="30" width="8" height="10" fill="#94a3b8" />
                      <rect x="32" y="30" width="8" height="10" fill="#94a3b8" />
                      {/* Bat 2 */}
                      <rect x="60" y="40" width="35" height="50" rx="4" fill="none" stroke="#94a3b8" strokeWidth="4" />
                      <rect x="65" y="30" width="8" height="10" fill="#94a3b8" />
                      <rect x="82" y="30" width="8" height="10" fill="#94a3b8" />
                      {/* Bat 3 */}
                      <rect x="110" y="40" width="35" height="50" rx="4" fill="none" stroke="#94a3b8" strokeWidth="4" />
                      <rect x="115" y="30" width="8" height="10" fill="#94a3b8" />
                      <rect x="132" y="30" width="8" height="10" fill="#94a3b8" />
                      {/* Bat 4 */}
                      <rect x="160" y="40" width="35" height="50" rx="4" fill="none" stroke="#94a3b8" strokeWidth="4" />
                      <rect x="165" y="30" width="8" height="10" fill="#94a3b8" />
                      <rect x="182" y="30" width="8" height="10" fill="#94a3b8" />
                      {/* Connection line */}
                      <line x1="20" y1="15" x2="170" y2="15" stroke="#0ea5e9" strokeWidth="4" />
                      <line x1="20" y1="15" x2="20" y2="30" stroke="#0ea5e9" strokeWidth="4" />
                      <line x1="70" y1="15" x2="70" y2="30" stroke="#0ea5e9" strokeWidth="4" />
                      <line x1="120" y1="15" x2="120" y2="30" stroke="#0ea5e9" strokeWidth="4" />
                      <line x1="170" y1="15" x2="170" y2="30" stroke="#0ea5e9" strokeWidth="4" />
                      <line x1="95" y1="0" x2="95" y2="15" stroke="#475569" strokeWidth="4" />
                    </svg>
                    <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>battery bank ({liveData.soc}%)</div>
                 </div>

                 {/* Flow Arrow: Grid to Inverter (or vice versa) */}
                 <div style={{ position: 'absolute', left: '500px', top: '150px', transform: 'translate(-50%, -50%)', zIndex: 11, textAlign: 'center' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 0 10px rgba(14,165,233,0.5)', transform: 'rotate(180deg)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                    <div style={{ color: '#0ea5e9', fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}>0 W</div>
                 </div>

                 {/* Grid / Generator (Top Right) */}
                 <div style={{ position: 'absolute', left: '650px', top: '150px', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center' }}>
                    <svg width="60" height="60" viewBox="0 0 100 100">
                      <rect x="20" y="30" width="60" height="50" rx="8" fill="none" stroke="#94a3b8" strokeWidth="4" />
                      <line x1="30" y1="30" x2="30" y2="20" stroke="#94a3b8" strokeWidth="4" />
                      <line x1="70" y1="30" x2="70" y2="20" stroke="#94a3b8" strokeWidth="4" />
                      <rect x="15" y="45" width="5" height="20" fill="#94a3b8" />
                      <rect x="80" y="45" width="5" height="20" fill="#94a3b8" />
                      <circle cx="50" cy="55" r="12" fill="none" stroke="#94a3b8" strokeWidth="4" />
                      <path d="M 50 43 L 50 67 M 38 55 L 62 55" stroke="#94a3b8" strokeWidth="4" />
                    </svg>
                    <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>grid supply</div>
                 </div>

              </Card>
           </Col>
`;
code = code.replace(oldPanelBlock, newPanelBlock);

fs.writeFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', code);
console.log('Applied simple schematic illustrative layout!');
