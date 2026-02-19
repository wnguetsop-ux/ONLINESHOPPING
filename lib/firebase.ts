import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyALcMJIbHJxe_nX0Ja1zoeOOXNuYv8K2pw",
  authDomain: "stockflow-b6d58.firebaseapp.com",
  projectId: "stockflow-b6d58",
  storageBucket: "stockflow-b6d58.firebasestorage.app",
  messagingSenderId: "243302666157",
  appId: "1:243302666157:web:109d48f30f91d747b2db24"
};

// Initialize once — works in both browser and SSR (Next.js)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth   = getAuth(app);
const db     = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;