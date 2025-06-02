
"use client";

import React, { useEffect, useState, type ReactNode } from 'react';
import { useUser } from '@/context/user-context';
import { useRouter, usePathname } from 'next/navigation';
import { seedAllInitialSettings } from '@/lib/firestore-service';
import { Loader2 } from 'lucide-react';

interface AuthWrapperProps {
  children: ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { username, isLoadingUser } = useUser(); // Removed 'login' as it's not used here for manual restore
  const router = useRouter();
  const pathname = usePathname();
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (isLoadingUser) {
      return; // Wait for UserProvider to load initial user state (from onAuthStateChanged)
    }

    // If user state is resolved (isLoadingUser is false) and there's no username,
    // and we are not on a public path, redirect to login.
    // Firebase's onAuthStateChanged in UserProvider is the source of truth for session restoration.
    if (!username && pathname !== '/login') { // Ensure /login is considered public
        router.push('/login');
    }
    
  }, [username, isLoadingUser, router, pathname]);

  useEffect(() => {
    if (username && !isLoadingUser) {
      setIsSeeding(true);
      seedAllInitialSettings(username)
        .catch(error => console.error("Failed to seed initial settings for user:", username, error))
        .finally(() => setIsSeeding(false));

      // If logged in and somehow on login page, redirect to journal
      if (pathname === '/login') {
        router.push('/journal');
      }
    }
  }, [username, isLoadingUser, pathname, router]);

  if (isLoadingUser || (!username && pathname !== '/login') || isSeeding) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          {isLoadingUser && <p className="mt-4 text-muted-foreground">Loading user...</p>}
          {isSeeding && <p className="mt-4 text-muted-foreground">Preparing your journal...</p>}
          {(!username && !isLoadingUser && pathname !== '/login') && <p className="mt-4 text-muted-foreground">Redirecting to login...</p>}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
