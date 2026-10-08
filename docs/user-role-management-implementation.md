# User & Role Management Implementation Report

**Author:** Senior Frontend Architect & Application Security Engineer  
**Date:** October 3, 2026  
**Project:** `app.sochiot` (`bms-frontend`)  
**Specification:** `docs/app-sochiot-user-role-management-antigravity-prompt.md`  
**API Specification Source:** `docs/Openapi.yaml` (OpenAPI 3.0.3)  
**UI Reference:** `ismartaccess-frontend-v2` / Attached Reference Screenshots  

---

## 1. Overview

The User Management and Role Management systems have been completely re-architected and implemented in `app.sochiot`. The implementation brings the proven visual language, interaction patterns, and user experience from `ismartaccess-frontend-v2` directly into `app.sochiot`, strictly backed by the authoritative `docs/Openapi.yaml` contract and the live backend API services.

No hardcoded roles, permissions, or locations are used. Predefined system roles are protected against accidental deletion or modification, while custom tenant roles and permissions are fully dynamic.

---

## 2. UI Reference Used

The visual style directly mirrors the reference screenshots and `ismartaccess-frontend-v2`:
- **System Users Screen (Screenshot 1)**:
  - Top header: "System Users"
  - Top-right action: "Manage Users" dropdown menu to toggle between "System Users" and "User Roles".
  - Four navigation tabs: "Administrator User", "Installation User", "Organisation User", "All Users".
  - Content card with title matching the active tab.
  - Action button: `+ Add <Tab Singular>` (e.g. `+ Add Administrator User`, `+ Add Installation User`, `+ Add Organisation User`, `+ Add User`).
  - Search input with debounce.
  - Table columns: `Name` (sortable, blue clickable text), `Email`, `Action` (trash icon for soft deletion, lock icon for unlocking account and admin password resets, edit icon).
  - Clean pagination controls: `< 1 2 3 ... >`.
- **User Roles Screen (Screenshot 2)**:
  - Top header: "User Roles"
  - Four navigation tabs: "Administrator Roles", "Installation Roles", "Organization Roles", "All Roles".
  - Content card with title matching the active tab.
  - Action button: `+ Add <Tab Singular>` (e.g. `+ Add Administrator Role`).
  - Table columns: `Name` (sortable, blue text), `Description`, `Action` (trash icon for custom roles; disabled/immutable for predefined system roles).
  - Pagination controls: `< 1 2 >`.
- **Add / Edit Role Screen (Screenshot 3)**:
  - Subheader with back arrow: `← Add Organisation Role` (or `← Add Administrator Role` / `← Edit Role`).
  - Two-column responsive layout:
    - **Left Column**: Name (required), Description (required textarea), Organization (dropdown from `/tenants` and `/companies`), Role Type (dropdown).
    - **Right Column**: Permissions (2-column grid of checkboxes dynamically loaded from `/permissions`, with "Select All" / "Clear All" helpers).
  - Bottom action buttons: `Add` (primary blue) and `Cancel` (bordered outline).
- **Add / Edit User Screen (Sections 3, 11, 15)**:
  - Subheader with back arrow: `← Add Administrator User` (or `← Add User` / `← Edit User`).
  - Two-column responsive layout:
    - **Left Column**: Name, Email, Password (with eye toggle), Organization, User Type, Role (dynamically populated from `GET /roles`), Status (Active/Inactive toggle).
    - **Right Column**: Location Assignment with interactive multi-node tree selector (`/locations/tree`).
  - Bottom action buttons: `Add` / `Save Changes` and `Cancel`.

---

## 3. API Endpoints Used

All endpoints strictly adhere to `docs/Openapi.yaml`:

### Users
- `GET /api/v1/users`: Paginated user list with role, status, and search filters.
- `GET /api/v1/users/{id}`: Detailed user record.
- `POST /api/v1/users`: Create user with `zoneLocations` mapping and role assignment.
- `PATCH /api/v1/users/{id}`: Update user attributes, role, status, and locations.
- `DELETE /api/v1/users/{id}`: Soft delete user.
- `POST /api/v1/users/{id}/change-password`: Force reset user password by administrator.
- `POST /api/v1/users/{id}/unlock`: Clear Redis rate-limit lockout and restore `ACTIVE` status.

