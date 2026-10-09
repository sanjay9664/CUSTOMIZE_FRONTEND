# TASK: Implement User Management + Role Management in app.sochiot
# UI/UX Reference: ismartaccess-frontend-v2

You are a senior frontend architect and React/TypeScript engineer with 16+ years of experience building enterprise SaaS, IAM/RBAC, multi-tenant applications, and security-sensitive administration interfaces.

We need to implement the User Management and Role Management functionality in the current `app.sochiot` frontend.

The UI/UX style, interaction patterns, layouts, forms, tables, navigation, and visual language should follow the existing implementation in:

`F:\SochIot Folder\Frontends\ismartaccess-frontend-v2`

IMPORTANT:

`ismartaccess-frontend-v2` is a UI/UX and functional-flow REFERENCE.

It is NOT the backend source of truth.

The current app.sochiot project's OpenAPI specification and existing APIs are the ONLY source of truth for API contracts.

Do NOT copy old API endpoints, old API models, old IDs, old backend assumptions, or old business logic from ismartaccess-frontend-v2.

---

# 1. OBJECTIVE

Implement the complete User Management and Role Management experience in `app.sochiot`, following the UX patterns demonstrated in `ismartaccess-frontend-v2`.

The functionality should cover:

## User Management

- User list
- Search
- Filtering
- Pagination
- Add User
- Edit User
- View User
- Enable/disable user
- Delete/deactivate user where supported by API
- Assign role
- Assign organization/company/tenant/location where supported
- Manage permissions through roles
- User validation
- User status
- User details
- Location assignment
- Role assignment

## Role Management

- Role list
- Administrator Roles
- Installation Roles
- Organization Roles
- All Roles
- Add Role
- Edit Role
- View Role
- Delete role where supported
- Permission selection
- Role type
- Organization assignment where applicable
- Permission grouping
- Role status where supported

Do NOT implement API operations that are not present in the OpenAPI specification.

---

# 2. VISUAL REFERENCE

The attached screenshots are also visual references for the expected UI/UX.

The reference screens demonstrate:

### User Roles

Tabs:

- Administrator Roles
- Installation Roles
- Organization Roles
- All Roles

Table:

- Name
- Description
- Action

There are also actions such as:

- Manage Users
- Add Organization Role

### Add Organization Role

The reference UI contains:

- Name *
- Description *
- Organization *
- Role Type *
- Permissions

Permissions are displayed as selectable checkboxes in a structured two-column layout.

Example permission labels shown in the reference:

- Manage Organization Users
- Manage Organization Roles
- Manage Schedules
- Manage Access Levels
- Manage Accessors
- Manage Holidays
- Manage Visitors
- Manage Rules
- Manage Check Access Log
- Manage Audit Trail
- Manage Reports And Analytics
- Manage Gateways
- Manage Devices
- Manage Modules
- Manage System Events
- Manage Updates

IMPORTANT:

These permission names are examples from the reference UI.

Do NOT hardcode them into the new implementation.

Load permissions from the current backend/OpenAPI API.

---

# 3. USER CREATION UI REFERENCE

The reference Add Administrator User screen contains:

- Name *
- Email *
- Organization *
- User Type *
- Role *
- Enabled

And a location tree on the right side.

The current app.sochiot implementation must use the current backend's location APIs and data model.

Do NOT copy the old location-tree implementation from ismartaccess-frontend-v2.

---

# 4. CRITICAL SOURCE-OF-TRUTH RULE

There are three different sources involved:

## SOURCE 1 — UI/UX

`F:\SochIot Folder\Frontends\ismartaccess-frontend-v2`

Use it to understand:

- visual style
- layout
- spacing
- forms
- tables
- tabs
- dialogs
- dropdowns
- checkboxes
- location tree
- loading states
- empty states
- confirmation dialogs
- validation UX
- navigation
- interaction patterns

## SOURCE 2 — CURRENT API

The current app.sochiot OpenAPI specification.

Use it as the authoritative source for:

- endpoints
- HTTP methods
- request bodies
- query parameters
- path parameters
- response schemas
- pagination
- filtering
- validation
- error responses
- role APIs
- permission APIs
- user APIs
- location APIs

## SOURCE 3 — CURRENT FRONTEND ARCHITECTURE

The existing app.sochiot frontend.

Follow:

- existing API client
- existing authentication
- existing routing
- existing components
- existing design system
- existing hooks
- existing state management
- existing notification system
- existing form validation
- existing TypeScript conventions

Do not introduce a parallel architecture.

---

