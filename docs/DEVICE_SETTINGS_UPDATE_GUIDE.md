# Device & Settings Update API Guide

> **Audience**: Frontend Developers working on BMS Device Management & Configuration  
> **Backend Version**: v1.0.0 (Supports Setting ID preservation & telemetry dual-format)

---

## 1. Overview

When configuring or editing a device in the BMS frontend, you often need to perform multiple actions at once:
1. Update basic device information (e.g., change `name`, `category`, `roomNo`, `assetId`).
2. Modify existing settings/metrics (e.g., change `displayName`, `unit`, alarm thresholds).
3. Add new settings/metrics to the device.
4. Remove unwanted settings from the device.

All of this can be done in a **single atomic API call**.

---

## 2. API Endpoints

### Recommended (Auto-resolves site):
```http
PATCH /api/v1/devices/:id
```
* **`:id`**: The numeric device ID (e.g., `9`) or unique BMS Device ID (`bmsDeviceId`, e.g., `BMS-0001`).
* **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
* **Query Params (Optional)**: `?siteId=<id>` (Site is automatically resolved from device if omitted).

### Alternative (Site-scoped):
```http
PATCH /api/v1/sites/:siteId/devices/:deviceId
```

---

## 3. The 3 Golden Rules for Frontend

> [!IMPORTANT]
> ### Rule 1: Updating an Existing Setting vs Adding a New Setting
> * **Existing Setting**: Include its database **`id`** (`"id": 18`). The backend will update that specific database row, preserving historical telemetry snapshots, rollup records, and aggregates.
> * **New Setting**: **Omit `id`** (or do not include the field). The backend will create/upsert a new row based on the unique composite key `[deviceId, sochiotFieldName]`.

> [!WARNING]
> ### Rule 2: Soft Deletion of Omitted Settings
> The backend treats the array you send as the **complete desired active list**.  
> Any setting currently in the database that is **missing from your payload will be soft-deleted** (`isActive = false`, `isDisplayed = false`).  
> **Action**: Always pass the complete list of all settings that should remain active on the device.

> [!NOTE]
> ### Rule 3: Payload Key Name
> You can use either **`template_settings`** or **`settings`** in the request body. Both point to the exact same backend logic.

---

## 4. Setting Field Reference (`DeviceSettingInput`)

Each object inside the `settings` / `template_settings` array accepts the following attributes:

### Identity & Hardware Mapping
| Field | Type | Required? | Description |
| :--- | :--- | :--- | :--- |
| `id` | `number` | **Optional** | Setting's internal DB ID. **Provide for existing settings; omit for newly added settings.** |
| `sochiotFieldName` | `string` | **Required** | Raw Sochiot field key (e.g., `"3,100F"`, `"4,28F"`). |
| `moduleId` | `number` | **Required** | Sochiot module ID reading or controlling this field (e.g., `4583`). |
| `moduleName` | `string \| null` | Optional | User-friendly module label (e.g., `"Main Incomer"`, `"Sensor Board"`). |
| `fieldId` | `number \| null` | Optional | Sochiot internal field mapping ID. |
| `sochiotFieldId` | `number \| null` | Optional | Alias / direct mapping for `fieldId`. |
| `graphId` | `number \| null` | Optional | Graph / dashboard panel configuration ID. |
| `eventId` | `number \| null` | Optional | Sochiot event ID mapping. |
| `eventKey` | `string \| null` | Optional | Sochiot event key identifier (e.g., `"EVT_TEMP_01"`). |
| `deviceName` | `string \| null` | Optional | Custom device name label or Sochiot source device name. |

