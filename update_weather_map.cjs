const fs = require('fs');
let code = fs.readFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', 'utf8');

// 1. Add state variable and WEATHER_LOCATIONS
if (!code.includes('const [weatherCity')) {
  code = code.replace("const [selectedDate, setSelectedDate] = useState('2025-07-16');", 
`const [selectedDate, setSelectedDate] = useState('2025-07-16');
  const [weatherCity, setWeatherCity] = useState('Delhi');
  
  const WEATHER_LOCATIONS = {
     'Delhi': { lat: 28.6139, lon: 77.2090, temp: '35°C', weather: 'Clear', hum: '42%', wind: '12 km/h' },
     'Noida': { lat: 28.5355, lon: 77.3910, temp: '36°C', weather: 'Sunny', hum: '40%', wind: '10 km/h' },
     'Ghaziabad': { lat: 28.6692, lon: 77.4538, temp: '35°C', weather: 'Clear', hum: '41%', wind: '11 km/h' },
     'Gurugram': { lat: 28.4595, lon: 77.0266, temp: '37°C', weather: 'Hot', hum: '38%', wind: '14 km/h' },
     'Mumbai': { lat: 19.0760, lon: 72.8777, temp: '31°C', weather: 'Humid', hum: '80%', wind: '18 km/h' }
  };
  const currentCity = WEATHER_LOCATIONS[weatherCity];`);
}

// 2. Replace the Weather UI block
const oldWeatherUI = `<div className="flex-grow-1 p-3 d-flex flex-column justify-content-center align-items-center text-center" style={{ minWidth: '45%' }}>
                           <h6 className="fw-bold mb-3 text-muted">San Fernando, Philippines</h6>
                           <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                              <CloudRain size={54} className="text-info" />
                              <div className="text-start">
                                 <div style={{ fontSize: '38px', fontWeight: 'bold', lineHeight: '1' }}>29°C</div>
                                 <div className="text-muted fs-6">Slight showers</div>
                              </div>
                           </div>
                           <Row className="w-100 text-muted mt-2 g-2" style={{ fontSize: '11px' }}>
                              <Col xs={6} className="d-flex align-items-center gap-2"><Droplets size={12} className="text-info"/> 85%</Col>
                              <Col xs={6} className="d-flex align-items-center gap-2"><Wind size={12} className="text-secondary"/> 11.4 km/h</Col>
                              <Col xs={6} className="d-flex align-items-center gap-2"><Sun size={12} className="text-warning"/> 5:34 AM</Col>
                              <Col xs={6} className="d-flex align-items-center gap-2"><Activity size={12} className="text-warning"/> 6:34 PM</Col>
                           </Row>
                        </div>
                        {/* Map Area (Right) */}
                        <div style={{ width: '55%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: '0 8px 8px 0' }}>
                           <iframe 
                             width="100%" 
                             height="100%" 
                             src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km%2Fh&zoom=5&overlay=rain&product=ecmwf&level=surface&lat=15.029&lon=120.682&detailLat=15.029&detailLon=120.682" 
                             frameBorder="0"
                             style={{ border: 0, borderRadius: '0 8px 8px 0' }}
                           ></iframe>
                        </div>`;

const newWeatherUI = `<div className="flex-grow-1 p-3 d-flex flex-column justify-content-center align-items-center text-center" style={{ minWidth: '45%' }}>
                           <div className="mb-3 w-75">
                              <select 
                                className="form-select form-select-sm bg-dark text-white fw-bold"
                                style={{ borderColor: '#2e3238', outline: 'none', boxShadow: 'none' }}
                                value={weatherCity}
                                onChange={(e) => setWeatherCity(e.target.value)}
                              >
                                 {Object.keys(WEATHER_LOCATIONS).map(city => (
                                    <option key={city} value={city}>{city}, India</option>
                                 ))}
                              </select>
                           </div>
                           <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                              {currentCity.weather === 'Humid' || currentCity.weather === 'Sunny' ? <Sun size={54} className="text-warning" /> : <Sun size={54} className="text-warning" />}
                              <div className="text-start">
                                 <div style={{ fontSize: '38px', fontWeight: 'bold', lineHeight: '1' }}>{currentCity.temp}</div>
                                 <div className="text-muted fs-6">{currentCity.weather}</div>
                              </div>
                           </div>
                           <Row className="w-100 text-muted mt-2 g-2" style={{ fontSize: '11px' }}>
                              <Col xs={6} className="d-flex align-items-center gap-2"><Droplets size={12} className="text-info"/> {currentCity.hum}</Col>
                              <Col xs={6} className="d-flex align-items-center gap-2"><Wind size={12} className="text-secondary"/> {currentCity.wind}</Col>
                              <Col xs={6} className="d-flex align-items-center gap-2"><Sun size={12} className="text-warning"/> 5:34 AM</Col>
                              <Col xs={6} className="d-flex align-items-center gap-2"><Activity size={12} className="text-warning"/> 6:34 PM</Col>
                           </Row>
                        </div>
                        {/* Map Area (Right) */}
                        <div style={{ width: '55%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: '0 8px 8px 0' }}>
                           <iframe 
                             width="100%" 
                             height="100%" 
                             src={\`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km%2Fh&zoom=10&overlay=wind&product=ecmwf&level=surface&lat=\${currentCity.lat}&lon=\${currentCity.lon}&detailLat=\${currentCity.lat}&detailLon=\${currentCity.lon}\`}
                             frameBorder="0"
                             style={{ border: 0, borderRadius: '0 8px 8px 0' }}
                           ></iframe>
                        </div>`;

code = code.replace(oldWeatherUI, newWeatherUI);
fs.writeFileSync('src/pages/EnergyMetering/SolarDashboard.jsx', code);
console.log('Added interactive weather map selection!');