# 5. FIRST STEP — AUDIT BOTH PROJECTS

Before implementing anything, inspect:

`F:\SochIot Folder\Frontends\ismartaccess-frontend-v2`

and the current app.sochiot frontend.

Do not immediately start coding.

First understand:

### ismartaccess-frontend-v2

Find:

- User Management pages
- User forms
- Role Management pages
- Role forms
- permission selector
- location tree
- table components
- pagination
- tabs
- modals
- confirmation dialogs
- reusable form components
- validation
- API abstraction
- loading/error/empty states

### app.sochiot

Find:

- current routing
- current layout
- current sidebar/navigation
- current components
- current table implementation
- current form components
- current dropdown/select
- current checkbox components
- current modal/dialog
- current toast/notification system
- current API client
- OpenAPI-generated/client types if available
- authentication context
- permission system
- location APIs
- existing user-related code
- existing role-related code

---

# 6. USE THE AVAILABLE ANTIGRAVITY SKILLS

Use the relevant installed skills rather than implementing from generic assumptions.

Especially inspect/use:

- frontend-developer
- frontend-security-coder
- security
- typescript-pro
- typescript-advanced-types
- javascript-testing-patterns
- application-performance-performance-optimization
- architecture-patterns
- api-design-principles
- api-documenter
- uxui-principles
- redesign-existing-projects
- improve-ui
- baseline-ui

If another installed skill is more appropriate for:

- RBAC
- forms
- tables
- accessibility
- API integration
- performance
- security

use it.

---

# 7. DO NOT COPY THE OLD IMPLEMENTATION BLINDLY

Do NOT simply copy files from:

`ismartaccess-frontend-v2`

into app.sochiot.

Instead:

1. Inspect the reference implementation.
2. Understand the UX pattern.
3. Identify reusable concepts.
4. Reimplement them using the current app.sochiot architecture.
5. Integrate with the current OpenAPI contract.

The result should feel like the same product family while remaining native to the current frontend architecture.

---

# 8. OPENAPI-FIRST IMPLEMENTATION

Before writing API integration code, inspect the current OpenAPI specification.

Identify all relevant endpoints for:

## Users

Search for operations related to:

- users
- user
- administrators
- organization users
- members

Determine exact:

- GET list
- GET detail
- POST create
- PATCH/PUT update
- DELETE/deactivate
- enable/disable
- role assignment
- location assignment

## Roles

Search for:

- roles
- role
- permissions

Determine exact:

- GET roles
- GET role
- POST role
- PUT/PATCH role
- DELETE role
- permissions
- role types
- organization-specific roles

## Locations

Determine exact endpoints for:

- locations
- location tree
- organization
- tenant
- zone
- area
- site
- asset

Do not invent endpoint names.

Do not assume REST conventions if OpenAPI defines something different.

---

# 9. API CONTRACT MUST DRIVE TYPES

If the project already has generated OpenAPI types, use them.

Do not manually duplicate API interfaces if generated types already exist.

Avoid `any`.

Avoid unsafe casts unless there is a verified reason.

Request and response types must match the OpenAPI specification.

---

# 10. USER MANAGEMENT PAGE

Create the User Management page using the reference UI style.

Expected high-level structure:

    User Management

                              [ Manage Users / Add User ]

    ------------------------------------------------------------

    Search              Filters

    ------------------------------------------------------------

    Name | Email | Role | Organization | Status | Action

    ------------------------------------------------------------

    User
    User
    User
    User

    ------------------------------------------------------------

    Pagination

Adapt the exact columns to the current API.

Do not display fields that the API does not provide.

---

# 11. USER CREATION

Create an Add User form following the visual style of the reference.

Potential structure:

    Add User

    Name *
    Email *

    Organization *
    User Type *

    Role *
    Enabled

    Location
    ------------------------------
    Location Tree
    ------------------------------

    [Add] [Cancel]

However:

DO NOT assume these fields are exactly required.

Determine required fields from OpenAPI and current backend validation.

Required fields must be driven by the actual API contract.

---

# 12. USER EDIT

Implement edit functionality based on the API.

Determine whether:

- email can be edited
- organization can be changed
- role can be changed
- location can be changed
- status can be changed

Do not expose fields that the backend does not allow updating.

---

# 13. USER STATUS

If the API supports user enable/disable:

Provide an appropriate UI control.

Examples:

- Enabled
- Disabled

or a toggle.

The UI should call the correct backend operation.

Do not simulate status changes locally.

---

# 14. USER ROLE ASSIGNMENT

