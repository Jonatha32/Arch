import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBP9LDjMtOiVZpBBQuANuNGAcQzmXp9AoA",
  authDomain: "arch-9c0d2.firebaseapp.com",
  projectId: "arch-9c0d2",
  storageBucket: "arch-9c0d2.firebasestorage.app",
  messagingSenderId: "702840291197",
  appId: "1:702840291197:web:71badbe1734c60c2b71614",
  measurementId: "G-NTPKHHT9ZG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);