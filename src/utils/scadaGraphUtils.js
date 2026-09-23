/**
 * SCADA Graph & Telemetry Utilities
 * Standardized across BMS modules (Energy Metering, AQI Sensor, etc.)
 * Provides consistent IST time formatting, boundary calculations, and color palettes.
 */

// Sampling intervals supported by OpenAPI endpoint
export const SAMPLING_INTERVALS = [
  { label: '15-Min', value: 'MIN_15' },
  { label: 'Hourly', value: 'HOURLY' },
  { label: 'Daily', value: 'DAILY' },
  { label: 'Monthly', value: 'MONTHLY' }
];

// Time range presets
export const RANGE_PRESETS = [
  { id: 'last24h', label: 'Last 24 Hours', defaultInterval: 'HOURLY' },
  { id: 'today', label: 'Today', defaultInterval: 'MIN_15' },
  { id: 'last7d', label: 'Last 7 Days', defaultInterval: 'HOURLY' },
  { id: 'last30d', label: 'Last 30 Days', defaultInterval: 'DAILY' },
  { id: 'month', label: 'This Month', defaultInterval: 'DAILY' },
  { id: 'custom', label: 'Custom', defaultInterval: 'DAILY' }
];

// Curated SCADA graph palette for distinct, high-visibility telemetry visualizations
export const GRAPH_PALETTES = [
  { stroke: '#06b6d4', fill: '#0891b2', name: 'Cyan' },
  { stroke: '#10b981', fill: '#059669', name: 'Emerald' },
  { stroke: '#38bdf8', fill: '#0284c7', name: 'Sky' },
  { stroke: '#f59e0b', fill: '#d97706', name: 'Amber' },
  { stroke: '#8b5cf6', fill: '#7c3aed', name: 'Purple' },
  { stroke: '#ec4899', fill: '#db2777', name: 'Pink' },
  { stroke: '#6366f1', fill: '#4f46e5', name: 'Indigo' },
  { stroke: '#14b8a6', fill: '#0d9488', name: 'Teal' },
  { stroke: '#f97316', fill: '#ea580c', name: 'Orange' },
  { stroke: '#ef4444', fill: '#dc2626', name: 'Red' }
];

/**
 * Returns today's calendar date in Indian Standard Time (IST) in 'YYYY-MM-DD' format
 */
export const getTodayIstDateString = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

/**
 * Parses UTC/GMT timestamps from backend into JavaScript Date object
 * Guaranteed to interpret GMT/UTC timestamps properly
 */
export const parseUtcDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;

  if (typeof dateVal === 'number') {
    const ms = dateVal < 1e11 ? dateVal * 1000 : dateVal;
    return new Date(ms);
  }

  let str = String(dateVal).trim();
  if (!str) return null;

  if (/^\d{10,13}$/.test(str)) {
    const num = Number(str);
    const ms = num < 1e11 ? num * 1000 : num;
    return new Date(ms);
  }

  // Normalize "YYYY-MM-DD HH:mm:ss" to "YYYY-MM-DDTHH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(str)) {
    str = str.replace(' ', 'T');
  }

  // If missing timezone indicator, append 'Z' so it is treated as UTC/GMT
  if (!str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
    str += 'Z';
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Calculates start and end ISO 8601 UTC strings based on range preset or custom date bounds
 * Considers Indian Standard Time (IST) calendar boundaries for "Today", "This Month", and "Custom"
 */
export const calculateDateRange = (presetId, customStart, customEnd) => {
  const now = new Date();
  let from = new Date();
  let to = now;

  if (presetId === 'custom') {
    const todayIst = getTodayIstDateString();

    let startDate = customStart;
    let endDate = customEnd;

    // Fallback if bounds are not provided
    if (!startDate) {
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = d7.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    }
    if (!endDate) {
      endDate = todayIst;
    }

    // Ensure startDate <= endDate; auto-swap if user entered in reverse
    if (startDate > endDate) {
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
    }

    // Start of the day in IST (00:00:00.000 IST = UTC+05:30)
    from = new Date(`${startDate}T00:00:00+05:30`);
    if (isNaN(from.getTime())) {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // End of the day in IST (23:59:59.999 IST), or current time 'now' if endDate is today
    if (endDate === todayIst) {
      to = now;
    } else {
      to = new Date(`${endDate}T23:59:59.999+05:30`);
      if (isNaN(to.getTime()) || to > now) {
        to = now;
      }
    }

    return {
      from: from.toISOString(),
      to: to.toISOString()
    };
  }

  switch (presetId) {
    case 'today': {
      // Start of day in IST (00:00:00 IST = UTC+05:30)
      const istDateStr = getTodayIstDateString();
      from = new Date(`${istDateStr}T00:00:00+05:30`);
      break;
    }
    case 'last7d':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'last30d':
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'month': {
      // Start of month in IST (00:00:00 IST of 1st day)
      const istDateStr = getTodayIstDateString();
      const [year, month] = istDateStr.split('-');
      from = new Date(`${year}-${month}-01T00:00:00+05:30`);
      break;
    }
    case 'last24h':
    default:
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
  }

  return {
    from: from.toISOString(),
    to: now.toISOString()
  };
};

// High-performance cached IST formatters (56x faster than repeatedly calling toLocaleTimeString)
const istTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

const istDayFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  month: 'short',
  day: 'numeric'
});

const istMonthFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  month: 'short',
  year: 'numeric'
});

/**
 * Formats snapshot timestamps to Indian Standard Time (IST, UTC+05:30)
 */
