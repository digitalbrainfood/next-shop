// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDiCbTkbfn3LHAZnvlBxYZEDU1Ng_LftdA",
  authDomain: "nextshop-a17fe.firebaseapp.com",
  projectId: "nextshop-a17fe",
  storageBucket: "nextshop-a17fe.firebasestorage.app",
  messagingSenderId: "135352358131",
  appId: "1:135352358131:web:1eed317a816366721f1386",
  measurementId: "G-98EJ5Y0RMG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services and export them
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

export default app;