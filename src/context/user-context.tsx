
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Ensure this points to your initialized Firebase auth
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';

interface UserContextType {
  user: User | null;
  username: string | null; // This can be user.email or user.displayName
  isLoadingUser: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  // const router = useRouter(); // No longer needed for redirection here
  // const pathname = usePathname(); // No longer needed for redirection here

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setUsername(firebaseUser.displayName || firebaseUser.email);
      } else {
        setUsername(null);
      }
      setIsLoadingUser(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoadingUser(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user and username state
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      setIsLoadingUser(false); 
      throw error; 
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoadingUser(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will set user to null
    } catch (error) {
      console.error("Firebase Logout Error:", error);
      setIsLoadingUser(false);
      throw error;
    }
  }, []);

  // Removed redirection useEffect from UserProvider. AuthWrapper will handle this.

  return (
    <UserContext.Provider value={{ user, username, isLoadingUser, login, logout }}>
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