Role assignment must use actual backend roles.

Do not hardcode roles such as:

- Admin
- Manager
- Operator
- Super Admin

unless they are returned by the API.

The role dropdown should be dynamically populated.

Consider:

- Loading
- Empty roles
- API error

states.

---

# 15. LOCATION ASSIGNMENT

The reference application has a hierarchical location selector.

Implement the equivalent experience using the current app.sochiot location APIs.

Expected conceptual structure:

    Company
     └── Tenant
          └── Zone
               └── Area
                    └── Site
                         └── Asset
                              └── Child Asset

IMPORTANT:

The exact hierarchy must come from the current backend/OpenAPI implementation.

Do not hardcode the hierarchy.

Do not use the deprecated Building model.

The current physical hierarchy uses Assets.

Therefore:

    Site
      ↓
    Asset
      ↓
    Asset.parentId
      ↓
    Child Assets

must be treated as the source of truth for physical location hierarchy.

---

# 16. ROLE MANAGEMENT PAGE

Create a role management experience following the reference UI.

Tabs:

- Administrator Roles
- Installation Roles
- Organization Roles
- All Roles

BUT:

Verify whether the current API actually supports these role categories/types.

If the API uses different role types, map them appropriately.

Do not hardcode categories simply because they exist in the reference application.

---

# 17. ROLE LIST

Use a reusable table.

Potential columns:

- Name
- Description
- Role Type
- Organization
- Actions

Only include fields supported by the API.

Support:

- sorting if API supports it
- pagination
- search
- filtering
- loading
- empty state
- error state

Do not implement client-side filtering for large datasets if the backend supports server-side filtering.

---

# 18. CREATE ROLE

Build the role creation form following the reference design.

Expected conceptual structure:

    Add Role

    Name *
    Description *

    Organization *

    Role Type *

    Permissions
    --------------------------------
    ☐ Permission
    ☐ Permission
    ☐ Permission
    ...
    --------------------------------

    [Add] [Cancel]

Permission list must come from the backend.

Do not hardcode permissions.

---

# 19. PERMISSION GROUPING

If the API provides permission categories/modules, use them.

For example:

- Users
- Roles
- Devices
- Reports
- Access
- System

If the API returns only a flat permission list, create a UI grouping only if there is a reliable metadata/source for the grouping.

Do not invent semantic permission groups that could misrepresent authorization behavior.

---

# 20. PERMISSION SELECTION

Implement:

- individual permission selection
- selected state
- deselection
- validation
- loading
- empty state
- API errors

If appropriate and supported:

- Select All
- Clear All

Do not introduce permissions that don't exist in the backend.

---

# 21. ROLE EDIT

Implement edit role based on the API.

Ensure:

    Existing role
        ↓
    Load current data
        ↓
    Load current permissions
        ↓
    Populate form
        ↓
    Modify
        ↓
    Submit
        ↓
    Refresh role list

Do not accidentally remove permissions because an optional field was omitted from the request.

---

# 22. ROLE DELETE

If supported by the API:

Use a confirmation dialog.

Example:

    Delete Role?

    Are you sure you want to delete "Manager"?

    [Cancel] [Delete]

Do not delete immediately on icon click.

Handle:

- successful deletion
- API error
- role already assigned
- protected/system role
- permission denied

based on actual API responses.

---

# 23. SYSTEM / BUILT-IN ROLES

Determine whether the backend differentiates:

- system roles
- custom roles
- protected roles
- organization roles

If system/protected roles cannot be deleted or modified, the UI must reflect the actual backend rules.

Do not rely only on hiding the delete button.

Backend authorization remains authoritative.

---

# 24. SECURITY

This is an RBAC administration interface.

Audit for:

- permission escalation
- unauthorized role assignment
- unauthorized organization assignment
- unauthorized location assignment
- trusting frontend permission state
- exposing sensitive user information
- storing passwords/tokens in form state unnecessarily
- unsafe HTML rendering
- XSS through user/role names
- insecure API calls
- IDOR-prone URL patterns
- client-side-only authorization

The frontend should enforce UX restrictions, but the backend remains the security boundary.

---

# 25. FORM SECURITY

Use the project's existing validation system.

Validate:

- required fields
- email
- name
- description
- role
- organization
- permissions
- location

Avoid duplicating backend validation rules unless they are explicitly documented.

Display backend validation errors correctly.

---

# 26. UX REQUIREMENTS

Match the visual language of `ismartaccess-frontend-v2`:

