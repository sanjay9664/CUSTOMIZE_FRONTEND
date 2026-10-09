# User & Role Management API Mapping

**Specification Source:** `docs/Openapi.yaml` (OpenAPI 3.0.3)  
**Target UI Reference:** `ismartaccess-frontend-v2` / Attached Reference Screenshots  
**Project:** `app.sochiot` (`bms-frontend`)

---

## 1. Master API Mapping Table

| Feature | OpenAPI Endpoint | Method | Request Body / Params | Response Schema | Used By |
|---|---|---|---|---|---|
| **Users: List** | `/users` | `GET` | Query: `page`, `limit`, `role`, `status` | `PaginatedResponse` with `data: User[]` | `UserList`, `SystemUsers` |
| **Users: Get Detail** | `/users/{id}` | `GET` | Path: `id` | `User` | `UserDetails`, `EditUserModal` |
| **Users: Create** | `/users` | `POST` | `CreateUserRequest`: `{ name, email, role, roleId?, roleType?, permissions?, tenantId?, zoneLocations? }` | `User` (201 Created) | `AddUserForm`, `UserManagement` |
| **Users: Update** | `/users/{id}` | `PATCH` | `UpdateUserRequest`: `{ name?, email?, password?, role?, roleId?, roleType?, permissions?, status?, features?, zoneLocations? }` | `User` | `EditUserForm`, `UserManagement` |
| **Users: Soft Delete** | `/users/{id}` | `DELETE` | Path: `id` | `SuccessMessageResponse`: `{ success: true, message: string }` | `UserTable`, `DeleteUserDialog` |
| **Users: Reset/Change Password** | `/users/{id}/change-password` | `POST` | Path: `id`, Body: `{ password: string }` | `{ success: true, message: string, data: User }` | `ChangePasswordModal`, `UserTable` |
| **Users: Unlock Account** | `/users/{id}/unlock` | `POST` | Path: `id` | `{ success: true, message: string, data: User }` | `UnlockUserAction`, `UserTable` |
| **Users: Update Feature Permissions** | `/users/{id}/permissions` | `PATCH` | Path: `id`, Body: `{ features: object }` | `User` | `UserFeaturePermissionsModal` |
| **Users: Export CSV** | `/users/export` | `GET` | Query: `role?`, `status?`, `tenantId?` | `text/csv` attachment | `UserManagement` Header Actions |
| **Users: Bulk Import** | `/users/bulk-import` | `POST` | Body: `{ users: BulkImportUserItem[] }` | `{ success: true, data: { imported: number, failed: number } }` | `UserBulkImportModal` |
| **Users: Scoped List** | `/users/scope/{scopeType}/{scopeId}` | `GET` | Path: `scopeType`, `scopeId` | `{ success: true, data: User[] }` | `LocationScopedUserList` |
| **Roles: List** | `/roles` | `GET` | Query: `tenantId?` | `{ success: true, data: RoleResponse[] }` | `RoleList`, `UserRoles`, `UserForm` |
| **Roles: Get Detail** | `/roles/{id}` | `GET` | Path: `id` | `{ success: true, data: RoleDetailResponse }` | `RoleDetail`, `EditRoleForm` |
| **Roles: Create Custom Role** | `/roles` | `POST` | `CreateRoleRequest`: `{ name, description?, permissionCodes: string[], tenantId? }` | `{ success: true, data: RoleDetailResponse }` (201) | `AddRoleForm`, `RoleManagement` |
| **Roles: Update Custom Role** | `/roles/{id}` | `PATCH` | `UpdateRoleRequest`: `{ name?, description?, permissionCodes?: string[] }` | `{ success: true, data: RoleDetailResponse }` | `EditRoleForm`, `RoleManagement` |
| **Roles: Delete Custom Role** | `/roles/{id}` | `DELETE` | Path: `id` | `{ success: true, data: { id: string, deleted: true } }` | `RoleTable`, `DeleteRoleDialog` |
| **Roles: Clone Role** | `/roles/{id}/clone` | `POST` | Path: `id`, Body: `{ name: string, description?: string }` | `{ success: true, data: RoleDetailResponse }` (201) | `CloneRoleModal`, `RoleTable` |
| **Permissions: Catalog** | `/permissions` | `GET` | Query: `tenantId?` | `{ success: true, data: PermissionResponse[] }` | `PermissionSelector`, `RoleForm` |
| **Locations: Unified Tree** | `/locations/tree` | `GET` | Query: `includeCompany=true`, `tenantId?`, `companyId?` | `{ success: true, data: LocationTreeNode[] }` | `LocationTreeSelector`, `UserForm` |
| **Companies: List** | `/companies` | `GET` | Query: `page?`, `limit?` | `{ total, page, limit, totalPages, data: Company[] }` | `OrganizationDropdown`, `RoleForm` |
| **Tenants: List** | `/tenants` | `GET` | Query: `page?`, `limit?`, `status?` | `{ total, page, limit, totalPages, data: Tenant[] }` | `OrganizationDropdown`, `UserForm` |

