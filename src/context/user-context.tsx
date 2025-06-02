
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const LOCAL_STORAGE_USERNAME_KEY = 'tradeflow_username';

interface UserContextType {
  username: string | null;
  isLoadingUser: boolean;
  login: (name: string, shouldRedirect?: boolean) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true); // To track initial load
  const router = useRouter();

  useEffect(() => {
    // Try to load username from localStorage on initial mount
    try {
      const storedUsername = localStorage.getItem(LOCAL_STORAGE_USERNAME_KEY);
      if (storedUsername) {
        setUsername(storedUsername);
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      // Potentially in a non-browser environment or localStorage is disabled
    }
    setIsLoadingUser(false);
  }, []);

  const login = useCallback((name: string, shouldRedirect = true) => {
    if (name.trim()) {
      setUsername(name.trim());
      try {
        localStorage.setItem(LOCAL_STORAGE_USERNAME_KEY, name.trim());
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
      if (shouldRedirect) {
        router.push('/journal');
      }
    }
  }, [router]);

  const logout = useCallback(() => {
    setUsername(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_USERNAME_KEY);
    } catch (error) {
      console.error("Error removing from localStorage:", error);
    }
    router.push('/login');
  }, [router]);

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
