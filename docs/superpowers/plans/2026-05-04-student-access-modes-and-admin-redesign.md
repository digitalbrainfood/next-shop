# Student Access Modes & Admin Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock each student account to either Products or Talent (system-enforced), and ship a redesigned, route-based admin dashboard at `/dashboard` (teacher) and `/admin` (super admin) sharing one cohesive shell.

**Architecture:** Backend cloud functions are hardened to refuse duplicate-email creation and gain a `convertStudentRole` and `listDualAccessStudents`. UI is lifted out of the monolithic `src/app/page.js` into route-based pages backed by a shared `AdminShell` (sidebar + topbar). Add Student becomes a 3-step modal wizard whose first step *is* the access-mode choice. A right-side drawer guides the teacher through cleanup of any pre-existing dual-access accounts.

**Tech Stack:** Next.js 16 App Router, React 19, Firebase (Auth + Firestore + Functions + Admin SDK), Tailwind CSS v4, Lucide icons, `firebase-functions-test` for cloud-function unit tests, `jspdf` for credential handouts.

**Spec:** [docs/superpowers/specs/2026-05-04-student-access-modes-and-admin-redesign.md](../specs/2026-05-04-student-access-modes-and-admin-redesign.md)

---

## File structure

### New files

```
functions/jest.config.js
functions/test/cloud-functions.test.js

src/app/dashboard/layout.js
src/app/dashboard/page.js                                 // Overview
src/app/dashboard/students/page.js
src/app/dashboard/classes/page.js
src/app/dashboard/content/page.js
src/app/admin/layout.js                                   // wraps existing /admin in shell

src/components/admin/AdminShell.jsx
src/components/admin/AdminSidebar.jsx
src/components/admin/AdminTopbar.jsx
src/components/admin/StatCard.jsx
src/components/admin/RolePill.jsx
src/components/admin/NeedsAttention.jsx
src/components/admin/RecentStudentsTable.jsx
src/components/admin/ClassBreakdown.jsx
src/components/admin/ActivityFeed.jsx

src/components/admin/wizard/AddStudentWizard.jsx
src/components/admin/wizard/StepRolePicker.jsx
src/components/admin/wizard/StepClassAndCreds.jsx
src/components/admin/wizard/StepCredentialHandoff.jsx
src/components/admin/wizard/passwordGenerator.js
src/components/admin/wizard/credentialPdf.js

src/components/admin/cleanup/DualAccessDrawer.jsx
src/components/admin/cleanup/ResolveOptions.jsx

src/lib/admin/useStudents.js
src/lib/admin/useClasses.js
src/lib/admin/useDualAccessStudents.js
src/lib/admin/useActivityFeed.js
src/lib/auth/useAdminAuth.js
src/lib/auth/dashboardRoute.js
```

### Modified files

```
.gitignore                          // already done — backups/ ignored
package.json                        // add jspdf dependency
functions/package.json              // add jest dev dep + test script
functions/index.js                  // harden + add 2 functions
firestore.rules                     // add students/{uid} rules
src/app/admin/page.js               // adopt AdminShell, add dual-access stat
src/app/page.js                     // DELETE SuperAdminDashboard, modals, vendor forms
src/components/Header.js            // route Dashboard button by role
```

---

## Phase 1 — Backend hardening (deployable on its own)

This phase produces a self-contained shippable change: dual-access creation is blocked at the source, and new functions exist for the UI to call later.

### Task 1: Set up jest in `functions/`

**Files:**
- Modify: `functions/package.json`
- Create: `functions/jest.config.js`

- [ ] **Step 1: Update `functions/package.json` to add jest**

Replace the contents of `functions/package.json` with:

```json
{
  "name": "functions",
  "description": "Cloud Functions for Firebase",
  "scripts": {
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log",
    "test": "jest"
  },
  "engines": {
    "node": "22"
  },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^12.6.0",
    "firebase-functions": "^6.0.1"
  },
  "devDependencies": {
    "firebase-functions-test": "^3.1.0",
    "jest": "^29.7.0"
  },
  "private": true
}
```

- [ ] **Step 2: Create `functions/jest.config.js`**

```js
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/test/**/*.test.js'],
    verbose: true,
};
```

- [ ] **Step 3: Install**

Run from repo root:
```bash
cd functions && npm install
```
Expected: jest is added to `functions/node_modules`. No errors.

- [ ] **Step 4: Commit**

```bash
git add functions/package.json functions/package-lock.json functions/jest.config.js
git commit -m "test: add jest to cloud functions"
```

---

### Task 2: TDD — `createNewVendor` rejects existing email

**Files:**
- Create: `functions/test/cloud-functions.test.js`
- Modify: `functions/index.js`

- [ ] **Step 1: Write the failing test**

Create `functions/test/cloud-functions.test.js`:

```js
const test = require('firebase-functions-test')();

// Mock the firebase-admin auth module before requiring our functions
const mockGetUserByEmail = jest.fn();
const mockCreateUser = jest.fn();
const mockSetCustomUserClaims = jest.fn();
const mockGetUser = jest.fn();
const mockListUsers = jest.fn();
const mockDeleteUser = jest.fn();

jest.mock('firebase-admin/auth', () => ({
    getAuth: () => ({
        getUserByEmail: mockGetUserByEmail,
        createUser: mockCreateUser,
        setCustomUserClaims: mockSetCustomUserClaims,
        getUser: mockGetUser,
        listUsers: mockListUsers,
        deleteUser: mockDeleteUser,
    }),
}));

jest.mock('firebase-admin/app', () => ({ initializeApp: jest.fn() }));

const myFunctions = require('../index');

const SUPER_ADMIN_UID = 'RnBej9HSStVJXA0rtIB02W0R1yv2';

beforeEach(() => {
    jest.clearAllMocks();
});

afterAll(() => {
    test.cleanup();
});

describe('createNewVendor', () => {
    test('rejects when email already exists', async () => {
        mockGetUserByEmail.mockResolvedValue({ uid: 'existing-uid' });
        const wrapped = test.wrap(myFunctions.createNewVendor);

        await expect(wrapped({
            data: { username: 'alex', password: 'pw1234', class: 'morning' },
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        })).rejects.toThrow(/already exists/i);

        expect(mockCreateUser).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd functions && npm test
```
Expected: FAIL — current implementation does not call `getUserByEmail` first, so it falls through to `createUser` which is not mocked to throw.

- [ ] **Step 3: Modify `functions/index.js` `createNewVendor` to refuse duplicates**

In `functions/index.js`, replace the body of the `try { ... }` block in `createNewVendor` (currently around lines 61-97) with:

```js
    try {
      const authService = getAuth();
      const email = `${username.trim()}@shopnext.dev`;

      // Refuse if a user with this email already exists. We never merge claims.
      try {
        const existing = await authService.getUserByEmail(email);
        if (existing) {
          throw new HttpsError(
            "already-exists",
            "A user with this username already exists. Pick a different username, or use Convert Role on the existing student."
          );
        }
      } catch (lookupErr) {
        if (lookupErr instanceof HttpsError) throw lookupErr;
        if (lookupErr.code !== 'auth/user-not-found') throw lookupErr;
        // user-not-found is the happy path — fall through to creation
      }

      const userRecord = await authService.createUser({
        email,
        password: password,
        displayName: username.trim(),
      });

      await authService.setCustomUserClaims(userRecord.uid, {
        class: className.trim().toLowerCase(),
      });

      console.log("Successfully created new vendor:", userRecord.uid);

      return {
        success: true,
        result: `Successfully created user ${username} in class ${className}.`,
        uid: userRecord.uid,
      };
    } catch (error) {
      console.error("Error creating new user:", error);
      if (error instanceof HttpsError) throw error;
      if (error.code === 'auth/email-already-exists') {
        throw new HttpsError("already-exists", "A user with this username already exists.");
      } else if (error.code === 'auth/invalid-email') {
        throw new HttpsError("invalid-argument", "Invalid email format generated from username.");
      } else if (error.code === 'auth/weak-password') {
        throw new HttpsError("invalid-argument", "Password is too weak.");
      }
      throw new HttpsError("internal", error.message);
    }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd functions && npm test
```
Expected: PASS.

- [ ] **Step 5: Add the happy-path test**

Append to the `describe('createNewVendor', ...)` block:

```js
    test('creates user when email is free', async () => {
        const notFound = Object.assign(new Error('not found'), { code: 'auth/user-not-found' });
        mockGetUserByEmail.mockRejectedValue(notFound);
        mockCreateUser.mockResolvedValue({ uid: 'new-uid' });
        mockSetCustomUserClaims.mockResolvedValue();

        const wrapped = test.wrap(myFunctions.createNewVendor);
        const result = await wrapped({
            data: { username: 'alex', password: 'pw1234', class: 'morning' },
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        });

        expect(result.success).toBe(true);
        expect(mockCreateUser).toHaveBeenCalledWith({
            email: 'alex@shopnext.dev',
            password: 'pw1234',
            displayName: 'alex',
        });
        expect(mockSetCustomUserClaims).toHaveBeenCalledWith('new-uid', { class: 'morning' });
    });
```

- [ ] **Step 6: Run all tests**

```bash
cd functions && npm test
```
Expected: 2 passing.

- [ ] **Step 7: Commit**

```bash
git add functions/test/cloud-functions.test.js functions/index.js
git commit -m "feat(functions): createNewVendor rejects duplicate usernames"
```

---

### Task 3: TDD — `createAvatarVendor` removes claim-merge loophole

**Files:**
- Modify: `functions/test/cloud-functions.test.js`
- Modify: `functions/index.js`

- [ ] **Step 1: Write the failing test**

Append to `functions/test/cloud-functions.test.js`:

```js
describe('createAvatarVendor', () => {
    test('rejects when email already exists (no claim merging)', async () => {
        mockGetUserByEmail.mockResolvedValue({
            uid: 'existing-uid',
            customClaims: { class: 'morning' },
        });
        const wrapped = test.wrap(myFunctions.createAvatarVendor);

        await expect(wrapped({
            data: { username: 'alex', password: 'pw1234', avatarClass: 'morning' },
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        })).rejects.toThrow(/already exists/i);

        expect(mockCreateUser).not.toHaveBeenCalled();
        // Critical: must NOT merge claims onto existing user
        expect(mockSetCustomUserClaims).not.toHaveBeenCalled();
    });

    test('creates talent user when email is free', async () => {
        const notFound = Object.assign(new Error('not found'), { code: 'auth/user-not-found' });
        mockGetUserByEmail.mockRejectedValue(notFound);
        mockCreateUser.mockResolvedValue({ uid: 'new-uid' });
        mockSetCustomUserClaims.mockResolvedValue();

        const wrapped = test.wrap(myFunctions.createAvatarVendor);
        const result = await wrapped({
            data: { username: 'theo', password: 'pw1234', avatarClass: 'evening' },
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        });

        expect(result.success).toBe(true);
        expect(mockSetCustomUserClaims).toHaveBeenCalledWith('new-uid', { avatarClass: 'evening' });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd functions && npm test
```
Expected: the "rejects when email already exists" test FAILS — current code merges claims.

- [ ] **Step 3: Replace `createAvatarVendor` body**

In `functions/index.js`, replace the entire `try { ... }` block of `createAvatarVendor` (currently around lines 141-189) with:

