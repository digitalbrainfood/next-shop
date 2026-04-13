import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
function getAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            return initializeApp({
                credential: cert(serviceAccount),
                projectId: serviceAccount.project_id,
            });
        } catch (err) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', err.message);
        }
    }

    return initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'nextshop-a17fe',
    });
}

const adminApp = getAdminApp();
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