---

## 2. Model & Enum Specifications

### 2.1 User Enums & Schemas
- **UserRole**: `SUPER_ADMIN | ADMIN | MANAGER | OPERATOR | VIEWER`
- **UserStatus**: `ACTIVE | INACTIVE | SUSPENDED | PENDING_VERIFICATION`
- **User Entity**:
  ```typescript
  interface User {
    id: string;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
    tenantId?: string | null;
    roleId?: string | null;
    permissions?: string[];
    resolvedPermissions?: string[];
    features?: Record<string, boolean>;
    zoneLocations?: Array<{
      zoneNodeType: string;
      zoneNodeId: string;
    }>;
    createdAt?: string;
  }
  ```

### 2.2 Role Schemas
- **RoleResponse**:
  ```typescript
  interface RoleResponse {
    id: string;
    name: string;
    description?: string | null;
    isPredefined: boolean;
    tenantId?: string | null;
    permissions: string[]; // Permission codes array
    userCount: number;
    createdAt?: string;
    updatedAt?: string;
  }
  ```

### 2.3 Permission Schemas
- **PermissionResponse**:
  ```typescript
  interface PermissionResponse {
    code: string;       // e.g. "device:control"
    name: string;       // e.g. "Control Devices"
    category: string;   // e.g. "device", "alarm", "ticket", "report", "user", "role"
    description?: string;
    implies?: string[];
  }
  ```

### 2.4 Location Tree Node Schema
- **LocationTreeNode**:
  ```typescript
  interface LocationTreeNode {
    id: string;
    name: string;
    type: 'COMPANY' | 'TENANT' | 'ZONE' | 'AREA' | 'SITE' | 'BUILDING' | 'FLOOR' | 'ROOM' | 'ASSET' | string;
    parentId?: string | null;
    siteId?: number | null;
    sochiotLocationId?: number | null;
    address?: string | null;
    city?: string | null;
    assetType?: string | null;
    depth?: number;
    children?: LocationTreeNode[];
  }
  ```

---

## 3. UI/UX Tab Category Mapping

The reference screens use 4 tabs:
1. **Administrator User / Administrator Roles**:
   - Filter: `role in ['SUPER_ADMIN', 'ADMIN']` or `isPredefined === true && (role === 'ADMIN' || role === 'SUPER_ADMIN')`
2. **Installation User / Installation Roles**:
   - Filter: `role in ['OPERATOR']` or roles tagged for field/commissioning operations
3. **Organisation User / Organization Roles**:
   - Filter: `role in ['MANAGER', 'VIEWER']` or custom tenant roles (`isPredefined === false`)
4. **All Users / All Roles**:
   - Unfiltered view across all active records

---

## 4. Verification Check
- All endpoints map 1:1 with verified routes in `docs/Openapi.yaml`.
- No deprecated Building model endpoints used; physical location hierarchy uses `/locations/tree` (Asset-driven).
- Predefined system roles are protected from deletion (`isPredefined === true`).
