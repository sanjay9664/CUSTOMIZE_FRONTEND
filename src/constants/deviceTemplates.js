/**
 * Central Device Categories and Telemetry Templates
 * Synchronized with backend DeviceCategory enum and docs/Device-template.MD
 */



export const DEVICE_CATEGORIES = [
  'MAIN_ENERGY_METER',
  'SUB_ENERGY_METER',
  'SOLAR_SYSTEM',
  'INVERTER',
  'UPS',
  'UG_TANK',
  'AG_TANK',
  'PUMP',
  'VALVE',
  'GENERATOR',
  'LT_PANEL',
  'FIRE_PUMP',
  'HVAC_CHILLER',
  'HVAC_AHU',
  'HVAC_COOLING_TOWER',
  'VRV',
  'AQI_SENSOR',
  'BREAKER',
  'STP',
  'WTP',
  'LIFT',
  'LIGHTING',
  'FIRE_PANEL',
  'CONTROLLER',
  'SENSOR',
  'AC',
  'OTHER'
];



export const CATEGORY_LABELS = {
  MAIN_ENERGY_METER: 'Main Energy Meter',
  SUB_ENERGY_METER: 'Sub-Energy Meter',
  ENERGY_METER: 'Sub-Energy Meter', // fallback for any legacy device records
  SOLAR_SYSTEM: 'Solar System',
  INVERTER: 'Inverter',
  UPS: 'Uninterruptible Power Supply (UPS)',
  UG_TANK: 'Underground (UG) Tank',
  AG_TANK: 'Above Ground (AG) Tank',
  PUMP: 'Pump',
  VALVE: 'Valve',
  GENERATOR: 'Generator (DG Set)',
  LT_PANEL: 'LT Panel',
  FIRE_PUMP: 'Fire Pump',
  HVAC_CHILLER: 'HVAC Chiller',
  HVAC_AHU: 'HVAC AHU',
  HVAC_COOLING_TOWER: 'HVAC Cooling Tower',
  VRV: 'VRV System',
  AQI_SENSOR: 'AQI Sensor',
  BREAKER: 'Breaker',
  STP: 'Sewage Treatment (STP)',
  WTP: 'Water Treatment (WTP)',
  LIFT: 'Elevator / Lift',
  LIGHTING: 'Lighting Automation',
  FIRE_PANEL: 'Fire Alarm Panel',
  CONTROLLER: 'Controller',
  SENSOR: 'Sensor',
  AC: 'Air Conditioner (AC)',
  OTHER: 'Other Device'
};

export const formatCategoryLabel = (category) => {
  if (!category) return '';
  return CATEGORY_LABELS[category] || String(category).replace(/_/g, ' ');
};

export const isCategoryMatch = (deviceCategory, filterCategory) => {
  if (!filterCategory || filterCategory === 'ALL') return true;
  if (!deviceCategory) return false;

  const dCat = String(deviceCategory).trim().toUpperCase().replace(/[\s-]+/g, '_');
  const fCat = String(filterCategory).trim().toUpperCase().replace(/[\s-]+/g, '_');

  if (dCat === fCat) return true;

  // Sub-energy meter aliases (including legacy 'ENERGY_METER' and 'SUB_ENERGY_METER')
  const subMeterAliases = ['SUB_ENERGY_METER', 'ENERGY_METER', 'SUB_ENERGY_METERS', 'ENERGY_METERS'];
  if (subMeterAliases.includes(fCat) && subMeterAliases.includes(dCat)) return true;

  // Main energy meter aliases
  const mainMeterAliases = ['MAIN_ENERGY_METER', 'MAIN_ENERGY_METERS'];
  if (mainMeterAliases.includes(fCat) && mainMeterAliases.includes(dCat)) return true;

  // Tank aliases
  const ugTankAliases = ['UG_TANK', 'UNDERGROUND_TANK', 'UNDERGROUND_WATER_TANK'];
  if (ugTankAliases.includes(fCat) && ugTankAliases.includes(dCat)) return true;

  const agTankAliases = ['AG_TANK', 'ABOVE_GROUND_TANK', 'ABOVE_GROUND_WATER_TANK'];
  if (agTankAliases.includes(fCat) && agTankAliases.includes(dCat)) return true;

  // Generator aliases
  const genAliases = ['GENERATOR', 'DG_SET', 'DG', 'DIESEL_GENERATOR'];
  if (genAliases.includes(fCat) && genAliases.includes(dCat)) return true;

  // Fire pump
  const firePumpAliases = ['FIRE_PUMP', 'FIRE_PUMP_SYSTEM'];
  if (firePumpAliases.includes(fCat) && firePumpAliases.includes(dCat)) return true;

  // HVAC aliases
  const chillerAliases = ['HVAC_CHILLER', 'CHILLER'];
  if (chillerAliases.includes(fCat) && chillerAliases.includes(dCat)) return true;

  const ahuAliases = ['HVAC_AHU', 'AHU'];
  if (ahuAliases.includes(fCat) && ahuAliases.includes(dCat)) return true;

  const coolingTowerAliases = ['HVAC_COOLING_TOWER', 'COOLING_TOWER'];
  if (coolingTowerAliases.includes(fCat) && coolingTowerAliases.includes(dCat)) return true;

  const vrvAliases = ['VRV', 'VRV_SYSTEM', 'VRF'];
  if (vrvAliases.includes(fCat) && vrvAliases.includes(dCat)) return true;

  const liftAliases = ['LIFT', 'ELEVATOR'];
  if (liftAliases.includes(fCat) && liftAliases.includes(dCat)) return true;

  const acAliases = ['AC', 'AIR_CONDITIONER'];
  if (acAliases.includes(fCat) && acAliases.includes(dCat)) return true;

  const solarAliases = ['SOLAR_SYSTEM', 'SOLAR', 'SOLAR_PLANT', 'SOLAR SYSTEM'];
  if (solarAliases.includes(fCat) && solarAliases.includes(dCat)) return true;

  const inverterAliases = ['INVERTER', 'SOLAR_INVERTER'];
  if (inverterAliases.includes(fCat) && inverterAliases.includes(dCat)) return true;

  const upsAliases = ['UPS', 'UNINTERRUPTIBLE_POWER_SUPPLY'];
  if (upsAliases.includes(fCat) && upsAliases.includes(dCat)) return true;

  return false;
};

