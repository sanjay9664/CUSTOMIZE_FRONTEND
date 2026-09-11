# Location, Gateway & Device Selection System — Technical Specification & Migration Guide

## 1. Executive Summary & Overview

This document provides an exhaustive reverse-engineered specification of the hierarchical location, gateway, and device selection mechanism implemented in `ismartaccess-frontend-v2`.

The system provides a two-stage cascading filter mechanism:
1. **Scope/Location Selection**: Navigates an organizational hierarchy from **Company** down to a **Building/Location** using an Ant Design Cascader or top-level Breadcrumb dropdown.
2. **Gateway & Device Selection**: Once a location/zone is selected, the application lazily queries the entity configuration API to fetch all **Gateways (Clusters & Panels)** and their attached **Devices (Hardware Modules)**, allowing secondary cascading selection.
3. **Downstream Telemetry & Reporting**: The selected identifiers are automatically mapped to query parameters or WebSocket subscriptions for live telemetry and audit/event reporting.

---

## 2. Complete File Manifest

| Component / Layer | Workspace File Path | Role in Selection Flow |
| :--- | :--- | :--- |
| **Top Header Breadcrumb** | `src/components/location/index.js` | Top-bar crosshair breadcrumb (`sochiot > sochiot-comp > ...`). Dispatches global scope to Redux store. |
| **Top Header Bar** | `src/components/layout/LayoutHeader.js` | Mounts `<Location />` and `<SearchEngine />` in the top application navigation. |
| **Filter Container** | `src/components/ReportEngine/LocationDeviceFilter.js` | Mounts `<SingleLocationInput />`, `<DeviceCascaderSelector />`, and `<ReportStats />`. Handles entity fetching on location change. |
| **Location Cascader** | `src/components/singleLocationInput/index.js` | Ant Design `Cascader` rendering the Company → Client → Zone → Building tree. |
| **Gateway/Device Cascader**| `src/components/deviceCascaderSelector/index.js` | Ant Design `Cascader` rendering the Gateway (Cluster/Panel) → Device tree (`M000N3LN0MN200` → `PDC_200`). |
| **Report Stats Widget** | `src/components/ReportEngine/ReportStats.js` | Renders counts for Buildings, Linked Clusters, Linked Panels, and Linked Devices. |
| **Reports Page View** | `src/screens/ReportEngineScreen/index.js` | Controller component that stores `currentLocation` and `entityFilter` state and provides them to tabs. |
| **Realtime Events Tab** | `src/components/ReportEngine/tabs/realTimeEvents.js` | Manages live WebSocket event stream (`/system-events`) filtered by location and hardware type. |
| **Historical Reports Tab** | `src/components/ReportEngine/tabs/reports.js` | Manages paginated historical event queries filtered by location and device/gateway. |
| **Application Router** | `src/AppRouter.js` | On login, triggers `userDetails()` to populate initial location tree. |
| **Auth / User Actions** | `src/redux/actions/authActions.js` | Calls `/auth-engine/user/me` and dispatches `LOCATION_UPDATE`. |
| **Entity Actions** | `src/redux/actions/launchPadAction.js` | Contains `fetchEntityHeirarcy()` calling `/config-engine/entity/{NODE_TYPE}/{NODE_ID}`. |
| **Report Engine Actions** | `src/redux/actions/reportEngineActions.js` | Contains `fetchEventsReport()` calling `/event-engine/system-events`. |
| **Location Redux Reducer**| `src/redux/reducers/locationReducer.js` | Stores `userZoneLocations`, `currentLocation`, `locationHierarchy`, and `preferredLocation`. |
| **Location Utilities** | `src/utilities/locations.js` | `getLocationObjFormLocationInput()`, `searchPreferedLocationHierarchy()`. |
| **Entity Utilities** | `src/utilities/entity.js` | `getGatewayDeviceHierarchy()` (transforms backend payload into cascader options). |
| **Report Query Utilities** | `src/utilities/reportEngine.js` | `getReportQueryParams()`, `generateDevicesCount()`, `getLinkedCount()`. |
| **Cascader Formatters** | `src/utilities/ruleEngine.js` | `getInitialCascaderValue()` (maps hierarchy array into cascader path value). |
| **Axios Configuration** | `src/utilities/configureAxios.js` | Axios instance with base URL, auth token header, and response unwrapping (`response.data`). |
| **API Endpoints Dictionary**| `src/constants/api.js` | Central repository of API routes and path templates. |