- typography
- spacing
- borders
- table appearance
- tabs
- form layout
- buttons
- dropdowns
- checkbox styling
- dialogs
- icons
- hover states
- active states
- pagination
- empty states
- loading states

But use the current app.sochiot design system/components wherever possible.

Do NOT introduce a second design system.

---

# 27. RESPONSIVE DESIGN

The implementation must work on:

- desktop
- laptop
- tablet
- smaller screens

Pay particular attention to the two-column user form:

    User Details | Location Tree

The layout should gracefully collapse when screen width is insufficient.

---

# 28. COMPONENT ARCHITECTURE

Prefer reusable components.

Potential structure:

    UserManagement/
        UserList
        UserTable
        UserFilters
        UserForm
        UserDetails
        UserStatusToggle
        UserRoleSelector
        LocationSelector

    RoleManagement/
        RoleList
        RoleTable
        RoleFilters
        RoleForm
        PermissionSelector
        RoleTypeSelector

Do not create these exact files blindly.

Follow the existing project's architecture.

Reuse existing components wherever appropriate.

---

# 29. DATA FETCHING

Follow the current app.sochiot data-fetching architecture.

Do not introduce another HTTP client or state-management library.

Handle:

- loading
- success
- empty
- error
- retry

states.

Avoid unnecessary API calls.

For example, don't fetch permissions repeatedly every time a checkbox is rendered.

Cache static/reference data appropriately if the existing architecture supports it.

---

# 30. PAGINATION

Determine whether the backend uses:

- page
- limit
- offset
- cursor

from OpenAPI.

Implement pagination exactly according to the API.

Do not fetch all users and paginate thousands of users entirely on the frontend if server-side pagination exists.

---

# 31. SEARCH AND FILTERS

Determine which filters are supported by the API.

Only expose valid server-side filters.

For search:

- debounce if appropriate
- avoid requests on every keystroke
- reset pagination when search changes
- preserve filter state appropriately

---

# 32. ERROR HANDLING

Use the existing application error/notification system.

Handle:

- 401
- 403
- 404
- 409
- 422
- 429
- 500
- network failure
- validation failure

according to the API contract.

Especially:

### 403

Display an authorization message.

Do not simply show a generic error.

### 409

Handle conflicts such as duplicate email or duplicate role if supported.

---

# 33. AUTHORIZATION-AWARE UI

Determine the current frontend permission system.

Use the actual permission identifiers from the current API/authentication system.

UI controls such as:

- Add User
- Edit User
- Delete User
- Add Role
- Edit Role
- Delete Role

should respect the current authenticated user's permissions.

Again:

Frontend permission checks are UX only.

Backend authorization is authoritative.

---

# 34. NAVIGATION

Determine where User Management and Role Management belong in the current app.sochiot navigation.

Follow the current application's routing architecture.

Do not copy old route names from ismartaccess-frontend-v2 unless they match the current application.

---

# 35. PERFORMANCE

Avoid:

- unnecessary re-renders
- rendering thousands of location nodes at once if avoidable
- repeated permission API calls
- repeated role API calls
- duplicate user API calls
- unnecessary full-page reloads
- unnecessary context updates

For large location trees, evaluate:

- lazy expansion
- memoization
- virtualization if necessary
- efficient tree construction

Do not prematurely add virtualization if the actual dataset does not require it.

---

# 36. ACCESSIBILITY

Use accessible:

- labels
- inputs
- buttons
- checkboxes
- tabs
- dialogs
- dropdowns
- keyboard navigation
- focus handling
- error messages

Ensure form labels are correctly associated with controls.

---

# 37. TESTING

Add/update tests for:

## User

- list users
- search users
- pagination
- add user
- validation
- edit user
- enable/disable
- role assignment
- location assignment
- API errors
- permission denied

## Roles

- list roles
- role tabs/types
- add role
- edit role
- delete role
- permission selection
- permission loading
- validation
- API errors
- protected/system role behavior

## Security

- unauthorized user cannot see protected actions
- 403 handling
- no hardcoded authorization
- no stale permissions
- no unsafe rendering

---

# 38. DO NOT MODIFY BACKEND

For this task:

DO NOT change backend code.

Use the existing backend APIs exactly as defined in OpenAPI.

If the frontend discovers an API mismatch or missing backend capability, document it as:

    Backend API Gap

with:

- endpoint
- required behavior
- current behavior
- frontend impact
- suggested backend change

Do not silently work around a backend limitation.

---

# 39. IMPLEMENTATION PROCESS

Follow this sequence:

## Phase 1 — Discovery

Inspect:

