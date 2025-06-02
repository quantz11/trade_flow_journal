"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BarChart3, Loader2 } from 'lucide-react';
import { useUser } from '@/context/user-context'; // Import useUser

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // State to track if the component has mounted on the client
  const [isClient, setIsClient] = useState(false);

  // UseEffect to set isClient to true after mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Conditionally access useUser only on the client
  const { login, user, isLoadingUser } = isClient ? useUser() : { login: async () => {}, user: null, isLoadingUser: true };


  // Redirect if user is already logged in via Firebase Auth
  useEffect(() => {
    // Only perform redirection on the client and when auth state is loaded
    if (isClient && !isLoadingUser && user) {
      router.replace('/journal');
    }
     // Also redirect if we are not loading and there is no user.
     // This handles cases where a user might land on /login but isn't logged in.
     // If they are loading, we wait for the auth state to be determined.
     // Only perform this check on the client
     if (isClient && !isLoadingUser && !user) {
        // Stay on login page
     }
  }, [router, user, isLoadingUser, isClient]); // Depend on user, isLoadingUser, and isClient


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Email and password cannot be empty.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      // Redirection is now handled by the useEffect based on user state
    } catch (firebaseError: any) {
      console.error("Firebase Login Error:", firebaseError);
      // Display a user-friendly error message based on the Firebase error code
      if (firebaseError.code === 'auth/user-not-found') {
        setError('No user found with this email.');
      } else if (firebaseError.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (firebaseError.code === 'auth/invalid-email') {
         setError('Invalid email address format.');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // While the user state is loading or before client mount, show a loading indicator or null
   if (isLoadingUser || !isClient) {
     return (
         <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
             <p className="mt-4 text-lg text-muted-foreground">{!isClient ? 'Initializing...' : 'Loading user state...'}</p>
         </div>
     );
   }

   // If user is already logged in, the effect will redirect, so we render nothing here
   if (user) {
       return null;
   }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center space-space-y-2">
          <div className="flex justify-center items-center mb-3">
            <BarChart3 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to TradeFlow</CardTitle>
          <CardDescription>Please log in with your email and password.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-lg"
                disabled={isLoading}
                autoFocus
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="password" className="text-base">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-lg"
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        Use a test email and password to log in.
      </p>
    </div>
  );
}