export const DEVICE_TEMPLATES = {
  WATER_MANAGEMENT: {
    id: 'WATER_MANAGEMENT',
    label: 'Water Management',
    parameters: [
      { name: 'Water Level', required: false },
      { name: 'Water Flow', required: false },
      { name: 'Water Pressure', required: false },
      { name: 'Inlet Pressure', required: false },
      { name: 'Outlet Pressure', required: false },
      { name: 'Tank Level', required: true },
      { name: 'AG Tank Level', required: false },
      { name: 'UG Tank Level', required: false },
      { name: 'Pump Status', required: true },
      { name: 'Runtime', required: false },
      { name: 'Current', required: false },
      { name: 'Voltage', required: false },
      { name: 'Power', required: false },
      { name: 'Frequency', required: false },
      { name: 'Flow Rate', required: false },
      { name: 'Total Water Consumption', required: false },
      { name: 'Daily Consumption', required: false },
      { name: 'Monthly Consumption', required: false },
      { name: 'Leakage Status', required: false },
      { name: 'Valve Status', required: false },
      { name: 'Auto/Manual Mode', required: false },
      { name: 'Low-Level Alarm', required: false },
      { name: 'High-Level Alarm', required: false },
      { name: 'Dry-Run Alarm', required: false },
      { name: 'Pump Fault', required: false },
      { name: 'Pump Trip', required: false }
    ]
  },

  MOTOR: {
    id: 'MOTOR',
    label: 'Motor',
    parameters: [
      { name: 'Motor Status', required: true },
      { name: 'Speed RPM', required: false },
      { name: 'Frequency', required: true },
      { name: 'Voltage', required: true },
      { name: 'Current', required: true },
      { name: 'Active Power', required: false },
      { name: 'Reactive Power', required: false },
      { name: 'Power Factor', required: false },
      { name: 'Temperature', required: false },
      { name: 'Bearing Temperature', required: false },
      { name: 'Winding Temperature', required: false },
      { name: 'Vibration', required: false },
      { name: 'Torque', required: false },
      { name: 'Load %', required: false },
      { name: 'Runtime', required: false },
      { name: 'Start Count', required: false },
      { name: 'Trip Count', required: false },
      { name: 'Overload Status', required: false },
      { name: 'Overcurrent', required: false },
      { name: 'Undervoltage', required: false },
      { name: 'Overvoltage', required: false },
      { name: 'Phase Failure', required: false },
      { name: 'Phase Imbalance', required: false },
      { name: 'VFD Status', required: false },
      { name: 'VFD Fault', required: false },
      { name: 'VFD Frequency', required: false },
      { name: 'Energy Consumption', required: false },
      { name: 'Efficiency', required: false }
    ]
  },

  DG_SET: {
    id: 'DG_SET',
    label: 'DG Set / Generator',

    parameters: [
      // =========================
      // CORE / GENERAL PARAMETERS
      // =========================
      { name: 'Running Status (ON / OFF / IDLE)', required: true },
      { name: 'Availability Status (% / State)', required: false },
      { name: 'Generator Load Percentage (%)', required: false },

      { name: 'Line Voltage (V Volts)', required: true },
      { name: 'Phase Current (A Amperes)', required: true },
      { name: 'Electrical Frequency (Hz Hertz)', required: true },
      { name: 'Engine Speed (RPM)', required: false },

      { name: 'Active Power (kW Kilowatt)', required: false },
      { name: 'Apparent Power (kVA Kilovolt-Ampere)', required: false },
      { name: 'Reactive Power (kVAr Reactive Power)', required: false },
      { name: 'Power Factor (PF 0.00-1.00)', required: false },

      // =========================
      // FUEL / ENGINE PARAMETERS
      // =========================
      { name: 'Fuel Tank Level (%)', required: false },
      { name: 'Fuel Consumption (Liters)', required: false },
      { name: 'Fuel Consumption Rate (L/hr)', required: false },

      { name: 'Engine Temperature (°C)', required: false },
      { name: 'Coolant Temperature (°C)', required: false },
      { name: 'Engine Oil Pressure (kPa / Bar)', required: false },
      { name: 'Engine Oil Temperature (°C)', required: false },

      { name: 'Battery Voltage (V DC)', required: false },

      { name: 'Total Engine Hours (HRS)', required: false },
      { name: 'Start Count (Number of Starts)', required: false },
      { name: 'Engine Runtime (Hours)', required: false },

      { name: 'Alternator Temperature (°C)', required: false },
      { name: 'Exhaust Gas Temperature (°C)', required: false },

      // =========================
      // ELECTRICAL PARAMETERS
      // =========================
      { name: 'Phase-to-Neutral Voltage (V L-N)', required: false },
      { name: 'Phase Current (A Amperes)', required: false },

      // =========================
      // PROTECTION / ALARM PARAMETERS
      // =========================
      { name: 'Generator Trip Alarm', required: false },
      { name: 'Generator Overload Alarm', required: false },
      { name: 'Low Fuel Level Alarm', required: false },
      { name: 'Low Oil Pressure Warning', required: false },
      { name: 'High Temperature Alarm', required: false },
      { name: 'Battery Voltage Low Warning', required: false },
      { name: 'Emergency Stop Activated', required: false },

      // ==================================================
      // ADDITIONAL GENERATOR PARAMETERS (EXPANDED DISPLAY NAMES)
      // ==================================================

      { name: 'Engine Speed (RPM)', required: false },
      { name: 'Frequency (R Phase - Hz)', required: false },

      { name: 'Line-to-Line Voltage L1-L2 (V)', required: false },
      { name: 'Phase L1 Current (A L1)', required: false },
      { name: 'Phase L2 Current (A L2)', required: false },
      { name: 'Phase L3 Current (A L3)', required: false },

      { name: 'Generator Average Power Factor (PF)', required: false },

      { name: 'Engine Run Time (Total Hours)', required: false },
      { name: 'Number of Starts (Start Count)', required: false },

      { name: 'Active Energy Consumption (kWh)', required: false },
      { name: 'Apparent Energy Consumption (kVAh)', required: false },
      { name: 'Reactive Energy Consumption (kVArh)', required: false },

      { name: 'Total Active Power (kW / Total Watts)', required: false },
      { name: 'Total Apparent Power (kVA / Total VA)', required: false },
      { name: 'Total Reactive Power (kVAr / Total Var)', required: false },

      { name: 'Average Voltage Line-to-Neutral (V L-N)', required: false },

      // =========================
      // GENERATOR FAULT & PROTECTION ALARMS
      // =========================
      { name: 'Overvoltage Alarm (High Voltage)', required: false },
      { name: 'Under-Frequency Alarm (Low Frequency)', required: false },
      { name: 'Over-Frequency Alarm (High Frequency)', required: false },
      { name: 'Overcurrent Alarm (High Current)', required: false },

      { name: 'Low Battery Voltage Alarm', required: false },
      { name: 'High Battery Voltage Alarm', required: false },

      { name: 'Generator kW Overload Alarm', required: false },

      { name: 'Low Oil Pressure Alarm', required: false },
      { name: 'High Coolant Temperature Alarm', required: false },

      { name: 'Engine Under-Speed Fault Alarm', required: false },
      { name: 'Engine Over-Speed Fault Alarm', required: false },

      { name: 'Engine Fail to Start Alarm', required: false },
      { name: 'Engine Fail to Rest/Stop Alarm', required: false },

      { name: 'Undervoltage Alarm (Low Voltage)', required: false }
    ]
  },

  LT_PANEL: {
    id: 'LT_PANEL',
    label: 'LT Panel',
    parameters: [
      { name: 'Panel Status', required: true },
      { name: 'Incoming Voltage', required: true },
      { name: 'Incoming Current', required: true },
      { name: 'Incoming Power', required: false },
      { name: 'Incoming Apparent Power', required: false },
      { name: 'Incoming Reactive Power', required: false },
      { name: 'Power Factor', required: false },
      { name: 'Frequency', required: false },
      { name: 'Bus Voltage', required: false },
      { name: 'Bus Current', required: false },
      { name: 'Feeder Voltage', required: false },
      { name: 'Feeder Current', required: false },
      { name: 'Feeder Power', required: false },
      { name: 'Breaker Status', required: false },
      { name: 'Breaker Trip', required: false },
      { name: 'Breaker ON/OFF', required: false },
      { name: 'Phase Voltage R-Y', required: false },
      { name: 'Phase Voltage Y-B', required: false },
      { name: 'Phase Voltage B-R', required: false },
      { name: 'Phase Current R', required: false },
      { name: 'Phase Current Y', required: false },
      { name: 'Phase Current B', required: false },
      { name: 'Phase Imbalance', required: false },
      { name: 'Energy Consumption', required: false },
      { name: 'Maximum Demand', required: false },
      { name: 'Incoming/Outgoing Energy', required: false },
      { name: 'Temperature', required: false },
      { name: 'Panel Door Status', required: false },
      { name: 'Overload', required: false },
      { name: 'Short Circuit', required: false },
      { name: 'Earth Fault', required: false }
    ]
  },

  TRANSFORMER: {
    id: 'TRANSFORMER',
    label: 'Transformer',
    parameters: [
      { name: 'Transformer Status', required: true },
      { name: 'HV Voltage', required: false },
      { name: 'LV Voltage', required: false },
      { name: 'HV Current', required: false },
      { name: 'LV Current', required: false },
      { name: 'Load %', required: false },
      { name: 'Active Power', required: false },
      { name: 'Apparent Power', required: false },
      { name: 'Reactive Power', required: false },
      { name: 'Power Factor', required: false },
      { name: 'Frequency', required: false },
      { name: 'Oil Temperature', required: false },
      { name: 'Winding Temperature', required: false },
      { name: 'Ambient Temperature', required: false },
      { name: 'Oil Level', required: false },
      { name: 'Buchholz Alarm', required: false },
      { name: 'Buchholz Trip', required: false },
      { name: 'Pressure', required: false },
      { name: 'OLTC Position', required: false },
      { name: 'Tap Position', required: false },
      { name: 'Transformer-1 Status', required: false },
      { name: 'Transformer-2 Status', required: false },
      { name: 'Load Balance', required: false },
      { name: 'Phase Imbalance', required: false },
      { name: 'Overload', required: false },
      { name: 'Overtemperature', required: false },
      { name: 'Energy Input', required: false },
      { name: 'Energy Output', required: false },
      { name: 'Efficiency', required: false },
      { name: 'Runtime', required: false }
    ]
  },

  FIRE_SYSTEM: {
    id: 'FIRE_SYSTEM',
    label: 'Fire System / Fire Pump',
    parameters: [
      { name: 'Fire Alarm Status', required: true },
      { name: 'Fire Pump Status', required: true },
      { name: 'Main Pump Status', required: false },
      { name: 'Jockey Pump Status', required: false },
      { name: 'Diesel Pump Status', required: false },
      { name: 'Pump Pressure', required: false },
      { name: 'Header Pressure', required: false },
      { name: 'Suction Pressure', required: false },
      { name: 'Discharge Pressure', required: false },
      { name: 'Water Tank Level', required: false },
      { name: 'Current', required: false },
      { name: 'Voltage', required: false },
      { name: 'Power', required: false },
      { name: 'Runtime', required: false },
      { name: 'Start Count', required: false },
      { name: 'Fire Zone Status', required: false },
      { name: 'Smoke Detector Status', required: false },
      { name: 'Heat Detector Status', required: false },
      { name: 'Manual Call Point', required: false },
      { name: 'Sprinkler Status', required: false },
      { name: 'Hydrant Pressure', required: false },
      { name: 'Valve Status', required: false },
      { name: 'Valve Open/Close', required: false },
      { name: 'Fire Alarm', required: false },
      { name: 'Pump Fault', required: false },
      { name: 'Low Pressure', required: false },
      { name: 'High Pressure', required: false },
      { name: 'Low Water Level', required: false },
      { name: 'Diesel Fuel Level', required: false },
      { name: 'Battery Voltage', required: false },
      { name: 'Emergency Status', required: false }
    ]
  },

SUB_ENERGY_METER: {
  id: 'SUB_ENERGY_METER',
  label: 'Sub-Energy Meter',

  parameters: [
    // =========================
    // MOST COMMON / CORE
    // =========================
    { name: 'Meter Status', required: true },
    { name: 'Meter Serial Number', required: true },
    { name: 'Voltage (V - Volts)', required: true },
    { name: 'Current (A - Amperes)', required: true },
    { name: 'Active Power (kW - Kilowatt)', required: true },
    { name: 'Power Factor (PF)', required: true },
    { name: 'Active Energy (kWh - Kilowatt Hour)', required: true },
    { name: 'Apparent Power (kVA - Apparent Power)', required: false },
    { name: 'Apparent Energy (kVAh - Kilovolt Ampere Hour)', required: false },

    // =========================
    // PHASE PARAMETERS
    // =========================
    { name: 'Phase Voltage (V - Volts)', required: false },
    { name: 'Phase Current (A - Amperes)', required: false },
    { name: 'Voltage R (V)', required: false },
    { name: 'Voltage Y (V)', required: false },
    { name: 'Voltage B (V)', required: false },
    { name: 'R Current (A)', required: false },
    { name: 'Y Current (A)', required: false },
    { name: 'B Current (A)', required: false },
    { name: 'Phase Imbalance (%)', required: false },

    // =========================
    // ENERGY / POWER
    // =========================
    { name: 'Reactive Power (kVAR - Reactive Power)', required: false },
    { name: 'Reactive Energy (kVARh - Reactive Energy Hour)', required: false },
    { name: 'Import Energy (kWh - Active Energy)', required: false },
    { name: 'Export Energy (kWh - Active Energy)', required: false },
    { name: 'kWh (Active Energy - Kilowatt Hour)', required: false },
    { name: 'kVAh (Apparent Energy - Kilovolt Ampere Hour)', required: false },
    { name: 'kVARh (Reactive Energy - Kilovolt Ampere Reactive Hour)', required: false },
    { name: 'Daily Energy (kWh)', required: false },
    { name: 'Monthly Energy (kWh)', required: false },
    { name: 'Yearly Energy (kWh)', required: false },

    // =========================
    // DEMAND
    // =========================
    { name: 'Maximum Demand (kW / kVA)', required: false },
    { name: 'Average Demand (kW / kVA)', required: false },
    { name: 'Peak Demand (kW / kVA)', required: false },

    // =========================
    // METER / LOAD SETTINGS
    // =========================
    { name: 'Balance (₹)', required: false },
    { name: 'Fixed Charge (₹)', required: false },
    { name: 'EB Tariff (₹)', required: false },
    { name: 'DG Tariff (₹)', required: false },
    { name: 'EB/DG Status', required: false },
    { name: 'Connected Status', required: false },
    { name: 'Force Off', required: false },
    { name: 'Low Balance Cut', required: false },

    // =========================
    // OVERLOAD / LOAD SET
    // =========================
    { name: 'Overload Trip', required: false },
    { name: 'Overload Limit Reached', required: false },
    { name: 'No. of Overload Checks', required: false },
    { name: 'EB R Load Set (kW)', required: false },
    { name: 'EB Y Load Set (kW)', required: false },
    { name: 'EB B Load Set (kW)', required: false },
    { name: 'DG R Load Set (kW)', required: false },
    { name: 'DG Y Load Set (kW)', required: false },
    { name: 'DG B Load Set (kW)', required: false },

    // =========================
    // ELECTRICAL QUALITY
    // =========================
    { name: 'Frequency (Hz - Hertz)', required: false },
    { name: 'Harmonics THD (% Total Harmonic Distortion)', required: false },

    // =========================
    // CONSUMPTION / ANALYTICS
    // =========================
    { name: 'Main Meter', required: false },
    { name: 'Sub Meter', required: false },
    { name: 'Meter-wise Consumption', required: false },
    { name: 'Area-wise Consumption', required: false },
    { name: 'Equipment-wise Consumption', required: false },
    { name: 'Energy Cost (₹)', required: false },
    { name: 'Energy Trend', required: false },
    { name: 'Carbon Emission (kgCO2)', required: false }
  ]
},

 MAIN_ENERGY_METER: {
  id: 'MAIN_ENERGY_METER',
  label: 'Main Energy Meter',

  parameters: [
    // =========================
    // MOST COMMON / CORE
    // =========================
    { name: 'EP (Active Energy - kWh)', required: false },
    { name: 'Eq (Reactive Energy - kVARh)', required: false },
    { name: 'PF (Power Factor)', required: false },
    { name: 'S (Apparent Power - kVA)', required: false },
    { name: 'Total KW (Active Power - kW)', required: false },
    { name: 'Total KVA (Apparent Power - kVA)', required: false },
    { name: 'Frequency (Hz - Hertz)', required: false },

    // =========================
    // PHASE VOLTAGE & CURRENT
    // =========================
    { name: 'R-Phase Voltage (V)', required: false },
    { name: 'Y-Phase Voltage (V)', required: false },
    { name: 'B-Phase Voltage (V)', required: false },
    { name: 'R-Current (A)', required: false },
    { name: 'Y-Current (A)', required: false },
    { name: 'B-Current (A)', required: false },

    // =========================
    // PHASE POWER FACTOR
    // =========================
    { name: 'PF-R (R-Phase Power Factor)', required: false },
    { name: 'PF-Y (Y-Phase Power Factor)', required: false },
    { name: 'PF-B (B-Phase Power Factor)', required: false },
    { name: 'Avg PF (Average Power Factor)', required: false },

    // =========================
    // ENERGY
    // =========================
    { name: 'EB KWH (Grid Active Energy - kWh)', required: false },
    { name: 'EB KVAH (Grid Apparent Energy - kVAh)', required: false },
    { name: 'DG KWH (Generator Active Energy - kWh)', required: false },
    { name: 'Reactive Power (kVAR - Reactive Power)', required: false },

    // =========================
    // AVERAGE ELECTRICAL VALUES
    // =========================
    { name: 'Avg Voltage L-L (V)', required: false },
    { name: 'Avg Voltage L-N (V)', required: false },
    { name: 'Avg Current (A)', required: false },
    { name: 'Power KVA (AVG) (Avg Apparent Power - kVA)', required: false },
    { name: 'Power KVAR (AVG) (Avg Reactive Power - kVAR)', required: false },

    // =========================
    // LINE-TO-LINE VOLTAGE
    // =========================
    { name: 'Voltage R-Y (V)', required: false },
    { name: 'Voltage Y-B (V)', required: false },
    { name: 'Voltage B-R (V)', required: false },

    // =========================
    // METER / TARIFF
    // =========================
    { name: 'Balance (₹)', required: false },
    { name: 'Meter Target', required: false },
    { name: 'EB Tariff (₹/kWh)', required: false },
    { name: 'DG Tariff (₹/kWh)', required: false },

    // =========================
    // PHASE LOAD
    // =========================
    { name: 'R-Phase Load (kW)', required: false },
    { name: 'Y-Phase Load (kW)', required: false },
    { name: 'B-Phase Load (kW)', required: false },
    { name: 'Load %', required: false },

    // =========================
    // LOAD / NO-LOAD TIME
    // =========================
    { name: 'Load Hrs', required: false },
    { name: 'Load Min', required: false },
    { name: 'No Load Hrs', required: false },
    { name: 'No Load Min', required: false }
  ]
},

  VRV: {
    id: 'VRV',
    label: 'VRV System',
    parameters: [
      { name: 'VRV System Status', required: true },
      { name: 'Outdoor Unit Status', required: false },
      { name: 'Indoor Unit Status', required: false },
      { name: 'Set Temperature', required: false },
      { name: 'Room Temperature', required: false },
      { name: 'Supply Air Temperature', required: false },
      { name: 'Return Air Temperature', required: false },
      { name: 'Humidity', required: false },
      { name: 'Compressor Status', required: false },
      { name: 'Compressor Frequency', required: false },
      { name: 'Current', required: false },
      { name: 'Power', required: false },
      { name: 'Refrigerant Pressure', required: false },
      { name: 'Refrigerant Temperature', required: false },
      { name: 'Fan Speed', required: false },
      { name: 'Fan Status', required: false },
      { name: 'Cooling Mode', required: false },
      { name: 'Heating Mode', required: false },
      { name: 'Auto Mode', required: false },
      { name: 'Energy Consumption', required: false },
      { name: 'Runtime', required: false },
      { name: 'Indoor Unit Count', required: false },
      { name: 'Outdoor Unit Count', required: false },
      { name: 'Zone Status', required: false },
      { name: 'Schedule', required: false },
      { name: 'Human Sensor', required: false },
      { name: 'Occupancy', required: false },
      { name: 'Temperature Alarm', required: false },
      { name: 'Communication Alarm', required: false },
      { name: 'Filter Alarm', required: false },
      { name: 'Compressor Fault', required: false }
    ]
  },

  AQI_SENSOR: {
    id: 'AQI_SENSOR',
    label: 'AQI Sensor',
    parameters: [
      { name: 'AQI', required: true },
      { name: 'PM1.0', required: false },
      { name: 'PM2.5', required: true },
      { name: 'PM10', required: false },
      { name: 'CO', required: false },
      { name: 'CO₂', required: false },
      { name: 'NO₂', required: false },
      { name: 'SO₂', required: false },
      { name: 'O₃', required: false },
      { name: 'TVOC', required: false },
      { name: 'Formaldehyde', required: false },
      { name: 'Temperature', required: false },
      { name: 'Humidity', required: false },
      { name: 'Air Pressure', required: false },
      { name: 'Indoor Air Quality', required: false },
      { name: 'Outdoor Air Quality', required: false },
      { name: 'Sensor Status', required: true },
      { name: 'Sensor Health', required: false },
      { name: 'Air Quality Level', required: false },
      { name: 'Good/Moderate/Poor', required: false },
      { name: 'Threshold Status', required: false },
      { name: 'High PM2.5 Alarm', required: false },
      { name: 'High CO₂ Alarm', required: false },
      { name: 'High TVOC Alarm', required: false },
      { name: 'Daily Average AQI', required: false },
      { name: 'Maximum AQI', required: false },
      { name: 'Minimum AQI', required: false },
      { name: 'AQI Trend', required: false },
      { name: 'PDF Report', required: false }
    ]
  },

  HVAC: {
    id: 'HVAC',
    label: 'HVAC',
    parameters: [
      { name: 'HVAC Status', required: true },
      { name: 'Chiller Status', required: false },
      { name: 'AHU Status', required: false },
      { name: 'Cooling Tower Status', required: false },
      { name: 'Supply Temperature', required: false },
      { name: 'Return Temperature', required: false },
      { name: 'Chilled Water Supply', required: false },
      { name: 'Chilled Water Return', required: false },
      { name: 'Water Flow', required: false },
      { name: 'Water Pressure', required: false },
      { name: 'Air Flow', required: false },
      { name: 'Air Pressure', required: false },
      { name: 'Room Temperature', required: false },
      { name: 'Humidity', required: false },
      { name: 'Compressor Status', required: false },
      { name: 'Current', required: false },
      { name: 'Power', required: false },
      { name: 'Fan Status', required: false },
      { name: 'Fan Speed', required: false },
      { name: 'Pump Status', required: false },
      { name: 'Pump Current', required: false },
      { name: 'Pump Power', required: false },
      { name: 'Cooling Capacity', required: false },
      { name: 'COP', required: false },
      { name: 'Energy Consumption', required: false },
      { name: 'Runtime', required: false },
      { name: 'Filter Status', required: false },
      { name: 'Valve Status', required: false },
      { name: 'Damper Position', required: false },
      { name: 'Set Temperature', required: false },
      { name: 'Temperature Difference', required: false },
      { name: 'High Temperature Alarm', required: false },
      { name: 'High Pressure Alarm', required: false },
      { name: 'Low Pressure Alarm', required: false },
      { name: 'Maintenance Due', required: false }
    ]
  },

  AC: {
    id: 'AC',
    label: 'Air Conditioner',
    parameters: [
      { name: 'AC Status', required: true },
      { name: 'ON/OFF', required: false },
      { name: 'Set Temperature', required: false },
      { name: 'Room Temperature', required: false },
      { name: 'Humidity', required: false },
      { name: 'Mode', required: false },
      { name: 'Cooling', required: false },
      { name: 'Heating', required: false },
      { name: 'Fan Speed', required: false },
      { name: 'Compressor Status', required: false },
      { name: 'Current', required: false },
      { name: 'Power', required: false },
      { name: 'Supply Air Temperature', required: false },
      { name: 'Return Air Temperature', required: false },
      { name: 'Energy Consumption', required: false },
      { name: 'Runtime', required: false },
      { name: 'Schedule', required: false },
      { name: 'Auto/Manual', required: false },
      { name: 'Swing Status', required: false },
      { name: 'Filter Status', required: false },
      { name: 'Fault Status', required: false },
      { name: 'Communication Status', required: false },
      { name: 'Temperature Alarm', required: false },
      { name: 'Power Consumption', required: false }
    ]
  },
  
SOLAR_SYSTEM: {
  id: 'SOLAR_SYSTEM',
  label: 'Solar System',
  parameters: [
    // CORE / GENERAL PARAMETERS
    { name: 'Solar System Status', required: true },
    { name: 'Solar Generation Power (kW)', required: false },
    { name: 'Daily Energy Generation (kWh)', required: false },
    { name: 'Total Energy Generation (kWh)', required: false },
    { name: 'Solar System Availability (%)', required: false },
    { name: 'Solar Plant Load (%)', required: false },

    // ELECTRICAL PARAMETERS
    { name: 'AC Output Voltage (V)', required: false },
    { name: 'AC Output Current (A)', required: false },
    { name: 'AC Output Frequency (Hz)', required: false },
    { name: 'AC Output Power (kW)', required: false },
    { name: 'Apparent Power (kVA)', required: false },
    { name: 'Reactive Power (kVAR)', required: false },
    { name: 'Power Factor (PF)', required: false },
    { name: 'DC Input Voltage (V)', required: false },
    { name: 'DC Input Current (A)', required: false },
    { name: 'DC Input Power (kW)', required: false },

    // ENERGY / PERFORMANCE PARAMETERS
    { name: 'Monthly Energy Generation (kWh)', required: false },
    { name: 'Yearly Energy Generation (kWh)', required: false },
    { name: 'Lifetime Energy Generation (kWh)', required: false },
    { name: 'Solar Performance Ratio (%)', required: false },
    { name: 'Solar System Efficiency (%)', required: false },
    { name: 'Specific Energy Yield (kWh/kWp)', required: false },
    { name: 'Installed Solar Capacity (kWp)', required: false },
    { name: 'Export Energy (kWh)', required: false },
    { name: 'Import Energy (kWh)', required: false },
    { name: 'Self-Consumption Energy (kWh)', required: false },
    { name: 'Grid Feed-in Power (kW)', required: false },

    // ENVIRONMENTAL PARAMETERS
    { name: 'Solar Irradiance (W/m²)', required: false },
    { name: 'Ambient Temperature (°C)', required: false },
    { name: 'Solar Panel Temperature (°C)', required: false },
    { name: 'Wind Speed (m/s)', required: false },

    // EQUIPMENT / STRING PARAMETERS
    { name: 'Inverter Status', required: false },
    { name: 'Solar Panel String Voltage (V)', required: false },
    { name: 'Solar Panel String Current (A)', required: false },
    { name: 'Solar Panel String Power (kW)', required: false },
    { name: 'MPPT Voltage (V)', required: false },
    { name: 'MPPT Current (A)', required: false },
    { name: 'MPPT Power (kW)', required: false },
    { name: 'Connected Inverter Count', required: false },
    { name: 'Online Inverter Count', required: false },

    // BATTERY / HYBRID SYSTEM PARAMETERS
    { name: 'Battery State of Charge (%)', required: false },
    { name: 'Battery Charging Power (kW)', required: false },
    { name: 'Battery Discharging Power (kW)', required: false },
    { name: 'Battery Voltage (V)', required: false },
    { name: 'Battery Current (A)', required: false },
    { name: 'Battery Status', required: false },

    // ALARMS / DIAGNOSTICS
    { name: 'Solar System Fault Status', required: false },
    { name: 'Inverter Fault Status', required: false },
    { name: 'Grid Failure Alarm', required: false },
    { name: 'DC Overvoltage Alarm', required: false },
    { name: 'AC Overvoltage Alarm', required: false },
    { name: 'Insulation Resistance Alarm', required: false },
    { name: 'Ground Fault Alarm', required: false },
    { name: 'Overtemperature Alarm', required: false },
    { name: 'Communication Status', required: false },
    { name: 'Last Fault Code', required: false },
    { name: 'Last Fault Timestamp', required: false },

    // ADVANCED / DERIVED PARAMETERS
    { name: 'Carbon Emission Reduction (kgCO2)', required: false },
    { name: 'Equivalent Trees Saved', required: false },
    { name: 'Estimated Energy Generation (kWh)', required: false },
    { name: 'Solar Generation Forecast (kWh)', required: false },
    { name: 'Solar Curtailment Power (kW)', required: false },
    { name: 'Solar Curtailment Energy (kWh)', required: false }
  ]
},

INVERTER: {
  id: 'INVERTER',
  label: 'Inverter',
  parameters: [
    // CORE / GENERAL PARAMETERS
    { name: 'Inverter Status', required: true },
    { name: 'Output Power (kW)', required: false },
    { name: 'Input Power (kW)', required: false },
    { name: 'Output Voltage (V)', required: false },
    { name: 'Output Current (A)', required: false },
    { name: 'Input Voltage (V)', required: false },
    { name: 'Input Current (A)', required: false },
    { name: 'Output Frequency (Hz)', required: false },
    { name: 'Power Factor (PF)', required: false },

    // ELECTRICAL PARAMETERS
    { name: 'Apparent Power (kVA)', required: false },
    { name: 'Reactive Power (kVAR)', required: false },
    { name: 'DC Bus Voltage (V)', required: false },
    { name: 'DC Bus Current (A)', required: false },
    { name: 'Phase Voltage (V)', required: false },
    { name: 'Phase Current (A)', required: false },
    { name: 'R-Phase Voltage (V)', required: false },
    { name: 'Y-Phase Voltage (V)', required: false },
    { name: 'B-Phase Voltage (V)', required: false },
    { name: 'R-Phase Current (A)', required: false },
    { name: 'Y-Phase Current (A)', required: false },
    { name: 'B-Phase Current (A)', required: false },
    { name: 'Voltage Imbalance (%)', required: false },
    { name: 'Current Imbalance (%)', required: false },

    // ENERGY / PERFORMANCE PARAMETERS
    { name: 'Daily Energy Generation (kWh)', required: false },
    { name: 'Total Energy Generation (kWh)', required: false },
    { name: 'Monthly Energy Generation (kWh)', required: false },
    { name: 'Yearly Energy Generation (kWh)', required: false },
    { name: 'Energy Consumption (kWh)', required: false },
    { name: 'Inverter Efficiency (%)', required: false },
    { name: 'Inverter Load (%)', required: false },
    { name: 'Rated Power (kW)', required: false },
    { name: 'Maximum Output Power (kW)', required: false },
    { name: 'Runtime (Hours)', required: false },
    { name: 'Start Count', required: false },

    // OPERATING / CONTROL PARAMETERS
    { name: 'Operating Mode', required: false },
    { name: 'Auto / Manual Mode', required: false },
    { name: 'Run Command', required: false },
    { name: 'Frequency Setpoint (Hz)', required: false },
    { name: 'Voltage Setpoint (V)', required: false },
    { name: 'Power Setpoint (kW)', required: false },
    { name: 'Speed (RPM)', required: false },
    { name: 'Motor Temperature (°C)', required: false },
    { name: 'Heatsink Temperature (°C)', required: false },
    { name: 'Ambient Temperature (°C)', required: false },

    // SOLAR / DC-SPECIFIC PARAMETERS
    { name: 'PV Input Power (kW)', required: false },
    { name: 'PV String Voltage (V)', required: false },
    { name: 'PV String Current (A)', required: false },
    { name: 'MPPT Voltage (V)', required: false },
    { name: 'MPPT Current (A)', required: false },
    { name: 'MPPT Power (kW)', required: false },
    { name: 'Connected String Count', required: false },

    // ALARMS / PROTECTION
    { name: 'Fault Status', required: false },
    { name: 'Alarm Status', required: false },
    { name: 'Overvoltage Alarm', required: false },
    { name: 'Undervoltage Alarm', required: false },
    { name: 'Overcurrent Alarm', required: false },
    { name: 'Overload Alarm', required: false },
    { name: 'Overtemperature Alarm', required: false },
    { name: 'Overfrequency Alarm', required: false },
    { name: 'Underfrequency Alarm', required: false },
    { name: 'DC Bus Fault', required: false },
    { name: 'Ground Fault', required: false },
    { name: 'Short Circuit Fault', required: false },
    { name: 'Phase Failure Alarm', required: false },
    { name: 'Communication Status', required: false },
    { name: 'Last Fault Code', required: false },
    { name: 'Last Fault Timestamp', required: false },

    // ADVANCED PARAMETERS
    { name: 'Total Operating Hours', required: false },
    { name: 'Power Derating (%)', required: false },
    { name: 'Harmonic Distortion THD (%)', required: false },
    { name: 'Insulation Resistance (kΩ)', required: false },
    { name: 'Internal Temperature (°C)', required: false },
    { name: 'Firmware Version', required: false }
  ]
},

UPS: {
  id: 'UPS',
  label: 'Uninterruptible Power Supply (UPS)',
  parameters: [
    // CORE / GENERAL PARAMETERS
    { name: 'UPS Status', required: true },
    { name: 'UPS Operating Mode', required: false },
    { name: 'UPS Load (%)', required: false },
    { name: 'Output Power (kW)', required: false },
    { name: 'Output Apparent Power (kVA)', required: false },
    { name: 'Input Voltage (V)', required: false },
    { name: 'Output Voltage (V)', required: false },
    { name: 'Input Frequency (Hz)', required: false },
    { name: 'Output Frequency (Hz)', required: false },
    { name: 'Output Current (A)', required: false },

    // BATTERY PARAMETERS
    { name: 'Battery State of Charge (%)', required: false },
    { name: 'Battery Voltage (V)', required: false },
    { name: 'Battery Current (A)', required: false },
    { name: 'Battery Temperature (°C)', required: false },
    { name: 'Battery Runtime Remaining (Minutes)', required: false },
    { name: 'Battery Status', required: false },
    { name: 'Battery Charging Status', required: false },
    { name: 'Battery Charging Current (A)', required: false },
    { name: 'Battery Discharging Current (A)', required: false },
    { name: 'Battery Capacity (%)', required: false },
    { name: 'Battery Health (%)', required: false },
    { name: 'Battery Backup Time (Minutes)', required: false },
    { name: 'Battery Replacement Date', required: false },
    { name: 'Battery Count', required: false },
    { name: 'Battery String Voltage (V)', required: false },

    // ELECTRICAL PARAMETERS
    { name: 'Input Current (A)', required: false },
    { name: 'Input Power (kW)', required: false },
    { name: 'Input Apparent Power (kVA)', required: false },
    { name: 'Output Current (A)', required: false },
    { name: 'Output Power Factor (PF)', required: false },
    { name: 'Output Reactive Power (kVAR)', required: false },
    { name: 'Input Power Factor (PF)', required: false },
    { name: 'Bypass Voltage (V)', required: false },
    { name: 'Bypass Frequency (Hz)', required: false },
    { name: 'DC Bus Voltage (V)', required: false },
    { name: 'DC Bus Current (A)', required: false },
    { name: 'Phase Voltage (V)', required: false },
    { name: 'Phase Current (A)', required: false },
    { name: 'R-Phase Voltage (V)', required: false },
    { name: 'Y-Phase Voltage (V)', required: false },
    { name: 'B-Phase Voltage (V)', required: false },
    { name: 'R-Phase Current (A)', required: false },
    { name: 'Y-Phase Current (A)', required: false },
    { name: 'B-Phase Current (A)', required: false },
    { name: 'Voltage Imbalance (%)', required: false },
    { name: 'Current Imbalance (%)', required: false },

    // OPERATIONAL / TRANSFER PARAMETERS
    { name: 'Inverter Status', required: false },
    { name: 'Rectifier Status', required: false },
    { name: 'Static Bypass Status', required: false },
    { name: 'Maintenance Bypass Status', required: false },
    { name: 'Battery Mode Status', required: false },
    { name: 'Online Mode Status', required: false },
    { name: 'Eco Mode Status', required: false },
    { name: 'Transfer Status', required: false },
    { name: 'Transfer Count', required: false },
    { name: 'Runtime (Hours)', required: false },
    { name: 'Start Count', required: false },

    // TEMPERATURE / COOLING PARAMETERS
    { name: 'UPS Temperature (°C)', required: false },
    { name: 'Inverter Temperature (°C)', required: false },
    { name: 'Rectifier Temperature (°C)', required: false },
    { name: 'Ambient Temperature (°C)', required: false },
    { name: 'Fan Status', required: false },
    { name: 'Fan Speed (RPM)', required: false },

    // ENERGY / PERFORMANCE PARAMETERS
    { name: 'Daily Energy Consumption (kWh)', required: false },
    { name: 'Total Energy Consumption (kWh)', required: false },
    { name: 'UPS Efficiency (%)', required: false },
    { name: 'Crest Factor', required: false },
    { name: 'Output Harmonic Distortion THD (%)', required: false },
    { name: 'Input Harmonic Distortion THD (%)', required: false },
    { name: 'Rated Capacity (kVA)', required: false },
    { name: 'Rated Power (kW)', required: false },

    // ALARMS / PROTECTION
    { name: 'Fault Status', required: false },
    { name: 'Alarm Status', required: false },
    { name: 'On Battery Alarm', required: false },
    { name: 'Low Battery Alarm', required: false },
    { name: 'Battery Fault Alarm', required: false },
    { name: 'Battery Overtemperature Alarm', required: false },
    { name: 'Input Failure Alarm', required: false },
    { name: 'Output Failure Alarm', required: false },
    { name: 'Output Overload Alarm', required: false },
    { name: 'Output Overvoltage Alarm', required: false },
    { name: 'Output Undervoltage Alarm', required: false },
    { name: 'Overtemperature Alarm', required: false },
    { name: 'Fan Failure Alarm', required: false },
    { name: 'Bypass Failure Alarm', required: false },
    { name: 'Emergency Power Off (EPO) Status', required: false },
    { name: 'Communication Status', required: false },
    { name: 'Last Fault Code', required: false },
    { name: 'Last Fault Timestamp', required: false },

    // ADVANCED / MAINTENANCE PARAMETERS
    { name: 'Total Operating Hours', required: false },
    { name: 'Last Battery Test Result', required: false },
    { name: 'Battery Test Status', required: false },
    { name: 'Next Battery Test Date', required: false },
    { name: 'Battery Replacement Required', required: false },
    { name: 'Firmware Version', required: false },
    { name: 'Maintenance Due', required: false }
  ]
},

 AG_TANK: {
  id: 'AG_TANK',
  label: 'Above Ground (AG) Tank',

  parameters: [
    {
      name: 'WATER LEVEL',
      parameter: 'Tank Level',
      required: true
    },
    {
      name: 'WATER LEVEL %',
      parameter: 'Tank Level %',
      required: true
    },
    {
      name: 'TANK CAPACITY',
      parameter: 'Tank Capacity',
      required: false
    },
    {
      name: 'INLET FLOW',
      parameter: 'Inlet Flow',
      required: false
    },
    {
      name: 'OUTLET FLOW',
      parameter: 'Outlet Flow',
      required: false
    },
    {
      name: 'OPEN VALVE',
      parameter: 'Inlet Valve',
      required: false
    },
    {
      name: 'CLOSE VALVE',
      parameter: 'Outlet Valve',
      required: false
    },
    {
      name: 'VALVE STATUS START',
      parameter: 'Valve Status Start',
      required: false
    },
    {
      name: 'VALVE STATUS STOP',
      parameter: 'Valve Status Stop',
      required: false
    },
    {
      name: 'LOWER LIMITS',
      parameter: 'Low-Level Alarm',
      required: false
    },
    {
      name: 'UPPER LIMITS',
      parameter: 'High-Level Alarm',
      required: false
    },
    {
      name: 'OVERFLOW ALARM',
      parameter: 'Overflow Alarm',
      required: false
    }
  ]
},

 UG_TANK: {
  id: 'UG_TANK',
  label: 'Underground (UG) Tank',

  parameters: [
    {
      name: 'WATER LEVEL',
      parameter: 'Tank Level',
      required: true
    },
    {
      name: 'WATER LEVEL %',
      parameter: 'Tank Level %',
      required: true
    },
    {
      name: 'TANK CAPACITY',
      parameter: 'Tank Capacity',
      required: false
    },
    {
      name: 'INLET FLOW',
      parameter: 'Inlet Flow',
      required: false
    },
    {
      name: 'OUTLET FLOW',
      parameter: 'Outlet Flow',
      required: false
    },
    {
      name: 'OPEN VALVE',
      parameter: 'Inlet Valve',
      required: false
    },
    {
      name: 'CLOSE VALVE',
      parameter: 'Outlet Valve',
      required: false
    },
    {
      name: 'VALVE STATUS START',
      parameter: 'Valve Status Start',
      required: false
    },
    {
      name: 'VALVE STATUS STOP',
      parameter: 'Valve Status Stop',
      required: false
    },
    {
      name: 'LOWER LIMITS',
      parameter: 'Low-Level Alarm',
      required: false
    },
    {
      name: 'UPPER LIMITS',
      parameter: 'High-Level Alarm',
      required: false
    },
    {
      name: 'OVERFLOW ALARM',
      parameter: 'Overflow Alarm',
      required: false
    },
    {
      name: 'AUTO MODE',
      parameter: 'Auto Mode',
      required: false
    },
    {
      name: 'MANUAL MODE',
      parameter: 'Manual Mode',
      required: false
    },
    {
      name: 'BYPASS MODE',
      parameter: 'Bypass Mode',
      required: false
    },
    {
      name: 'START COMMAND',
      parameter: 'Start Command',
      required: false
    },
    {
      name: 'STOP COMMAND',
      parameter: 'Stop Command',
      required: false
    },
    {
      name: 'AUTO SETTING',
      parameter: 'Auto Setting',
      required: false
    },
    {
      name: 'MANUAL SETTING',
      parameter: 'Manual Setting',
      required: false
    },
    {
      name: 'START PRESSURE',
      parameter: 'Start Pressure',
      required: false
    },
    {
      name: 'STOP PRESSURE',
      parameter: 'Stop Pressure',
      required: false
    },
    {
      name: 'LOCAL MODE',
      parameter: 'Local Mode',
      required: false
    },
    {
      name: 'REMOTE MODE',
      parameter: 'Remote Mode',
      required: false
    },
    {
      name: 'OUTPUT CURRENT',
      parameter: 'Output Current',
      required: false
    },
    {
      name: 'OUTPUT VOLTAGE',
      parameter: 'Output Voltage',
      required: false
    },
    {
      name: 'OUTPUT POWER',
      parameter: 'Output Power',
      required: false
    },
    {
      name: 'RUNNING ROTATION SPEED',
      parameter: 'Running Rotation Speed',
      required: false
    },
    {
      name: 'OUTPUT TORQUE',
      parameter: 'Output Torque',
      required: false
    },
    {
      name: 'BUS VOLTAGE',
      parameter: 'Bus Voltage',
      required: false
    },
    {
      name: 'CURRENT FREQUENCY',
      parameter: 'Current Frequency',
      required: false
    }
  ]
},

  PUMP: {
    id: 'PUMP',
    label: 'Pump',
    parameters: [
      { name: 'Pump Status', required: true },
      { name: 'Auto / Manual Mode', required: false },
      { name: 'Runtime', required: false },
      { name: 'Start Count', required: false },
      { name: 'Current', required: false },
      { name: 'Voltage', required: false },
      { name: 'Power', required: false },
      { name: 'Frequency', required: false },
      { name: 'Speed RPM', required: false },
      { name: 'Flow Rate', required: false },
      { name: 'Pressure', required: false },
      { name: 'Load %', required: false },
      { name: 'Energy Consumption', required: false },
      { name: 'Motor Temperature', required: false },
      { name: 'Pump Health', required: false },
      { name: 'Start / Stop Pump', required: false },
      { name: 'Speed Control', required: false },
      { name: 'Frequency Setpoint', required: false },
      { name: 'Pressure Setpoint', required: false },
      { name: 'Duty / Standby Selection', required: false },
      { name: 'Pump Scheduling', required: false },
      { name: 'Dry-Run Alarm', required: false },
      { name: 'Pump Fault', required: false },
      { name: 'Pump Trip', required: false },
      { name: 'Overload', required: false },
      { name: 'Overcurrent', required: false },
      { name: 'Phase Failure', required: false },
      { name: 'High Temperature', required: false },
      { name: 'High Vibration', required: false },
      { name: 'Low Pressure', required: false },
      { name: 'No-Flow Alarm', required: false },
      { name: 'VFD Fault', required: false }
    ]
  },

  VALVE: {
    id: 'VALVE',
    label: 'Valve',
    parameters: [
      { name: 'Valve Status', required: true },
      { name: 'Valve Open/Close', required: false },
      { name: 'Flow Rate', required: false },
      { name: 'Inlet Pressure', required: false },
      { name: 'Outlet Pressure', required: false },
      { name: 'Leakage Status', required: false },
      { name: 'Auto/Manual Mode', required: false },
      { name: 'Command Status', required: false },
      { name: 'Fault Alarm', required: false }
    ]
  },

  BREAKER: {
    id: 'BREAKER',
    label: 'Circuit Breaker',
    parameters: [
      { name: 'Breaker Status', required: true },
      { name: 'Breaker Trip', required: false },
      { name: 'Breaker ON/OFF', required: false },
      { name: 'Current', required: false },
      { name: 'Voltage', required: false },
      { name: 'Overload', required: false },
      { name: 'Short Circuit', required: false },
      { name: 'Earth Fault', required: false }
    ]
  },

  LIFT: {
    id: 'LIFT',
    label: 'Elevator / Lift',
    parameters: [
      { name: 'Lift Status', required: true },
      { name: 'Floor Position', required: true },
      { name: 'Direction (Up/Down)', required: false },
      { name: 'Door Status', required: false },
      { name: 'Overload Alarm', required: false },
      { name: 'Emergency Alarm', required: false },
      { name: 'Runtime', required: false }
    ]
  },

  LIGHTING: {
    id: 'LIGHTING',
    label: 'Lighting Automation',
    parameters: [
      { name: 'Lighting Status', required: true },
      { name: 'Lux Level', required: false },
      { name: 'Circuit Status', required: false },
      { name: 'Energy Consumption', required: false },
      { name: 'Auto/Manual Mode', required: false },
      { name: 'Schedule Status', required: false }
    ]
  },

  GENERIC: {
    id: 'OTHER',
    label: 'Standard Telemetry',
    parameters: [
      { name: 'Status', required: true },
      { name: 'Operational Value', required: false },
      { name: 'Fault Status', required: false },
      { name: 'Alarm Status', required: false },
      { name: 'Runtime', required: false },
      { name: 'Communication Status', required: false }
    ]
  }
};