### Roles & Permissions
- `GET /api/v1/roles`: Retrieve system predefined roles and custom tenant roles.
- `GET /api/v1/roles/{id}`: Retrieve role details with assigned permissions.
- `POST /api/v1/roles`: Create custom tenant role with `permissionCodes`.
- `PATCH /api/v1/roles/{id}`: Update custom role name, description, and permissions.
- `DELETE /api/v1/roles/{id}`: Delete custom role.
- `POST /api/v1/roles/{id}/clone`: Clone an existing role into a new custom tenant role.
- `GET /api/v1/permissions`: Catalog of available permissions with names, codes, categories, and descriptions.

### Spatial Locations & Hierarchy
- `GET /api/v1/locations/tree?includeCompany=true`: Unified spatial hierarchy (`Company -> Tenant -> Zone -> Area -> Site -> Asset: Building -> Floor -> Room -> Equipment`).
- `GET /api/v1/tenants`: List tenants / organizations.
- `GET /api/v1/companies`: List top-level companies.

---

## 4. Components Created

1. **`src/pages/Admin/components/LocationTreeSelector.jsx`**:
   - Multi-level collapsible tree view.
   - Distinct icons for `COMPANY`, `TENANT`, `ZONE`, `AREA`, `SITE`, and `ASSET` nodes.
   - Search filter across node names.
   - Expand All / Collapse All controls.
   - Outputs `zoneLocations: [{ zoneNodeType: string, zoneNodeId: string }]`.

2. **`src/pages/Admin/components/PermissionSelector.jsx`**:
   - 2-column checkbox layout matching Screenshot 3.
   - Dynamically loaded from `GET /permissions`.
   - Category filtering and search input.
   - "Select All" and "Clear All" controls.
   - Outputs `permissionCodes: string[]`.

3. **`src/pages/Admin/components/SystemUsersView.jsx`**:
   - User list table matching Screenshot 1.
   - 4 Tabs: "Administrator User", "Installation User", "Organisation User", "All Users".
   - Sortable columns, search input, pagination.
   - Modals for Delete confirmation and Reset Password / Unlock.

4. **`src/pages/Admin/components/UserRolesView.jsx`**:
   - Role list table matching Screenshot 2.
   - 4 Tabs: "Administrator Roles", "Installation Roles", "Organization Roles", "All Roles".
   - Predefined system role protection (cannot delete built-in roles).
   - Delete confirmation modal for custom roles.

5. **`src/pages/Admin/components/RoleFormView.jsx`**:
   - 2-column role creation and edit layout matching Screenshot 3.
   - Left: Name, Description, Organization, Role Type.
   - Right: PermissionSelector.

6. **`src/pages/Admin/components/UserFormView.jsx`**:
   - 2-column user creation and edit layout matching Sections 3, 11, 15.
   - Left: Name, Email, Password, Organization, User Type, Role, Status.
   - Right: LocationTreeSelector.

7. **`tests/user_management_check.js`**:
   - Automated self-check verifying API methods, tab categorization rules, zoneLocation conversions, and role immutability.

---

## 5. Components Reused

- `src/services/bmsService.js`: Standardized API service layer.
- `src/services/apiClient.js`: Unified API client with token injection and error handling.
- `src/components/PasswordInput.jsx`: Secure password field with show/hide toggle.
- `react-bootstrap`: Table, Card, Form, Button, Modal, Dropdown, Spinner, Badge, Row, Col.
- `lucide-react`: Clean icons matching the design system.

---

## 6. User Management Features

- **List & Filtering**: Filter by role categories (Administrator, Installation, Organisation, All) and search by name/email.
- **Creation**: Validates required fields (`name`, `email`, `password`, `role`), supports location assignment via tree.
- **Editing**: Allows updating user attributes, changing role, adjusting active status, and updating assigned locations.
- **Account Actions**:
  - Soft deletion with confirmation.
  - Administrative password change.
  - Account unlocking from rate-limiting lockouts.

---

## 7. Role Management Features

- **List & Filtering**: Categorizes roles into Administrator, Installation, Organization, and All roles.
- **System Role Protection**: Built-in roles (`ADMIN`, `SUPER_ADMIN`, `OPERATOR`, etc.) are marked with a "System" badge and cannot be deleted.
- **Custom Role Creation**: Create custom roles with specific subsets of permissions.
- **Editing**: Modify permissions, name, or description for custom roles.
- **Deletion**: Custom roles can be deleted with user impact checks.

