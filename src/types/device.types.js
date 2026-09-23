/**
 * Device & Settings Types & Schema Definitions
 * Aligned with docs/DEVICE_SETTINGS_UPDATE_GUIDE.md and docs/Openapi.yaml
 *
 * @typedef {'FLOAT' | 'INTEGER' | 'BOOLEAN' | 'STRING' | 'ENUM'} FieldDataType
 *
 * @typedef {Object} DeviceThresholds
 * @property {number|null} [warningHigh]
 * @property {number|null} [criticalHigh]
 * @property {number|null} [warningLow]
 * @property {number|null} [criticalLow]
 *
 * @typedef {Object} DeviceSettingPayload
 * @property {number} [id] Provide for existing settings; omit for new ones
 * @property {number} moduleId Sochiot module ID reading or controlling this field
 * @property {string|null} [moduleName] User-friendly module label
 * @property {number|null} [fieldId] Sochiot internal field mapping ID
 * @property {number|null} [sochiotFieldId] Direct alias for fieldId
 * @property {number|null} [graphId] Graph or dashboard panel configuration ID
 * @property {number|null} [eventId] Sochiot event ID mapping
 * @property {string|null} [eventKey] Sochiot event key identifier
 * @property {string|null} [deviceName] Custom device name label or Sochiot source device name
 * @property {string} sochiotFieldName Raw Sochiot field key (e.g. "3,100F", "4,28F")
 * @property {string} displayName Human-readable label displayed in UI widgets
 * @property {FieldDataType} dataType Allowed values: 'FLOAT', 'INTEGER', 'BOOLEAN', 'STRING', 'ENUM'
 * @property {string|null} [unit] Unit of measure (e.g. "V", "A", "kWh", "°C")
 * @property {number} [displayOrder] Display sorting order (default: 0)
 * @property {string[]} [enumValues] Allowed string options if dataType is 'ENUM'
 * @property {number|null} [warningHigh] Upper warning limit
 * @property {number|null} [criticalHigh] Upper critical limit
 * @property {number|null} [warningLow] Lower warning limit
 * @property {number|null} [criticalLow] Lower critical limit
 * @property {DeviceThresholds} [defaultThresholds] Alternative nested thresholds object
 * @property {boolean} [isTelemetry] Live telemetry & hourly rollups enabled (default: true)
 * @property {boolean} [isCumulative] Indefinite accumulation for delta math (kWh, m3) (default: false)
 * @property {boolean} [isCommand] Actionable control command (default: false)
 * @property {string|null} [commandAlias] Human-friendly alias if isCommand is true
 * @property {boolean} [isReadable] Whether the current value can be read (default: true)
 * @property {boolean} [isDisplayed] Toggles card display in overview (default: true)
 * @property {boolean} [graphable] Allows plotting this metric in trend analytics (default: true)
 * @property {boolean} [isActive] Explicitly toggle setting active/inactive (default: true)
 * @property {Record<string, unknown>|null} [meta] Arbitrary JSON metadata for custom widgets
 *
 * @typedef {Object} UpdateDevicePayload
 * @property {string} [name] Device name
 * @property {string|null} [description] Optional description
 * @property {string} [category] Device category
 * @property {string|null} [serialNumber] Hardware serial number
 * @property {string|null} [profileId] Device profile ID
 * @property {number|null} [siteId] Site association ID
 * @property {number[]} [sochiotDeviceIds] Linked Sochiot hardware device IDs
 * @property {number[]} [moduleIds] Linked Sochiot module IDs
 * @property {number|null} [areaId] Area ID
 * @property {number|null} [buildingId] Building ID
 * @property {string|null} [assetId] Asset equipment ID
 * @property {number|null} [roomNo] Room number
 * @property {number|null} [floorNo] Floor number
 * @property {number} [displayOrder] Device card order
 * @property {boolean} [isActive] Active status flag
 * @property {DeviceSettingPayload[]} [settings] Canonical list of desired active settings
 * @property {DeviceSettingPayload[]} [template_settings] Alternative alias for settings
 * @property {Array<Object>} [rules] Automation rules
 */

/**
 * Validates a list of settings to ensure no duplicate sochiotFieldName entries exist
 * @param {DeviceSettingPayload[]} settings
 * @returns {{ valid: boolean, duplicateField?: string }}
 */
export const validateUniqueSettingFieldNames = (settings = []) => {
  const seen = new Set();
  for (const s of settings) {
    const rawKey = String(s.sochiotFieldName || '').trim().toLowerCase();
    if (rawKey) {
      if (seen.has(rawKey)) {
        return { valid: false, duplicateField: s.sochiotFieldName };
      }
      seen.add(rawKey);
    }
  }
  return { valid: true };
};

/**
 * Determines whether a setting is cumulative (energy or water meters)
 * @param {Object} field
 * @returns {boolean}
 */
export const isCumulativeMetric = (field = {}) => {
  if (field.isCumulative !== undefined && field.isCumulative !== null) {
    return Boolean(field.isCumulative);
  }
  const name = String(field.displayName || field.sochiotFieldName || '').toLowerCase();
  const unit = String(field.unit || '').toLowerCase();
  return /(kwh|kvah|kvarh|energy|consumption|m3|cubic meter)/i.test(name) ||
         /(kwh|kvah|kvarh|m3)/i.test(unit);
};