DEVICE_TEMPLATES.MAIN_METER = DEVICE_TEMPLATES.MAIN_ENERGY_METER;
DEVICE_TEMPLATES.SUB_METER = DEVICE_TEMPLATES.SUB_ENERGY_METER;
DEVICE_TEMPLATES.ENERGY_METERING = DEVICE_TEMPLATES.SUB_ENERGY_METER;
DEVICE_TEMPLATES.SOLAR = DEVICE_TEMPLATES.SOLAR_SYSTEM;
DEVICE_TEMPLATES.SOLAR_PLANT = DEVICE_TEMPLATES.SOLAR_SYSTEM;
DEVICE_TEMPLATES.SOLAR_INVERTER = DEVICE_TEMPLATES.INVERTER;

/**
 * Maps any backend DeviceCategory to its corresponding template.
 * Also handles category strings with underscores or spaces, or custom entries.
 */
export const getTemplateForCategory = (category) => {
  if (!category) return DEVICE_TEMPLATES.GENERIC;

  const key = String(category).trim().toUpperCase();

  switch (key) {
    case 'MAIN_ENERGY_METER':
    case 'MAIN_METER':
    case 'MAIN_ENERGY_METERING':
    case 'ENERGY_METER_MAIN':
      return DEVICE_TEMPLATES.MAIN_ENERGY_METER;

    case 'SUB_ENERGY_METER':
    case 'SUB_METER':
    case 'SUB_ENERGY_METERING':
    case 'ENERGY_METER_SUB':
    case 'ENERGY_METER':
    case 'ENERGY_METERING':
      return DEVICE_TEMPLATES.SUB_ENERGY_METER;

    case 'UG_TANK':
    case 'UGTANK':
    case 'UG_PUMP':
      return DEVICE_TEMPLATES.UG_TANK;

    case 'AG_TANK':
    case 'AGTANK':
    case 'AG_PUMP':
      return DEVICE_TEMPLATES.AG_TANK;

    case 'PUMP':
    case 'WATER_PUMP':
      return DEVICE_TEMPLATES.PUMP;

    case 'VALVE':
      return DEVICE_TEMPLATES.VALVE;

    case 'GENERATOR':
    case 'DG_SET':
    case 'DG':
      return DEVICE_TEMPLATES.DG_SET;

    case 'LT_PANEL':
    case 'PANEL':
      return DEVICE_TEMPLATES.LT_PANEL;

    case 'FIRE_PUMP':
    case 'FIRE_PANEL':
    case 'FIRE_SYSTEM':
      return DEVICE_TEMPLATES.FIRE_SYSTEM;

    case 'HVAC_CHILLER':
    case 'HVAC_AHU':
    case 'HVAC_COOLING_TOWER':
    case 'HVAC':
      return DEVICE_TEMPLATES.HVAC;

    case 'VRV':
      return DEVICE_TEMPLATES.VRV;

    case 'AQI_SENSOR':
    case 'AQI':
      return DEVICE_TEMPLATES.AQI_SENSOR;

    case 'BREAKER':
      return DEVICE_TEMPLATES.BREAKER;

    case 'STP':
    case 'WTP':
    case 'WATER_MANAGEMENT':
    case 'WATERMANAGEMENT':
      return DEVICE_TEMPLATES.WATER_MANAGEMENT;

    case 'LIFT':
      return DEVICE_TEMPLATES.LIFT;

    case 'LIGHTING':
      return DEVICE_TEMPLATES.LIGHTING;

    case 'CONTROLLER':
    case 'MOTOR':
      return DEVICE_TEMPLATES.MOTOR;

    case 'AC':
      return DEVICE_TEMPLATES.AC;

    case 'TRANSFORMER':
      return DEVICE_TEMPLATES.TRANSFORMER;

    case 'UPS':
    case 'UNINTERRUPTIBLE_POWER_SUPPLY':
      return DEVICE_TEMPLATES.UPS;

    case 'SOLAR_SYSTEM':
    case 'SOLAR_PLANT':
    case 'SOLAR SYSTEM':
    case 'SOLAR':
      return DEVICE_TEMPLATES.SOLAR_SYSTEM;

    case 'INVERTER':
    case 'SOLAR_INVERTER':
      return DEVICE_TEMPLATES.INVERTER;
    
    case 'SENSOR':
    case 'OTHER':
    default:
      return DEVICE_TEMPLATES.GENERIC;
  }
};