`ismartaccess-frontend-v2`

and current app.sochiot.

## Phase 2 — API Mapping

Read the current OpenAPI specification.

Create a mapping:

    UI Feature
        ↓
    Current API Endpoint
        ↓
    HTTP Method
        ↓
    Request Type
        ↓
    Response Type

## Phase 3 — Architecture Mapping

Identify reusable current app.sochiot components.

## Phase 4 — Implementation

Implement:

1. User Management
2. Add User
3. Edit User
4. Role Management
5. Add Role
6. Edit Role
7. Permission selector
8. Location selector
9. Delete/deactivate operations where supported
10. Loading/error/empty states

## Phase 5 — Testing

Run all relevant tests.

## Phase 6 — Visual Verification

Compare the resulting UI against the attached screenshots and the reference application.

---

# 40. IMPORTANT: API MAPPING DOCUMENT

Before implementation, create:

`docs/user-role-management-api-mapping.md`

Include:

| Feature | OpenAPI Endpoint | Method | Request | Response | Used By |
|---|---|---|---|---|---|

Include:

### Users

- list
- detail
- create
- update
- status
- role assignment
- location assignment

### Roles

- list
- detail
- create
- update
- delete

### Permissions

- list
- role permission assignment

### Locations

- tree
- organization/company
- tenant
- zone
- area
- site
- asset

Only include endpoints that actually exist.

---

# 41. IMPLEMENTATION REPORT

After implementation, create:

`docs/user-role-management-implementation.md`

Include:

# Overview

# UI Reference Used

# API Endpoints Used

# Components Created

# Components Reused

# User Management

# Role Management

# Permission Management

# Location Assignment

# Authorization

# Validation

# Error Handling

# Performance

# Accessibility

# Testing

# Known Backend API Gaps

# Files Changed

---

# 42. FINAL ACCEPTANCE CRITERIA

The implementation is complete only when:

## User Management

- Users can be listed using the current API.
- Users can be searched/filtered where supported.
- Pagination matches the API.
- Users can be created where supported.
- Users can be edited where supported.
- User status can be changed where supported.
- Roles can be assigned using real API data.
- Locations can be assigned using real API data.
- Validation works.
- API errors are handled.
- Authorization-aware UI works.

## Role Management

- Roles can be listed.
- Role categories/types follow the current API.
- Roles can be created where supported.
- Roles can be edited where supported.
- Roles can be deleted where supported.
- Permissions are loaded from the API.
- Permissions can be selected.
- Existing permissions populate correctly during edit.
- Protected/system roles are handled correctly.

## Architecture

- No old API endpoints copied from ismartaccess.
- No hardcoded user IDs.
- No hardcoded role IDs.
- No hardcoded permission IDs.
- No hardcoded organization IDs.
- No hardcoded location IDs.
- No deprecated Building model dependency.
- Current OpenAPI is the API source of truth.
- Existing app.sochiot architecture is reused.
- Existing design system is reused where possible.

## UX

- UI visually follows ismartaccess-frontend-v2.
- Forms follow the same interaction model.
- Tables follow the same interaction model.
- Role tabs follow the same pattern where supported.
- Location tree follows the same UX pattern.
- Responsive behavior works.
- Loading/empty/error states are implemented.
- Accessibility requirements are satisfied.

---

# 43. IMPORTANT — DO NOT STOP AT VISUAL COPYING

The goal is NOT:

"Make the page look like ismartaccess."

The goal is:

"Bring the proven User/Role Management UX from ismartaccess-frontend-v2 into app.sochiot while using app.sochiot's own architecture, OpenAPI contract, authentication, authorization, location model, components, and APIs."

Therefore:

    ismartaccess-frontend-v2
            ↓
    UI/UX + interaction reference

    Current app.sochiot OpenAPI
            ↓
    API source of truth

    Current app.sochiot frontend
            ↓
    Architecture + components + auth + state + routing

            ↓

    Final User & Role Management

Do not mix these responsibilities.

---

# 44. START NOW

First inspect both projects and the OpenAPI specification.

Do NOT assume the old implementation is correct.

Do NOT invent API endpoints.

Do NOT modify backend code.

Do NOT copy old API services blindly.

Do NOT hardcode permissions.

Do NOT hardcode roles.

Do NOT hardcode locations.

First produce the API mapping and implementation architecture.

Then implement the complete User Management + Role Management functionality using the verified API contract and the visual/interaction language of `ismartaccess-frontend-v2`.

After implementation, run tests and perform a final visual + functional audit.
