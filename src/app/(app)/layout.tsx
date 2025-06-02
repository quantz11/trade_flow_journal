
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarTrigger, SidebarProvider } from "@/components/ui/sidebar";
// UserProvider removed from here, it's now in RootLayout
import { AuthWrapper } from "@/components/layout/auth-wrapper";
import React from 'react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // UserProvider removed from here
    <AuthWrapper>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen">
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-auto">
            {/* Mobile-only trigger bar */}
            <div className="md:hidden p-2 sticky top-0 bg-background z-20 border-b border-border flex items-center">
              <SidebarTrigger />
            </div>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthWrapper>
    // UserProvider removed from here
  );
}