---

## 8. Permission Management Features

- Dynamically retrieved from `GET /api/v1/permissions`.
- Permissions grouped into categories (`user`, `role`, `device`, `report`, `site`, `hvac`, `asset`).
- Fast search and filtering by category.
- "Select All" / "Clear All" helpers.

---

## 9. Location Assignment Features

- Uses the unified spatial hierarchy tree from `GET /locations/tree?includeCompany=true`.
- Supports multi-node selection across Company, Tenant, Zone, Area, Site, and Asset levels.
- Replaces deprecated Building model dependencies with Asset-driven physical hierarchy.

---

## 10. Authorization & Security

- **Principle of Least Privilege**: Custom roles can only be granted entitled permissions.
- **Immutability of System Roles**: Predefined roles cannot be deleted or stripped of their core permissions.
- **Session Boundary**: Passwords are never logged or stored in persistent storage.
- **XSS Protection**: React automatic escaping prevents script injection via user or role names.

---

## 11. Validation & Error Handling

- **Form Validation**: Required fields validated before dispatch; password length constrained (min 6 characters).
- **Backend Error Handling**: Extracts granular error messages from `400 BadRequest`, `403 Forbidden`, `404 NotFound`, and `409 Conflict` (e.g. duplicate email/role name).
- **Graceful Fallbacks**: Empty, loading, and error states provided across all tables and selector components.

---

## 12. Testing & Verification

1. **Node Self-Check (`tests/user_management_check.js`)**:
   ```
   --- Starting User & Role Management Self-Check ---
   ✓ bmsService API methods verified
   ✓ Role tab classification rules verified
   ✓ User tab classification rules verified
   ✓ Location tree zoneLocations conversion verified
   ✓ Predefined role immutability check verified
   --- ALL USER & ROLE MANAGEMENT CHECKS PASSED ---
   ```
2. **Existing Regression Suite (`tests/auth_cleanup_check.js` & `src/store/redux_self_check.js`)**:
   ```
   ✓ Login JWT refresh token preservation verified
   ✓ Valid opaque refresh token preservation verified
   ✓ Client-side refresh_token cookie shadowing prevention verified
   ✓ Allowlist-based storage and cookie purging verified
   --- ALL AUTH CLEANUP & REFRESH CHECKS PASSED ---
   --- ALL REDUX CHECKS PASSED SUCCESSFULLY ---
   ```
3. **Live Backend API Verification**:
   - `GET /api/v1/roles`: Responded with 20 roles (both predefined and custom).
   - `GET /api/v1/permissions`: Responded with 17 active permission catalog entries.
   - `GET /api/v1/locations/tree?includeCompany=true`: Responded with multi-company spatial tree.
   - `GET /api/v1/users`: Responded with 19 user records.

---

## 13. Known Backend API Gaps

None identified. All required capabilities (user list, user create/update/delete, role list, role create/update/delete, permissions catalog, unified location tree) are fully implemented and functional in `bms-backend`.

---

## 14. Files Changed

- `docs/user-role-management-api-mapping.md`: Created master API mapping document.
- `docs/user-role-management-implementation.md`: Created detailed implementation report.
- `src/services/bmsService.js`: Added `getLocationTree` API method and ES module extension.
- `src/services/apiClient.js`: Added explicit `.js` extensions for module resolution.
- `src/pages/Admin/UserManagement.jsx`: Updated top-level coordinator with "Manage Users" dropdown, tab navigation, and responsive CSS.
- `src/pages/Admin/components/LocationTreeSelector.jsx`: Created interactive hierarchical location tree selector.
- `src/pages/Admin/components/PermissionSelector.jsx`: Created 2-column permission checkbox grid.
- `src/pages/Admin/components/SystemUsersView.jsx`: Created System Users table view matching Screenshot 1.
- `src/pages/Admin/components/UserRolesView.jsx`: Created User Roles table view matching Screenshot 2.
- `src/pages/Admin/components/UserFormView.jsx`: Created 2-column user creation and editing view.
- `src/pages/Admin/components/RoleFormView.jsx`: Created 2-column role creation and editing view matching Screenshot 3.
- `tests/user_management_check.js`: Created automated test verification script.
- `vite.config.js`: Added `server.watch.ignored` patterns for `docs/` to prevent Windows file-lock EBUSY watcher crashes.
