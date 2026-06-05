import re

with open('src/pages/EnergyMetering/SolarDashboard.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Replace DashboardTheme with getTheme
theme_code = '''const getTheme = (isDark) => ({
  bg: isDark ? '#111216' : '#f8fafc',
  panelBg: isDark ? '#1e2025' : '#ffffff',
  cardBg: isDark ? 'rgba(20, 22, 27, 0.65)' : 'rgba(255, 255, 255, 0.8)',
  cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)',
  text: isDark ? '#e2e8f0' : '#0f172a',
  muted: isDark ? '#8b949e' : '#64748b',
  border: isDark ? '#2e3238' : '#e2e8f0',
  chartGrid: isDark ? '#2e3238' : '#e2e8f0',
  chartTooltipBg: isDark ? '#181a1f' : '#ffffff',
});'''
code = re.sub(r'const DashboardTheme = \{.*?\};', theme_code, code, flags=re.DOTALL)

# 2. Update NodeBox signature
old_nodebox = r'const NodeBox = \(\{ children, x, y, width = 140, height = 70, borderColor, glowColor = null, zIndex=10 \}\) => \('
new_nodebox = 'const NodeBox = ({ children, x, y, width = 140, height = 70, borderColor, glowColor = null, zIndex=10, theme }) => ('
code = re.sub(old_nodebox, new_nodebox, code)

code = code.replace('''    background: 'rgba(20, 22, 27, 0.65)',
    backdropFilter: 'blur(10px)',
    border: `1px solid rgba(255, 255, 255, 0.08)`,
    borderTop: `2px solid ${borderColor}`,''', '''    background: theme.cardBg,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.cardBorder}`,
    borderTop: `2px solid ${borderColor}`,
    color: theme.text,''')

# 3. Add isDarkMode state
code = code.replace("const [selectedDate, setSelectedDate] = useState('2025-07-16');", "const [selectedDate, setSelectedDate] = useState('2025-07-16');\n  const [isDarkMode, setIsDarkMode] = useState(true);\n  const theme = getTheme(isDarkMode);")

# 4. Replace DashboardTheme.* with theme.*
code = code.replace('DashboardTheme.bg', 'theme.bg')
code = code.replace('DashboardTheme.panelBg', 'theme.panelBg')
code = code.replace('DashboardTheme.border', 'theme.border')
code = code.replace('DashboardTheme.text', 'theme.text')
code = code.replace('DashboardTheme.muted', 'theme.muted')

# 5. Add theme={theme} to NodeBox
code = code.replace('<NodeBox ', '<NodeBox theme={theme} ')

# 6. Update Dark Mode Button
code = code.replace('<Button variant="outline-warning" size="sm" className="fw-bold">Dark Mode</Button>', '<Button variant={isDarkMode ? "outline-light" : "outline-dark"} size="sm" className="fw-bold" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? "Light Mode" : "Dark Mode"}</Button>')

# 7. Update text-white in Header
code = code.replace('<h4 className="mb-0 d-flex align-items-center gap-2 fw-bold text-white">', '<h4 className="mb-0 d-flex align-items-center gap-2 fw-bold" style={{ color: theme.text }}>')

# 8. Replace SVG Map with Real Map
old_map = r'{/\* Map Area \(Right\) - Custom Native SVG Map \*/}.*?</style>\s*</div>'
new_map = '''{/* Map Area (Right) - Real Google Map Embed */}
                        <div style={{ width: '55%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: '0 8px 8px 0', borderLeft: `1px solid ${theme.border}` }}>
                           <iframe 
                             width="100%" 
                             height="100%" 
                             src="https://maps.google.com/maps?q=San%20Fernando,Philippines&t=k&z=10&ie=UTF8&iwloc=&output=embed" 
                             frameBorder="0"
                             style={{ border: 0, filter: isDarkMode ? 'contrast(1.1) brightness(0.9)' : 'none' }}
                           ></iframe>
                           <div style={{ position: 'absolute', top: '10px', right: '10px', background: theme.cardBg, padding: '4px 10px', borderRadius: '20px', fontSize: '10px', color: theme.text, backdropFilter: 'blur(4px)', border: `1px solid ${theme.cardBorder}` }}>
                              <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', marginRight: '6px', boxShadow: '0 0 5px #10b981' }}></span>
                              Live Satellite View
                           </div>
                        </div>'''
code = re.sub(old_map, new_map, code, flags=re.DOTALL)

# 9. Update some static colors for Light/Dark
code = code.replace("color: '#fff'", "color: theme.text")
code = code.replace('className="text-white"', 'style={{ color: theme.text }}')
code = code.replace('className="text-white fw-bold', 'className="fw-bold" style={{ color: theme.text }}')
code = code.replace('stroke="#2e3238"', 'stroke={theme.chartGrid}')
code = code.replace("backgroundColor: '#181a1f', borderColor: '#2e3238', color: '#fff'", "backgroundColor: theme.chartTooltipBg, borderColor: theme.border, color: theme.text")

with open('src/pages/EnergyMetering/SolarDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('UI update applied successfully!')
