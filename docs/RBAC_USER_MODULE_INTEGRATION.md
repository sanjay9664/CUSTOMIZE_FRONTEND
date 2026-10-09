# BMS RBAC User & Role Administration: Integration Guide & API Specifications

## 1. Overview
This document outlines the architecture, UI workflow, and backend API integration requirements for the **User & Role Administration Module** in `bms-frontend`, aligned with the design, hierarchy picker, and permission matrix patterns referenced from `ismartaccess-frontend-v2`.

All Sochiot synchronization endpoints have been deprecated and replaced with native BMS Authentication and Role-Based Access Control (RBAC).

---

## 2. UI Structure & Components (Adopted from `ismartaccess-frontend-v2`)

The User Administration interface in `src/pages/Settings/UserAdministration.jsx` is structured into five core sections:

1. **SCADA Live Statistics Header**:
   - Total System Users
   - Active Session Users
   - Custom & Predefined RBAC Roles
   - Configured Tenants & Organizations
2. **"Manage Modules" Quick Navigator Popover** (`ismartaccess-frontend-v2` style):
   - **Users Directory**: Navigates to active user management (`all-users`).
   - **Manage Roles**: Navigates to custom role creation & permission matrix (`roles`).
   - **Manage Organisation**: Navigates to corporate hierarchy & tenant management (`/manage-organisation`).
3. **Role-Scoped Filter Tabs**:
   - `All Users ({count})`: Unfiltered active directory.
   - `Administrator ({count})`: Filtered to `SUPER_ADMIN` and `ADMIN`.
   - `Operator & Manager ({count})`: Filtered to `OPERATOR` and `MANAGER`.
   - `Viewer ({count})`: Read-only accounts (`VIEWER`, `USER`).
   - `RBAC Roles ({count})`: Role definition directory and permissions overview.
   - `Invitations ({count})`: Pending, accepted, and expired account invitations.
4. **2-Column User Creation / Editing Modal** (`UserForm` + `LocationInput`):
   - **Left Column**: Full Name, Email, Password, Tenant Organization, Role Scope Type (`SYSTEM` vs `ORGANIZATION`), Role Assignment, Status.
   - **Right Column**: Location Scope Hierarchy Picker (`TENANT`, `ZONE`, `SITE`), dynamic node selection, live `zoneLocations` payload preview, and telemetry isolation enforcement.
5. **2-Column Custom Role Creation / Editing Modal** (`RoleForm` + Permission Matrix):
   - **Left Column**: Role Identifier (uppercase snake_case), Description, Role Scope Type, Target Organization, Policy Summary.
   - **Right Column**: Module-categorized Permission Matrix with `Select All`, `Clear All`, and individual category toggle buttons.

---

## 3. Implemented BMS Backend API Endpoints

The frontend communicates with the BMS backend using bearer tokens attached automatically via `apiClient.js` and `fetchInterceptor.js`.

### 3.1 Users API
| Method | Endpoint | Description | Request Body / Query |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users` | List users with pagination and search | `?page=1&pageSize=10&search=...&role=...&status=...` |
| `POST` | `/api/v1/users` | Create new user with role and scope | See Payload 4.1 below |
| `GET` | `/api/v1/users/{id}` | Get detailed profile & permissions | Path parameter `{id}` |
| `PATCH` | `/api/v1/users/{id}` | Update existing user details or role | See Payload 4.2 below |
| `DELETE` | `/api/v1/users/{id}` | Soft delete / deactivate user | Path parameter `{id}` |
| `POST` | `/api/v1/users/{id}/unlock` | Clear rate-limiting lockout | Path parameter `{id}` |
| `POST` | `/api/v1/users/{id}/change-password` | Admin password reset | `{ "newPassword": "..." }` |

### 3.2 Roles & Permissions API
| Method | Endpoint | Description | Request Body / Query |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/roles` | List all predefined & custom roles | None |
| `POST` | `/api/v1/roles` | Create custom role with permission codes | See Payload 4.3 below |
| `PATCH` | `/api/v1/roles/{id}` | Update role permissions and metadata | `{ "name": "...", "description": "...", "permissionCodes": [...] }` |
| `DELETE` | `/api/v1/roles/{id}` | Delete custom role (cannot delete predefined) | Path parameter `{id}` |
| `POST` | `/api/v1/roles/{id}/clone` | Clone existing role into new role | `{ "name": "NEW_ROLE_NAME" }` |
| `GET` | `/api/v1/permissions` | Catalog of all available permissions | None |

