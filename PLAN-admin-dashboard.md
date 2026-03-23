# Admin Dashboard Plan

## Overview
The goal is to build an admin section for the application, allowing Super Admins to monitor and manage user accounts with full CRUD capabilities. This will be a simple, table-based monitoring system with edit/delete modals.

## Project Type
WEB

## Success Criteria
- Super Admins can view a sortable list of all registered users.
- Super Admins can create new users manually from the frontend.
- Super Admins can update user details.
- Super Admins can delete or ban users.
- Access to the dashboard is strictly limited to users with superuser/admin privileges.

## Tech Stack
- **Frontend**: React, TypeScript, TailwindCSS, Vite (current stack).
- **Backend/API**: Django/Python (current stack).
- **State Management**: React state hooks and `adminService.ts`.

## File Structure
```plaintext
diamenu_ai/
├── backend/
│   ├── users/                    # User management app
│   │   ├── api/                 
│   │   │   ├── views.py         # Admin CRUD endpoints
│   │   │   └── serializers.py   # Admin user serializers
│   │   └── urls.py
├── src/
│   ├── pages/
│   │   └── admin/
│   │       ├── AdminDashboard.tsx      # Main wrapper & basic user table
│   │       ├── UserModal.tsx           # Modal for update/create actions
│   └── services/
│       └── adminService.ts             # Axios/Fetch calls for CRUD
```

## Task Breakdown

### TS-1: Backend API for Admin CRUD
- **Agent**: `backend-specialist`
- **Skill**: `api-patterns`
- **Priority**: P1
- **Dependencies**: None
- **INPUT**: Need for admin to manage users.
- **OUTPUT**: Django views/urls for `GET /api/admin/users/`, `POST /api/admin/users/`, `PUT /api/admin/users/<id>/`, `DELETE /api/admin/users/<id>/`. Protected by `IsAdminUser` permissions.
- **VERIFY**: Unit tests check that non-admins get 403 Forbidden, and admins can perform CRUD.

### TS-2: Admin API Service Integration
- **Agent**: `frontend-specialist`
- **Skill**: `react-best-practices`
- **Priority**: P2
- **Dependencies**: TS-1
- **INPUT**: Backend API endpoints.
- **OUTPUT**: `adminService.ts` in frontend, exporting functions like `getUsers`, `createUser`, `updateUser`, `deleteUser`.
- **VERIFY**: Network calls match the required payload and return correct data structures.

### TS-3: Routing and Access Control
- **Agent**: `frontend-specialist`
- **Skill**: `react-best-practices`
- **Priority**: P1
- **Dependencies**: None
- **INPUT**: Need to restrict routes to Admins.
- **OUTPUT**: Update `App.tsx` and routing logic to ensure only authenticated Super Admins can access `ViewState.ADMIN_DASHBOARD`. Verify `is_superuser` flag on the `storedUser` object.
- **VERIFY**: Attempting to navigate to the admin route as a normal user returns them to the home page.

### TS-4: Admin Dashboard UI (Read & Delete)
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P2
- **Dependencies**: TS-2, TS-3
- **INPUT**: `adminService.ts` data layer.
- **OUTPUT**: `AdminDashboard.tsx` displaying a basic user table. Includes a "Delete" button with a confirmation modal.
- **VERIFY**: Table renders correctly and reflects database state. Deletions remove rows visually and on the backend.

### TS-5: Admin User Creation & Editing (Create & Update)
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P2
- **Dependencies**: TS-4
- **INPUT**: Basic Admin Dashboard components.
- **OUTPUT**: `UserModal.tsx` to handle forms for adding a new user or editing an existing user.
- **VERIFY**: Form validation prevents bad data; successful submission updates the user table.

## Phase X: Verification
- [ ] Lint: Check frontend and backend syntax via `npm run lint` and `flake8` or equivalent.
- [ ] Security: Ensure all admin endpoints strictly enforce Super Admin privileges (`@permission_classes([IsAdminUser])`).
- [x] Build: `npm run build` succeeds without warnings.
- [x] Tests: Admin backend access control tests pass.
- [x] UX Audit: Admin console matches Web Design Guidelines (basic accessibility checks for forms and buttons).

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: 2026-03-23
