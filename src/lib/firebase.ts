import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export interface FirebaseConfigInput {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const LOCAL_CONFIG_KEY = 'lifeos_firebase_config';

export function getSavedFirebaseConfig(): FirebaseConfigInput | null {
  const envKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProject = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (envKey && envProject) {
    return {
      apiKey: envKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProject}.firebaseapp.com`,
      projectId: envProject,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProject}.firebasestorage.app`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }

  try {
    const raw = localStorage.getItem(LOCAL_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FirebaseConfigInput;
    if (parsed.apiKey && parsed.projectId) return parsed;
  } catch {
    return null;
  }
  return null;
}

export function saveLocalFirebaseConfig(config: FirebaseConfigInput | null): void {
  if (!config) {
    localStorage.removeItem(LOCAL_CONFIG_KEY);
  } else {
    localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(config));
  }
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

export function initFirebaseIfConfigured(): {
  configured: boolean;
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
} {
  if (appInstance && authInstance && firestoreInstance && storageInstance) {
    return {
      configured: true,
      app: appInstance,
      auth: authInstance,
      firestore: firestoreInstance,
      storage: storageInstance,
    };
  }

  const config = getSavedFirebaseConfig();
  if (!config) {
    return { configured: false, app: null, auth: null, firestore: null, storage: null };
  }

  appInstance = getApps().length ? getApps()[0] : initializeApp(config);
  authInstance = getAuth(appInstance);
  firestoreInstance = getFirestore(appInstance);
  storageInstance = getStorage(appInstance);

  return {
    configured: true,
    app: appInstance,
    auth: authInstance,
    firestore: firestoreInstance,
    storage: storageInstance,
  };
}

export function getAllowedEmail(): string {
  return (import.meta.env.VITE_ALLOWED_EMAIL || '').trim().toLowerCase();
}

export async function signInWithGoogle(): Promise<User> {
  const { auth } = initFirebaseIfConfigured();
  if (!auth) throw new Error('Firebase chưa được cấu hình.');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const allowed = getAllowedEmail();
  if (allowed && result.user.email?.toLowerCase() !== allowed) {
    await signOut(auth);
    throw new Error(`Tài khoản ${result.user.email} không được phép truy cập ứng dụng cá nhân này.`);
  }
  return result.user;
}

export async function signOutFirebase(): Promise<void> {
  const { auth } = initFirebaseIfConfigured();
  if (auth) await signOut(auth);
}

export function subscribeAuth(cb: (user: User | null) => void): () => void {
  const { auth } = initFirebaseIfConfigured();
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    const allowed = getAllowedEmail();
    if (user && allowed && user.email?.toLowerCase() !== allowed) {
      signOut(auth);
      cb(null);
      return;
    }
    cb(user);
  });
}