---

## 3. UI & Data Hierarchy Architecture

### Full Tree Representation

```text
ROOT (Organization)
 └── COMPANY (Consumer Company)
      └── CLIENT (Application / Tenant Client)
           └── ZONE (Region / Site / Complex)
                ├── SUB-ZONE (Optional recursive Sub-Zones)
                └── LOCATION (Physical Building / Facility)
                     ├── GATEWAY (Cluster / Panel Gateway)
                     │    ├── SUB-GATEWAY (Optional Sub-Panels)
                     │    └── DEVICE (Hardware Device / Endpoint)
                     └── ORPHAN DEVICE (Standalone Device without Gateway)
```

### Hierarchy Level Details

| Level | Node Entity | Data Source in Response | Identifier Field | Display Label | Parent Requirement | Loading Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **0** | `ROOT` | `GET /auth-engine/user/me` (`organizationName`) | `0` or `organizationId` | `organizationName` | None | Eager (App boot) |
| **1** | `COMPANY` | `userZoneLocationVO.companyList` | `company.id` | `company.name` | `ROOT` | Eager (App boot) |
| **2** | `CLIENT` | `company.consumers` or `clientList` | `client.id` | `client.name` | `company.id` | Eager (App boot) |
| **3** | `ZONE` | `client.zoneVOS` or `zoneList` | `zone.id` | `zone.name` | `client.id` | Eager (App boot) |
| **4** | `LOCATION` | `zone.locations` or `locationList` | `location.id` | `location.name` | `zone.id` | Eager (App boot) |
| **5** | `GATEWAY` | `GET /config-engine/entity/...` (`gatewayVOList`) | `node.id`, `node.gatewayUuid` | `node.name` | `location.id` / `zone.id` | **Lazy** (On selection) |
| **6** | `DEVICE` | `gatewayVO.deviceEntityVOS` or `orphanDeviceVOList`| `device.id`, `device.uuid` | `device.name` | `gateway.id` | **Lazy** (With Gateway) |

---

## 4. Selection Workflow & State Machine

```text
  [ User Logs In ]
         │
         ▼
  GET /auth-engine/user/me
  Populates Redux `location.userZoneLocations`
         │
         ▼
  Top Header <Location /> sets `currentLocation` & `locationHierarchy`
  (e.g., Zone: "Ashish_Manufacturing", ID: 30)
         │
         ▼
  <LocationDeviceFilter /> mounts on Reports Page
  ├── <SingleLocationInput /> displays "Ashish_Manufacturing"
  └── Triggers: GET /config-engine/entity/ZONE/30
         │
         ▼
  Response returns `locationVOS` with `gatewayVOList` and `deviceEntityVOS`
  ├── Transforms into `clusterTree` options
  └── Computes count stats (Buildings: 1, Clusters: 2, Panels: 0, Devices: 2)
         │
         ▼
  User clicks <DeviceCascaderSelector />
  ├── Level 1 Gateways: "M000N3LN0MN200", "M000V3LN0MN58"
  └── Level 2 Devices: "PDC_200"
         │
         ▼
  User selects "PDC_200"
  ├── Emits: { type: "DEVICE", device: "dev-uuid-pdc200" }
  └── <ReportEngineScreen /> sets `meta.entityFilter`
         │
         ▼
  Historical Reports Tab calls:
  GET /event-engine/system-events?location_id=101&device_id=dev-uuid-pdc200&page=1
```

---

## 5. End-to-End API Call Tracing

### 5.1 API Call 1: User & Location Hierarchy Bootstrap

