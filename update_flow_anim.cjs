const fs = require('fs');
let code = fs.readFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', 'utf8');

// Replace Transmission text to explicitly say GRID
code = code.replace('TRANSMISSION<br/>DISTRIBUTION', 'GRID<br/>(TRANSMISSION)');

// Replace the Master Blue Arrows section with an Animated version
const arrowsStart = code.indexOf('{/* Master Blue Arrows */}');
const arrowsEnd = code.indexOf('</svg>', arrowsStart);
const oldArrowsBlock = code.substring(arrowsStart, arrowsEnd);

const newArrowsBlock = `{/* Flow Animations */}
                 <style>{\`
                   @keyframes flowAnim { from { stroke-dashoffset: 25; } to { stroke-dashoffset: 0; } }
                   @keyframes flowAnimRev { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 25; } }
                 \`}</style>
                 
                 {/* Master Animated Arrows */}
                 <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9, pointerEvents: 'none' }}>
                    {/* Component for animated lines */}
                    <defs>
                       <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                         <feGaussianBlur stdDeviation="3" result="blur" />
                         <feComposite in="SourceGraphic" in2="blur" operator="over" />
                       </filter>
                    </defs>

                    {/* PV to Inverter */}
                    <path d="M 230 350 L 320 350" stroke="#3b82f6" strokeWidth="6" opacity="0.2" fill="none" />
                    <path d="M 230 350 L 320 350" stroke="#3b82f6" strokeWidth="4" strokeDasharray="10 15" fill="none" style={{ animation: 'flowAnim 1s linear infinite' }} filter="url(#glow)" />
                    <polygon points="320,342 335,350 320,358" fill="#3b82f6" />
                    <rect x="250" y="325" width="50" height="20" fill={theme.isDark ? '#0f172a' : '#ffffff'} rx="4" opacity="0.8" />
                    <text x="275" y="340" fill={theme.text} fontSize="14" fontWeight="bold" textAnchor="middle">{totalPv} W</text>

                    {/* Inverter to Monitor */}
                    <path d="M 400 290 L 400 220" stroke="#3b82f6" strokeWidth="6" opacity="0.2" fill="none" />
                    <path d="M 400 290 L 400 220" stroke="#3b82f6" strokeWidth="4" strokeDasharray="10 15" fill="none" style={{ animation: 'flowAnim 1s linear infinite' }} filter="url(#glow)" />
                    <polygon points="392,220 400,205 408,220" fill="#3b82f6" />

                    {/* Inverter to Battery (Down) */}
                    <path d="M 380 410 L 380 470" stroke="#3b82f6" strokeWidth="6" opacity="0.2" fill="none" />
                    <path d="M 380 410 L 380 470" stroke="#3b82f6" strokeWidth="4" strokeDasharray="10 15" fill="none" style={{ animation: 'flowAnim 1s linear infinite' }} filter="url(#glow)" />
                    <polygon points="372,470 380,485 388,470" fill="#3b82f6" />
                    
                    {/* Battery to Inverter (Up) */}
                    <path d="M 420 480 L 420 420" stroke="#3b82f6" strokeWidth="6" opacity="0.2" fill="none" />
                    <path d="M 420 480 L 420 420" stroke="#3b82f6" strokeWidth="4" strokeDasharray="10 15" fill="none" style={{ animation: 'flowAnim 1s linear infinite' }} filter="url(#glow)" />
                    <polygon points="412,420 420,405 428,420" fill="#3b82f6" />
                    
                    <rect x="375" y="435" width="50" height="20" fill={theme.isDark ? '#0f172a' : '#ffffff'} rx="4" opacity="0.8" />
                    <text x="400" y="450" fill={theme.text} fontSize="14" fontWeight="bold" textAnchor="middle">{liveData.batteryFlow.toFixed(0)} W</text>

                    {/* Inverter to Transformer */}
                    <path d="M 470 350 L 530 350" stroke="#3b82f6" strokeWidth="6" opacity="0.2" fill="none" />
                    <path d="M 470 350 L 530 350" stroke="#3b82f6" strokeWidth="4" strokeDasharray="10 15" fill="none" style={{ animation: 'flowAnim 1s linear infinite' }} filter="url(#glow)" />
                    <polygon points="530,342 545,350 530,358" fill="#3b82f6" />
                    
                    <rect x="475" y="325" width="50" height="20" fill={theme.isDark ? '#0f172a' : '#ffffff'} rx="4" opacity="0.8" />
                    <text x="500" y="340" fill={theme.text} fontSize="14" fontWeight="bold" textAnchor="middle">{liveData.grid} W</text>

                    {/* Transformer to Grid */}
                    <path d="M 660 350 L 730 350" stroke="#3b82f6" strokeWidth="6" opacity="0.2" fill="none" />
                    <path d="M 660 350 L 730 350" stroke="#3b82f6" strokeWidth="4" strokeDasharray="10 15" fill="none" style={{ animation: 'flowAnim 1s linear infinite' }} filter="url(#glow)" />
                    <polygon points="730,342 745,350 730,358" fill="#3b82f6" />

                    {/* Grid to Consumer */}
                    <path d="M 800 330 L 800 460" stroke="#3b82f6" strokeWidth="6" opacity="0.2" fill="none" />
                    <path d="M 800 330 L 800 460" stroke="#3b82f6" strokeWidth="4" strokeDasharray="10 15" fill="none" style={{ animation: 'flowAnim 1s linear infinite' }} filter="url(#glow)" />
                    <polygon points="792,460 800,475 808,460" fill="#3b82f6" />
                    
                    <rect x="805" y="385" width="50" height="20" fill={theme.isDark ? '#0f172a' : '#ffffff'} rx="4" opacity="0.8" />
                    <text x="830" y="400" fill={theme.text} fontSize="14" fontWeight="bold" textAnchor="middle">{liveData.load.toFixed(0)} W</text>
                 `;

