
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
const analytics = getAnalytics(app);

const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, db, storage };