### UI Display & Data Format
| Field | Type | Required? | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `displayName` | `string` | **Required** | - | Human-readable label displayed in widgets, tables, and graphs (e.g., `"Voltage R-N"`). |
| `dataType` | `string` | **Required** | - | Allowed values: `"FLOAT"`, `"INTEGER"`, `"BOOLEAN"`, `"STRING"`, `"ENUM"`. |
| `unit` | `string \| null` | Optional | `null` | Unit of measure (e.g., `"V"`, `"A"`, `"kWh"`, `"°C"`, `"kW"`, `"ppm"`). |
| `displayOrder` | `number` | Optional | `0` | Card/table display sorting order in BMS dashboards. |
| `enumValues` | `string[]` | Optional | `[]` | Allowed string options if `dataType` is `"ENUM"` (e.g., `["ON", "OFF", "TRIP"]`). |

### Thresholds & Alarms
| Field | Type | Optional? | Description |
| :--- | :--- | :--- | :--- |
| `warningHigh` | `number \| null` | Optional | Upper warning limit (triggers yellow alert in dashboard). |
| `criticalHigh` | `number \| null` | Optional | Upper critical limit (triggers red alarm & notifications). |
| `warningLow` | `number \| null` | Optional | Lower warning limit. |
| `criticalLow` | `number \| null` | Optional | Lower critical limit. |
| `defaultThresholds`| `object` | Optional | Alternative nested syntax: `{"warningHigh": ..., "criticalHigh": ..., ...}`. |

### Behavior & Analytics Flags
| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `isTelemetry` | `boolean` | `true` | Set `true` if this field receives live telemetry data and scheduled hourly rollups. |
| `isCumulative` | `boolean` | `false` | **CRITICAL for energy / water meters (e.g. Total kWh, m³)**. Tells telemetry rollups that values accumulate indefinitely and requires delta consumption math. |
| `isCommand` | `boolean` | `false` | Set `true` if this field represents an actionable control command (e.g., relay control, setpoint). |
| `commandAlias` | `string \| null`| `null` | Human-friendly alias if `isCommand` is `true`. |
| `graphable` | `boolean` | `true` | Allows plotting this metric in trend analytics. |
| `isDisplayed` | `boolean` | `true` | Toggles card display on device overview page. |
| `isReadable` | `boolean` | `true` | Whether the current value can be read by users. |
| `isActive` | `boolean` | `true` | Explicitly toggle setting active/inactive status. |
| `meta` | `object` | `{}` | Optional arbitrary JSON metadata for custom widget rendering. |

---

## 5. Complete Request Example

### Scenario:
* Rename device from `"AHU-1"` to `"AHU Main Floor - East"`.
* Update existing setting (`id: 18`, Voltage R-N) with new threshold limits.
* Keep existing setting (`id: 25`, Current) untouched.
* Add a brand new cumulative energy meter setting (no `id`).
* *(Any other setting previously on this device not listed below will be soft-deleted).*

```http
PATCH /api/v1/devices/9
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: application/json

{
  "name": "AHU Main Floor - East",
  "category": "HVAC_AHU",
  "settings": [
    {
      "id": 18,
      "moduleId": 4583,
      "moduleName": "Power Incomer",
      "sochiotFieldName": "3,100F",
      "displayName": "Voltage R-N",
      "dataType": "FLOAT",
      "unit": "V",
      "warningHigh": 245.0,
      "criticalHigh": 255.0,
      "warningLow": 215.0,
      "criticalLow": 205.0,
      "displayOrder": 1,
      "isTelemetry": true,
      "isCumulative": false,
      "isDisplayed": true,
      "graphable": true
    },
    {
      "id": 25,
      "moduleId": 4583,
      "moduleName": "Power Incomer",
      "sochiotFieldName": "3,101F",
      "displayName": "Current Phase A",
      "dataType": "FLOAT",
      "unit": "A",
      "displayOrder": 2,
      "isTelemetry": true,
      "isCumulative": false
    },
    {
      "moduleId": 4583,
      "moduleName": "Power Incomer",
      "sochiotFieldName": "4,0F",
      "displayName": "Total Active Energy",
      "dataType": "FLOAT",
      "unit": "kWh",
      "displayOrder": 3,
      "isTelemetry": true,
      "isCumulative": true
    }
  ]
}
```

---

## 6. Success Response Format (`200 OK`)

