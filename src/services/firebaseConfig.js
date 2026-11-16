import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import {
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_DATABASE_URL,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
} from '@env';

const PLACEHOLDER_MARKERS = [
  'your_firebase_api_key_here',
  'your-project-id',
  '000000000000',
];

const sanitizeUrl = url => {
  if (typeof url === 'string' && /^https?:\/\/.+/i.test(url.trim())) {
    return url.trim();
  }
  return 'https://your-project-id-default-rtdb.firebaseio.com';
};

export const firebaseConfig = {
  apiKey: FIREBASE_API_KEY || 'your_firebase_api_key_here',
  authDomain: FIREBASE_AUTH_DOMAIN || 'your-project-id.firebaseapp.com',
  databaseURL: sanitizeUrl(FIREBASE_DATABASE_URL),
  projectId: FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: FIREBASE_STORAGE_BUCKET || 'your-project-id.firebasestorage.app',
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
};

export const isFirebaseConfigured = () => {
  const requiredValues = [
    firebaseConfig.apiKey,
    firebaseConfig.databaseURL,
    firebaseConfig.projectId,
    firebaseConfig.appId,
  ];

  return requiredValues.every(value => {
    if (!value || typeof value !== 'string' || !value.trim()) {
      return false;
    }
    return !PLACEHOLDER_MARKERS.some(marker => value.includes(marker));
  });
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
  if (typeof getReactNativePersistence === 'function') {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } else {
    auth = getAuth(app);
  }
} catch (error) {
  auth = getAuth(app);
}

const db = getDatabase(app);

export { app, auth, db };
