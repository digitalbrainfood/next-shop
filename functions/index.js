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

// --- SUPER ADMIN CONFIGURATION ---
// IMPORTANT: Replace with the same Super Admin UID you used in your page.jsx file
const SUPER_ADMIN_UID = "RnBej9HSStVJXA0rtIB02W0R1yv2";

/**
 * A callable Cloud Function that allows a Super Admin to create a new vendor.
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

    // 1. Authentication Check: Ensure the person calling this function is logged in.
    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in to perform this action."
      );
    }

    // 2. Authorization Check: Ensure the authenticated user is the Super Admin.
    if (auth.uid !== SUPER_ADMIN_UID) {
      throw new HttpsError(
        "permission-denied",
        "You must be a super admin to perform this action."
      );
    }

    // 3. Validate Input: Get username and password from the client-side call.
    const username = data?.username;
    const password = data?.password;

    if (!username || typeof username !== "string" || username.length < 3) {
      throw new HttpsError(
        "invalid-argument",
        "Username must be a string with at least 3 characters."
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      throw new HttpsError(
        "invalid-argument",
        "Password must be a string with at least 6 characters."
      );
    }

    // 4. Create the User: Use the powerful Admin SDK to create a new user in Firebase Authentication.
    try {
      const auth = getAuth();
      const userRecord = await auth.createUser({
        email: `${username}@shopnext.dev`, // Formats the username into the required email format
        password: password,
        displayName: username,
      });

      console.log("Successfully created new vendor:", userRecord.uid);
      
      // 5. Send Success Response: Let the client know it worked.
      return { 
        success: true,
        result: `Successfully created vendor: ${username}`,
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
      
      // 6. Send Error Response: Let the client know something went wrong.
      throw new HttpsError("internal", `Failed to create user: ${error.message}`);
    }
  }
);