### 3.3 Account Invitations API
| Method | Endpoint | Description | Request Body / Query |
| :--- | :--- | :--- | :--- |
| `GET` | `/invitations` | List sent invitations | None |
| `POST` | `/invitations` | Send invitation link to prospective user | `{ "email": "...", "role": "OPERATOR", "tenantId": "...", "scopeType": "ZONE", "expirationDays": 7 }` |
| `DELETE` | `/invitations/{id}` | Revoke pending invitation | Path parameter `{id}` |
| `POST` | `/invitations/{token}/accept` | Accept invitation & set credentials | `{ "token": "...", "name": "...", "password": "..." }` |

---

## 4. API Request & Response Schemas

### 4.1 Create User (`POST /api/v1/users`)
```json
{
  "name": "Vikram Patel",
  "email": "vikram.patel@acme-facility.com",
  "password": "SecurePassword123!",
  "role": "OPERATOR",
  "roleId": "cm_operator_id",
  "tenantId": "tenant-delhi-01",
  "roleType": "ORGANIZATION",
  "status": "ACTIVE",
  "zoneLocations": [
    {
      "zoneNodeType": "ZONE",
      "zoneNodeId": "zone-hvac-north"
    }
  ],
  "permissions": "read,write"
}
```

### 4.2 Update User (`PATCH /api/v1/users/{id}`)
```json
{
  "name": "Vikram Patel",
  "email": "vikram.patel@acme-facility.com",
  "role": "MANAGER",
  "status": "ACTIVE",
  "zoneLocations": [
    {
      "zoneNodeType": "SITE",
      "zoneNodeId": "site-substation-b1"
    }
  ]
}
```

### 4.3 Create Custom Role (`POST /api/v1/roles`)
```json
{
  "name": "ENERGY_AUDITOR",
  "description": "Read-only energy telemetry, submeter analysis, and export reporting capabilities",
  "roleType": "ORGANIZATION",
  "organizationId": "tenant-delhi-01",
  "permissionCodes": [
    "device:read",
    "energy:read",
    "report:read",
    "report:export",
    "alarm:read"
  ]
}
```

---

## 5. Recommended Backend Enhancements & Needed APIs

To optimize data fetching and mirror the full hierarchical selection experience of `ismartaccess-frontend-v2`, we recommend adding the following endpoints to the BMS backend:

### 5.1 Unified Location Hierarchy Tree Endpoint
Currently, the frontend fetches `tenants`, `zones`, and `sites` through three separate calls and synthesizes them in client memory.

**Recommended Endpoint**:
```http
GET /api/v1/locations/tree?tenantId={tenantId}
```

**Ideal Response Payload**:
```json
{
  "success": true,
  "data": [
    {
      "id": "tenant-delhi-01",
      "name": "Delhi Corporate Campus",
      "type": "TENANT",
      "children": [
        {
          "id": "zone-hvac-north",
          "name": "North Tower HVAC & Chillers",
          "type": "ZONE",
          "children": [
            {
              "id": "site-substation-b1",
              "name": "Basement Substation 1",
              "type": "SITE"
            },
            {
              "id": "site-rooftop-chillers",
              "name": "Rooftop Cooling Tower Bay",
              "type": "SITE"
            }
          ]
        },
        {
          "id": "zone-datacenter-south",
          "name": "Data Center Precision Cooling",
          "type": "ZONE",
          "children": [
            {
              "id": "site-server-vault",
              "name": "Server Vault Tier IV",
              "type": "SITE"
            }
          ]
        }
      ]
    }
  ]
}
```
**Benefits**:
- Allows rendering a recursive tree picker in `LocationInput`.
- Allows assigning multiple granular zones or sites with inheritance in a single selector.

