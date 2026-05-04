## 2026-05-04 — Phase 1: Backend hardening

- Cloud functions `createNewVendor` and `createAvatarVendor` now refuse to create a user when the username (email) already exists — no more claim merging.
- New cloud function `convertStudentRole(uid, keepRole)` strips the unwanted claim so a dual-access student can be converted to a single-role account.
- New cloud function `listDualAccessStudents({scope?})` returns students who currently have both `class` and `avatarClass` claims.
- New Firestore rules for `students/{uid}` (teacher-facing notes; additive — no existing data touched).

## 2026-05-04 — Phase 8 complete: admin redesign shipped

- Teacher admin lifted to `/dashboard` with sidebar, overview, stats, students roster, classes manager, and content reorder.
- `/admin` super-admin polished and adopts the same shell.
- 3-step Add Student wizard with role gate, class picker, friendly password generator, and PDF credential handout.
- Dual-access cleanup drawer wired up; one-click resolution per student.
- `src/app/page.js` shrunk substantially (admin tab and 2 modals removed).
- Cloud function tests: 17 passing in `functions/test/cloud-functions.test.js`.

## 2026-05-04 — Phase 8 fix-ups (post-review)

- `/dashboard` now requires `superAdmin` claim (matches the production model where each professor is provisioned as super admin).
- `firestore.rules` `students/{uid}` create/update tightened: caller must own the matching `class`/`avatarClass` of the doc payload.
- `dashboardRouteFor` simplified — it now only returns `/admin` for super admins.
