
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { firebaseConfig } from "./config";

let app: FirebaseApp;
let dbInstance: Firestore; // Use a local variable for initialization
let authInstance: Auth;

try {
  // Check for common placeholder values or missing/empty configuration
  const criticalConfigMissing =
    !firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY" || firebaseConfig.apiKey.trim() === "" ||
    !firebaseConfig.projectId || firebaseConfig.projectId === "YOUR_PROJECT_ID" || firebaseConfig.projectId.trim() === "" ||
    !firebaseConfig.authDomain || firebaseConfig.authDomain.trim() === "" ||
    !firebaseConfig.storageBucket || firebaseConfig.storageBucket.trim() === "" ||
    !firebaseConfig.messagingSenderId || firebaseConfig.messagingSenderId.trim() === "" ||
    !firebaseConfig.appId || firebaseConfig.appId.trim() === "";

  if (criticalConfigMissing) {
    console.error(
      "CRITICAL FIREBASE CONFIGURATION ERROR: One or more Firebase configuration values (apiKey, projectId, authDomain, etc.) are missing, are still set to placeholder values (e.g., 'YOUR_PROJECT_ID'), or are empty strings. " +
      "This will cause Firebase initialization to fail. " +
      "Please ensure your Firebase environment variables (e.g., NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID) are correctly set in your .env file for local development, " +
      "AND ALSO in your Vercel (or other hosting provider) project's environment variable settings for deployed environments. " +
      "Current config being checked:", firebaseConfig
    );
    // Firebase SDK will likely throw its own specific error below, but this log helps pinpoint the issue.
  }

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  dbInstance = getFirestore(app);

  if (!dbInstance) {
    // This case is unlikely as getFirestore usually throws on failure,
    // but it's a safeguard.
    throw new Error(
      "Firestore initialization (getFirestore) returned a falsy value. " +
      "This could indicate that Firestore is not enabled for your project, " +
      "or the Firebase app configuration is invalid."
    );
  }
  authInstance = getAuth(app); // Get Auth instance

} catch (e) {
  const errorMessage = e instanceof Error ? e.message : String(e);
  console.error(
    "CRITICAL: Firebase/Firestore initialization failed in src/lib/firebase.ts. Error:",
    errorMessage,
    // Log the original error object if available and helpful
    e instanceof Error ? e.stack : ''
  );
  // Re-throw a more user-friendly error that guides towards checking config.
  throw new Error(
    `Firebase/Firestore initialization failed. This is often due to incorrect Firebase configuration ` +
    `(check your .env file AND your hosting provider's environment variable settings) or Firestore not being enabled for your project. ` +
    `Original error: ${errorMessage}`
  );
}

// Export the initialized instances.
export { app, dbInstance as db, authInstance as auth }; // Export auth
