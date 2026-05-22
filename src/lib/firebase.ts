import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Config aus Umgebungsvariablen (NEVER hardcode in public repos!)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validierung - nur in Entwicklung für bessere Fehlermeldungen
if (import.meta.env.DEV) {
  const missingVars = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value || value === 'undefined')
    .map(([key]) => key);
  
  if (missingVars.length > 0) {
    console.error('❌ Fehlende Firebase Umgebungsvariablen:', missingVars);
    console.error('   Stelle sicher, dass .env.local existiert und der Vite Server neu gestartet wurde');
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
