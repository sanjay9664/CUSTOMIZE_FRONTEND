🔍 Issue Diagnosis from the DevTools Screenshot
In your Network tab:

Request: GET http://localhost:5173/api/v1/users
Status: 401 Unauthorized
Response Content-Length: 94 bytes
Chain of Events: users (401) ➔ refresh (failed/red) ➔ logout (200) ➔ login (200)
Root Cause:
Missing or Malformed Authorization: Bearer <token> Header: The response length of 94 bytes matches the backend's standard JSON response:
json
{ "success": false, "error": { "code": "TOKEN_MISSING", "message": "No token provided" } }
The Axios/fetch request for GET /api/v1/users was sent without an Authorization: Bearer <token> header (or with an undefined/stale token from the previous session).
Refresh Interceptor Failure: When users failed with 401, the frontend response interceptor attempted POST /api/v1/auth/refresh. The refresh call failed because either:
Old session cookies were cleared during the backend database/JWT restart.
withCredentials: true is missing on the Axios instance, preventing the HttpOnly refreshToken cookie from reaching the backend.
The POST body did not provide { refreshToken } as a fallback.
Deprecated Sochiot Endpoints Being Called on Mount: If UserManagement.jsx or UserAdministration.jsx still attempts to call GET /api/v1/users/roles, GET /api/v1/users/all, or POST /api/v1/users/:id/sync, those routes no longer exist and return 404 Not Found.
📋 Prompt for the Frontend Team / Frontend Agent
Copy and paste the prompt below directly into the conversation with the frontend agent or developer:

markdown
# Task: Update User Administration & Integrate Granular RBAC API
The BMS backend has completed its migration to pure native BMS Authentication and granular Role-Based Access Control (RBAC). All Sochiot user synchronization endpoints have been removed.
Please update the frontend application (specifically `src/pages/Settings/UserAdministration.jsx`, `UserManagement.jsx`, API client/interceptor, and Auth context) to align with the OpenAPI specification (`docs/Openapi.yaml`).
---
### 1. Fix Axios / API Interceptor (Resolve 401 Unauthorized)
1. **Attach Bearer Token**: Ensure every outgoing API request attaches the token header:
   ```javascript
   apiClient.interceptors.request.use((config) => {
     const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     config.withCredentials = true; // Required for HttpOnly refresh cookies
     return config;
   });
   ```
2. **Token Storage Alignment**: On `POST /api/v1/auth/login`, the backend returns:
   ```json
   {
     "success": true,
     "data": {
       "accessToken": "ey...",
       "refreshToken": "...",
       "expiresIn": 900,
       "user": { ... }
     }
   }
   ```
   Ensure the frontend reads `response.data.data.accessToken` and stores it properly.
3. **401 Refresh Interceptor**: When handling 401 responses, invoke `POST /api/v1/auth/refresh`:
   - Send `withCredentials: true` so the cookie is forwarded.
   - Also pass `{ refreshToken: storedRefreshToken }` in the POST body as a reliable fallback.
---
### 2. Remove Deprecated Sochiot User Endpoints
Remove all calls and UI elements for the following deleted endpoints:
- ❌ `GET /api/v1/users/roles` (Removed)
- ❌ `GET /api/v1/users/all` (Removed)
- ❌ `POST /api/v1/users/:id/sync` (Removed)
- Remove any "Sync from Sochiot" buttons or Sochiot user import options.
---
### 3. Update User Listing & Management Endpoints
- **List Users**: `GET /api/v1/users`
  - Query params: `page`, `pageSize`, `search`, `role`, `status`, `siteId`.
  - Response structure:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "usr_...",
          "name": "...",
          "email": "...",
          "role": "MANAGER",
          "roleId": "cm01...",
          "status": "ACTIVE",
          "resolvedPermissions": ["device:read", "user:read", ...],
          "zoneLocations": []
        }
      ],
      "meta": { "total": 24, "page": 1, "pageSize": 10, "totalPages": 3 }
    }
    ```
  - Bind user table to `response.data.data` and pagination to `response.data.meta`.
- **Create User**: `POST /api/v1/users`
  - Payload:
    ```json
    {
      "name": "John Doe",
      "email": "john@example.com",
      "role": "MANAGER",
      "roleId": "cm01...",
      "tenantId": "...",
      "zoneLocations": [{ "zoneNodeType": "SITE", "zoneNodeId": "1" }]
    }
    ```
- **Update User**: `PATCH /api/v1/users/:id`
  - Payload: `{ name, email, role, roleId, status, features, zoneLocations }`.
- **Delete User**: `DELETE /api/v1/users/:id`
- **Unlock User Account**: `POST /api/v1/users/:id/unlock` (resets Redis rate-limit lockouts).
- **Admin Change Password**: `POST /api/v1/users/:id/change-password` with `{ newPassword }`.
---
### 4. Integrate Roles & Permissions API (`/roles` & `/permissions`)
1. **Roles Dropdown in User Form**:
   - Replace the old `/users/roles` call with `GET /api/v1/roles`.
   - Populate the Role selector with:
     - System Predefined Roles: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `OPERATOR`, `VIEWER`.
     - Custom Tenant Roles: Dynamic roles created by the organization.
   - When submitting user creation/edit, pass both `role` (enum) and `roleId` (string ID).
2. **RBAC Role Management Screen / Modal**:
   - **List Roles**: `GET /api/v1/roles` (returns `id`, `name`, `description`, `isPredefined`, `permissions`, `userCount`).
   - **Create Custom Role**: `POST /api/v1/roles` with `{ name, description, permissionCodes: string[] }`.
   - **Edit Role**: `PATCH /api/v1/roles/:id` with `{ name, description, permissionCodes: string[] }` (disabled for `isPredefined: true`).
   - **Delete Role**: `DELETE /api/v1/roles/:id` (cannot delete if `userCount > 0` or if predefined).
   - **Clone Role**: `POST /api/v1/roles/:id/clone` with `{ name: "New Cloned Name" }`.
3. **Permissions Catalog Matrix**:
   - `GET /api/v1/permissions`: Returns all available permissions with `{ code, name, category, description, implies }`.
   - Use this to render permission checkboxes categorized by module (`device`, `ticket`, `report`, `user`, `role`, `alarm`, `tenant`).
---
### 5. Frontend Permission Guarding
The user object (`GET /api/v1/users/me` or auth state) now provides `resolvedPermissions: string[]`.
Update frontend route & button guards (`hasPermission(code)`) to support:
1. `*` (Wildcard) ➔ Full access to all actions.
2. `<module>:*` (e.g., `user:*`) ➔ Grants all permissions in that module.
3. Exact code matching (e.g., `user:read` to view the user list, `user:write` to create/edit/delete users, `role:manage` to manage roles).
*(Note: `legacyPermissions` has been completely deprecated and removed).*
🛠️ Quick Verification Checklist for the Developer
 LocalStorage & Axios Interceptor: Check Authorization: Bearer ... is visible in request headers in DevTools.
 Network Call Verification: Confirm GET /api/v1/users/roles is replaced with GET /api/v1/roles.
 Response Unwrapping: Update state assignments from res.data to res.data.data (for users array) and res.data.meta (for pagination).
 Role Selection: Ensure the user form passes roleId alongside role.
 Clean Interceptor Recovery: Confirm that upon receiving a 401, the frontend refreshes the token without redirect loops.
3:55 PM