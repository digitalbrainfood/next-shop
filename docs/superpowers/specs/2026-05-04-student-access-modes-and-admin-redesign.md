# Student Access Modes & Admin Dashboard Redesign — Design Spec

**Date:** 2026-05-04
**Status:** Draft, awaiting user sign-off
**Author:** ShopNext team

## 1. Summary

Two related changes:

1. **Access mode enforcement.** Each student account is locked to exactly one access mode — **Products** *or* **Talent (Avatars)** — never both. The current backend allows a student account to accumulate both `class` and `avatarClass` custom claims; this spec closes that loophole and provides a one-time cleanup path for any existing dual-access accounts.

2. **Admin dashboard redesign.** The teacher-facing admin (currently a tab buried inside `src/app/page.js`) is promoted to its own route `/dashboard`, and the existing super-admin route `/admin` is refreshed. Both share a single `AdminShell` layout for visual cohesion. The student-creation flow is reworked into a 3-step wizard with a polished credential-handoff step.

The visual direction is **Calm Clarity** — white cards on light gray, blue accent, generous whitespace, Linear/Notion-style restraint. It matches the existing `/admin` and `/settings` aesthetic.

## 2. Goals

- A student account can have access to Products **xor** Talent — system-enforced.
- Existing dual-access accounts are surfaced and can be resolved by the teacher (keep one role, or split into two accounts).
- Teachers get a dedicated dashboard at `/dashboard` that feels like a real product, separate from the storefront.
- The `Add Student` flow makes the access-mode choice the *first and most prominent* decision.
- Credential handoff is dignified: copy, download as PDF, or email — not "write it down before this disappears."
- `src/app/page.js` shrinks substantially as the embedded admin is lifted out.

## 3. Non-Goals

- No change to the storefront UI for students/viewers.
- No change to product/talent content schemas.
- No change to Stripe billing, school registration, or custom-domain features.
- No new role types beyond the existing `superAdmin`, `class`, `avatarClass`, `viewer`.
- No mobile-app surface — desktop-first responsive web only.

## 4. Background — current state

- **Storefront + admin in one file.** `src/app/page.js` (≈2300 lines) holds the storefront, login, vendor area, and a `SuperAdminDashboard` component (lines ≈2066–2197) that the teacher uses to manage classes, vendors, and content.
- **Two cloud functions create student accounts:** `createNewVendor` sets a `class` claim; `createAvatarVendor` sets `avatarClass`. The avatar function has explicit logic at [functions/index.js:147-153](functions/index.js:147) that *merges* `avatarClass` onto an existing user's claims rather than rejecting — this is the dual-access loophole.
- **Custom-claims model:**
  - `superAdmin: true` — full access
  - `class: <className>` — edits products in that class
  - `avatarClass: <className>` — edits avatars in that class
  - `viewer: true` — read-only across all classes
- **Two admin surfaces today:**
  - `src/app/admin/page.js` — super-admin only; manages all schools (the customer table).
  - In-page admin tab — teacher's per-school admin (vendor/viewer/class management).

## 5. Architecture

### 5.1 New routing layout

```
src/app/
  page.js                     ← storefront only (admin tab REMOVED)
  dashboard/                  ← NEW — teacher's admin home
    layout.js                 ← uses AdminShell
    page.js                   ← Overview (stats, needs-attention, recent activity)
    students/page.js          ← Student roster + Add Student wizard
    classes/page.js           ← Class management (replaces ManageClassesModal)
    content/page.js           ← Drag-reorder products & talent
  admin/
    layout.js                 ← uses AdminShell (cohesion with /dashboard)
    page.js                   ← Polished super-admin (existing, redesigned)
```

**Auth gating** (client-side `useEffect` in each layout, mirroring existing pattern in `src/app/admin/page.js:140-158`):
- `/dashboard/**` — requires `class` OR `avatarClass` claim, OR `superAdmin`.
- `/admin/**` — requires `superAdmin` claim.
- Storefront `page.js` — public; the in-page `SuperAdminDashboard` is deleted. Super admins navigate to `/admin`; teachers navigate to `/dashboard`. The Header's "Dashboard" button routes based on role.

### 5.2 Shared building block — `AdminShell`

`src/components/admin/AdminShell.jsx` provides:
- Left sidebar (240px, sticky, collapses to icons under 768px)
- Top bar with school logo/name, user menu, role badge
- Slot for page header (title + optional CTA)
- Slot for main content
- Optional right rail slot (used on Overview)

