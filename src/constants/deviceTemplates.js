/**
 * Central Device Categories and Telemetry Templates
 * Synchronized with backend DeviceCategory enum and docs/Device-template.MD
 */



export const DEVICE_CATEGORIES = [
  'MAIN_ENERGY_METER',
  'SUB_ENERGY_METER',
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
      { name: 'Running Status', required: true },
      { name: 'Availability', required: false },
      { name: 'Load %', required: false },
      { name: 'Voltage', required: true },
      { name: 'Current', required: true },
      { name: 'Frequency', required: true },
      { name: 'Speed RPM', required: false },
      { name: 'Active Power', required: false },
      { name: 'Apparent Power', required: false },
      { name: 'Reactive Power', required: false },
      { name: 'Power Factor', required: false },
      { name: 'Fuel Level', required: false },
      { name: 'Fuel Consumption', required: false },
      { name: 'Fuel Rate', required: false },
      { name: 'Engine Temperature', required: false },
      { name: 'Coolant Temperature', required: false },
      { name: 'Oil Pressure', required: false },
      { name: 'Oil Temperature', required: false },
      { name: 'Battery Voltage', required: false },
      { name: 'Engine Hours', required: false },
      { name: 'Start Count', required: false },
      { name: 'Runtime', required: false },
      { name: 'Alternator Temperature', required: false },
      { name: 'Exhaust Temperature', required: false },
      { name: 'Phase Voltage', required: false },
      { name: 'Phase Current', required: false },
      { name: 'Trip', required: false },
      { name: 'Overload', required: false },
      { name: 'Low Fuel', required: false },
      { name: 'Low Oil Pressure', required: false },
      { name: 'High Temperature', required: false },
      { name: 'Battery Low', required: false },
      { name: 'Emergency Stop', required: false }
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
      { name: 'Meter Status', required: true },
      { name: 'Voltage', required: true },
      { name: 'Current', required: true },
      { name: 'Frequency', required: false },
      { name: 'Active Power', required: false },
      { name: 'Reactive Power', required: false },
      { name: 'Apparent Power', required: false },
      { name: 'Power Factor', required: false },
      { name: 'Import Energy', required: false },
      { name: 'Export Energy', required: false },
      { name: 'Active Energy', required: false },
      { name: 'Reactive Energy', required: false },
      { name: 'Maximum Demand', required: false },
      { name: 'Average Demand', required: false },
      { name: 'Peak Demand', required: false },
      { name: 'Phase Voltage', required: false },
      { name: 'Phase Current', required: false },
      { name: 'Phase Imbalance', required: false },
      { name: 'Harmonics THD', required: false },
      { name: 'kWh', required: false },
      { name: 'kVAh', required: false },
      { name: 'kVARh', required: false },
      { name: 'Daily Energy', required: false },
      { name: 'Monthly Energy', required: false },
      { name: 'Yearly Energy', required: false },
      { name: 'Main Meter', required: false },
      { name: 'Sub Meter', required: false },
      { name: 'Meter-wise Consumption', required: false },
      { name: 'Area-wise Consumption', required: false },
      { name: 'Equipment-wise Consumption', required: false },
      { name: 'Energy Cost', required: false },
      { name: 'Energy Trend', required: false },
      { name: 'Carbon Emission', required: false }
    ]
  },

  MAIN_ENERGY_METER: {
    id: 'MAIN_ENERGY_METER',
    label: 'Main Energy Meter',
    parameters: [
      { name: 'EP', required: false },
      { name: 'Eq', required: false },
      { name: 'PF', required: false },
      { name: 'S', required: false },
      { name: 'R-Phase Voltage', required: false },
      { name: 'Y-Phase Voltage', required: false },
      { name: 'B-Phase Voltage', required: false },
      { name: 'R-Current', required: false },
      { name: 'Y-Current', required: false },
      { name: 'B-Current', required: false },
      { name: 'EB KVAH', required: false },
      { name: 'EB KWH', required: false },
      { name: 'Balance', required: false },
      { name: 'Total KW', required: false },
      { name: 'Power Factor', required: false },
      { name: 'Total KVA', required: false },
      { name: 'DG KWH', required: false },
      { name: 'Reactive Power', required: false },
      { name: 'Frequency', required: false },
      { name: 'Avg Voltage L-L', required: false },
      { name: 'Avg Voltage L-N', required: false },
      { name: 'Avg Current', required: false },
      { name: 'Power KVA (AVG)', required: false },
      { name: 'Power KVAR (AVG)', required: false },
      { name: 'Avg PF', required: false },
      { name: 'Voltage R-Y', required: false },
      { name: 'Voltage Y-B', required: false },
      { name: 'Voltage B-R', required: false },
      { name: 'PF-R', required: false },
      { name: 'PF-Y', required: false },
      { name: 'PF-B', required: false },
      { name: 'Load Hrs', required: false },
      { name: 'Load Min', required: false },
      { name: 'No Load Hrs', required: false },
      { name: 'No Load Min', required: false },
      { name: 'Load %', required: false },
      { name: 'Meter Target', required: false },
      { name: 'EB Tariff', required: false },
      { name: 'DG Tariff', required: false },
      { name: 'R-Phase Load', required: false },
      { name: 'Y-Phase Load', required: false },
      { name: 'B-Phase Load', required: false }
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

  AG_TANK: {
    id: 'AG_TANK',
    label: 'Above Ground (AG) Tank',
    parameters: [
      { name: 'Tank Level', required: true },
      { name: 'Tank Level %', required: true },
      { name: 'Tank Capacity', required: false },
      { name: 'Inlet Flow', required: false },
      { name: 'Outlet Flow', required: false },
      { name: 'Inlet Valve', required: false },
      { name: 'Outlet Valve', required: false },
      { name: 'Low-Level Alarm', required: false },
      { name: 'High-Level Alarm', required: false },
      { name: 'Overflow Alarm', required: false }
    ]
  },

  UG_TANK: {
    id: 'UG_TANK',
    label: 'Underground (UG) Tank',
    parameters: [
      { name: 'Tank Level', required: true },
      { name: 'Tank Level %', required: true },
      { name: 'Tank Capacity', required: false },
      { name: 'Inlet Flow', required: false },
      { name: 'Outlet Flow', required: false },
      { name: 'Inlet Valve', required: false },
      { name: 'Outlet Valve', required: false },
      { name: 'Low-Level Alarm', required: false },
      { name: 'High-Level Alarm', required: false },
      { name: 'Overflow Alarm', required: false }
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

    case 'SENSOR':
    case 'OTHER':
    default:
      return DEVICE_TEMPLATES.GENERIC;
  }
};
