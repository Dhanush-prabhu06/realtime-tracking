import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database"; // Added Realtime Database
import { getFirestore } from "firebase/firestore"; // Firestore

const firebaseConfig = {
  apiKey: "AIzaSyDFIyBhMvQL3q3nqk6ya1X7ZJIZUIUi-iY",
  authDomain: "mini-proj-c3518.firebaseapp.com",
  projectId: "mini-proj-c3518",
  storageBucket: "mini-proj-c3518.appspot.com",
  messagingSenderId: "566804339681",
  appId: "1:566804339681:web:a9a809807b117dee8f50a0",
  measurementId: "G-21WHRVSH7B",
  databaseURL: "https://mini-proj-c3518-default-rtdb.firebaseio.com/", // Realtime Database URL
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app); // Authentication
export const database = getDatabase(app); // Realtime Database
export const firestore = getFirestore(app); // Firestore