Both `/dashboard/layout.js` and `/admin/layout.js` import `AdminShell`. The sidebar items are different per surface (teacher vs super-admin), but every other affordance is shared.

### 5.3 File-size discipline

Each new page file targets <400 lines. Reusable bits live in `src/components/admin/` (shell, wizard, drawers, stat cards, sidebar nav, etc.).

## 6. UI components

### 6.1 Teacher Dashboard `/dashboard` — Overview page

- **Greeting + primary CTA:** `Good morning, Prof. Chen.` with `[+ Add Student]` button (top-right).
- **Stat cards row** (4 cards): Students · Active Classes · Products · Talent. Each shows count + small trend indicator ("+3 this week"). Reuses the `StatCard` pattern at [src/app/admin/page.js:20-31](src/app/admin/page.js:20).
- **Needs Attention panel** — only renders when there's something:
  - "**N students have access to both Products and Talent.** Resolve →"
  - "**N students haven't logged in since you created them.** Resend credentials →"
  - When empty, the panel is hidden entirely.
- **Two-column section:**
  - Left (2/3): Recent students table (last 8) — name, role pill, class, last active.
  - Right (1/3): Class breakdown — per-class student count + role split.
- **Activity feed** (bottom): last 10 events ("kara created Air Jordan ad", "alex added to morning-class").

### 6.2 Add Student wizard

Opens as a centered modal overlay from `+ Add Student`. Three steps:

**Step 1 — Pick role.** Two large clickable cards: Product Vendor / Talent Vendor. Each card shows an icon, title, one-line description, and "Access: …" footer. **Required choice; no default.** This is the new enforcement made visible.

**Step 2 — Class & credentials.**
- **Class dropdown** scoped to the role chosen in Step 1 (`classes/` for products, `avatar-classes/` for talent). Includes inline `+ Create new class` option that creates the class doc on the fly.
- **Username** — text input, 3+ chars, with live availability check via `listAllUsers` cloud function (debounced).
- **Password** — pre-filled with a friendly auto-generated string (e.g. `swift-otter-42`). Editable. `🎲 Regenerate` button. 6+ char min.
- **Notes (optional)** — small text field, persisted to a new `students/{uid}` Firestore doc for teacher reference.

**Step 3 — Credential handoff.**
```
✅ Student created!

  Username:  alex      [📋 copy]
  Password:  swift-otter-42  [📋 copy]
  Login URL: morning-class.shopnext.app  [📋 copy]

  [📋 Copy all]  [📥 Download PDF handout]  [✉ Email to me]  [Done]
```

The PDF handout is generated client-side (using `jsPDF` or similar — to be confirmed during implementation; spec leaves the library choice to the plan). It contains: school name, student username, password, login URL, and a "What's next" note. Single page, printable.

### 6.3 Dual-access cleanup drawer

Triggered from the Needs Attention panel link. Right-side slide-in drawer that auto-advances through the queue:

- Shows: student username, creation date, "Currently has: Products + Talent."
- Three options:
  - **Keep Products only** (drop `avatarClass`)
  - **Keep Talent only** (drop `class`)
  - **Split into 2 accounts** — current account becomes Products; a new Talent account is created with a new username (input field) and auto-generated password. The new account's credentials are shown via the same Step-3 credential handoff component.
- Buttons: `[Skip for now]  [Apply →]`.
- After the last item resolves: "✅ All clean."

### 6.4 `/dashboard/students` — full roster

- Search bar (filters by name / username).
- Filter chips: role (All / Products / Talent), class (All / specific class).
- Table: name, role pill, class, last active, `⋯` menu (reset password, edit notes, delete).
- Top-right `+ Add Student` (same wizard).
- Empty state: "No students yet. + Add your first."

### 6.5 `/dashboard/classes` — class management

- Two collapsible sections: **Product Classes** and **Talent Classes**.
- Each class card shows: name, student count, content count, edit/rename, delete.
- `+ New class` inline. Replaces today's `ManageClassesModal`.

### 6.6 `/dashboard/content` — drag-reorder & manage

- Top tabs: `Products | Talent` (Talent tab hidden if school's `platforms` array doesn't include `'avatars'`).
- Class dropdown to scope the list.
- Drag-to-reorder card list; edit/delete per item. Reuses existing handlers from `SuperAdminDashboard` in `page.js` (lines ≈1932–1941).

### 6.7 Super-admin `/admin` polish

- Keep all current functionality and the customers table.
- Wrap in `AdminShell` so it visually matches `/dashboard`.
- Add a 5th stat card: **"Dual-access students across all schools"** (count, with link to a per-school breakdown drawer).