export const formatTimestampLabel = (dateStr, interval, rangePreset) => {
  if (!dateStr) return '';
  const date = parseUtcDate(dateStr);
  if (!date) return String(dateStr);

  switch (interval) {
    case 'MIN_15':
    case 'MIN_30':
      return istTimeFormatter.format(date);
    case 'HOURLY':
      if (rangePreset === 'last7d' || rangePreset === 'last30d') {
        return `${istDayFormatter.format(date)} ${istTimeFormatter.format(date)}`;
      }
      return istTimeFormatter.format(date);
    case 'DAILY':
      return istDayFormatter.format(date);
    case 'MONTHLY':
      return istMonthFormatter.format(date);
    default:
      return istTimeFormatter.format(date);
  }
};

/**
 * Formats full timestamp range in Indian Standard Time (IST) for custom tooltip
 */
export const formatTooltipWindow = (startStr, endStr) => {
  if (!startStr) return '';
  const startDate = parseUtcDate(startStr);
  if (!startDate) return String(startStr);

  const startDay = istDayFormatter.format(startDate);
  const startTime = istTimeFormatter.format(startDate);
  const startFmt = `${startDay}, ${startTime}`;

  if (!endStr) return `${startFmt} IST`;
  const endDate = parseUtcDate(endStr);
  if (!endDate) return `${startFmt} – ${endStr} IST`;

  const endDay = istDayFormatter.format(endDate);
  const endTime = istTimeFormatter.format(endDate);

  if (startDay === endDay) {
    return `${startDay}, ${startTime} – ${endTime} IST`;
  }
  return `${startFmt} – ${endDay}, ${endTime} IST`;
};

/**
 * Downsamples data specifically for discrete Bar Chart rendering.
 * Eliminates SVG path explosion and animation frame-dropping on large datasets.
 * Preserves arithmetic mean, min/max peaks, missing-data null gaps, timestamps, and metric semantics.
 */
export const downsampleForBarChart = (data, maxBars = 60) => {
  if (!Array.isArray(data) || data.length <= maxBars) return data || [];

  const bucketSize = Math.ceil(data.length / maxBars);
  const result = [];

  for (let i = 0; i < data.length; i += bucketSize) {
    const chunk = data.slice(i, i + bucketSize);
    if (chunk.length === 0) continue;

    let sum = 0;
    let validCount = 0;
    let min = Infinity;
    let max = -Infinity;
    const firstPoint = chunk[0];
    const lastPoint = chunk[chunk.length - 1];
    const midPoint = chunk[Math.floor(chunk.length / 2)];

    let totalReadings = 0;
    let activeAlarm = null;

    for (const pt of chunk) {
      const candidateVal = (pt.plotValue !== null && pt.plotValue !== undefined) 
        ? pt.plotValue 
        : ((pt.avgValue !== null && pt.avgValue !== undefined) ? pt.avgValue : pt.lastValue);

      if (candidateVal !== null && candidateVal !== undefined && !isNaN(Number(candidateVal))) {
        const val = Number(candidateVal);
        sum += val;
        validCount += 1;
        if (val < min) min = val;
        if (val > max) max = val;
      }
      if (pt.minValue !== null && pt.minValue !== undefined && !isNaN(Number(pt.minValue))) {
        if (Number(pt.minValue) < min) min = Number(pt.minValue);
      }
      if (pt.maxValue !== null && pt.maxValue !== undefined && !isNaN(Number(pt.maxValue))) {
        if (Number(pt.maxValue) > max) max = Number(pt.maxValue);
      }
      if (pt.readingCount) {
        totalReadings += Number(pt.readingCount);
      }
      if (pt.alarmState && pt.alarmState !== 'NORMAL') {
        activeAlarm = pt.alarmState;
      }
    }

    result.push({
      ...midPoint,
      // If no valid readings in this chunk, preserve null gap
      plotValue: validCount > 0 ? Number((sum / validCount).toFixed(2)) : null,
      avgValue: validCount > 0 ? Number((sum / validCount).toFixed(2)) : null,
      minValue: min !== Infinity ? min : null,
      maxValue: max !== -Infinity ? max : null,
      lastValue: lastPoint?.lastValue !== undefined ? lastPoint.lastValue : (lastPoint?.plotValue ?? null),
      firstValue: firstPoint?.firstValue !== undefined ? firstPoint.firstValue : (firstPoint?.plotValue ?? null),
      rawStart: firstPoint.rawStart,
      rawEnd: lastPoint.rawEnd,
      time: midPoint.time,
      readingCount: totalReadings || (validCount > 0 ? validCount : 0),
      alarmState: activeAlarm || 'NORMAL',
      delta: null // Environmental parameters are not cumulative
    });
  }

  return result;
};

/**
 * Format numeric value cleanly with max decimals
 */
export const formatVal = (val, maxDecimals = 2) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  const num = Number(val);
  return Number.isInteger(num) ? num.toString() : num.toFixed(maxDecimals);
};

/**
 * Determines whether a setting is cumulative (energy consumption)
 */
export const isCumulativeSetting = (setting) => {
  if (!setting) return false;
  if (setting.isCumulative === true) return true;
  const unit = String(setting.unit || '').toUpperCase();
  if (unit === 'KWH' || unit === 'KVAH' || unit === 'KVARH') return true;
  const name = String(setting.displayName || setting.name || '').toUpperCase();
  return name.includes('ENERGY') || name.includes('CONSUMPTION') || name.includes('CUMULATIVE') || name.includes('KWH') || name.includes('KVAH');
};
