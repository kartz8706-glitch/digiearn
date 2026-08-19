import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC1sBkBaJlw31gydJpy1nq2Va9ytnbxIhk",
  authDomain: "digi-earn-d6065.firebaseapp.com",
  databaseURL: "https://digi-earn-d6065-default-rtdb.firebaseio.com",
  projectId: "digi-earn-d6065",
  storageBucket: "digi-earn-d6065.firebasestorage.app",
  messagingSenderId: "356529310187",
  appId: "1:356529310187:web:0df9c480ad0c6c773d31ae",
  measurementId: "G-J46QDV3B6P",
};

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const realtimeDatabase = getDatabase(firebaseApp);
export const firestoreDatabase = getFirestore(firebaseApp);

export async function initializeAnalytics() {
  if (typeof window === "undefined" || !(await isSupported())) return null;
  return getAnalytics(firebaseApp);
}