```js
    try {
      const authService = getAuth();
      const email = `${username.trim()}@shopnext.dev`;

      try {
        const existing = await authService.getUserByEmail(email);
        if (existing) {
          throw new HttpsError(
            "already-exists",
            "A user with this username already exists. Pick a different username, or use Convert Role on the existing student."
          );
        }
      } catch (lookupErr) {
        if (lookupErr instanceof HttpsError) throw lookupErr;
        if (lookupErr.code !== 'auth/user-not-found') throw lookupErr;
      }

      const userRecord = await authService.createUser({
        email,
        password: password,
        displayName: username.trim(),
      });

      await authService.setCustomUserClaims(userRecord.uid, {
        avatarClass: avatarClass.trim().toLowerCase(),
      });

      console.log("Successfully created avatar vendor:", userRecord.uid);

      return {
        success: true,
        result: `Successfully created ${username} in avatar class ${avatarClass}.`,
        uid: userRecord.uid,
      };
    } catch (error) {
      console.error("Error creating avatar vendor:", error);
      if (error instanceof HttpsError) throw error;
      if (error.code === 'auth/email-already-exists') {
        throw new HttpsError("already-exists", "A user with this username already exists.");
      } else if (error.code === 'auth/invalid-email') {
        throw new HttpsError("invalid-argument", "Invalid email format generated from username.");
      } else if (error.code === 'auth/weak-password') {
        throw new HttpsError("invalid-argument", "Password is too weak.");
      }
      throw new HttpsError("internal", error.message);
    }
```

- [ ] **Step 4: Run all tests**