code = code.replace(oldArrowsBlock, newArrowsBlock);

// I noticed the SVG sun has wavy arrows. Let's make them animated too!
const sunArrowsStart = code.indexOf('{/* Wavy Sunlight Arrows */}');
const sunArrowsEnd = code.indexOf('</svg>', sunArrowsStart);
const oldSunBlock = code.substring(sunArrowsStart, sunArrowsEnd);

const newSunBlock = `{/* Animated Wavy Sunlight Arrows */}
                 <svg style={{ position: 'absolute', left: '120px', top: '120px', width: '100px', height: '150px', zIndex: 9, pointerEvents: 'none' }}>
                    <path d="M 10 10 Q 25 30 10 50 T 10 90 L 5 80 M 10 90 L 15 80" fill="none" stroke="#f59e0b" strokeWidth="3" opacity="0.2" />
                    <path d="M 10 10 Q 25 30 10 50 T 10 90 L 5 80 M 10 90 L 15 80" fill="none" stroke="#facc15" strokeWidth="3" strokeDasharray="10 15" style={{ animation: 'flowAnim 1.5s linear infinite' }} filter="url(#glow)" />
                    
                    <path d="M 40 10 Q 55 30 40 50 T 40 90 L 35 80 M 40 90 L 45 80" fill="none" stroke="#f59e0b" strokeWidth="3" opacity="0.2" />
                    <path d="M 40 10 Q 55 30 40 50 T 40 90 L 35 80 M 40 90 L 45 80" fill="none" stroke="#facc15" strokeWidth="3" strokeDasharray="10 15" style={{ animation: 'flowAnim 1.2s linear infinite' }} filter="url(#glow)" />
                    
                    <path d="M 70 10 Q 85 30 70 50 T 70 90 L 65 80 M 70 90 L 75 80" fill="none" stroke="#f59e0b" strokeWidth="3" opacity="0.2" />
                    <path d="M 70 10 Q 85 30 70 50 T 70 90 L 65 80 M 70 90 L 75 80" fill="none" stroke="#facc15" strokeWidth="3" strokeDasharray="10 15" style={{ animation: 'flowAnim 1.8s linear infinite' }} filter="url(#glow)" />
                    
                    <text x="80" y="40" fill="#f59e0b" fontSize="10" fontWeight="bold">SUNLIGHT</text>
                 `;
code = code.replace(oldSunBlock, newSunBlock);

fs.writeFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', code);
console.log('Added beautiful animations and updated Grid label!');
