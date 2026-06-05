const fs = require('fs');
let code = fs.readFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', 'utf8');

const oldPanelStart = code.indexOf('{/* Background Overlay');
if (oldPanelStart === -1) {
    console.error("Could not find the start of the panel block!");
    process.exit(1);
}
const oldPanelEnd = code.indexOf('{/* RIGHT PANEL */}');
const oldPanelBlock = code.substring(oldPanelStart, oldPanelEnd);

const newPanelBlock = `{/* Background Overlay */}
                 <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', background: theme.isDark ? 'radial-gradient(circle at center, rgba(14,165,233,0.03) 0%, transparent 70%)' : 'none' }}></div>

                 {/* Sun & Rays */}
                 <div style={{ position: 'absolute', left: '100px', top: '80px', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center' }}>
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="25" fill="#facc15" />
                      {/* Sun Rays */}
                      <path d="M 50 15 L 50 5 M 50 85 L 50 95 M 15 50 L 5 50 M 85 50 L 95 50 M 25 25 L 18 18 M 75 75 L 82 82 M 25 75 L 18 82 M 75 25 L 82 18" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                 </div>
                 {/* Wavy Sunlight Arrows */}
                 <svg style={{ position: 'absolute', left: '120px', top: '120px', width: '100px', height: '150px', zIndex: 9 }}>
                    <path d="M 10 10 Q 25 30 10 50 T 10 90 L 5 80 M 10 90 L 15 80" fill="none" stroke="#f59e0b" strokeWidth="3" />
                    <path d="M 40 10 Q 55 30 40 50 T 40 90 L 35 80 M 40 90 L 45 80" fill="none" stroke="#f59e0b" strokeWidth="3" />
                    <path d="M 70 10 Q 85 30 70 50 T 70 90 L 65 80 M 70 90 L 75 80" fill="none" stroke="#f59e0b" strokeWidth="3" />
                    <text x="80" y="40" fill="#f59e0b" fontSize="10" fontWeight="bold">SUNLIGHT</text>
                 </svg>

                 {/* PV Array (Bottom Left) */}
                 <div style={{ position: 'absolute', left: '150px', top: '350px', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center' }}>
                    <svg width="120" height="80" viewBox="0 0 120 80">
                      <g stroke={theme.isDark ? '#94a3b8' : '#64748b'} strokeWidth="2" fill={theme.isDark ? '#1e293b' : '#e2e8f0'}>
                         <rect x="5" y="10" width="30" height="60" transform="skewY(-10)" />
                         <rect x="40" y="10" width="30" height="60" transform="skewY(-10)" />
                         <rect x="75" y="10" width="30" height="60" transform="skewY(-10)" />
                      </g>
                      <g stroke={theme.isDark ? '#475569' : '#94a3b8'} strokeWidth="1">
                         <line x1="5" y1="40" x2="105" y2="40" transform="skewY(-10)" />
                         <line x1="20" y1="10" x2="20" y2="70" transform="skewY(-10)" />
                         <line x1="55" y1="10" x2="55" y2="70" transform="skewY(-10)" />
                         <line x1="90" y1="10" x2="90" y2="70" transform="skewY(-10)" />
                      </g>
                    </svg>
                    <div className="fw-bold mt-2" style={{ color: theme.text, fontSize: '12px' }}>PV ARRAY</div>
                 </div>

                 {/* Inverter (Center) */}
                 <div style={{ position: 'absolute', left: '400px', top: '350px', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center' }}>
                    <svg width="90" height="70" viewBox="0 0 100 80">
                      <rect x="10" y="10" width="80" height="60" fill={theme.isDark ? '#1e293b' : '#f8fafc'} stroke={theme.isDark ? '#94a3b8' : '#64748b'} strokeWidth="3" />
                      <rect x="15" y="15" width="70" height="15" fill={theme.isDark ? '#334155' : '#e2e8f0'} />
                      <line x1="50" y1="30" x2="50" y2="70" stroke={theme.isDark ? '#94a3b8' : '#64748b'} strokeWidth="2" />
                    </svg>
                    <div className="fw-bold mt-2" style={{ color: theme.text, fontSize: '12px' }}>INVERTER</div>
                 </div>

                 {/* Monitor System (Top Center) */}
                 <div style={{ position: 'absolute', left: '400px', top: '150px', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center' }}>
                    <svg width="70" height="70" viewBox="0 0 100 100">
                      <rect x="10" y="20" width="80" height="50" rx="4" fill={theme.isDark ? '#1e293b' : '#f8fafc'} stroke={theme.isDark ? '#94a3b8' : '#64748b'} strokeWidth="3" />
                      <path d="M 20 55 L 40 40 L 55 50 L 80 30" fill="none" stroke="#10b981" strokeWidth="3" />
                      <rect x="40" y="70" width="20" height="10" fill={theme.isDark ? '#94a3b8' : '#64748b'} />
                      <rect x="25" y="80" width="50" height="5" fill={theme.isDark ? '#94a3b8' : '#64748b'} />
                    </svg>
                    <div className="fw-bold mt-1" style={{ color: theme.text, fontSize: '12px' }}>MONITOR SYSTEM</div>
                 </div>

                 {/* Battery Bank (Bottom Center) */}
                 <div style={{ position: 'absolute', left: '400px', top: '530px', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center' }}>
                    <svg width="100" height="70" viewBox="0 0 100 80">
                      <rect x="10" y="10" width="35" height="25" fill={theme.isDark ? '#334155' : '#64748b'} />
                      <rect x="55" y="10" width="35" height="25" fill={theme.isDark ? '#334155' : '#64748b'} />
                      <rect x="10" y="45" width="35" height="25" fill={theme.isDark ? '#334155' : '#64748b'} />
                      <rect x="55" y="45" width="35" height="25" fill={theme.isDark ? '#334155' : '#64748b'} />
                      <circle cx="20" cy="10" r="3" fill="#94a3b8" /> <circle cx="35" cy="10" r="3" fill="#94a3b8" />
                      <circle cx="65" cy="10" r="3" fill="#94a3b8" /> <circle cx="80" cy="10" r="3" fill="#94a3b8" />
                      <circle cx="20" cy="45" r="3" fill="#94a3b8" /> <circle cx="35" cy="45" r="3" fill="#94a3b8" />
                      <circle cx="65" cy="45" r="3" fill="#94a3b8" /> <circle cx="80" cy="45" r="3" fill="#94a3b8" />
                    </svg>
                    <div className="fw-bold mt-1" style={{ color: theme.text, fontSize: '12px' }}>BATTERY BANK</div>
                 </div>

                 {/* Power Transformer (Right Center) */}
                 <div style={{ position: 'absolute', left: '600px', top: '350px', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center' }}>
                    <svg width="80" height="70" viewBox="0 0 100 90">
                      <rect x="15" y="30" width="70" height="50" fill={theme.isDark ? '#e2e8f0' : '#94a3b8'} stroke={theme.isDark ? '#94a3b8' : '#475569'} strokeWidth="2" />
                      <line x1="25" y1="30" x2="25" y2="80" stroke="#475569" strokeWidth="2" />
                      <line x1="35" y1="30" x2="35" y2="80" stroke="#475569" strokeWidth="2" />
                      <line x1="45" y1="30" x2="45" y2="80" stroke="#475569" strokeWidth="2" />
                      <line x1="55" y1="30" x2="55" y2="80" stroke="#475569" strokeWidth="2" />
                      <line x1="65" y1="30" x2="65" y2="80" stroke="#475569" strokeWidth="2" />
                      <line x1="75" y1="30" x2="75" y2="80" stroke="#475569" strokeWidth="2" />
                      <rect x="25" y="15" width="6" height="15" fill={theme.isDark ? '#94a3b8' : '#64748b'} />
                      <rect x="47" y="15" width="6" height="15" fill={theme.isDark ? '#94a3b8' : '#64748b'} />
                      <rect x="69" y="15" width="6" height="15" fill={theme.isDark ? '#94a3b8' : '#64748b'} />
                      <circle cx="28" cy="12" r="4" fill={theme.isDark ? '#475569' : '#334155'} />
                      <circle cx="50" cy="12" r="4" fill={theme.isDark ? '#475569' : '#334155'} />
                      <circle cx="72" cy="12" r="4" fill={theme.isDark ? '#475569' : '#334155'} />
                    </svg>
                    <div className="fw-bold mt-1" style={{ color: theme.text, fontSize: '11px' }}>POWER TRANSFORMER</div>
                 </div>

                 {/* Grid Pylon (Far Right) */}
                 <div style={{ position: 'absolute', left: '800px', top: '250px', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center' }}>
                    <svg width="80" height="100" viewBox="0 0 100 120">
                      <path d="M 40 10 L 60 10 L 80 120 L 20 120 Z" fill="none" stroke={theme.isDark ? '#94a3b8' : '#475569'} strokeWidth="3" />
                      <path d="M 10 30 L 90 30 M 20 60 L 80 60 M 30 90 L 70 90" stroke={theme.isDark ? '#94a3b8' : '#475569'} strokeWidth="2" />
                      <path d="M 45 10 L 20 120 M 55 10 L 80 120" stroke={theme.isDark ? '#94a3b8' : '#475569'} strokeWidth="1" />
                      <path d="M 10 30 L 50 60 L 90 30 M 20 60 L 50 90 L 80 60 M 30 90 L 50 120 L 70 90" fill="none" stroke={theme.isDark ? '#94a3b8' : '#475569'} strokeWidth="1" />
                      {/* Lines hanging down */}
                      <path d="M 10 30 Q 10 40 0 50 M 90 30 Q 90 40 100 50" fill="none" stroke="#64748b" strokeWidth="2" />
                    </svg>
                    <div className="fw-bold mt-1" style={{ color: theme.text, fontSize: '11px', lineHeight: '1.2' }}>TRANSMISSION<br/>DISTRIBUTION</div>
                 </div>

                 {/* Consumer Building (Bottom Far Right) */}
                 <div style={{ position: 'absolute', left: '800px', top: '530px', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center' }}>
                    <svg width="80" height="80" viewBox="0 0 100 100">
                      {/* Small building left */}
                      <rect x="5" y="40" width="40" height="60" fill={theme.isDark ? '#e2e8f0' : '#cbd5e1'} stroke={theme.isDark ? '#94a3b8' : '#64748b'} strokeWidth="2" />
                      <rect x="10" y="50" width="10" height="10" fill={theme.isDark ? '#0ea5e9' : '#38bdf8'} />
                      <rect x="30" y="50" width="10" height="10" fill={theme.isDark ? '#0ea5e9' : '#38bdf8'} />
                      <rect x="10" y="70" width="10" height="10" fill={theme.isDark ? '#0ea5e9' : '#38bdf8'} />
                      <rect x="30" y="70" width="10" height="10" fill={theme.isDark ? '#0ea5e9' : '#38bdf8'} />
                      {/* Tall building right */}
                      <rect x="45" y="10" width="45" height="90" fill={theme.isDark ? '#94a3b8' : '#94a3b8'} stroke={theme.isDark ? '#64748b' : '#475569'} strokeWidth="2" />
                      <rect x="55" y="20" width="8" height="8" fill={theme.isDark ? '#0ea5e9' : '#38bdf8'} />
                      <rect x="70" y="20" width="8" height="8" fill={theme.isDark ? '#0ea5e9' : '#38bdf8'} />
                      <rect x="55" y="35" width="8" height="8" fill={theme.isDark ? '#0ea5e9' : '#38bdf8'} />
                      <rect x="70" y="35" width="8" height="8" fill={theme.isDark ? '#0ea5e9' : '#38bdf8'} />
                      <rect x="55" y="50" width="8" height="8" fill={theme.isDark ? '#0ea5e9' : '#38bdf8'} />
                      <rect x="70" y="50" width="8" height="8" fill={theme.isDark ? '#0ea5e9' : '#38bdf8'} />
                      <rect x="55" y="65" width="8" height="8" fill={theme.isDark ? '#0ea5e9' : '#38bdf8'} />
                      <rect x="70" y="65" width="8" height="8" fill={theme.isDark ? '#0ea5e9' : '#38bdf8'} />
                      <rect x="55" y="80" width="8" height="8" fill={theme.isDark ? '#0ea5e9' : '#38bdf8'} />
                      <rect x="70" y="80" width="8" height="8" fill={theme.isDark ? '#0ea5e9' : '#38bdf8'} />
                    </svg>
                    <div className="fw-bold mt-2" style={{ color: theme.text, fontSize: '12px' }}>CONSUMER</div>
                 </div>

                 {/* Master Blue Arrows */}
                 <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9 }}>
                    {/* PV to Inverter */}
                    <path d="M 230 350 L 320 350" stroke="#3b82f6" strokeWidth="6" fill="none" />
                    <polygon points="320,342 335,350 320,358" fill="#3b82f6" />
                    <text x="275" y="340" fill={theme.text} fontSize="14" fontWeight="bold" textAnchor="middle">{totalPv} W</text>

                    {/* Inverter to Monitor */}
                    <path d="M 400 290 L 400 220" stroke="#3b82f6" strokeWidth="6" fill="none" />
                    <polygon points="392,220 400,205 408,220" fill="#3b82f6" />

                    {/* Inverter to Battery (Down) */}
                    <path d="M 380 410 L 380 470" stroke="#3b82f6" strokeWidth="6" fill="none" />
                    <polygon points="372,470 380,485 388,470" fill="#3b82f6" />
                    {/* Battery to Inverter (Up) */}
                    <path d="M 420 480 L 420 420" stroke="#3b82f6" strokeWidth="6" fill="none" />
                    <polygon points="412,420 420,405 428,420" fill="#3b82f6" />
                    <text x="400" y="450" fill={theme.text} fontSize="14" fontWeight="bold" textAnchor="middle">{liveData.batteryFlow.toFixed(0)} W</text>

                    {/* Inverter to Transformer */}
                    <path d="M 470 350 L 530 350" stroke="#3b82f6" strokeWidth="6" fill="none" />
                    <polygon points="530,342 545,350 530,358" fill="#3b82f6" />
                    <text x="500" y="340" fill={theme.text} fontSize="14" fontWeight="bold" textAnchor="middle">{liveData.grid} W</text>

                    {/* Transformer to Grid */}
                    <path d="M 660 350 L 730 350" stroke="#3b82f6" strokeWidth="6" fill="none" />
                    <polygon points="730,342 745,350 730,358" fill="#3b82f6" />

                    {/* Grid to Consumer */}
                    <path d="M 800 330 L 800 460" stroke="#3b82f6" strokeWidth="6" fill="none" />
                    <polygon points="792,460 800,475 808,460" fill="#3b82f6" />
                    <text x="830" y="400" fill={theme.text} fontSize="14" fontWeight="bold" textAnchor="middle">{liveData.load.toFixed(0)} W</text>
                 </svg>

              </Card>
           </Col>
`;

code = code.replace(oldPanelBlock, newPanelBlock);

// Also we need to widen the Col and Card to fit 900px, but the Col is already lg={8}. Let's make sure the Card has a minHeight and wide horizontal scroll if needed.
code = code.replace('<Card.Body className="p-0 position-relative" style={{ minHeight: \'600px\', overflow: \'hidden\' }}>', 
                    '<Card.Body className="p-0 position-relative" style={{ minHeight: \'650px\', overflowX: \'auto\', overflowY: \'hidden\' }}>');

fs.writeFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', code);
console.log('Applied highly detailed consumer flowchart!');
