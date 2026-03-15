# Frontend RBAC Implementation

## Purpose

This document describes how the frontend currently consumes the backend RBAC contract.

Companion docs:

- [RBAC_CHEAT_SHEET.md](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-docs/guides/RBAC_CHEAT_SHEET.md)
- [SECURITY_HARDENING_GUIDE.md](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-docs/guides/SECURITY_HARDENING_GUIDE.md)
- [ACTIVITY_LOGS.md](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-docs/guides/ACTIVITY_LOGS.md)

It is the reference for:

- session shape
- `AuthContext` behavior
- route protection
- permission-based rendering
- admin surface gating
- public payload assumptions

## Frontend Authorization Model

The frontend is not the security boundary.

The backend decides access.

The frontend uses RBAC for:

- route gating
- UI visibility
- avoiding obviously invalid submissions
- aligning UX with backend permissions

Every sensitive action must still be enforced on the backend.

## Session Contract

The frontend session comes from `user.me`.

Current session fields:

- `id`
- `email`
- `role`
- `artistName`
- `accountState`
- `permissions`

Consumed in [AuthContext.jsx](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-frontend/src/contexts/AuthContext.jsx).

### Current browser auth behavior

- The frontend uses cookie-backed requests for browser auth.
- [trpc.js](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-frontend/src/lib/trpc.js) sends `credentials: "include"`.
- The frontend does not store a bearer token for normal browser requests.
- `AuthContext` still clears a leftover `localStorage["token"]` defensively.

## Shared RBAC Helpers

Implemented in [rbac.js](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-frontend/src/lib/rbac.js).

Current exports include:

- `ROLES`
- `ACCOUNT_STATES`
- `PERMISSIONS`
- `hasPermission(user, permission)`
- `isStaffRole(role)`
- `isArtistRole(role)`
- `getRoleLabel(role)`
- `canManageAnyArtwork(user)`
- `canViewOwnArtwork(user, ownerId)`
- `canViewArtworkInternals(user, ownerId)`

This file mirrors the backend RBAC constants and must stay aligned with backend changes.

## AuthContext

Implemented in [AuthContext.jsx](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-frontend/src/contexts/AuthContext.jsx).

Current public API:

- `user`
- `role`
- `permissions`
- `accountState`
- `loading`
- `error`
- `can(permission)`
- `login(email, password)`
- `logout()`
- `clearError()`
- `ACCOUNT_STATES`
- `PERMISSIONS`

### Current behavior

Initial load:

- `AuthProvider` calls `user.me`
- if it fails, the user is cleared and stale local token or artwork draft state is cleaned up

Login:

- backend sets the HttpOnly cookie
- frontend stores `res.user` in React state
- React Query state is reset so permission-sensitive UI refreshes immediately

Logout:

- backend cookie is cleared
- frontend clears user state
- stale local token and artwork draft state are removed
- cached queries are invalidated

## Route Protection

Implemented in [ProtectedRoute.jsx](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-frontend/src/components/layout/ProtectedRoute.jsx).

Current supported guard props:

- `allowAccountStates`
- `requireAnyPermission`
- `requireAllPermissions`

Current route protection in [App.jsx](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-frontend/src/App.jsx):

`/add-artwork`

- requires `ACTIVE`
- requires `artwork.create:own` or `artwork.create:any`

`/edit-artwork/:id`

- requires `ACTIVE`
- requires `artwork.update:own` or `artwork.update:any`

`/admin`

- requires `ACTIVE`
- requires at least one of:
  - `artist.approve`
  - `artist.quota.manage`
  - `user.state.manage`
  - `user.delete:any`
  - `artwork.feature.manage`
  - `carousel.manage`
  - `audit.read:any`

`/change-password`

- requires `ACTIVE`

`/activity-history`

- requires `ACTIVE`

## Current Admin UI Contract

### Admin navbar entry

The navbar shows `Admin` when the user has at least one of:

- `artist.approve`
- `artist.quota.manage`
- `user.state.manage`
- `user.delete:any`
- `artwork.feature.manage`
- `carousel.manage`
- `audit.read:any`

