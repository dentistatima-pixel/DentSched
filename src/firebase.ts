// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

export { app, analytics };
