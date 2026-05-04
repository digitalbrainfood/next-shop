## 2026-05-04 — Phase 1: Backend hardening

- Cloud functions `createNewVendor` and `createAvatarVendor` now refuse to create a user when the username (email) already exists — no more claim merging.
- New cloud function `convertStudentRole(uid, keepRole)` strips the unwanted claim so a dual-access student can be converted to a single-role account.
- New cloud function `listDualAccessStudents({scope?})` returns students who currently have both `class` and `avatarClass` claims.
- New Firestore rules for `students/{uid}` (teacher-facing notes; additive — no existing data touched).