### Admin top-level tabs

Implemented in [AdminManagement.jsx](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-frontend/src/pages/admin/AdminManagement.jsx).

Artists tab:

- visible for `artist.approve`, `artist.quota.manage`, `user.state.manage`, or `user.delete:any`

Carousel tab:

- visible for `carousel.manage`

Featured tab:

- visible for `artwork.feature.manage`

Activity Logs tab:

- visible for `audit.read:any`

### Artists sub-tabs and buttons

Implemented in [ArtistsManagement.jsx](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-frontend/src/pages/admin/ArtistsManagement.jsx) and [ArtistApprovals.jsx](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-frontend/src/pages/admin/ArtistApprovals.jsx).

Approvals sub-tab:

- visible for `artist.approve`, `user.state.manage`, or `user.delete:any`

Quota sub-tab:

- visible for `artist.quota.manage`

Approve button:

- requires `artist.approve`

Activate or deactivate button:

- requires `user.state.manage`

Delete button:

- requires `user.delete:any`
- only shown when the artist has zero artworks

## Artwork UI Contract

### Artwork form and edit flow

Key files:

- [ArtworkForm.jsx](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-frontend/src/features/artwork-form/ArtworkForm.jsx)
- [AddArtwork.jsx](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-frontend/src/pages/AddArtwork.jsx)
- [EditArtwork.jsx](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-frontend/src/pages/EditArtwork.jsx)

Current rules:

- artist-selection UI is driven by create-any vs create-own permissions
- admin-only artwork fields are permission-gated
- `EditArtwork` only sends:
  - `featured` and `sold` when the user has `artwork.feature.manage`
  - `status` and `expiresAt` when the user has `artwork.status.manage`

This keeps the frontend submission contract aligned with backend field enforcement.

### Artwork internals

Status badges and internal artwork details should use shared helpers instead of raw role checks:

- `canManageAnyArtwork(...)`
- `canViewArtworkInternals(...)`

## Public Payload Assumptions

### Public artist search

Public artist search may return:

- `id`
- `artistName`

Staff results may additionally include:

- `email`

Do not assume `email` exists in ordinary artist or public sessions.

### Gallery artist filter labels

The gallery's auto-applied own-artist filter now uses the same public display format as normal artist filtering:

- artist name only

This keeps the active filter label consistent across login, refresh, and manual filter selection.

### Public artwork detail

Public artwork image payloads are sanitized:

- image `id` is not guaranteed to exist
- UI keys must fall back to `cloudinary_public_id`, `url`, or index where needed

## Activity Log UI Contract

### Artist history

Implemented in [ActivityHistory.jsx](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-frontend/src/pages/user/ActivityHistory.jsx).

Current behavior:

- page is protected by `ACTIVE`
- data comes from `activityLog.getMyActivityLogs`
- action filter options are restricted to the current artist-visible action set
- artist cards do not expose raw JSON controls

### Admin audit view

Implemented in [ActivityLogs.jsx](d:/1.WORK/PROJECTS/REACT/art-showcase/art-showcase-frontend/src/pages/admin/ActivityLogs.jsx).

Current behavior:

- requires `audit.read:any`
- uses:
  - `activityLog.getAdminActivityLogs`
  - `activityLog.getActivityLogStats`
- renders a custom admin table, not `ActivityLogEntry`
- raw JSON toggle is available in the expanded admin row

## Anti-Patterns To Avoid

- hardcoding role checks when a permission already expresses the rule
- assuming public payloads include staff-only fields
- sending admin-only artwork fields from artist flows
- treating frontend hiding as real security
- reintroducing browser bearer-token storage without a backend requirement
- assuming gallery artist labels can safely include email in ordinary artist sessions

## Verification Status

Verified in the current repository state:

- frontend builds successfully with `npm run build`
- `AuthContext` is cookie-first and permission-first
- `/admin` route and navbar gating match the current admin permission family
- artist-management tabs and buttons are individually permission-scoped
- edit-artwork payloads no longer send forbidden admin-only fields for artists
- gallery own-artist filter labels are consistent across auto-apply and normal filtering
