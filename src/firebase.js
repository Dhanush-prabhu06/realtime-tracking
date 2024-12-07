import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDFIyBhMvQL3q3nqk6ya1X7ZJIZUIUi-iY",
  authDomain: "mini-proj-c3518.firebaseapp.com",
  projectId: "mini-proj-c3518",
  storageBucket: "mini-proj-c3518.firebasestorage.app",
  messagingSenderId: "566804339681",
  appId: "1:566804339681:web:a9a809807b117dee8f50a0",
  measurementId: "G-21WHRVSH7B",
  databaseURL: "https://mini-proj-c3518-default-rtdb.firebaseio.com/", // Ensure Realtime Database URL is added
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const firestore = getFirestore(app); // Initialize Firestore