* **Frontend Calling Function**: `getUserDetails()` in `src/AppRouter.js`
* **Redux Action**: `userDetails()` in `src/redux/actions/authActions.js`
* **HTTP Method**: `GET`
* **Endpoint**: `/auth-engine/user/me`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Query / Path Parameters**: None
* **Expected Response Schema**:
  ```json
  {
    "id": 1,
    "name": "Super Admin",
    "organizationName": "sochiot",
    "userZoneLocationVO": {
      "rootUser": true,
      "companyList": [
        {
          "id": 10,
          "name": "sochiot-comp",
          "consumers": [
            {
              "id": 20,
              "name": "sochiot-app",
              "zoneVOS": [
                {
                  "id": 30,
                  "name": "Ashish_Manufacturing",
                  "subZones": [],
                  "locations": [
                    {
                      "id": 101,
                      "name": "Greater Noida",
                      "locationType": { "name": "BUILDING" }
                    },
                    {
                      "id": 102,
                      "name": "Lucknow",
                      "locationType": { "name": "BUILDING" }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      "clientList": [],
      "zoneList": [],
      "locationList": []
    },
    "preferredZoneNodeType": "ZONE",
    "preferredZoneNodeId": 30,
    "preferredLocationParentHierarchy": {
      "nodeId": 30,
      "name": "Ashish_Manufacturing",
      "zoneNodeType": "ZONE",
      "parent": {
        "id": 20,
        "name": "sochiot-app",
        "type": "CLIENT",
        "parent": {
          "id": 10,
          "name": "sochiot-comp",
          "type": "COMPANY",
          "parent": null
        }
      }
    }
  }
  ```
* **Processing**: Redux reducer updates `state.location.userZoneLocations`. `SingleLocationInput` parses the nested tree into cascader options with values encoded as `${zoneNodeType}-${id}` (e.g. `COMPANY-10`, `CLIENT-20`, `ZONE-30`, `LOCATION-101`).

---

### 5.2 API Call 2: Gateway & Device Hierarchy Fetch

* **Frontend Calling Function**: `getEntityHierarcy(nodeTypes, nodeId)` in `src/components/ReportEngine/LocationDeviceFilter.js`
* **Redux Action**: `fetchEntityHeirarcy(nodeType, nodeId)` in `src/redux/actions/launchPadAction.js`
* **HTTP Method**: `GET`
* **Endpoint**: `/config-engine/entity/{NODE_TYPE}/{NODE_ID}`
* **Path Parameters**:
  * `{NODE_TYPE}`: Node type string (`'ROOT'`, `'COMPANY'`, `'CLIENT'`, `'ZONE'`, `'LOCATION'`).
  * `{NODE_ID}`: Numeric ID of the selected entity.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Expected Response Schema**:
  ```json
  {
    "locationVOS": [
      {
        "id": 101,
        "name": "Greater Noida",
        "gatewayVOList": [
          {
            "id": 501,
            "name": "M000N3LN0MN200",
            "gatewayUuid": "b4a8b7df-9b2f-41dc-9082-200",
            "hardwareId": "HW-M200",
            "gatewayType": { "name": "CLUSTER" },
            "hasDeviceConnectivity": true,
            "deviceEntityVOS": [
              {
                "id": 801,
                "name": "PDC_200",
                "uuid": "4fa81cd8-0f56-42d8-9999-pdc200",
                "hardwareId": "HW-PDC200"
              }
            ],
            "subGatewayVOS": []
          },
          {
            "id": 502,
            "name": "M000V3LN0MN58",
            "gatewayUuid": "c5b9c8ea-1a3e-52ed-8193-58",
            "hardwareId": "HW-M58",
            "gatewayType": { "name": "CLUSTER" },
            "hasDeviceConnectivity": false,
            "deviceEntityVOS": [],
            "subGatewayVOS": []
          }
        ],
        "orphanDeviceVOList": []
      }
    ]
  }
  ```
* **Transformation Logic** (`src/utilities/entity.js`):
  ```javascript
  // Gateway Node
  {
    id: node.id,
    label: node.name,                                            // "M000N3LN0MN200"
    value: `${node.gatewayType.name}@${node.id}@${node.gatewayUuid}`, // "CLUSTER@501@b4a8b7df-..."
    key: `${node.gatewayType.name}@${node.id}@${node.gatewayUuid}`,
    type: node.gatewayType.name,
    children: node.hasDeviceConnectivity
      ? node.deviceEntityVOS.map(device => ({
          id: device.id,
          label: device.name,                                    // "PDC_200"
          value: `DEVICE@${device.id}@${device.uuid}`,           // "DEVICE@801@4fa81cd8-..."
          key: `DEVICE@${device.id}@${device.uuid}`
        }))
      : getGatewayDeviceHierarchy(node.subGatewayVOS)
  }
  ```

