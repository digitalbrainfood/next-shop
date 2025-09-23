// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);