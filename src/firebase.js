// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// 👇 Aquí va tu configuración (la que me pasaste)
const firebaseConfig = {
  apiKey: "AIzaSyAQRJZQhYxruxdVK0vv8cNAcOSJC0G3upM",
  authDomain: "gastos-familia-a3da3.firebaseapp.com",
  projectId: "gastos-familia-a3da3",
  storageBucket: "gastos-familia-a3da3.firebasestorage.app",
  messagingSenderId: "105658466585",
  appId: "1:105658466585:web:7ee5014da645f101718588",
  measurementId: "G-WZYLRF2YVW"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar Firestore y Auth
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
