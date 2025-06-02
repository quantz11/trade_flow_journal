
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BarChart3, Loader2 } from 'lucide-react'; 
// No useUser here, as it's for pages outside the main app layout/provider initially

const LOCAL_STORAGE_USERNAME_KEY = 'tradeflow_username';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // If user is already "logged in" via localStorage, redirect them
    // This handles cases where they manually navigate to /login
    const storedUsername = localStorage.getItem(LOCAL_STORAGE_USERNAME_KEY);
    if (storedUsername) {
      router.replace('/journal'); 
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    setIsLoading(true);
    // Simulate a slight delay for UX, then "log in"
    setTimeout(() => {
      try {
        localStorage.setItem(LOCAL_STORAGE_USERNAME_KEY, name.trim());
        router.push('/journal'); // The AuthWrapper in (app)/layout will pick this up
      } catch (lsError) {
        console.error("LocalStorage error:", lsError);
        setError("Could not save login. Please ensure localStorage is enabled.");
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center items-center mb-3">
            <BarChart3 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to TradeFlow</CardTitle>
          <CardDescription>Please enter your name to access your journal.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-lg"
                disabled={isLoading}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Logging in...
                </>
              ) : (
                'Login / Access Journal'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Your name is used to save and retrieve your data locally in this browser.
      </p>
    </div>
  );
}
