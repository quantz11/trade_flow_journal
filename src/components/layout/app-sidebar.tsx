
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  Settings,
  LayoutList,
  BrainCircuit,
  BarChart3,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "./theme-toggle";
import { useUser } from "@/context/user-context";
import { Button } from "@/components/ui/button"; // Import Button

const navItems = [
  { href: "/journal", label: "Journal Entry", icon: BookOpenText },
  { href: "/log", label: "Entry Log", icon: LayoutList },
  { href: "/analysis", label: "AI Analysis", icon: BrainCircuit },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { username, logout } = useUser();

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4 flex items-center gap-2 justify-between">
        <Link href="/journal" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <BarChart3 className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">TradeFlow</h1>
        </Link>
        <SidebarTrigger className="group-data-[collapsible=icon]:hidden hidden md:flex" />
      </SidebarHeader>
      <SidebarContent className="flex flex-col justify-between">
        <SidebarMenu>
          {username && navItems.map((item) => ( // Only show nav items if logged in
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== "/journal" && pathname.startsWith(item.href))}
                  tooltip={{ children: item.label, className:"bg-card text-card-foreground border-border"}}
                  className="justify-start"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <div className="mt-auto p-2 space-y-2">
           <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />
           <ThemeToggle />
           {username && (
            <>
              <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />
              <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="w-full justify-start p-2 text-sm group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:p-0"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5 text-destructive" />
                  <span className="ml-2 group-data-[collapsible=icon]:hidden text-destructive">Logout</span>
                </Button>
              </div>
            </>
           )}
        </div>
      </SidebarContent>
      <SidebarFooter className="p-2 group-data-[collapsible=icon]:hidden">
         {username && <p className="text-xs text-muted-foreground truncate">Logged in as: {username}</p>}
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} TradeFlow
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