```bash
cd functions && npm test
```
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add functions/test/cloud-functions.test.js functions/index.js
git commit -m "feat(functions): createAvatarVendor stops merging claims on existing email"
```

---

### Task 4: TDD — new `convertStudentRole` function

**Files:**
- Modify: `functions/test/cloud-functions.test.js`
- Modify: `functions/index.js`

- [ ] **Step 1: Write the failing tests**

Append to `functions/test/cloud-functions.test.js`:

```js
describe('convertStudentRole', () => {
    test('keepRole=class strips avatarClass', async () => {
        mockGetUser.mockResolvedValue({
            uid: 'target-uid',
            customClaims: { class: 'morning', avatarClass: 'morning' },
        });
        mockSetCustomUserClaims.mockResolvedValue();

        const wrapped = test.wrap(myFunctions.convertStudentRole);
        const result = await wrapped({
            data: { uid: 'target-uid', keepRole: 'class' },
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        });

        expect(result.success).toBe(true);
        expect(mockSetCustomUserClaims).toHaveBeenCalledWith('target-uid', { class: 'morning' });
    });

    test('keepRole=avatarClass strips class', async () => {
        mockGetUser.mockResolvedValue({
            uid: 'target-uid',
            customClaims: { class: 'morning', avatarClass: 'morning' },
        });
        mockSetCustomUserClaims.mockResolvedValue();

        const wrapped = test.wrap(myFunctions.convertStudentRole);
        await wrapped({
            data: { uid: 'target-uid', keepRole: 'avatarClass' },
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        });
        expect(mockSetCustomUserClaims).toHaveBeenCalledWith('target-uid', { avatarClass: 'morning' });
    });

    test('rejects invalid keepRole', async () => {
        const wrapped = test.wrap(myFunctions.convertStudentRole);
        await expect(wrapped({
            data: { uid: 'target-uid', keepRole: 'banana' },
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        })).rejects.toThrow(/keepRole/i);
    });

    test('rejects unauthenticated caller', async () => {
        const wrapped = test.wrap(myFunctions.convertStudentRole);
        await expect(wrapped({
            data: { uid: 'target-uid', keepRole: 'class' },
        })).rejects.toThrow(/logged in/i);
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd functions && npm test
```
Expected: 4 new failing tests — `convertStudentRole` is undefined.

- [ ] **Step 3: Add `convertStudentRole` to `functions/index.js`**

Append to `functions/index.js` (before the final closing of the file):

```js
/**
 * Strips one of (class | avatarClass) from a student so they only retain
 * the kept role. Caller must be super admin OR a teacher who owns one of
 * the student's current claims.
 */
exports.convertStudentRole = onCall(
  { timeoutSeconds: 60, memory: "256MiB", minInstances: 0, maxInstances: 10 },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError("unauthenticated", "You must be logged in to convert a student.");
    }

    const { uid, keepRole } = data || {};
    if (!uid || (keepRole !== 'class' && keepRole !== 'avatarClass')) {
      throw new HttpsError("invalid-argument", "Provide uid and keepRole ('class' or 'avatarClass').");
    }

    const authService = getAuth();
    const target = await authService.getUser(uid);
    const existing = target.customClaims || {};

    const isSuperAdmin = auth.token?.superAdmin === true;
    const isInitialAdmin = auth.uid === "RnBej9HSStVJXA0rtIB02W0R1yv2";
    const callerOwnsClass = auth.token?.class && auth.token.class === existing.class;
    const callerOwnsAvatar = auth.token?.avatarClass && auth.token.avatarClass === existing.avatarClass;

    if (!isSuperAdmin && !isInitialAdmin && !callerOwnsClass && !callerOwnsAvatar) {
      throw new HttpsError("permission-denied", "You do not have permission to convert this student.");
    }

    // Build the new claims object — keep only the chosen role + preserve viewer flag if any.
    const next = {};
    if (keepRole === 'class' && existing.class) next.class = existing.class;
    if (keepRole === 'avatarClass' && existing.avatarClass) next.avatarClass = existing.avatarClass;
    if (existing.viewer) next.viewer = existing.viewer;

    await authService.setCustomUserClaims(uid, next);

    return {
      success: true,
      uid,
      claims: next,
      message: "Student converted. They must sign out and sign back in for the change to take effect.",
    };
  }
);
```

- [ ] **Step 4: Run all tests**

```bash
cd functions && npm test
```
Expected: 8 passing.

- [ ] **Step 5: Commit**

```bash
git add functions/test/cloud-functions.test.js functions/index.js
git commit -m "feat(functions): add convertStudentRole"
```

---

### Task 5: TDD — new `listDualAccessStudents` function

**Files:**
- Modify: `functions/test/cloud-functions.test.js`
- Modify: `functions/index.js`

- [ ] **Step 1: Write the failing tests**

Append to `functions/test/cloud-functions.test.js`:

```js
describe('listDualAccessStudents', () => {
    const buildUsers = () => ({
        users: [
            { uid: 'a', email: 'a@x', displayName: 'a', customClaims: { class: 'morning', avatarClass: 'morning' } },
            { uid: 'b', email: 'b@x', displayName: 'b', customClaims: { class: 'morning' } },
            { uid: 'c', email: 'c@x', displayName: 'c', customClaims: { avatarClass: 'evening' } },
            { uid: 'd', email: 'd@x', displayName: 'd', customClaims: { class: 'evening', avatarClass: 'evening' } },
            { uid: 'e', email: 'e@x', displayName: 'e', customClaims: {} },
        ],
    });

    test('super admin sees all dual-access students', async () => {
        mockListUsers.mockResolvedValue(buildUsers());
        const wrapped = test.wrap(myFunctions.listDualAccessStudents);
        const result = await wrapped({
            data: {},
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        });
        expect(result.users.map(u => u.uid).sort()).toEqual(['a', 'd']);
    });

    test('scope filter restricts to one class', async () => {
        mockListUsers.mockResolvedValue(buildUsers());
        const wrapped = test.wrap(myFunctions.listDualAccessStudents);
        const result = await wrapped({
            data: { scope: 'morning' },
            auth: { uid: SUPER_ADMIN_UID, token: { superAdmin: true } },
        });
        expect(result.users.map(u => u.uid)).toEqual(['a']);
    });

    test('teacher sees only students in their class scope', async () => {
        mockListUsers.mockResolvedValue(buildUsers());
        const wrapped = test.wrap(myFunctions.listDualAccessStudents);
        const result = await wrapped({
            data: {},
            auth: { uid: 'teacher-uid', token: { class: 'evening' } },
        });
        expect(result.users.map(u => u.uid)).toEqual(['d']);
    });

    test('rejects unauthenticated', async () => {
        const wrapped = test.wrap(myFunctions.listDualAccessStudents);
        await expect(wrapped({ data: {} })).rejects.toThrow(/logged in/i);
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd functions && npm test
```
Expected: 4 new failing tests.

- [ ] **Step 3: Add `listDualAccessStudents` to `functions/index.js`**

Append:

```js
/**
 * Returns student accounts that have BOTH `class` and `avatarClass` claims.
 * - Super admin sees all such students.
 * - Teachers see only students whose class/avatarClass matches their own claim.
 * - Optional `scope` further filters to a single class name.
 */
exports.listDualAccessStudents = onCall(
  { timeoutSeconds: 60, memory: "256MiB", minInstances: 0, maxInstances: 10 },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const isSuperAdmin = auth.token?.superAdmin === true || auth.uid === "RnBej9HSStVJXA0rtIB02W0R1yv2";
    const teacherClass = auth.token?.class;
    const teacherAvatarClass = auth.token?.avatarClass;
    const scope = (data && data.scope) ? String(data.scope).toLowerCase() : null;

    if (!isSuperAdmin && !teacherClass && !teacherAvatarClass) {
      throw new HttpsError("permission-denied", "Caller has no class scope.");
    }

    const authService = getAuth();
    const { users } = await authService.listUsers();

    const dual = users.filter(u => {
      const c = u.customClaims || {};
      if (!(c.class && c.avatarClass)) return false;
      if (scope) {
        return c.class === scope || c.avatarClass === scope;
      }
      if (isSuperAdmin) return true;
      return (teacherClass && (c.class === teacherClass || c.avatarClass === teacherClass)) ||
             (teacherAvatarClass && (c.class === teacherAvatarClass || c.avatarClass === teacherAvatarClass));
    }).map(u => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      class: u.customClaims?.class || null,
      avatarClass: u.customClaims?.avatarClass || null,
      createdAt: u.metadata?.creationTime || null,
    }));

    return { success: true, users: dual };
  }
);
```

- [ ] **Step 4: Run all tests**

```bash
cd functions && npm test
```
Expected: 12 passing.

- [ ] **Step 5: Commit**

```bash
git add functions/test/cloud-functions.test.js functions/index.js
git commit -m "feat(functions): add listDualAccessStudents"
```

---

### Task 6: Add Firestore rules for `students/{uid}` collection

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Add the new rules block**

Edit `firestore.rules`. Find the closing brace of `match /schools/{schoolId} { ... }` block (around line 95) and *before* the final two closing braces, insert:

```
    // Per-student teacher notes & metadata (additive — no migration of existing data)
    match /students/{uid} {
      // Super admin always; the student themselves; or a teacher whose class
      // claim matches the student's recorded role/class.
      function isOwnRecord() {
        return request.auth != null && request.auth.uid == uid;
      }
      function teacherOwnsThisStudent() {
        return request.auth != null
          && (
            (request.auth.token.class != null
              && resource.data.class == request.auth.token.class)
            || (request.auth.token.avatarClass != null
              && resource.data.avatarClass == request.auth.token.avatarClass)
          );
      }

      allow read:   if isSuperAdmin() || isOwnRecord() || teacherOwnsThisStudent();
      allow create, update: if isSuperAdmin()
        || (request.auth != null
            && (request.auth.token.class != null || request.auth.token.avatarClass != null));
      allow delete: if isSuperAdmin();
    }
```

- [ ] **Step 2: Validate rules locally**

```bash
firebase emulators:start --only firestore --project nextshop-a17fe &
# wait a couple seconds for the emulator
sleep 5
# any successful boot confirms syntactic validity
firebase emulators:exec --only firestore "echo rules-ok" --project nextshop-a17fe
```
Expected: `rules-ok` printed; emulator did not fail to load rules. Kill the background emulator after.

> **Note:** if the emulator is not configured locally, skip this step — `firebase deploy --only firestore:rules` in Task 7 will validate them.

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat(rules): add students collection access rules"
```

---

### Task 7: Deploy Phase 1

**Files:** none (deploy)

- [ ] **Step 1: Deploy functions**

```bash
firebase deploy --only functions --project nextshop-a17fe
```
Expected: 5 functions updated/created (`createNewVendor`, `createAvatarVendor`, `createNewViewer`, `deleteUser`, `listAllUsers`) plus 2 new (`convertStudentRole`, `listDualAccessStudents`). No errors.

- [ ] **Step 2: Deploy rules**

```bash
firebase deploy --only firestore:rules --project nextshop-a17fe
```
Expected: rules deployed successfully.

- [ ] **Step 3: Manual smoke test of the loophole closure**

In a browser, open the existing in-page admin (super admin signed in). Try creating a Talent Vendor with the username of an existing Product Vendor. Expected: an `already-exists` error toast — **no claim merging**.

> **Verification:** before this task, the same action would have silently added `avatarClass` to the existing user. After: it's blocked.

- [ ] **Step 4: Commit a CHANGELOG note**

Create `CHANGELOG.md` at repo root if it doesn't exist; otherwise append:

```markdown
## 2026-05-04 — Phase 1: Backend hardening

- Cloud functions `createNewVendor` and `createAvatarVendor` now refuse to create a user when the username (email) already exists — no more claim merging.
- New cloud function `convertStudentRole(uid, keepRole)` strips the unwanted claim so a dual-access student can be converted to a single-role account.
- New cloud function `listDualAccessStudents({scope?})` returns students who currently have both `class` and `avatarClass` claims.
- New Firestore rules for `students/{uid}` (teacher-facing notes; additive — no existing data touched).
```

```bash
git add CHANGELOG.md
git commit -m "docs: changelog for Phase 1 backend hardening"
git push
```

---

## Phase 2 — Shared admin shell

### Task 8: Add `jspdf` dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install jspdf**

```bash
npm install jspdf
```
Expected: `jspdf` added to dependencies.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add jspdf for credential PDF handouts"
```

---

### Task 9: `dashboardRoute` helper

**Files:**
- Create: `src/lib/auth/dashboardRoute.js`

- [ ] **Step 1: Create the helper**

```js
// Decides where the "Dashboard" affordance should send a user.
// - Super admins go to /admin (the multi-school view)
// - Teachers (have class or avatarClass claim) go to /dashboard
// - Anyone else (viewer only, or storefront-only) returns null
export function dashboardRouteFor(claims, hardcodedSuperAdminUid, currentUid) {
    if (!claims) return null;
    if (claims.superAdmin === true || currentUid === hardcodedSuperAdminUid) return '/admin';
    if (claims.class || claims.avatarClass) return '/dashboard';
    return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth/dashboardRoute.js
git commit -m "feat(auth): dashboardRouteFor helper"
```

---

### Task 10: `useAdminAuth` hook

**Files:**
- Create: `src/lib/auth/useAdminAuth.js`

- [ ] **Step 1: Create the hook**

```js
"use client";
import { useEffect, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth, SUPER_ADMIN_UID } from '../firebase';

/**
 * Subscribes to auth state and resolves a stable shape for the admin shell.
 * @param requirement - 'teacher' | 'superAdmin'
 *   - 'teacher': allows class/avatarClass/superAdmin
 *   - 'superAdmin': only the super admin
 * @returns {{ user, claims, loading, allowed }}
 */
export function useAdminAuth(requirement = 'teacher') {
    const [user, setUser] = useState(null);
    const [claims, setClaims] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onIdTokenChanged(auth, async (current) => {
            if (!current) {
                setUser(null);
                setClaims(null);
                setLoading(false);
                return;
            }
            const tokenResult = await current.getIdTokenResult();
            current.customClaims = tokenResult.claims;
            setUser(current);
            setClaims(tokenResult.claims);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const isSuperAdmin = !!claims && (claims.superAdmin === true || user?.uid === SUPER_ADMIN_UID);
    const isTeacher = !!claims && (claims.class || claims.avatarClass);

    let allowed = false;
    if (requirement === 'superAdmin') allowed = isSuperAdmin;
    else if (requirement === 'teacher') allowed = isSuperAdmin || isTeacher;

    return { user, claims, loading, allowed, isSuperAdmin };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth/useAdminAuth.js
git commit -m "feat(auth): useAdminAuth hook"
```

---

### Task 11: `AdminSidebar` component

**Files:**
- Create: `src/components/admin/AdminSidebar.jsx`

- [ ] **Step 1: Create the sidebar**

```jsx
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, BookOpen, ShoppingBag, Settings, ExternalLink, GraduationCap } from 'lucide-react';

const ICONS = { Home, Users, BookOpen, ShoppingBag, Settings, ExternalLink, GraduationCap };

export function AdminSidebar({ items, schoolName, schoolColor = '#2563eb', logoIcon = 'GraduationCap' }) {
    const pathname = usePathname();
    const Logo = ICONS[logoIcon] || GraduationCap;

    return (
        <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: schoolColor }}>
                    <Logo className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{schoolName}</p>
                    <p className="text-xs text-gray-400">Admin</p>
                </div>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {items.map((item) => {
                    const Icon = ICONS[item.icon] || Home;
                    const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    if (item.external) {
                        return (
                            <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                <Icon className="h-4 w-4" /> {item.label}
                            </a>
                        );
                    }
                    return (
                        <Link key={item.href} href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}>
                            <Icon className="h-4 w-4" /> {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AdminSidebar.jsx
git commit -m "feat(admin): AdminSidebar component"
```

---

### Task 12: `AdminTopbar` component

**Files:**
- Create: `src/components/admin/AdminTopbar.jsx`

- [ ] **Step 1: Create the topbar**

```jsx
"use client";
import { LogOut, ShieldCheck, UserCircle } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export function AdminTopbar({ user, claims, isSuperAdmin, title, action }) {
    const handleSignOut = () => signOut(auth);
    return (
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                {isSuperAdmin && (
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium">
                        <ShieldCheck className="h-3 w-3" /> Super Admin
                    </span>
                )}
            </div>
            <div className="flex items-center gap-3">
                {action}
                <span className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                    <UserCircle className="h-5 w-5" />
                    {user?.displayName || user?.email || 'You'}
                </span>
                <button
                    onClick={handleSignOut}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 cursor-pointer"
                    title="Sign Out"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </header>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AdminTopbar.jsx
git commit -m "feat(admin): AdminTopbar component"
```

---

### Task 13: `AdminShell` composition

**Files:**
- Create: `src/components/admin/AdminShell.jsx`

- [ ] **Step 1: Create the shell**

```jsx
"use client";
import { Loader2, ShieldCheck } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export function AdminShell({
    requirement,
    auth: authState,
    sidebarItems,
    schoolName,
    schoolColor,
    logoIcon,
    title,
    action,
    children,
}) {
    const { user, claims, loading, allowed, isSuperAdmin } = authState;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!allowed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <ShieldCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-500 mb-4">
                        {requirement === 'superAdmin'
                            ? 'You must be a super admin to view this page.'
                            : 'You must be a teacher or super admin to view this page.'}
                    </p>
                    <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">Go to main site</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar
                items={sidebarItems}
                schoolName={schoolName}
                schoolColor={schoolColor}
                logoIcon={logoIcon}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <AdminTopbar user={user} claims={claims} isSuperAdmin={isSuperAdmin} title={title} action={action} />
                <main className="flex-1 p-6 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AdminShell.jsx
git commit -m "feat(admin): AdminShell composes sidebar + topbar with auth gate"
```

---

### Task 14: `StatCard` extracted component

**Files:**
- Create: `src/components/admin/StatCard.jsx`

- [ ] **Step 1: Create the component (extracted from /admin)**

```jsx
import { TrendingUp } from 'lucide-react';

export function StatCard({ icon: Icon, label, value, subtext, color = 'bg-blue-100 text-blue-600' }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
            {subtext && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />{subtext}
                </p>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/StatCard.jsx
git commit -m "feat(admin): StatCard component"
```

---

### Task 15: `RolePill` component

**Files:**
- Create: `src/components/admin/RolePill.jsx`

- [ ] **Step 1: Create the pill**

```jsx
import { ShoppingBag, User } from 'lucide-react';

export function RolePill({ role, size = 'sm' }) {
    const isProducts = role === 'products' || role === 'class';
    const isTalent = role === 'talent' || role === 'avatarClass';
    const isDual = role === 'dual';

    const cls = size === 'xs'
        ? 'px-1.5 py-0.5 text-[10px]'
        : 'px-2 py-0.5 text-xs';

    if (isDual) {
        return (
            <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-amber-50 text-amber-800 border border-amber-200 ${cls}`}>
                Both (needs cleanup)
            </span>
        );
    }
    if (isProducts) {
        return (
            <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-blue-50 text-blue-700 border border-blue-100 ${cls}`}>
                <ShoppingBag className="h-3 w-3" /> Products
            </span>
        );
    }
    if (isTalent) {
        return (
            <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-purple-50 text-purple-700 border border-purple-100 ${cls}`}>
                <User className="h-3 w-3" /> Talent
            </span>
        );
    }
    return <span className={`inline-flex rounded-md bg-gray-100 text-gray-500 ${cls}`}>—</span>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/RolePill.jsx
git commit -m "feat(admin): RolePill component"
```

---

### Task 16: `NeedsAttention` panel

**Files:**
- Create: `src/components/admin/NeedsAttention.jsx`

- [ ] **Step 1: Create the panel**

```jsx
import { AlertTriangle, ChevronRight } from 'lucide-react';

export function NeedsAttention({ items }) {
    const visible = (items || []).filter(Boolean);
    if (visible.length === 0) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h3 className="font-semibold text-amber-900 text-sm">Needs attention</h3>
            </div>
            <ul className="space-y-2">
                {visible.map((item, i) => (
                    <li key={i}>
                        <button
                            onClick={item.onResolve}
                            className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg bg-white border border-amber-100 hover:border-amber-300 transition-colors cursor-pointer"
                        >
                            <span className="text-sm text-amber-900">{item.message}</span>
                            <span className="flex items-center gap-1 text-xs font-medium text-amber-700">
                                {item.cta || 'Resolve'} <ChevronRight className="h-3 w-3" />
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/NeedsAttention.jsx
git commit -m "feat(admin): NeedsAttention panel"
```

---

## Phase 3 — Hooks for data

### Task 17: `useStudents` hook

**Files:**
- Create: `src/lib/admin/useStudents.js`

- [ ] **Step 1: Create the hook**

```js
"use client";
import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

/**
 * Lists all student accounts (vendor/talent) in the platform via the
 * existing `listAllUsers` callable. Filters in-memory to entries that
 * have at least one class/avatarClass claim, so the result is the
 * teacher's roster (super admin sees everyone).
 *
 * Returns { students, loading, error, refresh }
 *   students: [{ uid, email, displayName, class, avatarClass, viewer }]
 */
export function useStudents() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        const fn = httpsCallable(functions, 'listAllUsers');
        fn()
            .then((result) => {
                if (!alive) return;
                const list = (result.data?.users || [])
                    .filter(u => u.customClaims && (u.customClaims.class || u.customClaims.avatarClass || u.customClaims.viewer))
                    .map(u => ({
                        uid: u.uid,
                        email: u.email,
                        displayName: u.displayName,
                        class: u.customClaims?.class || null,
                        avatarClass: u.customClaims?.avatarClass || null,
                        viewer: u.customClaims?.viewer === true,
                    }));
                setStudents(list);
                setLoading(false);
            })
            .catch((e) => {
                if (!alive) return;
                setError(e);
                setLoading(false);
            });
        return () => { alive = false; };
    }, [tick]);

    return { students, loading, error, refresh: () => setTick((t) => t + 1) };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/admin/useStudents.js
git commit -m "feat(admin): useStudents hook"
```

---

### Task 18: `useClasses` hook

**Files:**
- Create: `src/lib/admin/useClasses.js`

- [ ] **Step 1: Create the hook**

```js
"use client";
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Subscribes to one of two Firestore collections.
 * @param {'product' | 'talent'} kind
 */
export function useClasses(kind) {
    const collectionName = kind === 'talent' ? 'avatar-classes' : 'classes';
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, collectionName), (snap) => {
            setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, [collectionName]);

    return { classes, loading, kind, collectionName };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/admin/useClasses.js
git commit -m "feat(admin): useClasses hook"
```

---

### Task 19: `useDualAccessStudents` hook

**Files:**
- Create: `src/lib/admin/useDualAccessStudents.js`

- [ ] **Step 1: Create the hook**

```js
"use client";
import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

export function useDualAccessStudents(scope = null) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        const fn = httpsCallable(functions, 'listDualAccessStudents');
        fn(scope ? { scope } : {})
            .then((res) => {
                if (!alive) return;
                setUsers(res.data?.users || []);
                setLoading(false);
            })
            .catch((e) => {
                if (!alive) return;
                setError(e);
                setLoading(false);
            });
        return () => { alive = false; };
    }, [scope, tick]);

    return { users, loading, error, refresh: () => setTick((t) => t + 1) };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/admin/useDualAccessStudents.js
git commit -m "feat(admin): useDualAccessStudents hook"
```

---

## Phase 4 — Add Student wizard

### Task 20: `passwordGenerator` utility

**Files:**
- Create: `src/components/admin/wizard/passwordGenerator.js`

- [ ] **Step 1: Create the generator**

```js
const ADJECTIVES = [
    'swift', 'bright', 'calm', 'bold', 'kind', 'quick', 'sharp', 'wise',
    'lucky', 'happy', 'gentle', 'silver', 'golden', 'royal', 'lively', 'humble',
];
const ANIMALS = [
    'otter', 'tiger', 'falcon', 'dolphin', 'wolf', 'panda', 'eagle', 'lynx',
    'koala', 'shark', 'badger', 'rabbit', 'hawk', 'fox', 'whale', 'orca',
];

function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
}

/**
 * Returns a friendly password like "swift-otter-42".
 * Always 6+ chars, easy to read aloud and type.
 */
export function generateFriendlyPassword() {
    const num = Math.floor(Math.random() * 90) + 10; // 10..99
    return `${pick(ADJECTIVES)}-${pick(ANIMALS)}-${num}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/wizard/passwordGenerator.js
git commit -m "feat(wizard): friendly password generator"
```

---

### Task 21: `credentialPdf` utility

**Files:**
- Create: `src/components/admin/wizard/credentialPdf.js`

- [ ] **Step 1: Create the PDF generator**

```js
import { jsPDF } from 'jspdf';

/**
 * Generates and downloads a single-page PDF handout with login credentials.
 * @param {Object} args
 *   schoolName, role ('Products' | 'Talent'), username, password, loginUrl
 */
export function downloadCredentialPdf({ schoolName, role, username, password, loginUrl }) {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });

    doc.setFontSize(22);
    doc.text(schoolName || 'My School', 60, 90);

    doc.setFontSize(13);
    doc.setTextColor(120);
    doc.text(`${role} Vendor account`, 60, 115);

    doc.setDrawColor(220);
    doc.line(60, 135, 552, 135);

    doc.setTextColor(40);
    doc.setFontSize(11);
    doc.text('Your sign-in details', 60, 175);

    doc.setFont('courier', 'normal');
    doc.setFontSize(13);
    doc.text(`Username:  ${username}`, 60, 205);
    doc.text(`Password:  ${password}`, 60, 230);
    if (loginUrl) doc.text(`URL:       ${loginUrl}`, 60, 255);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('What\'s next:', 60, 305);
    doc.text('1. Open the URL above in your browser.', 60, 325);
    doc.text('2. Sign in with your username and password.', 60, 343);
    doc.text(`3. You\'ll see your ${role.toLowerCase()} dashboard ready to use.`, 60, 361);

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Keep this document private. ${schoolName} - ${new Date().toLocaleDateString()}`, 60, 760);

    const safeName = String(username).replace(/[^a-z0-9-_]/gi, '_');
    doc.save(`${safeName}-credentials.pdf`);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/wizard/credentialPdf.js
git commit -m "feat(wizard): credentialPdf generator"
```

---

### Task 22: `StepRolePicker` component

**Files:**
- Create: `src/components/admin/wizard/StepRolePicker.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { ShoppingBag, User } from 'lucide-react';

// Static class maps so Tailwind v4 sees every used utility at scan time.
const ACCENTS = {
    blue: {
        ring: 'border-blue-500 ring-2 ring-blue-100',
        iconBg: 'bg-blue-50',
        iconFg: 'text-blue-600',
        accessText: 'text-blue-700',
    },
    purple: {
        ring: 'border-purple-500 ring-2 ring-purple-100',
        iconBg: 'bg-purple-50',
        iconFg: 'text-purple-600',
        accessText: 'text-purple-700',
    },
};

export function StepRolePicker({ value, onChange }) {
    const Card = ({ role, icon: Icon, title, description, accessLine, accentKey }) => {
        const accent = ACCENTS[accentKey];
        const selected = value === role;
        return (
            <button
                type="button"
                onClick={() => onChange(role)}
                className={`flex-1 text-left p-5 rounded-xl border-2 transition-all cursor-pointer ${
                    selected ? accent.ring : 'border-gray-200 hover:border-gray-300'
                }`}
            >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${accent.iconBg}`}>
                    <Icon className={`h-6 w-6 ${accent.iconFg}`} />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
                <p className="text-sm text-gray-500 mb-3">{description}</p>
                <p className={`text-xs font-medium ${accent.accessText}`}>{accessLine}</p>
            </button>
        );
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">What kind of student?</h3>
            <p className="text-sm text-gray-500 mb-5">Each student account is locked to one of these. You can&rsquo;t change it later, only convert.</p>
            <div className="flex gap-4">
                <Card
                    role="products"
                    icon={ShoppingBag}
                    title="Product Vendor"
                    description="Student creates product marketing campaigns."
                    accessLine="Access: Products"
                    accentKey="blue"
                />
                <Card
                    role="talent"
                    icon={User}
                    title="Talent Vendor"
                    description="Student creates hirable avatar profiles."
                    accessLine="Access: Talent"
                    accentKey="purple"
                />
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/wizard/StepRolePicker.jsx
git commit -m "feat(wizard): StepRolePicker"
```

---

### Task 23: `StepClassAndCreds` component

**Files:**
- Create: `src/components/admin/wizard/StepClassAndCreds.jsx`

- [ ] **Step 1: Create the component**

```jsx
"use client";
import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Dices, Plus } from 'lucide-react';
import { generateFriendlyPassword } from './passwordGenerator';

export function StepClassAndCreds({ classes, classKind, value, onChange, existingUsernames }) {
    const [creatingClass, setCreatingClass] = useState(false);
    const [newClassName, setNewClassName] = useState('');

    const onPickClass = (e) => {
        const v = e.target.value;
        if (v === '__new__') {
            setCreatingClass(true);
            return;
        }
        onChange({ ...value, class: v });
        setCreatingClass(false);
    };

    const confirmNewClass = () => {
        const trimmed = newClassName.trim().toLowerCase();
        if (trimmed.length < 2) return;
        onChange({ ...value, class: trimmed, _isNewClass: true });
        setCreatingClass(false);
        setNewClassName('');
    };

    const trimmedUser = (value.username || '').trim().toLowerCase();
    const usernameTaken = useMemo(() => {
        if (!trimmedUser || trimmedUser.length < 3) return false;
        if (!existingUsernames) return false;
        return existingUsernames.has(trimmedUser);
    }, [trimmedUser, existingUsernames]);
    const usernameOk = trimmedUser.length >= 3 && !usernameTaken;

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-5">
                Class &amp; credentials
                <span className="ml-2 text-xs font-normal text-gray-400">
                    ({classKind === 'talent' ? 'Talent' : 'Products'})
                </span>
            </h3>

            <div className="space-y-4">
                {/* Class */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
                    {!creatingClass ? (
                        <select
                            value={value.class || ''}
                            onChange={onPickClass}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="" disabled>Choose a class...</option>
                            {classes.map(c => (<option key={c.id} value={c.id}>{c.name || c.id}</option>))}
                            <option value="__new__">+ Create new class...</option>
                        </select>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                placeholder="e.g. morning-class"
                                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                autoFocus
                            />
                            <button type="button" onClick={confirmNewClass}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer">
                                <Plus className="h-4 w-4 inline" /> Add
                            </button>
                            <button type="button" onClick={() => { setCreatingClass(false); setNewClassName(''); }}
                                className="px-3 py-2 text-gray-500 text-sm hover:text-gray-700 cursor-pointer">
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Username */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={value.username}
                            onChange={(e) => onChange({ ...value, username: e.target.value })}
                            className={`w-full px-3 py-2.5 pr-9 border rounded-lg text-sm focus:ring-2 outline-none ${
                                usernameTaken
                                    ? 'border-red-300 focus:ring-red-500'
                                    : usernameOk
                                        ? 'border-green-300 focus:ring-green-500'
                                        : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            placeholder="e.g. alex"
                            minLength={3}
                        />
                        {trimmedUser.length >= 3 && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                {usernameTaken
                                    ? <AlertCircle className="h-4 w-4 text-red-500" />
                                    : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            </span>
                        )}
                    </div>
                    {usernameTaken ? (
                        <p className="text-xs text-red-600 mt-1">Username already in use. Pick a different one.</p>
                    ) : (
                        <p className="text-xs text-gray-400 mt-1">3+ characters. Will be the student&rsquo;s sign-in username.</p>
                    )}
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={value.password}
                            onChange={(e) => onChange({ ...value, password: e.target.value })}
                            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={() => onChange({ ...value, password: generateFriendlyPassword() })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 cursor-pointer flex items-center gap-1.5"
                            title="Regenerate"
                        >
                            <Dices className="h-4 w-4" /> Regenerate
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">6+ characters. Easy to read aloud — students copy it on day one.</p>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
                    <input
                        type="text"
                        value={value.notes}
                        onChange={(e) => onChange({ ...value, notes: e.target.value })}
                        placeholder="real name, group, etc."
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/wizard/StepClassAndCreds.jsx
git commit -m "feat(wizard): StepClassAndCreds"
```

---

### Task 24: `StepCredentialHandoff` component

**Files:**
- Create: `src/components/admin/wizard/StepCredentialHandoff.jsx`

- [ ] **Step 1: Create the component**

```jsx
"use client";
import { useState } from 'react';
import { CheckCircle2, Clipboard, ClipboardCheck, Download, Mail } from 'lucide-react';
import { downloadCredentialPdf } from './credentialPdf';

export function StepCredentialHandoff({ schoolName, role, username, password, loginUrl, onDone }) {
    const [copied, setCopied] = useState(null);
    const copy = async (key, text) => {
        try { await navigator.clipboard.writeText(text); }
        catch { /* fall back to nothing — user can still type it */ }
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
    };

    const Field = ({ label, value, k }) => (
        <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-b-0">
            <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
                <p className="font-mono text-sm text-gray-900 truncate">{value}</p>
            </div>
            <button onClick={() => copy(k, value)} className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 cursor-pointer" title="Copy">
                {copied === k ? <ClipboardCheck className="h-4 w-4 text-green-600" /> : <Clipboard className="h-4 w-4" />}
            </button>
        </div>
    );

    const all = `Username: ${username}\nPassword: ${password}\nLogin: ${loginUrl}`;

    return (
        <div>
            <div className="flex items-center gap-2 text-green-700 mb-3">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Student created</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Hand these credentials to the student. They'll sign in at the URL below.</p>

            <div className="bg-gray-50 rounded-xl border border-gray-200 px-5 py-2 mb-5">
                <Field label="Username" value={username} k="user" />
                <Field label="Password" value={password} k="pass" />
                <Field label="Login URL" value={loginUrl} k="url" />
            </div>

            <div className="flex flex-wrap gap-2">
                <button onClick={() => copy('all', all)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 cursor-pointer">
                    {copied === 'all' ? <ClipboardCheck className="h-4 w-4 text-green-600" /> : <Clipboard className="h-4 w-4" />} Copy all
                </button>
                <button onClick={() => downloadCredentialPdf({ schoolName, role, username, password, loginUrl })}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 cursor-pointer">
                    <Download className="h-4 w-4" /> Download PDF handout
                </button>
                <a href={`mailto:?subject=Your%20${role}%20account&body=${encodeURIComponent(all)}`}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 cursor-pointer">
                    <Mail className="h-4 w-4" /> Email to me
                </a>
                <button onClick={onDone}
                    className="ml-auto flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 cursor-pointer">
                    Done
                </button>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/wizard/StepCredentialHandoff.jsx
git commit -m "feat(wizard): StepCredentialHandoff"
```

---

### Task 25: `AddStudentWizard` composition

**Files:**
- Create: `src/components/admin/wizard/AddStudentWizard.jsx`

- [ ] **Step 1: Create the wizard**

```jsx
"use client";
import { useMemo, useState } from 'react';
import { X, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { doc, setDoc } from 'firebase/firestore';
import { functions, db } from '../../../lib/firebase';
import { useClasses } from '../../../lib/admin/useClasses';
import { useStudents } from '../../../lib/admin/useStudents';
import { generateFriendlyPassword } from './passwordGenerator';
import { StepRolePicker } from './StepRolePicker';
import { StepClassAndCreds } from './StepClassAndCreds';
import { StepCredentialHandoff } from './StepCredentialHandoff';

export function AddStudentWizard({ open, onClose, schoolName, schoolSubdomain, onCreated }) {
    const [step, setStep] = useState(1); // 1: role, 2: class+creds, 3: handoff
    const [role, setRole] = useState(null); // 'products' | 'talent'
    const [form, setForm] = useState({ class: '', username: '', password: generateFriendlyPassword(), notes: '', _isNewClass: false });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const productClasses = useClasses('product');
    const talentClasses = useClasses('talent');
    const classes = role === 'talent' ? talentClasses.classes : productClasses.classes;
    const classKind = role === 'talent' ? 'talent' : 'product';

    // Live username availability check — reactive against current student snapshot.
    const { students } = useStudents();
    const existingUsernames = useMemo(() => {
        const set = new Set();
        students.forEach(s => {
            if (s.email) set.add(s.email.replace(/@shopnext\.dev$/, '').toLowerCase());
            if (s.displayName) set.add(s.displayName.toLowerCase());
        });
        return set;
    }, [students]);

    const reset = () => {
        setStep(1);
        setRole(null);
        setForm({ class: '', username: '', password: generateFriendlyPassword(), notes: '', _isNewClass: false });
        setError(null);
        setSubmitting(false);
    };

    const close = () => { reset(); onClose?.(); };

    if (!open) return null;

    const canContinue1 = !!role;
    const trimmedUser = form.username.trim().toLowerCase();
    const usernameTaken = trimmedUser.length >= 3 && existingUsernames.has(trimmedUser);
    const canContinue2 = form.class && trimmedUser.length >= 3 && !usernameTaken && form.password.length >= 6;

    const submit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const collectionName = classKind === 'talent' ? 'avatar-classes' : 'classes';
            if (form._isNewClass) {
                const display = form.class.charAt(0).toUpperCase() + form.class.slice(1).replace(/-/g, ' ');
                await setDoc(doc(db, collectionName, form.class), { name: display });
            }
            const fnName = classKind === 'talent' ? 'createAvatarVendor' : 'createNewVendor';
            const payload = classKind === 'talent'
                ? { username: form.username, password: form.password, avatarClass: form.class }
                : { username: form.username, password: form.password, class: form.class };
            const callable = httpsCallable(functions, fnName);
            const result = await callable(payload);
            const uid = result.data.uid;

            // Best-effort note write — don't block on failure (the student record itself succeeded)
            if (form.notes && uid) {
                try {
                    await setDoc(doc(db, 'students', uid), {
                        notes: form.notes,
                        class: classKind === 'product' ? form.class : null,
                        avatarClass: classKind === 'talent' ? form.class : null,
                        createdAt: new Date().toISOString(),
                    });
                } catch { /* swallow */ }
            }

            onCreated?.({ uid, ...form, role });
            setStep(3);
        } catch (e) {
            setError(e.message || 'Failed to create student.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">Step {step} of 3</p>
                        <h2 className="text-lg font-semibold text-gray-900">Add Student</h2>
                    </div>
                    <button onClick={close} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 py-5 overflow-y-auto">
                    {step === 1 && <StepRolePicker value={role} onChange={setRole} />}
                    {step === 2 && (
                        <StepClassAndCreds
                            classes={classes}
                            classKind={classKind}
                            value={form}
                            onChange={setForm}
                            existingUsernames={existingUsernames}
                        />
                    )}
                    {step === 3 && (
                        <StepCredentialHandoff
                            schoolName={schoolName}
                            role={role === 'talent' ? 'Talent' : 'Products'}
                            username={form.username}
                            password={form.password}
                            loginUrl={schoolSubdomain ? `https://${schoolSubdomain}.shopnext.app` : window.location.origin}
                            onDone={close}
                        />
                    )}
                    {error && (
                        <div className="mt-4 flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> {error}
                        </div>
                    )}
                </div>

                {step !== 3 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={step === 1 ? close : () => setStep(step - 1)}
                            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg cursor-pointer"
                        >
                            {step === 1 ? 'Cancel' : 'Back'}
                        </button>
                        {step === 1 && (
                            <button
                                disabled={!canContinue1}
                                onClick={() => setStep(2)}
                                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 cursor-pointer"
                            >
                                Continue <ArrowRight className="h-4 w-4" />
                            </button>
                        )}
                        {step === 2 && (
                            <button
                                disabled={!canContinue2 || submitting}
                                onClick={submit}
                                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 cursor-pointer"
                            >
                                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : 'Create student'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/wizard/AddStudentWizard.jsx
git commit -m "feat(wizard): AddStudentWizard composition"
```

---

## Phase 5 — `/dashboard` routes

### Task 26: `/dashboard/layout.js`

**Files:**
- Create: `src/app/dashboard/layout.js`

- [ ] **Step 1: Create the layout**

```jsx
"use client";
import { useState, useMemo } from 'react';
import { AdminShell } from '../../components/admin/AdminShell';
import { useAdminAuth } from '../../lib/auth/useAdminAuth';
import { useSchoolConfig } from '../../lib/useSchoolConfig';
import { AddStudentWizard } from '../../components/admin/wizard/AddStudentWizard';
import { Plus } from 'lucide-react';

const DASHBOARD_ITEMS = [
    { href: '/dashboard',          label: 'Overview',  icon: 'Home' },
    { href: '/dashboard/students', label: 'Students',  icon: 'Users' },
    { href: '/dashboard/classes',  label: 'Classes',   icon: 'BookOpen' },
    { href: '/dashboard/content',  label: 'Content',   icon: 'ShoppingBag' },
    { href: '/settings',           label: 'Settings',  icon: 'Settings' },
    { href: '/',                   label: 'View storefront', icon: 'ExternalLink', external: true },
];

export default function DashboardLayout({ children }) {
    const auth = useAdminAuth('teacher');
    const schoolConfig = useSchoolConfig();
    const [wizardOpen, setWizardOpen] = useState(false);

    const action = useMemo(() => (
        <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 cursor-pointer"
        >
            <Plus className="h-4 w-4" /> Add Student
        </button>
    ), []);

    return (
        <>
            <AdminShell
                requirement="teacher"
                auth={auth}
                sidebarItems={DASHBOARD_ITEMS}
                schoolName={schoolConfig?.displayName || 'My School'}
                schoolColor={schoolConfig?.primaryColor || '#2563eb'}
                logoIcon="GraduationCap"
                title="Dashboard"
                action={action}
            >
                {children}
            </AdminShell>
            <AddStudentWizard
                open={wizardOpen}
                onClose={() => setWizardOpen(false)}
                schoolName={schoolConfig?.displayName || 'My School'}
                schoolSubdomain={schoolConfig?.subdomain}
            />
        </>
    );
}
```

> **Note:** the `useSchoolConfig` hook already exists at [src/lib/useSchoolConfig.js](../../src/lib/useSchoolConfig.js). It loads branding from the current hostname.

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/layout.js
git commit -m "feat(dashboard): /dashboard layout with shell + wizard"
```

---

### Task 27: `RecentStudentsTable` component

**Files:**
- Create: `src/components/admin/RecentStudentsTable.jsx`

- [ ] **Step 1: Create**

```jsx
import Link from 'next/link';
import { RolePill } from './RolePill';

export function RecentStudentsTable({ students, max = 8 }) {
    const list = (students || []).slice(0, max);
    if (list.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-500">No students yet.</p>
                <p className="text-xs text-gray-400 mt-1">Click <strong>Add Student</strong> to create your first.</p>
            </div>
        );
    }
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">Recent students</h3>
                <Link href="/dashboard/students" className="text-xs text-blue-600 hover:text-blue-700">View all →</Link>
            </div>
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase">Class</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {list.map((s) => {
                        const role = s.class && s.avatarClass ? 'dual'
                            : s.class ? 'class'
                            : s.avatarClass ? 'avatarClass' : null;
                        return (
                            <tr key={s.uid} className="hover:bg-gray-50">
                                <td className="px-5 py-2.5 text-sm text-gray-900">{s.displayName || s.email}</td>
                                <td className="px-5 py-2.5"><RolePill role={role} size="xs" /></td>
                                <td className="px-5 py-2.5 text-sm text-gray-600">{s.class || s.avatarClass || '—'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/RecentStudentsTable.jsx
git commit -m "feat(admin): RecentStudentsTable"
```

---

### Task 28: `ClassBreakdown` component

**Files:**
- Create: `src/components/admin/ClassBreakdown.jsx`

- [ ] **Step 1: Create**

```jsx
export function ClassBreakdown({ students, productClasses, talentClasses }) {
    const counts = new Map();
    const ensure = (key) => {
        if (!counts.has(key)) counts.set(key, { product: 0, talent: 0 });
        return counts.get(key);
    };

    productClasses?.forEach(c => ensure(c.id));
    talentClasses?.forEach(c => ensure(c.id));
    students?.forEach(s => {
        if (s.class) ensure(s.class).product += 1;
        if (s.avatarClass) ensure(s.avatarClass).talent += 1;
    });

    const rows = Array.from(counts.entries())
        .map(([name, c]) => ({ name, ...c, total: c.product + c.talent }))
        .filter(r => r.total > 0)
        .sort((a, b) => b.total - a.total);

    if (rows.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">Classes</h3>
                <p className="text-sm text-gray-500">No classes yet.</p>
            </div>
        );
    }
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Classes</h3>
            <ul className="space-y-3">
                {rows.map(r => (
                    <li key={r.name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">{r.name}</span>
                            <span className="text-xs text-gray-400">{r.total} student{r.total !== 1 && 's'}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                            {r.product > 0 && (
                                <div className="bg-blue-500" style={{ width: `${(r.product / r.total) * 100}%` }} title={`${r.product} product`} />
                            )}
                            {r.talent > 0 && (
                                <div className="bg-purple-500" style={{ width: `${(r.talent / r.total) * 100}%` }} title={`${r.talent} talent`} />
                            )}
                        </div>
                    </li>
                ))}
            </ul>
            <div className="flex items-center gap-3 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-blue-500 rounded-full" /> Products</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-purple-500 rounded-full" /> Talent</span>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/ClassBreakdown.jsx
git commit -m "feat(admin): ClassBreakdown widget"
```

---

### Task 29: `/dashboard/page.js` Overview

**Files:**
- Create: `src/app/dashboard/page.js`

- [ ] **Step 1: Create the overview page**

```jsx
"use client";
import { useState } from 'react';
import { Users, BookOpen, ShoppingBag, User } from 'lucide-react';
import { StatCard } from '../../components/admin/StatCard';
import { NeedsAttention } from '../../components/admin/NeedsAttention';
import { RecentStudentsTable } from '../../components/admin/RecentStudentsTable';
import { ClassBreakdown } from '../../components/admin/ClassBreakdown';
import { DualAccessDrawer } from '../../components/admin/cleanup/DualAccessDrawer';
import { useStudents } from '../../lib/admin/useStudents';
import { useClasses } from '../../lib/admin/useClasses';
import { useDualAccessStudents } from '../../lib/admin/useDualAccessStudents';

export default function DashboardOverview() {
    const { students } = useStudents();
    const productClasses = useClasses('product');
    const talentClasses = useClasses('talent');
    const dual = useDualAccessStudents();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const productCount = students.filter(s => s.class && !s.avatarClass).length;
    const talentCount = students.filter(s => s.avatarClass && !s.class).length;
    const totalStudents = students.length;
    const classCount = productClasses.classes.length + talentClasses.classes.length;

    const attention = [];
    if (dual.users.length > 0) {
        attention.push({
            message: `${dual.users.length} student${dual.users.length !== 1 ? 's' : ''} have access to both Products and Talent.`,
            cta: 'Resolve',
            onResolve: () => setDrawerOpen(true),
        });
    }

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Students" value={totalStudents} color="bg-blue-100 text-blue-600" />
                <StatCard icon={BookOpen} label="Classes" value={classCount} color="bg-amber-100 text-amber-600" />
                <StatCard icon={ShoppingBag} label="Product students" value={productCount} color="bg-blue-100 text-blue-600" />
                <StatCard icon={User} label="Talent students" value={talentCount} color="bg-purple-100 text-purple-600" />
            </div>

            <NeedsAttention items={attention} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RecentStudentsTable students={students} />
                </div>
                <div>
                    <ClassBreakdown
                        students={students}
                        productClasses={productClasses.classes}
                        talentClasses={talentClasses.classes}
                    />
                </div>
            </div>

            <DualAccessDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onResolved={() => dual.refresh()}
            />
        </div>
    );
}
```

> **Note:** `DualAccessDrawer` is built in Task 33 — this file imports it ahead of time. The page won't render correctly until that task is done. That's OK; the build will succeed because the import is unused at module-load time only when the drawer state stays closed (which is the default). However, the import statement requires the file to exist. If Task 33 is delayed, comment out the import and the `<DualAccessDrawer/>` JSX line until then.

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/page.js
git commit -m "feat(dashboard): Overview page"
```

---

### Task 30: `/dashboard/students/page.js`

**Files:**
- Create: `src/app/dashboard/students/page.js`

- [ ] **Step 1: Create the students roster page**

```jsx
"use client";
import { useState } from 'react';
import { Search, MoreVertical } from 'lucide-react';
import { useStudents } from '../../../lib/admin/useStudents';
import { RolePill } from '../../../components/admin/RolePill';

export default function StudentsPage() {
    const { students, loading } = useStudents();
    const [q, setQ] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const filtered = students.filter(s => {
        const text = (s.displayName || s.email || '').toLowerCase();
        if (q && !text.includes(q.toLowerCase())) return false;
        if (roleFilter === 'products' && !s.class) return false;
        if (roleFilter === 'talent' && !s.avatarClass) return false;
        if (roleFilter === 'dual' && !(s.class && s.avatarClass)) return false;
        return true;
    });

    return (
        <div className="space-y-5 max-w-6xl">
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search students..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="all">All roles</option>
                    <option value="products">Products</option>
                    <option value="talent">Talent</option>
                    <option value="dual">Dual access</option>
                </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading students...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm text-gray-500">No students match.</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Class</th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(s => {
                                const role = s.class && s.avatarClass ? 'dual'
                                    : s.class ? 'class'
                                    : s.avatarClass ? 'avatarClass' : null;
                                return (
                                    <tr key={s.uid} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 text-sm text-gray-900">{s.displayName || '—'}</td>
                                        <td className="px-5 py-3"><RolePill role={role} size="xs" /></td>
                                        <td className="px-5 py-3 text-sm text-gray-600">{s.class || s.avatarClass || '—'}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{s.email}</td>
                                        <td className="px-5 py-3">
                                            <button className="text-gray-400 hover:text-gray-700 p-1.5 rounded hover:bg-gray-100 cursor-pointer" disabled>
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
```

> **Note:** The row-action (⋯ menu — reset password, delete) ships disabled in this task; wired up in Task 35 once the cleanup drawer + extracted `DeleteUsersModal` are available.

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/students/page.js
git commit -m "feat(dashboard): students roster page"
```

---

### Task 31: `/dashboard/classes/page.js`

**Files:**
- Create: `src/app/dashboard/classes/page.js`

- [ ] **Step 1: Create the classes page**

```jsx
"use client";
import { useState } from 'react';
import { collection, doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { useClasses } from '../../../lib/admin/useClasses';
import { useStudents } from '../../../lib/admin/useStudents';

function ClassesSection({ kind, title, classes, students, collectionName }) {
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');

    const studentCount = (classId) => students.filter(s =>
        kind === 'product' ? s.class === classId : s.avatarClass === classId
    ).length;

    const addClass = async () => {
        const id = name.trim().toLowerCase();
        if (id.length < 2) return;
        const display = id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ');
        await setDoc(doc(db, collectionName, id), { name: display });
        setName(''); setAdding(false);
    };

    const renameClass = async (id) => {
        const newName = editingName.trim();
        if (newName.length < 1) return;
        await updateDoc(doc(db, collectionName, id), { name: newName });
        setEditingId(null);
    };

    const deleteClass = async (id) => {
        if (!window.confirm(`Delete class "${id}"? Existing students/content keep their class assignment, but this class won't appear in dropdowns.`)) return;
        await deleteDoc(doc(db, collectionName, id));
    };

    return (
        <section className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
                    <Plus className="h-4 w-4" /> New class
                </button>
            </div>

            {adding && (
                <div className="flex gap-2 mb-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. morning-class" autoFocus
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <button onClick={addClass} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 cursor-pointer">Add</button>
                    <button onClick={() => { setAdding(false); setName(''); }} className="text-sm text-gray-500 hover:text-gray-700 px-2 cursor-pointer">Cancel</button>
                </div>
            )}

            <ul className="divide-y divide-gray-100">
                {classes.length === 0 && <li className="text-sm text-gray-500 py-4">No classes yet.</li>}
                {classes.map(c => (
                    <li key={c.id} className="flex items-center justify-between py-3">
                        {editingId === c.id ? (
                            <div className="flex gap-2 flex-1">
                                <input value={editingName} onChange={(e) => setEditingName(e.target.value)} autoFocus
                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm" />
                                <button onClick={() => renameClass(c.id)} className="text-sm text-blue-600 cursor-pointer">Save</button>
                                <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 cursor-pointer">Cancel</button>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">{c.name || c.id}</p>
                                    <p className="text-xs text-gray-400">{studentCount(c.id)} student{studentCount(c.id) !== 1 && 's'} &middot; id: <code>{c.id}</code></p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => { setEditingId(c.id); setEditingName(c.name || c.id); }}
                                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded cursor-pointer"><Edit2 className="h-3.5 w-3.5" /></button>
                                    <button onClick={() => deleteClass(c.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default function ClassesPage() {
    const product = useClasses('product');
    const talent = useClasses('talent');
    const { students } = useStudents();

    return (
        <div className="space-y-5 max-w-4xl">
            <ClassesSection kind="product" title="Product Classes" classes={product.classes} students={students} collectionName="classes" />
            <ClassesSection kind="talent"  title="Talent Classes"  classes={talent.classes}  students={students} collectionName="avatar-classes" />
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/classes/page.js
git commit -m "feat(dashboard): classes management page"
```

---

### Task 32: `/dashboard/content/page.js`

**Files:**
- Create: `src/app/dashboard/content/page.js`

- [ ] **Step 1: Create the content management page**

```jsx
"use client";
import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, where, writeBatch } from 'firebase/firestore';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { Edit, GripVertical, Trash2 } from 'lucide-react';
import { db, storage } from '../../../lib/firebase';
import { useClasses } from '../../../lib/admin/useClasses';
import { useSchoolConfig } from '../../../lib/useSchoolConfig';

export default function ContentPage() {
    const schoolConfig = useSchoolConfig();
    const platformsArray = schoolConfig?.platforms || ['products', 'avatars'];
    const showTalent = platformsArray.includes('avatars');
    const [tab, setTab] = useState('products');

    const product = useClasses('product');
    const talent = useClasses('talent');
    const classes = tab === 'talent' ? talent.classes : product.classes;
    const collectionName = tab === 'talent' ? 'avatars' : 'products';

    const [selectedClass, setSelectedClass] = useState('');
    const [items, setItems] = useState([]);
    const [dragged, setDragged] = useState(null);

    useEffect(() => {
        if (classes.length && !selectedClass) setSelectedClass(classes[0].id);
    }, [classes, selectedClass]);

    useEffect(() => {
        if (!selectedClass) { setItems([]); return; }
        const q = query(collection(db, collectionName), where('class', '==', selectedClass), orderBy('featuredOrder', 'asc'));
        const unsub = onSnapshot(q, (snap) => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, [collectionName, selectedClass]);

    const onDragStart = (i) => setDragged(items[i]);
    const onDragOver = (e, i) => {
        e.preventDefault();
        const over = items[i];
        if (!dragged || dragged === over) return;
        const next = items.filter(x => x !== dragged);
        next.splice(i, 0, dragged);
        setItems(next);
    };
    const onDragEnd = async () => {
        setDragged(null);
        const batch = writeBatch(db);
        items.forEach((item, i) => batch.update(doc(db, collectionName, item.id), { featuredOrder: i }));
        await batch.commit();
    };
    const onDelete = async (item) => {
        if (!window.confirm(`Delete "${item.name}"? This will remove it permanently.`)) return;
        await deleteDoc(doc(db, collectionName, item.id));
        (item.imageUrls || []).forEach(u => deleteObject(storageRef(storage, u)).catch(() => {}));
        (item.videoUrls || []).forEach(u => deleteObject(storageRef(storage, u)).catch(() => {}));
    };

    return (
        <div className="space-y-4 max-w-5xl">
            <div className="flex gap-1 border-b border-gray-200">
                <button onClick={() => setTab('products')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${tab === 'products' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    Products
                </button>
                {showTalent && (
                    <button onClick={() => setTab('talent')}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${tab === 'talent' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        Talent
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Class:</label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    {classes.length === 0 && <option value="">No classes yet</option>}
                    {classes.map(c => (<option key={c.id} value={c.id}>{c.name || c.id}</option>))}
                </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {items.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">No content in this class yet.</div>
                ) : items.map((it, i) => (
                    <div key={it.id} draggable
                        onDragStart={() => onDragStart(i)}
                        onDragOver={(e) => onDragOver(e, i)}
                        onDragEnd={onDragEnd}
                        className="flex items-center justify-between p-3 border-b last:border-b-0 cursor-move">
                        <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                            <img src={it.imageUrl || it.imageUrls?.[0]} alt={it.name}
                                className="h-10 w-10 rounded object-cover" />
                            <div>
                                <p className="font-medium text-gray-900 text-sm">{it.name}</p>
                                <p className="text-xs text-gray-500">{it.vendor}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button disabled className="p-2 text-gray-300 cursor-not-allowed" title="Edit (use storefront for now)">
                                <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => onDelete(it)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

> **Note:** the Edit affordance is disabled here for v1 — editing still happens via the storefront's existing `CreateItemForm` reachable from the vendor's own dashboard. Hooking edit into the new dashboard is a follow-up (out of scope per spec §12).

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/content/page.js
git commit -m "feat(dashboard): content management page"
```

---

## Phase 6 — Dual-access cleanup

### Task 33: `ResolveOptions` component

**Files:**
- Create: `src/components/admin/cleanup/ResolveOptions.jsx`

- [ ] **Step 1: Create**

```jsx
"use client";
import { useState } from 'react';

export function ResolveOptions({ student, onResolve, busy }) {
    const [choice, setChoice] = useState(null);
    const [splitUsername, setSplitUsername] = useState('');

    const Option = ({ value, label, hint }) => (
        <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${choice === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="radio" name="resolve" value={value} checked={choice === value} onChange={() => setChoice(value)}
                className="mt-1" />
            <div>
                <p className="font-medium text-sm text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
            </div>
        </label>
    );

    const apply = () => {
        if (!choice) return;
        if (choice === 'split' && splitUsername.trim().length < 3) return;
        onResolve({ choice, splitUsername: splitUsername.trim() });
    };

    return (
        <div className="space-y-3">
            <Option value="keep-class" label="Keep Products only" hint={`Drop avatarClass=${student.avatarClass}; student keeps class=${student.class}.`} />
            <Option value="keep-avatarClass" label="Keep Talent only" hint={`Drop class=${student.class}; student keeps avatarClass=${student.avatarClass}.`} />
            <Option value="split" label="Split into 2 accounts" hint="Current account becomes Products only. A new Talent account is created with a fresh username." />

            {choice === 'split' && (
                <div className="ml-7">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New username for the Talent account</label>
                    <input value={splitUsername} onChange={(e) => setSplitUsername(e.target.value)} placeholder="e.g. alex-talent"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
                <button disabled={!choice || busy} onClick={apply}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 cursor-pointer">
                    {busy ? 'Applying...' : 'Apply →'}
                </button>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/cleanup/ResolveOptions.jsx
git commit -m "feat(cleanup): ResolveOptions component"
```

---

### Task 34: `DualAccessDrawer` component

**Files:**
- Create: `src/components/admin/cleanup/DualAccessDrawer.jsx`

- [ ] **Step 1: Create the drawer**

```jsx
"use client";
import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { CheckCircle2, X } from 'lucide-react';
import { functions } from '../../../lib/firebase';
import { useDualAccessStudents } from '../../../lib/admin/useDualAccessStudents';
import { ResolveOptions } from './ResolveOptions';
import { generateFriendlyPassword } from '../wizard/passwordGenerator';
import { StepCredentialHandoff } from '../wizard/StepCredentialHandoff';
import { useSchoolConfig } from '../../../lib/useSchoolConfig';

export function DualAccessDrawer({ open, onClose, onResolved }) {
    const { users, loading, refresh } = useDualAccessStudents();
    const schoolConfig = useSchoolConfig();
    const [index, setIndex] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [splitResult, setSplitResult] = useState(null); // { username, password } after a Split

    useEffect(() => { if (open) { setIndex(0); setError(null); setSplitResult(null); refresh(); } }, [open]);

    if (!open) return null;

    const current = users[index];
    const allDone = !loading && users.length === 0;

    const apply = async ({ choice, splitUsername }) => {
        if (!current) return;
        setBusy(true);
        setError(null);
        try {
            if (choice === 'keep-class') {
                const fn = httpsCallable(functions, 'convertStudentRole');
                await fn({ uid: current.uid, keepRole: 'class' });
                onResolved?.();
                advance();
            } else if (choice === 'keep-avatarClass') {
                const fn = httpsCallable(functions, 'convertStudentRole');
                await fn({ uid: current.uid, keepRole: 'avatarClass' });
                onResolved?.();
                advance();
            } else if (choice === 'split') {
                // 1. Convert current to products only
                const conv = httpsCallable(functions, 'convertStudentRole');
                await conv({ uid: current.uid, keepRole: 'class' });
                // 2. Create a new talent account with the split username
                const password = generateFriendlyPassword();
                const create = httpsCallable(functions, 'createAvatarVendor');
                await create({ username: splitUsername, password, avatarClass: current.avatarClass });
                setSplitResult({ username: splitUsername, password });
                onResolved?.();
                // Don't advance until user closes the credential handoff
            }
        } catch (e) {
            setError(e.message || 'Failed to apply.');
        } finally {
            setBusy(false);
        }
    };

    const advance = () => {
        refresh();
        if (index >= users.length - 1) {
            // wait for refresh; the list will become empty and we'll show "all clean"
            setIndex(0);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/30" onClick={onClose} />
            <aside className="w-full max-w-md bg-white border-l border-gray-200 flex flex-col">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">Resolve dual access</p>
                        <h2 className="text-base font-semibold text-gray-900">Cleanup</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {loading && <p className="text-sm text-gray-500">Loading...</p>}

                    {!loading && allDone && (
                        <div className="text-center py-10">
                            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                            <p className="font-semibold text-gray-900">All clean</p>
                            <p className="text-sm text-gray-500 mt-1">No students with dual access remain.</p>
                        </div>
                    )}

                    {!loading && current && !splitResult && (
                        <>
                            <p className="text-xs text-gray-400 mb-2">{index + 1} of {users.length}</p>
                            <h3 className="text-lg font-semibold text-gray-900">{current.displayName || current.email}</h3>
                            <p className="text-xs text-gray-500 mb-3">
                                Currently has <strong>class={current.class}</strong> and <strong>avatarClass={current.avatarClass}</strong>.
                            </p>
                            <ResolveOptions student={current} onResolve={apply} busy={busy} />
                            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
                        </>
                    )}

                    {splitResult && (
                        <StepCredentialHandoff
                            schoolName={schoolConfig?.displayName || 'My School'}
                            role="Talent"
                            username={splitResult.username}
                            password={splitResult.password}
                            loginUrl={schoolConfig?.subdomain ? `https://${schoolConfig.subdomain}.shopnext.app` : window.location.origin}
                            onDone={() => { setSplitResult(null); advance(); }}
                        />
                    )}
                </div>
            </aside>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/cleanup/DualAccessDrawer.jsx
git commit -m "feat(cleanup): DualAccessDrawer"
```

---

### Task 35: Verify dashboard end-to-end (manual)

**Files:** none (verification)

- [ ] **Step 1: Run dev server**

```bash
npm run dev
```
Expected: app boots on `http://localhost:3000`.

- [ ] **Step 2: Sign in as a teacher account, navigate to `/dashboard`**

Expected:
- Sidebar shows: Overview · Students · Classes · Content · Settings · View storefront.
- Topbar shows the school name and an `+ Add Student` action.
- Stats render with real counts. RecentStudentsTable shows last 8.
- ClassBreakdown shows per-class split bars.

- [ ] **Step 3: Click Add Student, run through all 3 steps**

Verify:
- Step 1: cannot continue without picking a role.
- Step 2: cannot create with a too-short username/password; create-new-class works inline.
- Step 3: copy buttons work; Download PDF produces a valid file; Done returns to dashboard.

- [ ] **Step 4: Try to create with a username that already exists**

Expected: red error toast in the wizard saying "A user with this username already exists." No claim merge.

- [ ] **Step 5: Resolve the production dual-access account**

The audit found 1 dual-access account. Open the Needs Attention panel → Resolve drawer → pick **Keep Products only**. Refresh the dashboard. Expected: Needs Attention is now empty/hidden.

- [ ] **Step 6: Commit a verification note**

Append to `CHANGELOG.md`:

```markdown
## 2026-05-04 — Phase 5: Dashboard end-to-end verified

- /dashboard, Add Student wizard, dual-access cleanup drawer all working against deployed cloud functions.
```

```bash
git add CHANGELOG.md
git commit -m "docs: changelog for Phase 5 verification"
```

---

## Phase 7 — `/admin` polish

### Task 36: `/admin/layout.js`

**Files:**
- Create: `src/app/admin/layout.js`

- [ ] **Step 1: Create the layout**

```jsx
"use client";
import { AdminShell } from '../../components/admin/AdminShell';
import { useAdminAuth } from '../../lib/auth/useAdminAuth';

const ADMIN_ITEMS = [
    { href: '/admin',    label: 'Customers', icon: 'Users' },
    { href: '/register', label: 'Registration', icon: 'BookOpen' },
    { href: '/',         label: 'Storefront', icon: 'ExternalLink', external: true },
];

export default function AdminLayout({ children }) {
    const auth = useAdminAuth('superAdmin');
    return (
        <AdminShell
            requirement="superAdmin"
            auth={auth}
            sidebarItems={ADMIN_ITEMS}
            schoolName="ShopNext Admin"
            schoolColor="#7c3aed"
            logoIcon="ShieldCheck"
            title="Platform"
        >
            {children}
        </AdminShell>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/layout.js
git commit -m "feat(admin): /admin layout adopts AdminShell"
```

---

### Task 37: Refactor `/admin/page.js` to drop its own layout

**Files:**
- Modify: `src/app/admin/page.js`

- [ ] **Step 1: Strip outer layout, leave only page content**

Edit `src/app/admin/page.js`. Replace the outermost `<div className="min-h-screen bg-gray-50">...</div>` block (everything from line ~209 to the closing `</div>` before `;` and the inner `<header>` and `<footer>`) so the component returns only the page content. The `useEffect` auth gating is no longer needed because the new layout handles it.

The component's return should now be:

```jsx
return (
    <div className="space-y-6 max-w-6xl">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
            <p className="text-gray-500 mt-1">Manage all customer instances and subscriptions.</p>
        </div>

        {/* Stats Grid (keep existing — adding 5th card next task) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={Users} label="Total Customers" value={schools.length} color="bg-blue-100 text-blue-600" />
            <StatCard icon={DollarSign} label="Monthly Revenue" value={`$${totalRevenue.toLocaleString()}`} color="bg-green-100 text-green-600" />
            <StatCard icon={GraduationCap} label="Student Reach" value={totalStudents > 0 ? totalStudents.toLocaleString() : '—'} color="bg-purple-100 text-purple-600" />
            <StatCard icon={Activity} label="Active Instances" value={`${activeCount}/${schools.length}`} subtext={expiringCount > 0 ? `${expiringCount} expiring soon` : undefined} color="bg-amber-100 text-amber-600" />
            {/* Dual-access stat card added in Task 38 */}
        </div>

        {/* Customer Table (unchanged) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* ... keep existing table block as-is ... */}
        </div>
    </div>
);
```

Also:
- Remove the `import { GraduationCap, ShieldCheck, ... }` items that were used only by the old header.
- Remove the `useEffect` that did the `onIdTokenChanged` auth check.
- Remove the early returns for `loading` and `!user` (the layout handles these).
- Keep the schools subscription `useEffect` and all derived state (`filtered`, `totalRevenue`, `totalStudents`, `activeCount`, `expiringCount`).
- Replace the in-file `StatCard` definition with `import { StatCard } from '../../components/admin/StatCard';`.

- [ ] **Step 2: Run dev server, verify `/admin` still works**

```bash
npm run dev
```
Visit `/admin` as super admin. Expected: same data, now wrapped in the `AdminShell` (sidebar + topbar match `/dashboard`).

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.js
git commit -m "refactor(admin): adopt AdminShell, drop in-page layout"
```

---

### Task 38: Add dual-access stat card to `/admin`

**Files:**
- Modify: `src/app/admin/page.js`

- [ ] **Step 1: Add the hook + 5th card**

In `src/app/admin/page.js`, add the import:

```jsx
import { useDualAccessStudents } from '../../lib/admin/useDualAccessStudents';
import { AlertTriangle } from 'lucide-react';
```

Inside the component, after the existing `useState`/`useEffect` block, add:

```jsx
const dualAccess = useDualAccessStudents();
```

In the stats grid, add as the 5th card:

```jsx
<StatCard
    icon={AlertTriangle}
    label="Dual-access students"
    value={dualAccess.users.length}
    subtext={dualAccess.users.length > 0 ? 'Across all schools' : undefined}
    color="bg-amber-100 text-amber-600"
/>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/page.js
git commit -m "feat(admin): dual-access students stat card"
```

---

## Phase 8 — Cut over: delete in-page admin

### Task 39: Update `Header.js` to route by role

**Files:**
- Modify: `src/components/Header.js`

- [ ] **Step 1: Read the current Header**

```bash
cat src/components/Header.js
```
Confirm it currently has a "Dashboard" button that navigates within the same page.

- [ ] **Step 2: Replace with router-based dashboard routing**

Edit `src/components/Header.js`. The Dashboard button should navigate by URL via `next/link` based on the user's claims, using `dashboardRouteFor`:

```jsx
"use client";
import Link from 'next/link';
import { LogOut, ShieldCheck, UserCircle } from 'lucide-react';
import { dashboardRouteFor } from '../lib/auth/dashboardRoute';
import { SUPER_ADMIN_UID } from '../lib/firebase';

// (keep existing imports; reproduce the file as needed)

// Replace the existing in-page Dashboard button with:
{user && (() => {
    const route = dashboardRouteFor(user.customClaims, SUPER_ADMIN_UID, user.uid);
    if (!route) return null;
    return (
        <Link href={route} className="flex items-center gap-2 text-white px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 cursor-pointer text-sm font-medium">
            {route === '/admin' ? <ShieldCheck className="h-4 w-4" /> : <UserCircle className="h-4 w-4" />}
            <span className="hidden sm:inline">Dashboard</span>
        </Link>
    );
})()}
```

> **Note:** the existing Header is small (~60 lines). Adapt the snippet to match its prop signature and any local variables (`onSignOut`, `setView`, etc.). The key change is **the Dashboard button is now a link to `/dashboard` or `/admin`, not a `setView({ page: 'dashboard' })` call**. Remove the `setView` prop if it becomes unused.

- [ ] **Step 3: Manually verify**

```bash
npm run dev
```

- Sign in as a teacher → click Dashboard → lands on `/dashboard`.
- Sign in as super admin → click Dashboard → lands on `/admin`.
- Sign in as a viewer → no Dashboard button.

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.js
git commit -m "feat(header): route dashboard button to /dashboard or /admin"
```

---

### Task 40: Delete `SuperAdminDashboard` and modals from `page.js`

**Files:**
- Modify: `src/app/page.js`

- [ ] **Step 1: Locate and remove the SuperAdminDashboard component**

The component spans roughly lines 1820-2200 of `src/app/page.js` (verify with `grep -n "const SuperAdminDashboard" src/app/page.js`). Delete the entire component definition.

Likewise delete:
- `DeleteUsersModal` (search for `const DeleteUsersModal`)
- `ManageClassesModal` (search for `const ManageClassesModal`)
- The `setView({ page: 'dashboard' })` admin-tab routing inside the main `App` component's render switch (look for `case 'dashboard':` or equivalent in the page.js return).

- [ ] **Step 2: Remove the Dashboard tab from the page-level view switch**

In the App component's main `return` switch around line 2440-2480, the case that renders the in-page admin (matching `view.page === 'dashboard' && isSuperAdmin`) should be removed. Super admins now go to `/admin` via the Header link instead.

Vendors (with `class` or `avatarClass` claim) keep their existing `<VendorDashboard>` rendering — that's their content-editing surface, not the admin.

- [ ] **Step 3: Remove unused state/imports**

After deletion, run:

```bash
npm run lint 2>&1 | tail -30
```
Expected: any unused `useState` declarations for `adminTab`, `newUser`, `newViewer`, `migrationMsg`, `showDeleteUsersModal`, `showManageClassesModal`, etc., flagged. Remove those declarations.

Remove imports that are no longer used: `httpsCallable`, `setDoc` (from firebase/firestore — only if not used elsewhere; check first), `FolderPlus`, `RefreshCw`, etc. Use `npm run lint` as the source of truth.

- [ ] **Step 4: Run dev server & verify the storefront still works**

```bash
npm run dev
```

- Visit `/` — storefront renders normally with products and talent.
- A logged-in vendor can still see their VendorDashboard with their products/talents.
- The page is significantly shorter (target: page.js ≤ 1700 lines).

- [ ] **Step 5: Commit**

```bash
git add src/app/page.js
git commit -m "refactor(page): remove embedded SuperAdminDashboard + modals"
```

---

### Task 41: Final verification per spec §10

**Files:** none (verification)

Run through the full Testing plan from spec section 10:

- [ ] **Step 1: Backend unit tests**

```bash
cd functions && npm test
```
Expected: 12 passing.

- [ ] **Step 2: Lint**

```bash
npm run lint
```
Expected: zero errors.

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: build succeeds with no errors.

- [ ] **Step 4: Manual golden paths (do all 6 from spec §10)**

  1. Teacher creates a Product Vendor end-to-end — student appears in roster, can sign in, edits products. ✓
  2. Teacher creates a Talent Vendor — analogous. ✓
  3. Teacher tries duplicate username — clear error, no claim merge. ✓
  4. Teacher resolves a dual-access student via "Keep Products" — `avatarClass` claim is gone after token refresh. ✓
  5. Teacher splits a dual-access student — new Talent account exists, original retains Products only. ✓
  6. Super admin opens `/admin`, sees the dual-access stat, drills into a school's affected students. ✓

- [ ] **Step 5: Regression check**

  - Storefront loads, products and avatars render. ✓
  - Vendor sign-in still works. ✓
  - Stripe registration flow still works. ✓
  - `/settings` (custom domain, branding) still works. ✓

- [ ] **Step 6: Commit a release-note CHANGELOG entry and push**

Append to `CHANGELOG.md`:

```markdown
## 2026-05-04 — Phase 8 complete: admin redesign shipped

- Teacher admin lifted to `/dashboard` with sidebar, overview, stats, students roster, classes manager, and content reorder.
- `/admin` super-admin polished and adopts the same shell.
- 3-step Add Student wizard with role gate, class picker, friendly password generator, and PDF credential handout.
- Dual-access cleanup drawer wired up; one-click resolution per student.
- `src/app/page.js` shrunk substantially (admin tab and 2 modals removed).
- Net new test coverage: 12 cloud function tests in `functions/test/cloud-functions.test.js`.
```

```bash
git add CHANGELOG.md
git commit -m "docs: changelog for full admin redesign release"
git push
```

---

## Self-review checklist (run before handing off)

- [ ] **Spec coverage:** every spec section has a task or set of tasks implementing it.
- [ ] **No placeholders:** no TBD/TODO/"add validation" lines in any task.
- [ ] **Type/name consistency:** `convertStudentRole`, `listDualAccessStudents`, `useDualAccessStudents`, etc. match between definition and call sites.
- [ ] **Imports valid:** every component/file imported in a later task is created in an earlier one.
- [ ] **Commit hygiene:** every task ends with a commit; no batched dumps.
