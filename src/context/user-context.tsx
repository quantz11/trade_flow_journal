
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';

const LOCAL_STORAGE_USERNAME_KEY = 'tradeflow_username';

interface UserContextType {
  user: User | null; // Add Firebase User object
  username: string | null;
  isLoadingUser: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); // Use Firebase User object
  const [username, setUsername] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true); // To track initial load
  const router = useRouter();

  useEffect(() => {
    // Try to load username from localStorage on initial mount
    try {
      // Remove localStorage username as Firebase Auth is the source of truth now
      localStorage.removeItem(LOCAL_STORAGE_USERNAME_KEY);
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      // Potentially in a non-browser environment or localStorage is disabled
    }

    // Set up Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // You might fetch user details (like a display name) from Firestore here if needed
        setUsername(firebaseUser.displayName || firebaseUser.email); // Set username from Firebase user
      } else {
        setUsername(null);
      }
      setIsLoadingUser(false); // Authentication state is determined
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []);

  // Firebase Authentication login
  const login = useCallback(async (email: string, password: string) => {
    setIsLoadingUser(true); // Start loading
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged listener will handle setting user and username
      // router.push('/journal'); // Redirect is handled by the effect reacting to user change or in the component
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      // Handle login errors (e.g., show error message to user)
      throw error; // Re-throw the error so calling component can handle it
    } finally {
       // setIsLoadingUser(false); // Let the onAuthStateChanged listener set this
    }
  }, []);

  // Firebase Authentication logout
  const logout = useCallback(async () => {
    setIsLoadingUser(true); // Start loading (optional, depending on UI flow)
    try {
      await signOut(auth);
      // onAuthStateChanged listener will handle setting user and username to null
      // router.push('/login'); // Redirect is handled by the effect reacting to user change or in the component
    } catch (error) {
       console.error("Firebase Logout Error:", error);
       throw error;
    } finally {
      // setIsLoadingUser(false); // Let the onAuthStateChanged listener set this
    }
  }, []);

  // Effect to handle redirection based on authentication state
   useEffect(() => {
       // Only redirect after the initial loading is complete
       if (!isLoadingUser) {
           const requiresAuth = router.pathname !== '/login' && router.pathname !== '/signup'; // Adjust based on your public routes
           if (requiresAuth && !user) {
               router.push('/login');
           } else if (user && (router.pathname === '/login' || router.pathname === '/signup')) {
               router.push('/journal'); // Or your desired post-login page
           }
       }
   }, [user, isLoadingUser, router]); // Depend on user and isLoadingUser

  return (
    <UserContext.Provider value={{ username, isLoadingUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
