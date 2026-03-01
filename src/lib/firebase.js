import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/** Initialised Firebase app instance. */
export const app = initializeApp(firebaseConfig);

/**
 * Lazily-resolved Firebase Analytics instance.
 * Resolves to null when analytics is not supported (e.g. blocked by adblocker).
 */
export const analytics = (async () => {
  try {
    return (await isSupported()) ? getAnalytics(app) : null;
  } catch (error) {
    // Analytics initialization silently handled
    return null;
  }
})();
