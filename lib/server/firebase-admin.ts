import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

function getPrivateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
}

function hasAdminCredentials() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    getPrivateKey()
  );
}

let cachedApp: App | null = null;
let cachedDb: Firestore | null = null;

export function getFirebaseAdminApp(): App {
  if (!hasAdminCredentials()) {
    throw new Error('Firebase Admin is not configured');
  }

  if (cachedApp) {
    return cachedApp;
  }

  cachedApp =
    getApps()[0] ||
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: getPrivateKey(),
      }),
    });

  return cachedApp;
}

export function getFirebaseAdminDb(): Firestore {
  if (cachedDb) {
    return cachedDb;
  }

  cachedDb = getFirestore(getFirebaseAdminApp());
  return cachedDb;
}

export function isFirebaseAdminReady(): boolean {
  return hasAdminCredentials();
}