---

### 5.3 API Call 3: Filtered Event Report Query

* **Frontend Calling Function**: `getReport()` in `src/components/ReportEngine/tabs/reports.js`
* **Redux Action**: `fetchEventsReport(payload)` in `src/redux/actions/reportEngineActions.js`
* **HTTP Method**: `GET`
* **Endpoint**: `/event-engine/system-events`
* **Query Parameters**:
  * `page`: Current page number (integer).
  * `location_id`: ID stored in `sessionStorage.getItem('locationId')` or Building ID.
  * `zone`: ID of the Zone if a Zone is selected with `hasChild === true`.
  * `device_id`: Device UUID string if a `DEVICE` is selected in Cascader 2.
  * `cluster_id`: Cluster UUID string if a `CLUSTER` is selected.
  * `panel_id`: Panel UUID string if a `PANEL` is selected.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Expected Response Schema**:
  ```json
  {
    "page": 1,
    "totalRecords": 35,
    "data": [
      {
        "id": "evt-001",
        "buildingName": "Greater Noida",
        "hwType": "Device",
        "moduleType": "Access Control",
        "data": { "status": "ONLINE", "voltage": 12.4 },
        "dateAndTime": "2026-09-11T15:15:53Z"
      }
    ]
  }
  ```

---

### 5.4 API Call 4: Realtime Telemetry WebSocket

* **Component**: `EventsSocket` in `src/components/ReportEngine/tabs/realTimeEvents.js`
* **Protocol**: `WSS` / `WS`
* **URL**:
  ```text
  ws://<HOST>/system-events?node_type={ZONE|LOCATION}&node_id={ID}&hw_type={FILTER}
  ```
* **Event Processing**: Newly arriving event JSON payloads are prepended to the live table (`setData([event, ...data])`).

---

## 6. Key Data Encodings & Delimiters

The implementation relies on specific string-delimited key formats:

### 1. Location Cascader Encoding: `-`
* **Format**: `${zoneNodeType}-${id}`
* **Examples**:
  * `COMPANY-10`
  * `CLIENT-20`
  * `ZONE-30`
  * `LOCATION-101`
* **Decoding**:
  ```javascript
  const [nodeType, nodeId] = last(cascaderValue).split('-');
  ```

### 2. Gateway/Device Cascader Encoding: `@`
* **Gateway Format**: `${gatewayType}@${id}@${gatewayUuid}`
  * Example: `CLUSTER@501@b4a8b7df-9b2f-41dc-9082-200`
* **Device Format**: `DEVICE@${device.id}@${device.uuid}`
  * Example: `DEVICE@801@4fa81cd8-0f56-42d8-9999-pdc200`
* **Decoding**:
  ```javascript
  const [type, id, uuid] = last(cascaderValue).split('@');
  // type is "DEVICE" or "CLUSTER" or "PANEL"
  // uuid is passed downstream as the filter value
  ```

---

## 7. Migration Blueprint for a New Frontend

When re-implementing this pattern in a clean, modern framework (React, Vue, or Angular):

1. **Avoid Session Storage**: Replace `sessionStorage.setItem('locationId')` with explicit component state or URL search parameters (`?locationId=...&deviceId=...`).
2. **Use Typed Objects Over Delimited Strings**: Rather than encoding keys as strings with `-` and `@`, use structured cascader node values:
   ```typescript
   interface CascaderNode {
     label: string;
     value: {
       entityType: 'ZONE' | 'LOCATION' | 'CLUSTER' | 'PANEL' | 'DEVICE';
       id: number;
       uuid?: string;
     };
     children?: CascaderNode[];
   }
   ```
3. **Handle Cascader `changeOnSelect`**: Enable `changeOnSelect` on both dropdowns so users can filter by an entire Zone or Cluster without having to select a terminal leaf Device.
4. **Independent Reset**: When Location changes in Cascader 1, immediately clear Cascader 2 selection (`deviceId = undefined`) and trigger entity re-fetching for the newly selected location.
