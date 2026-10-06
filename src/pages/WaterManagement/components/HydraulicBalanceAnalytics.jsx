import React, { useState } from 'react';
import { Row, Col, Card, Badge, ProgressBar } from 'react-bootstrap';
import {
  Activity, ArrowDownRight, ArrowUpRight, CheckCircle2,
  Droplets, Gauge, ShieldCheck, Zap, AlertTriangle, TrendingUp
} from 'lucide-react';

const HydraulicBalanceAnalytics = ({
  agTotalVolume = 65000,
  ugTotalVolume = 320000,
  dailyPumping = 185000,
  dailyConsumption = 172000,
  masterPressure = 12.2,
  totalKw = 22.6
}) => {
  const [hoveredHour, setHoveredHour] = useState(null);

  // 24-Hour Simulation Curves (Pumping vs Consumption)
  const hourlyData = [
    { hour: '00:00', pumping: 120, consumption: 40, agLevel: 85 },
    { hour: '02:00', pumping: 180, consumption: 25, agLevel: 92 },
    { hour: '04:00', pumping: 160, consumption: 35, agLevel: 95 },
    { hour: '06:00', pumping: 90, consumption: 160, agLevel: 88 },
    { hour: '08:00', pumping: 140, consumption: 220, agLevel: 75 },
    { hour: '10:00', pumping: 200, consumption: 190, agLevel: 72 },
    { hour: '12:00', pumping: 180, consumption: 175, agLevel: 70 },
    { hour: '14:00', pumping: 150, consumption: 140, agLevel: 71 },
    { hour: '16:00', pumping: 110, consumption: 130, agLevel: 69 },
    { hour: '18:00', pumping: 210, consumption: 230, agLevel: 64 },
    { hour: '20:00', pumping: 240, consumption: 210, agLevel: 68 },
    { hour: '22:00', pumping: 170, consumption: 90, agLevel: 79 }
  ];

  const netSurplus = dailyPumping - dailyConsumption;

  return (
    <div className="hydraulic-analytics-section mt-4">
      <Row className="g-4 mb-4">
        {/* Daily Water Balance Summary */}
        <Col lg={4}>
          <Card className="bg-dark bg-opacity-40 border border-secondary border-opacity-15 rounded-4 h-100 p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <div className="p-2 rounded-3 bg-info bg-opacity-10 text-info">
                  <Droplets size={18} />
                </div>
                <div>
                  <h6 className="text-white fw-bold mb-0 fs-9">DAILY WATER BUDGET</h6>
                  <small className="text-secondary fs-10">24-Hr Cumulative Inflow vs Outflow</small>
                </div>
              </div>
              <Badge bg="success" className="bg-opacity-20 text-success border border-success border-opacity-20 fs-10">
                BALANCED
              </Badge>
            </div>

            <div className="py-2">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary fs-9">Total UG Sump Intake</span>
                <span className="text-white fw-bold fs-9">{(dailyPumping * 1.08 / 1000).toFixed(1)} kL</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary fs-9">Pumping to AG Rooftop</span>
                <span className="text-info fw-bold fs-9">{(dailyPumping / 1000).toFixed(1)} kL</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-secondary fs-9">Building Consumption</span>
                <span className="text-warning fw-bold fs-9">{(dailyConsumption / 1000).toFixed(1)} kL</span>
              </div>
              <div className="p-2 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                <span className="text-muted fs-10 fw-bold">NET RESERVE DELTA</span>
                <span className={`fw-black fs-8 ${netSurplus >= 0 ? 'text-success' : 'text-danger'}`}>
                  {netSurplus >= 0 ? `+${(netSurplus / 1000).toFixed(1)} kL (SURPLUS)` : `${(netSurplus / 1000).toFixed(1)} kL (DEFICIT)`}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-top border-secondary border-opacity-10">
              <small className="text-muted fs-10 d-block mb-1">Storage Split Distribution</small>
              <div className="progress" style={{ height: '8px' }}>
                <div
                  className="progress-bar bg-info"
                  role="progressbar"
                  style={{ width: `${(agTotalVolume / (agTotalVolume + ugTotalVolume)) * 100}%` }}
                  title="AG Rooftop Tanks"
                />
                <div
                  className="progress-bar bg-primary"
                  role="progressbar"
                  style={{ width: `${(ugTotalVolume / (agTotalVolume + ugTotalVolume)) * 100}%` }}
                  title="UG Sump Reservoirs"
                />
              </div>
              <div className="d-flex justify-content-between text-secondary fs-10 mt-1">
                <span>AG Rooftop: {Math.round((agTotalVolume / (agTotalVolume + ugTotalVolume)) * 100)}%</span>
                <span>UG Sump: {Math.round((ugTotalVolume / (agTotalVolume + ugTotalVolume)) * 100)}%</span>
              </div>
            </div>
          </Card>
        </Col>

        {/* Pumping Efficiency & Specific Energy Consumption */}
        <Col lg={4}>
          <Card className="bg-dark bg-opacity-40 border border-secondary border-opacity-15 rounded-4 h-100 p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <div className="p-2 rounded-3 bg-warning bg-opacity-10 text-warning">
                  <Zap size={18} />
                </div>
                <div>
                  <h6 className="text-white fw-bold mb-0 fs-9">ENERGY & PUMP EFFICIENCY</h6>
                  <small className="text-secondary fs-10">Electrical & Hydraulic Performance</small>
                </div>
              </div>
              <Badge bg="info" className="bg-opacity-20 text-info border border-info border-opacity-20 fs-10">
                OPTIMAL
              </Badge>
            </div>

            <div className="d-flex justify-content-around text-center py-2">
              <div>
                <span className="text-muted fs-10 fw-bold d-block uppercase">SPECIFIC ENERGY</span>
                <h4 className="text-white fw-black mb-0">0.34</h4>
                <small className="text-secondary fs-10">kWh / m³ Pumped</small>
              </div>
              <div className="border-start border-secondary border-opacity-15 ps-3">
                <span className="text-muted fs-10 fw-bold d-block uppercase">HEAD EFFICIENCY</span>
                <h4 className="text-success fw-black mb-0">82.4%</h4>
                <small className="text-secondary fs-10">Wire-to-Water</small>
              </div>
            </div>

            <div className="mt-3 pt-3 border-top border-secondary border-opacity-10">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-secondary fs-9">Current Power Load</span>
                <span className="text-warning fw-bold fs-9">{totalKw} kW</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-secondary fs-9">Estimated Daily Power</span>
                <span className="text-white fw-bold fs-9">142.8 kWh</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-secondary fs-9">Power Factor</span>
                <span className="text-info fw-bold fs-9">0.98 (Healthy)</span>
              </div>
            </div>
          </Card>
        </Col>

        {/* Water Quality & Sensory Health */}
        <Col lg={4}>
          <Card className="bg-dark bg-opacity-40 border border-secondary border-opacity-15 rounded-4 h-100 p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <div className="p-2 rounded-3 bg-success bg-opacity-10 text-success">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h6 className="text-white fw-bold mb-0 fs-9">WATER QUALITY TELEMETRY</h6>
                  <small className="text-secondary fs-10">In-line Potable Quality Sensors</small>
                </div>
              </div>
              <Badge bg="success" className="bg-opacity-20 text-success border border-success border-opacity-20 fs-10">
                PASSED IS:10500
              </Badge>
            </div>

            <Row className="g-2 py-1">
              <Col xs={6}>
                <div className="p-2 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-10">
                  <small className="text-muted fs-10 d-block">TDS LEVEL</small>
                  <span className="text-info fw-black fs-8">148</span>
                  <small className="text-secondary fs-10 ms-1">ppm</small>
                </div>
              </Col>
              <Col xs={6}>
                <div className="p-2 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-10">
                  <small className="text-muted fs-10 d-block">pH BALANCE</small>
                  <span className="text-success fw-black fs-8">7.38</span>
                  <small className="text-secondary fs-10 ms-1">Neutral</small>
                </div>
              </Col>
              <Col xs={6}>
                <div className="p-2 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-10">
                  <small className="text-muted fs-10 d-block">TURBIDITY</small>
                  <span className="text-white fw-black fs-8">0.72</span>
                  <small className="text-secondary fs-10 ms-1">NTU</small>
                </div>
              </Col>
              <Col xs={6}>
                <div className="p-2 rounded-3 bg-dark bg-opacity-60 border border-secondary border-opacity-10">
                  <small className="text-muted fs-10 d-block">CHLORINE</small>
                  <span className="text-warning fw-black fs-8">0.45</span>
                  <small className="text-secondary fs-10 ms-1">mg/L</small>
                </div>
              </Col>
            </Row>

            <div className="mt-2 pt-2 border-top border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
              <span className="text-secondary fs-10">Water Treatment / Filtration:</span>
              <span className="text-success fw-bold fs-10">UV + Micron Cartridge Active</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 24-Hour Hydraulic Supply vs Demand Trend SVG Chart */}
      <Card className="bg-dark bg-opacity-40 border border-secondary border-opacity-15 rounded-4 p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h6 className="text-white fw-bold mb-1 fs-8 d-flex align-items-center gap-2">
              <TrendingUp size={18} className="text-info" />
              24-HOUR HYDRAULIC DISPATCH & CONSUMPTION CURVE
            </h6>
            <small className="text-secondary fs-10">
              Interactive timeline showing Pumping to AG Tanks vs Real-time Building Consumption vs Rooftop Storage Fill
            </small>
          </div>

          <div className="d-flex align-items-center gap-3 fs-9">
            <div className="d-flex align-items-center gap-1.5">
              <span style={{ width: '12px', height: '3px', background: '#38bdf8', display: 'inline-block' }}></span>
              <span className="text-white">Pumping Flow (LPM)</span>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <span style={{ width: '12px', height: '3px', background: '#f59e0b', display: 'inline-block' }}></span>
              <span className="text-white">Building Demand (LPM)</span>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <span style={{ width: '12px', height: '3px', background: '#22c55e', display: 'inline-block' }}></span>
              <span className="text-white">AG Rooftop Fill (%)</span>
            </div>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="position-relative" style={{ minHeight: '220px' }}>
          <svg
            width="100%"
            height="220"
            viewBox="0 0 1000 220"
            preserveAspectRatio="none"
            className="overflow-visible"
          >
            <defs>
              <linearGradient id="pumpingArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="demandArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[40, 80, 120, 160].map(y => (
              <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
            ))}

            {/* Pumping Area & Path */}
            <path
              d="M0 130 C80 90, 160 80, 250 85 C330 140, 420 70, 500 80 C580 95, 670 120, 750 65 C830 50, 920 90, 1000 80 L1000 190 L0 190 Z"
              fill="url(#pumpingArea)"
            />
            <path
              d="M0 130 C80 90, 160 80, 250 85 C330 140, 420 70, 500 80 C580 95, 670 120, 750 65 C830 50, 920 90, 1000 80"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
            />

            {/* Demand Area & Path */}
            <path
              d="M0 170 C80 180, 160 170, 250 165 C330 70, 420 50, 500 70 C580 85, 670 110, 750 55 C830 65, 920 140, 1000 150 L1000 190 L0 190 Z"
              fill="url(#demandArea)"
            />
            <path
              d="M0 170 C80 180, 160 170, 250 165 C330 70, 420 50, 500 70 C580 85, 670 110, 750 55 C830 65, 920 140, 1000 150"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="6,3"
            />

            {/* AG Rooftop Fill % Line */}
            <path
              d="M0 70 C160 55, 330 50, 420 75 C580 90, 750 110, 920 95 C960 90, 1000 80, 1000 75"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
            />

            {/* Hover Points along timeline */}
            {hourlyData.map((d, i) => {
              const cx = (i / (hourlyData.length - 1)) * 980 + 10;
              const isHovered = hoveredHour === i;

              return (
                <g
                  key={d.hour}
                  onMouseEnter={() => setHoveredHour(i)}
                  onMouseLeave={() => setHoveredHour(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={cx}
                    cy="85"
                    r={isHovered ? 6 : 3}
                    fill={isHovered ? '#38bdf8' : '#0f172a'}
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  <text x={cx} y="205" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle">
                    {d.hour}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredHour !== null && (
            <div
              className="position-absolute p-2 rounded-3 bg-dark border border-secondary border-opacity-25 shadow-lg"
              style={{
                left: `${(hoveredHour / (hourlyData.length - 1)) * 85 + 5}%`,
                top: '10px',
                zIndex: 10,
                pointerEvents: 'none',
                minWidth: '150px'
              }}
            >
              <div className="fw-bold text-white fs-10 mb-1 border-bottom border-secondary border-opacity-20 pb-1">
                Timeline: {hourlyData[hoveredHour].hour}
              </div>
              <div className="d-flex justify-content-between text-info fs-10">
                <span>Pumping Rate:</span>
                <span className="fw-bold">{hourlyData[hoveredHour].pumping * 10} LPM</span>
              </div>
              <div className="d-flex justify-content-between text-warning fs-10">
                <span>Demand Flow:</span>
                <span className="fw-bold">{hourlyData[hoveredHour].consumption * 10} LPM</span>
              </div>
              <div className="d-flex justify-content-between text-success fs-10">
                <span>AG Rooftop Fill:</span>
                <span className="fw-bold">{hourlyData[hoveredHour].agLevel}%</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default React.memo(HydraulicBalanceAnalytics);