### 5.2 Bulk User Import & Export
For corporate facilities transitioning from legacy BMS setups:
- `POST /api/v1/users/bulk-import`: Multipart CSV/Excel upload mapping Name, Email, Role, Scope ID.
- `GET /api/v1/users/export?format=csv`: Audit compliance export of all registered users, roles, and status.

### 5.3 Predefined Role Protection Flag
Ensure `GET /api/v1/roles` returns `isPredefined: true` for system baseline roles:
- `SUPER_ADMIN`
- `ADMIN`
- `MANAGER`
- `OPERATOR`
- `VIEWER`

When `isPredefined: true`, delete operations are disabled on the frontend to prevent accidental revocation of core system privileges.

---

## 6. Permissions Matrix Catalog Reference

The BMS permission catalog supports the following capability codes categorized by module:

| Module | Permission Code | Description |
| :--- | :--- | :--- |
| **Device** | `device:read` | View device parameters, telemetry, and live status |
| | `device:control` | Send start/stop commands, setpoints, and manual override |
| | `device:create` | Provision and configure new telemetry hardware |
| | `device:delete` | Remove decommissioned meters and actuators |
| **Alarm** | `alarm:read` | View incoming alarm events and notifications |
| | `alarm:acknowledge` | Acknowledge active alarm warnings and critical trips |
| | `alarm:resolve` | Mark alarms as resolved with root cause notes |
| | `alarm:config` | Edit threshold values, deadbands, and notification policies |
| **Ticket** | `ticket:read` | View maintenance and inspection tickets |
| | `ticket:create` | Raise incident and routine maintenance tickets |
| | `ticket:assign` | Dispatch tickets to technicians and field teams |
| | `ticket:resolve` | Close maintenance orders with completion notes |
| **Reports** | `report:read` | View consumption, runtime, and audit reports |
| | `report:export` | Download PDF, CSV, and Excel telemetry exports |
| **Users** | `user:read` | View user profiles and access logs |
| | `user:create` | Create new staff accounts and dispatch invitations |
| | `user:update` | Edit user assignments, roles, and location scopes |
| | `user:delete` | Deactivate accounts and revoke access |
| **Roles** | `role:read` | View role directory and permission matrix |
| | `role:manage` | Create, edit, clone, and delete custom RBAC roles |
| **Tenant** | `tenant:read` | View tenant profiles and branch facilities |
| | `tenant:manage` | Configure tenant settings and facility attributes |

---

## 7. Verification & Testing Instructions

1. **Verify Token Injection**:
   Open browser dev tools (Network tab) and verify outgoing calls to `/api/v1/users` and `/api/v1/roles` have `Authorization: Bearer <token>`.
2. **Test User Creation with Location Scope**:
   Click **Add New User**, enter user credentials, choose **ZONE** scope, select target zone node, and click **Create User**. Inspect the request body to confirm `zoneLocations: [{ zoneNodeType: "ZONE", zoneNodeId: "..." }]`.
3. **Test Role Creation with Permission Matrix**:
   Click **Create Custom Role**, type a name like `FACILITY_SECURITY`, toggle module permissions, and submit.
4. **Test Clone Role**:
   On the **RBAC Roles** tab, click the clone button on any custom role, input a duplicate name, and verify that the clone inherits all permission codes.
5. **Test Account Lockout Reset**:
   Click the green Unlock button on any user row to invoke `POST /api/v1/users/{id}/unlock`.
