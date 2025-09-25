// functions/index.js

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {setGlobalOptions} = require("firebase-functions/v2");

// Set global options for all functions
setGlobalOptions({
  region: "us-central1", // Match your Cloud Run region
  maxInstances: 10,
});

// Initialize the Firebase Admin SDK
initializeApp();

/**
 * A callable Cloud Function to create a new vendor user with custom claims.
 * This function can only be called by an authenticated user who is a super admin.
 */
exports.createNewVendor = onCall(
  {
    // Explicitly set runtime options
    timeoutSeconds: 60,
    memory: "256MiB",
    minInstances: 0,
    maxInstances: 10,
  },
  async (request) => {
    const {auth, data} = request;

    // 1. Authentication Check: Ensure the user calling this function is authenticated.
    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in to create a new vendor."
      );
    }

    // 2. Authorization Check: Ensure the user is a super admin.
    const isSuperAdmin = auth.token?.superAdmin === true;
    // We also check the UID directly for the initial hardcoded super admin.
    const isInitialAdmin = auth.uid === "RnBej9HSStVJXA0rtIB02W0R1yv2";

    if (!isSuperAdmin && !isInitialAdmin) {
      throw new HttpsError(
        "permission-denied",
        "You do not have permission to perform this action."
      );
    }

    // 3. Data Validation: Check if the required data was sent.
    const { username, password, class: className } = data || {};
    if (!username || !password || !className) {
      throw new HttpsError(
        "invalid-argument",
        "Please provide username, password, and class."
      );
    }

    try {
      // 4. Create the User in Firebase Authentication
      const authService = getAuth();
      const userRecord = await authService.createUser({
        email: `${username.trim()}@shopnext.dev`,
        password: password,
        displayName: username.trim(),
      });

      // 5. Set Custom Claims for the new user. This gives them their 'class' role.
      await authService.setCustomUserClaims(userRecord.uid, {
        class: className.trim(),
      });

      console.log("Successfully created new vendor:", userRecord.uid);

      // 6. Return a success message.
      return {
        success: true,
        result: `Successfully created user ${username} in class ${className}.`,
        uid: userRecord.uid
      };
    } catch (error) {
      console.error("Error creating new user:", error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-exists') {
        throw new HttpsError("already-exists", "A user with this username already exists.");
      } else if (error.code === 'auth/invalid-email') {
        throw new HttpsError("invalid-argument", "Invalid email format generated from username.");
      } else if (error.code === 'auth/weak-password') {
        throw new HttpsError("invalid-argument", "Password is too weak.");
      }
      
      // Handle potential errors, like if the email already exists.
      throw new HttpsError("internal", error.message);
    }
  }
);