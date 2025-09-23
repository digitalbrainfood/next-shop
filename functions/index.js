/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Firebase Admin SDK
admin.initializeApp();

// --- SUPER ADMIN CONFIGURATION ---
// IMPORTANT: Replace with the same Super Admin UID you used in your page.jsx file
const SUPER_ADMIN_UID = "RnBej9HSStVJXA0rtIB02W0R1yv2";

/**
 * A callable Cloud Function that allows a Super Admin to create a new vendor.
 */
exports.createNewVendor = functions.https.onCall(async (data, context) => {
  // 1. Authentication Check: Ensure the person calling this function is logged in.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to perform this action."
    );
  }

  // 2. Authorization Check: Ensure the authenticated user is the Super Admin.
  if (context.auth.uid !== SUPER_ADMIN_UID) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You must be a super admin to perform this action."
    );
  }

  // 3. Validate Input: Get username and password from the client-side call.
  const username = data.username;
  const password = data.password;

  if (!(typeof username === "string" && username.length > 2) || !(typeof password === "string" && password.length >= 6)) {
      throw new functions.https.HttpsError(
          "invalid-argument",
          "The function must be called with a valid username (3+ characters) and a password (6+ characters)."
      );
  }

  // 4. Create the User: Use the powerful Admin SDK to create a new user in Firebase Authentication.
  try {
    const userRecord = await admin.auth().createUser({
      email: `${username}@shopnext.dev`, // Formats the username into the required email format
      password: password,
      displayName: username,
    });

    console.log("Successfully created new vendor:", userRecord.uid);
    // 5. Send Success Response: Let the client know it worked.
    return { result: `Successfully created vendor: ${username}` };
  } catch (error) {
    console.error("Error creating new user:", error);
    // 6. Send Error Response: Let the client know something went wrong.
    throw new functions.https.HttpsError("internal", error.message);
  }
});