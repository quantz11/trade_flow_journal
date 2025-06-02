
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

let app: FirebaseApp;
let dbInstance: Firestore; // Use a local variable for initialization

try {
  // Check for common placeholder values which indicate missing configuration
  if (
    !firebaseConfig.projectId || firebaseConfig.projectId === "YOUR_PROJECT_ID" ||
    !firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY"
  ) {
    console.error(
      "Firebase configuration in src/lib/config.ts appears to be using placeholder values (e.g., 'YOUR_PROJECT_ID', 'YOUR_API_KEY') " +
      "or essential values are missing. Please ensure your Firebase environment variables " +
      "(e.g., NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_API_KEY in your .env or environment) " +
      "are correctly set. Firebase initialization will likely fail."
    );
    // Firebase SDK will throw its own specific error below if config is invalid.
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
    `(check your .env file and src/lib/config.ts) or Firestore not being enabled for your project. ` +
    `Original error: ${errorMessage}`
  );
}

// Export the initialized instances.
// If an error was thrown above, the module loading would have stopped,
// and this `db` would effectively be uninitialized from the perspective of importers,
// leading to the `!db` check in firestore-service.ts to fail.
export { app, dbInstance as db };