## 7. Backend changes — `functions/index.js`

### 7.1 Existing functions, modified

- **`createNewVendor`** — before `authService.createUser`, check `getUserByEmail`. If a user exists, throw `already-exists` with message *"A user with this username already exists. Pick a different username, or use Convert Role on the existing student."* No claim merging.
- **`createAvatarVendor`** — same modification. Remove the merge branch at lines 147-153. Throw `already-exists` if the email is taken.

### 7.2 New functions

- **`convertStudentRole({ uid, keepRole })`** — `keepRole` is `'class'` or `'avatarClass'`. Strips the other claim. Caller must be `superAdmin` or hold the matching `class`/`avatarClass` claim for the affected student. Returns the updated claims.

- **`listDualAccessStudents({ scope? })`** — returns the list of users that have both `class` and `avatarClass` set. Optional `scope` filter restricts to a single class name (used by the teacher dashboard). Super-admin sees everything; teachers see only students whose class matches one of their own claims.

### 7.3 Existing functions, untouched

`listAllUsers`, `createNewViewer`, `deleteUser` — no changes needed.

## 8. Data model

- **Custom claims:** unchanged shape; the only change is that `class` and `avatarClass` are now mutually exclusive on a single account, enforced server-side.
- **New Firestore collection: `students/{uid}`** — `{ notes, createdAt, createdBy, lastActiveAt? }`. Optional teacher-facing notes and metadata. Read/write rules: super-admin always; teacher only for students whose `class`/`avatarClass` matches one of the teacher's claims.
- **Existing collections** — `classes/`, `avatar-classes/`, `products/`, `avatars/`, `schools/` — unchanged.
- **`firestore.rules`** — add the new `students` collection rules.

## 9. Migration plan

The work lands in this order:

1. **Backend hardening (no UI change yet).** Modify `createNewVendor` and `createAvatarVendor` to refuse on existing email. Add `convertStudentRole` and `listDualAccessStudents`. Deploy.
2. **Build `AdminShell` and `/dashboard` Overview.** Behind the existing super-admin gate, no new routes exposed yet to non-admins.
3. **Build the Add Student wizard** as the canonical creation path. The old in-page form continues to work (still calls the now-hardened cloud functions) until step 5.
4. **Build remaining `/dashboard` pages** (Students, Classes, Content) and the dual-access cleanup drawer.
5. **Cut over.** The Header's "Dashboard" button now routes to `/dashboard` (teachers) or `/admin` (super-admins). The in-page `SuperAdminDashboard`, `DeleteUsersModal`, `ManageClassesModal`, and the admin-tab logic are deleted from `src/app/page.js`.
6. **Polish `/admin`.** Wrap in `AdminShell`, add the dual-access stat card.

No data migration is required — existing student docs continue to work as-is. Dual-access accounts are simply surfaced for cleanup; nothing is auto-changed.

## 10. Testing plan

- **Unit:** `convertStudentRole` happy path, permission-denied, invalid `keepRole`. `listDualAccessStudents` filtering by scope. Backend rejection of duplicate-email creation.
- **Component:** Add Student wizard step transitions, role-required validation, password generator, credential-copy interactions.
- **Manual flows (golden paths):**
  1. Teacher creates a Product Vendor end-to-end — student appears in roster, can sign in, edits products.
  2. Teacher creates a Talent Vendor — analogous.
  3. Teacher tries to create a student with an already-used username — sees a clear error, no claim merge happens.
  4. Teacher resolves a dual-access student via "Keep Products" — `avatarClass` claim is gone after token refresh.
  5. Teacher splits a dual-access student — a new Talent account exists, original account retains Products only.
  6. Super admin opens `/admin`, sees the dual-access stat, drills into a school's affected students.
- **Regression manual check:** existing storefront, vendor area, settings, Stripe registration flow all unchanged.

## 11. Open questions / risks

- **PDF library choice.** `jsPDF` vs `pdf-lib` vs server-rendered PDF. To be decided in the implementation plan.
- **Live username availability check** — `listAllUsers` returns *all* users, which is fine while user counts are small but won't scale. For the v1 spec this is acceptable; a `checkUsernameAvailable` callable can replace it later.
- **Token refresh after `convertStudentRole`.** The student needs a token refresh for the new claims to take effect. The teacher-facing UX shows a tooltip: "Student must sign out and sign back in to see the change." No client push needed.

## 12. Out of scope (future work)

- CSV import / bulk student creation.
- Class roster export (download all credentials at once).
- Per-student activity timeline.
- Email-based credential delivery to students directly (currently teacher-only).
