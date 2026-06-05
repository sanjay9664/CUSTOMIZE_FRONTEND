const fs = require('fs');
let code = fs.readFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', 'utf8');

const oldBlockStart = code.indexOf('{/* Connection Lines');
const oldBlockEnd = code.indexOf('{/* RIGHT PANEL */}');
const oldBlock = code.substring(oldBlockStart, oldBlockEnd);

const newBlock = `{/* Connection Lines (Clean, logical flow) */}
                 <FlowLine path="M 200 100 C 200 180, 350 180, 350 215" color="#facc15" flowing={true} /> {/* PV1 to Inverter */}
                 <FlowLine path="M 500 100 C 500 180, 350 180, 350 215" color="#facc15" flowing={true} /> {/* PV2 to Inverter */}
                 
                 <FlowLine path="M 160 300 L 260 300" color="#ef4444" flowing={false} reverse={true} /> {/* Grid to Inverter */}
                 <FlowLine path="M 440 300 L 530 300" color="#a855f7" flowing={true} /> {/* Inverter to Battery */}
                 
                 <FlowLine path="M 350 385 L 350 460" color="#0ea5e9" flowing={true} /> {/* Inverter to Load */}

                 {/* Nodes */}
                 
                 {/* PV 1 (Top Left) */}
                 <NodeBox theme={theme} x={200} y={100} width={130} height={70} borderColor="#ca8a04">
                    <div className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>PV Array 1</div>
                    <div className="text-warning fw-bold fs-4 mb-1">{liveData.pv1.toFixed(0)} W</div>
                    <div className="d-flex gap-2" style={{ fontSize: '10px', color: theme.isDark ? '#fef08a' : '#b45309' }}>
                      <span>148.8 V</span> <span>4.3 A</span>
                    </div>
                 </NodeBox>

                 {/* PV 2 (Top Right) */}
                 <NodeBox theme={theme} x={500} y={100} width={130} height={70} borderColor="#ca8a04">
                    <div className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>PV Array 2</div>
                    <div className="text-warning fw-bold fs-4 mb-1">{liveData.pv2.toFixed(0)} W</div>
                    <div className="d-flex gap-2" style={{ fontSize: '10px', color: theme.isDark ? '#fef08a' : '#b45309' }}>
                      <span>312.8 V</span> <span>3.9 A</span>
                    </div>
                 </NodeBox>

                 {/* Grid (Middle Left) */}
                 <div style={{ position: 'absolute', top: '300px', left: '100px', transform: 'translate(-50%, -50%)', zIndex: 11, textAlign: 'center' }}>
                    <div className="text-success fw-bold" style={{ fontSize: '12px' }}>↑ 0 kWh</div>
                    <svg width="60" height="60" viewBox="0 0 100 100">
                       <path d="M 20 40 L 80 40 M 30 60 L 70 60 M 40 80 L 60 80 M 50 40 L 50 100" stroke="#ef4444" strokeWidth="4" />
                       <path d="M 20 40 L 50 80 L 80 40" fill="none" stroke="#0ea5e9" strokeWidth="4" strokeDasharray="5 5" />
                    </svg>
                    <div className="text-danger fw-bold" style={{ fontSize: '12px' }}>↓ 0 kWh</div>
                    <NodeBox theme={theme} x={30} y={90} width={90} height={40} borderColor="#ef4444">
                       <div className="text-danger fw-bold fs-5">0 W</div>
                    </NodeBox>
                 </div>

                 {/* INVERTER (Center Hub) */}
                 <NodeBox theme={theme} x={350} y={300} width={180} height={170} borderColor="#475569" glowColor="#64748b">
                    <div className="w-100 px-3 d-flex justify-content-center align-items-center mb-1">
                       <span className="text-warning fw-bold" style={{ fontSize: "16px", letterSpacing: "0.5px" }}>Solis Inverter</span>
                    </div>
                    <div className="text-center w-100 mb-2 px-2" style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold', background: 'rgba(16,185,129,0.1)', borderRadius: '4px' }}>
                       DC ↔ AC CONVERSION
                    </div>
                    <div className="text-start w-100 px-3 flex-grow-1" style={{ fontSize: '12px', color: theme.muted, lineHeight: '1.5' }}>
                       <div className="d-flex justify-content-between"><span>Voltage</span><span className="fw-bold" style={{ color: theme.text }}>232.9 V</span></div>
                       <div className="d-flex justify-content-between"><span>Current</span><span className="fw-bold" style={{ color: theme.text }}>9.8 A</span></div>
                       <div className="d-flex justify-content-between"><span>Freq</span><span className="fw-bold" style={{ color: theme.text }}>60.0 Hz</span></div>
                       <div className="d-flex justify-content-between"><span>Efficiency</span><span className="fw-bold text-success">98.5 %</span></div>
                    </div>
                    <div className="w-100 px-3 d-flex justify-content-between align-items-center mb-1 pt-1 border-top" style={{ borderColor: theme.cardBorder }}>
                       <Activity size={18} className="text-danger" />
                       <span className="fw-bold fs-6" style={{ color: theme.text }}>42.3 °C</span>
                    </div>
                 </NodeBox>

                 {/* Battery (Middle Right) */}
                 <div style={{ position: 'absolute', top: '300px', left: '600px', transform: 'translate(-50%, -50%)', zIndex: 11, display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="text-center">
                       <div className="fw-bold mb-1" style={{ color: theme.text, fontSize: '12px' }}>↑ 9.20 kWh</div>
                       <div style={{ width: '40px', height: '80px', border: '3px solid #10b981', borderRadius: '4px', position: 'relative', background: '#064e3b', padding: '2px', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}>
                          <div style={{ position: 'absolute', top: '-6px', left: '10px', width: '14px', height: '4px', background: '#10b981', borderRadius: '2px 2px 0 0' }}></div>
                          <div style={{ width: '100%', height: '95%', background: '#10b981', position: 'absolute', bottom: '2px', left: '0' }}></div>
                          <div className="w-100 h-100 d-flex flex-column justify-content-around align-items-center position-relative z-1">
                            <div style={{ width:'4px', height:'4px', background:'rgba(255,255,255,0.8)', borderRadius:'50%'}}></div>
                            <div style={{ width:'4px', height:'4px', background:'rgba(255,255,255,0.8)', borderRadius:'50%'}}></div>
                            <div style={{ width:'4px', height:'4px', background:'rgba(255,255,255,0.8)', borderRadius:'50%'}}></div>
                          </div>
                       </div>
                       <div className="fw-bold mt-1" style={{ color: theme.text, fontSize: '12px' }}>↓ 3.30 kWh</div>
                    </div>
                    <div>
                       <div className="fw-bold" style={{ color: theme.text, fontSize: '32px', lineHeight: '1' }}>{liveData.soc} %</div>
                       <div className="p-2 px-2 mt-1 rounded border fw-bold" style={{ borderColor: '#a855f7', background: theme.isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.05)', fontSize: '12px', color: theme.text }}>
                          <div>53.2 V</div>
                          <div>7.3 A</div>
                          <div className="text-info mt-1">{liveData.batteryMode}</div>
                       </div>
                    </div>
                 </div>

                 {/* Load (Bottom Center) */}
                 <div style={{ position: 'absolute', top: '500px', left: '350px', transform: 'translate(-50%, -50%)', zIndex: 11, textAlign: 'center' }}>
                    <div style={{ background: theme.cardBg, backdropFilter: 'blur(10px)', border: \`1px solid \${theme.cardBorder}\`, borderTop: '2px solid #0ea5e9', borderRadius: '16px', padding: '15px 25px', boxShadow: '0 4px 20px rgba(14, 165, 233, 0.2)' }}>
                       <div className="text-info fw-bold fs-3">{liveData.load.toFixed(0)} W</div>
                       <div className="d-flex align-items-center justify-content-center gap-2 mt-2">
                          <svg width="24" height="24" viewBox="0 0 100 100">
                             <path d="M 10 50 L 50 10 L 90 50 L 90 90 L 10 90 Z" fill={theme.isDark ? "#475569" : "#cbd5e1"} stroke={theme.isDark ? "#94a3b8" : "#64748b"} strokeWidth="2" />
                             <rect x="25" y="60" width="15" height="15" fill={theme.isDark ? "#facc15" : "#ca8a04"} />
                             <rect x="60" y="60" width="15" height="15" fill={theme.isDark ? "#facc15" : "#ca8a04"} />
                             <path d="M 10 50 L 50 10 L 90 50" fill="none" stroke="#ef4444" strokeWidth="6" />
                          </svg>
                          <div className="fw-bold" style={{ color: theme.text }}>9.9 kWh</div>
                       </div>
                    </div>
                 </div>

                 {/* Production & Load Summary Stats */}
                 <div style={{ position: 'absolute', bottom: '15px', left: '0', width: '100%', display: 'flex', gap: '20px', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div className="p-3 rounded" style={{ pointerEvents: 'auto', background: theme.cardBg, backdropFilter: 'blur(10px)', border: \`1px solid \${theme.cardBorder}\`, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                       <div className="text-center text-muted fw-bold mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>PRODUCTION MIX</div>
                       <div className="d-flex gap-4 text-center" style={{ fontSize: '11px' }}>
                          <div>
                            <Sun size={14} className="text-warning mb-1" /><br/>
                            Solar<br/><span className="text-muted">(7.6 kWh)</span><br/><b style={{ fontSize: '13px', color: theme.text }}>45.0 %</b>
                          </div>
                          <div>
                            <Battery size={14} className="text-success mb-1" /><br/>
                            Battery<br/><span className="text-muted">(9.2 kWh)</span><br/><b style={{ fontSize: '13px', color: theme.text }}>55.0 %</b>
                          </div>
                          <div>
                            <Zap size={14} className="text-danger mb-1" /><br/>
                            Grid<br/><span className="text-muted">(0.0 kWh)</span><br/><b style={{ fontSize: '13px', color: theme.text }}>0.0 %</b>
                          </div>
                       </div>
                    </div>

                    <div className="p-3 rounded" style={{ pointerEvents: 'auto', background: theme.cardBg, backdropFilter: 'blur(10px)', border: \`1px solid \${theme.cardBorder}\`, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                       <div className="text-center text-muted fw-bold mb-2" style={{ fontSize: '11px', letterSpacing: '1px' }}>LOAD CONSUMPTION</div>
                       <div className="d-flex gap-4 text-center" style={{ fontSize: '11px' }}>
                          <div>
                            <Sun size={14} className="text-warning mb-1" /><br/>
                            Solar<br/><span className="text-muted">(7.6 kWh)</span><br/><b style={{ fontSize: '13px', color: theme.text }}>77.0 %</b>
                          </div>
                          <div>
                            <Battery size={14} className="text-success mb-1" /><br/>
                            Battery<br/><span className="text-muted">(3.3 kWh)</span><br/><b style={{ fontSize: '13px', color: theme.text }}>33.0 %</b>
                          </div>
                          <div>
                            <Zap size={14} className="text-danger mb-1" /><br/>
                            Grid<br/><span className="text-muted">(0.0 kWh)</span><br/><b style={{ fontSize: '13px', color: theme.text }}>0.0 %</b>
                          </div>
                       </div>
                    </div>
                 </div>

              </Card>
           </Col>
`;

code = code.replace(oldBlock, newBlock);
fs.writeFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', code);
console.log('UI layout updated successfully!');
