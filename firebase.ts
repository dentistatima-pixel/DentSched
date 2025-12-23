
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSth7Hlb0ObSqOAKBw_4vpArYxypWdQ8o",
  authDomain: "dentsched-82b86.firebaseapp.com",
  databaseURL: "https://dentsched-82b86-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dentsched-82b86",
  storageBucket: "dentsched-82b86.firebasestorage.app",
  messagingSenderId: "221041189478",
  appId: "1:221041189478:web:1dc2f2306d50f3de2fc3a7",
  measurementId: "G-64MESE2VPW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database with explicit URL for regional resolution
const db = getDatabase(app, firebaseConfig.databaseURL);

let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn("Firebase Analytics initialization skipped:", err.message);
  });
}

export { app, analytics, db };
