const fs = require('fs');
let code = fs.readFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', 'utf8');

// 1. Fix NodeBox to ensure content fits. We will change padding from '10px' to '4px 10px' and add overflow: 'visible'.
code = code.replace(/padding: '10px'/g, "padding: '4px 10px', overflow: 'visible'");

// 2. Increase PV1 and PV2 height from 60 to 75
code = code.replace(/width=\{130\} height=\{60\} borderColor="#facc15"/g, 'width={130} height={75} borderColor="#facc15"');

// 3. Increase Total PV height from 75 to 85
code = code.replace(/width=\{170\} height=\{75\} borderColor="#facc15"/g, 'width={170} height={85} borderColor="#facc15"');

// 4. Fix the Battery Stats box (the one at left: 790px)
// It was missing a solid background so lines could show through, and it was misaligned.
// Let's add background and tweak alignment.
const oldBatteryStats = `                 <div style={{ position: 'absolute', top: '360px', left: '790px', transform: 'translate(-50%, -50%)', zIndex: 11, width: '100px' }}>
                    <div className="fw-bold text-white" style={{ fontSize: '28px', lineHeight: '1' }}>{liveData.soc} %</div>
                    <div className="p-1 mt-1 rounded border fw-bold text-white" style={{ borderColor: '#a855f7', fontSize: '10px' }}>
                       <div>53.2 V</div><div>7.3 A</div>
                       <div className="text-info">{liveData.batteryMode}</div>
                    </div>
                    <div className="text-muted fw-bold mt-1" style={{ fontSize: '10px' }}>~ 31h 17m</div>
                 </div>`;

const newBatteryStats = `                 <div style={{ position: 'absolute', top: '360px', left: '800px', transform: 'translate(-50%, -50%)', zIndex: 11, width: '120px' }}>
                    <div className="fw-bold text-white mb-2" style={{ fontSize: '32px', lineHeight: '1' }}>{liveData.soc} %</div>
                    <div className="p-2 rounded border fw-bold text-white" style={{ borderColor: '#a855f7', fontSize: '12px', background: theme.isDark ? '#181a1f' : '#ffffff' }}>
                       <div>53.2 V</div><div>7.3 A</div>
                       <div className="text-info mt-1">{liveData.batteryMode}</div>
                    </div>
                    <div className="text-muted fw-bold mt-2" style={{ fontSize: '11px' }}>~ 31h 17m (to 20%)</div>
                 </div>`;

code = code.replace(oldBatteryStats, newBatteryStats);

// 5. Fix the FlowLine overlapping the PV boxes.
// PV 1 is at 220, 100. Total PV is at 350, 220.
// FlowLine path="M 220 120 L 220 160 L 350 160 L 350 180" 
// If PV1 is height 75, it goes from y=100-37.5=62.5 to 137.5.
// So M 220 120 overlaps PV1! It should start at M 220 140.
code = code.replace('M 220 120 L 220 160 L 350 160 L 350 180', 'M 220 140 L 220 170 L 350 170 L 350 180');
code = code.replace('M 480 120 L 480 160 L 350 160 L 350 180', 'M 480 140 L 480 170 L 350 170 L 350 180');

fs.writeFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', code);
console.log('Fixed clipping and layout messes in NodeBoxes and Battery Stats!');