```json
{
  "success": true,
  "data": {
    "id": 9,
    "name": "AHU Main Floor - East",
    "category": "HVAC_AHU",
    "bmsDeviceId": "BMS-0009",
    "siteId": 1,
    "isActive": true,
    "settings": [
      {
        "id": 18,
        "deviceId": 9,
        "moduleId": 4583,
        "moduleName": "Power Incomer",
        "sochiotFieldName": "3,100F",
        "displayName": "Voltage R-N",
        "dataType": "FLOAT",
        "unit": "V",
        "warningHigh": 245.0,
        "criticalHigh": 255.0,
        "warningLow": 215.0,
        "criticalLow": 205.0,
        "isTelemetry": true,
        "isCumulative": false,
        "displayOrder": 1,
        "isActive": true
      },
      {
        "id": 25,
        "deviceId": 9,
        "moduleId": 4583,
        "sochiotFieldName": "3,101F",
        "displayName": "Current Phase A",
        "dataType": "FLOAT",
        "unit": "A",
        "isTelemetry": true,
        "isCumulative": false,
        "displayOrder": 2,
        "isActive": true
      },
      {
        "id": 104,
        "deviceId": 9,
        "moduleId": 4583,
        "sochiotFieldName": "4,0F",
        "displayName": "Total Active Energy",
        "dataType": "FLOAT",
        "unit": "kWh",
        "isTelemetry": true,
        "isCumulative": true,
        "displayOrder": 3,
        "isActive": true
      }
    ],
    "updatedAt": "2026-09-23T06:05:00.000Z"
  }
}
```

Notice that the newly created setting received its new auto-generated `id` (e.g. `104`).

---

## 7. TypeScript Types for Frontend

You can copy and paste these types directly into your frontend code:

```typescript
export type FieldDataType = 'FLOAT' | 'INTEGER' | 'BOOLEAN' | 'STRING' | 'ENUM';

export interface DeviceSettingPayload {
  /** Provide for existing settings; omit for new ones */
  id?: number;
  moduleId: number;
  moduleName?: string | null;
  fieldId?: number | null;
  /** Direct alias for fieldId */
  sochiotFieldId?: number | null;
  graphId?: number | null;
  eventId?: number | null;
  eventKey?: string | null;
  deviceName?: string | null;
  sochiotFieldName: string;
  displayName: string;
  dataType: FieldDataType;
  unit?: string | null;
  displayOrder?: number;
  enumValues?: string[];
  warningHigh?: number | null;
  criticalHigh?: number | null;
  warningLow?: number | null;
  criticalLow?: number | null;
  isTelemetry?: boolean;
  isCumulative?: boolean;
  isCommand?: boolean;
  commandAlias?: string | null;
  isReadable?: boolean;
  isDisplayed?: boolean;
  graphable?: boolean;
  isActive?: boolean;
  meta?: Record<string, unknown> | null;
}

export interface UpdateDevicePayload {
  name?: string;
  description?: string | null;
  category?: string;
  serialNumber?: string | null;
  profileId?: string | null;
  areaId?: number | null;
  buildingId?: number | null;
  assetId?: string | null;
  roomNo?: number | null;
  floorNo?: number | null;
  displayOrder?: number;
  isActive?: boolean;
  settings?: DeviceSettingPayload[];
  /** Alias for settings */
  template_settings?: DeviceSettingPayload[];
}
```

---

## 8. Common Errors & Troubleshooting

| Status Code | Error Code | Common Cause & Fix |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Missing required fields (`moduleId`, `sochiotFieldName`, `displayName`, `dataType`) or invalid enum value in `dataType`. |
| `403 Forbidden` | `FORBIDDEN_SITE_ACCESS` | The logged-in user does not have permission to modify devices on that site. |
| `404 Not Found` | `DEVICE_NOT_FOUND` | Device ID in URL does not exist or has been deleted. |
| `409 Conflict` | `DUPLICATE_SETTING` | Multiple items inside `settings` have the exact same `sochiotFieldName`. |
