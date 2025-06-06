
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, initializeAuth, browserLocalPersistence, type Auth } from "firebase/auth";
import { firebaseConfig } from "./config";

let app: FirebaseApp;
let dbInstance: Firestore;
let authInstance: Auth;

const criticalConfigMissing =
  !firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY" || firebaseConfig.apiKey.trim() === "" ||
  !firebaseConfig.authDomain || firebaseConfig.authDomain.trim() === "" ||
  !firebaseConfig.projectId || firebaseConfig.projectId === "YOUR_PROJECT_ID" || firebaseConfig.projectId.trim() === "" ||
  !firebaseConfig.storageBucket || firebaseConfig.storageBucket.trim() === "" ||
  !firebaseConfig.messagingSenderId || firebaseConfig.messagingSenderId.trim() === "" ||
  !firebaseConfig.appId || firebaseConfig.appId.trim() === "";

if (criticalConfigMissing) {
  const errorMessage =
    "CRITICAL FIREBASE CONFIGURATION ERROR: One or more Firebase configuration values (apiKey, projectId, authDomain, etc.) are missing, are still set to placeholder values (e.g., 'YOUR_PROJECT_ID'), or are empty strings. " +
    "This will cause Firebase initialization to fail. " +
    "Please ensure your Firebase environment variables (e.g., NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID) are correctly set in your .env file for local development, " +
    "AND ALSO in your Vercel (or other hosting provider) project's environment variable settings for deployed environments. " +
    "Current config being checked: " + JSON.stringify(firebaseConfig);
  console.error(errorMessage);
  throw new Error(errorMessage);
}

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    // Explicitly initialize Auth with browserLocalPersistence when the app is first initialized
    authInstance = initializeAuth(app, {
      persistence: browserLocalPersistence
    });
  } else {
    app = getApp();
    // For subsequent accesses or in hot-reloads, get the existing auth instance.
    // Firebase's getAuth() should respect the persistence set during the initial initializeAuth call for the app instance.
    authInstance = getAuth(app);
  }

  dbInstance = getFirestore(app);

  if (!dbInstance) {
    throw new Error(
      "Firestore initialization (getFirestore) returned a falsy value. " +
      "This could indicate that Firestore is not enabled for your project, " +
      "or the Firebase app configuration is invalid."
    );
  }
  if (!authInstance) {
    throw new Error(
      "Auth initialization (initializeAuth/getAuth) returned a falsy value. " +
      "This could indicate an issue with the Firebase app configuration."
    );
  }

} catch (e) {
  const errorMessage = e instanceof Error ? e.message : String(e);
  console.error(
    "CRITICAL: Firebase/Firestore initialization failed in src/lib/firebase.ts. Error:",
    errorMessage,
    e instanceof Error ? e.stack : ''
  );
  if (!errorMessage.startsWith("CRITICAL FIREBASE CONFIGURATION ERROR")) {
    throw new Error(
      `Firebase/Firestore initialization failed. This is often due to incorrect Firebase configuration ` +
      `(check your .env file AND your hosting provider's environment variable settings) or Firestore not being enabled for your project. ` +
      `Original error: ${errorMessage}`
    );
  }
  throw e;
}

export { app, dbInstance as db, authInstance as auth };
