
"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { JournalEntryForm } from "@/components/journal/journal-entry-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJournalEntryById } from '@/lib/firestore-service';
import type { JournalEntry } from '@/types';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/context/user-context'; // Import useUser
import Link from 'next/link'; // Import Link

function JournalPageContent() {
  const searchParams = useSearchParams();
  const entryIdToEdit = searchParams.get('edit');
  const [entryToEdit, setEntryToEdit] = React.useState<JournalEntry | null | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { username } = useUser(); // Get username from context

  React.useEffect(() => {
    if (entryIdToEdit && username) { // Ensure username exists before fetching
      setIsLoading(true);
      setError(null);
      getJournalEntryById(entryIdToEdit, username) // Pass username
        .then(entry => {
          if (entry) {
            setEntryToEdit(entry);
          } else {
            setError("Entry not found or you don't have permission to edit it.");
            setEntryToEdit(null);
          }
        })
        .catch(err => {
          console.error("Failed to fetch entry for editing:", err);
          setError("Failed to load entry data. " + (err.message || ''));
          setEntryToEdit(null);
        })
        .finally(() => setIsLoading(false));
    } else if (!entryIdToEdit) {
      setEntryToEdit(null); // New entry mode
    } else if (!username && entryIdToEdit) {
      // If there's an edit ID but no user yet, wait for user context
      // This might happen on direct navigation to an edit URL before user context loads
      setIsLoading(true); // Show loader until username is available
      setEntryToEdit(undefined);
    }
  }, [entryIdToEdit, username]); // Add username to dependency array

  const pageTitle = entryIdToEdit ? "Edit Journal Entry" : "New Journal Entry";
  const cardTitle = entryIdToEdit ? "Update Your Trade" : "Log Your Trade";

  // If username is not yet available (e.g., initial load), show a loader or appropriate message.
  if (!username && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Waiting for user session...</p>
      </div>
    );
  }

  if (isLoading || (entryIdToEdit && entryToEdit === undefined && username)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading entry data...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
                <CardTitle className="text-destructive text-center">Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive text-center">{error}</p>
                <Link href="/journal" className="block text-center mt-4 text-primary hover:underline">
                    Go to New Entry form
                </Link>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground text-center md:text-left">{pageTitle}</h1>
      <Card className="shadow-lg">
        <CardHeader className="text-center md:text-left">
          <CardTitle className="text-2xl">{cardTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <JournalEntryForm
            key={entryIdToEdit || `new-${username}`} // Add username to key for new entries to reset on user change
            entryToEdit={entryToEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function JournalPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading page...</p>
      </div>
    }>
      <JournalPageContent />
    </Suspense>
  );
}
