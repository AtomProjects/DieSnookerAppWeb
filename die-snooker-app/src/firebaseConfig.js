// src/firebaseConfig.js (example path)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-fFmAiherpGg3dbecT3v_Z-368kSEMPY", // Use this, or replace if you have a specific one
  authDomain: "die-snooker-app.firebaseapp.com",
  projectId: "die-snooker-app",
  storageBucket: "die-snooker-app.firebasestorage.app",
  messagingSenderId: "547283642216",
  appId: "1:547283642216:web:7f2fdc23dab5ce8430d8dd",
  measurementId: "G-GTFVZZ4LJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
