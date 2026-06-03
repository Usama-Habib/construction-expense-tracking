import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Firebase project configuration
// Get this from Firebase Console > Project Settings > Your apps > Web app
const firebaseConfig = {
  apiKey: "AIzaSyAA8gaIW_6mWrF5AVnea24y9Wm41LivslA",
  authDomain: "expensetracking-4d4ae.firebaseapp.com",
  projectId: "expensetracking-4d4ae",
  storageBucket: "expensetracking-4d4ae.firebasestorage.app",
  messagingSenderId: "939383424247",
  appId: "1:939383424247:web:9226a882fe4bad02417ff2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
