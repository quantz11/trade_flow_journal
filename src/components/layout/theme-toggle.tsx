
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSidebar } from "@/components/ui/sidebar"; 

import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";


export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme(); 
  const [isMounted, setIsMounted] = React.useState(false);
  const { state: sidebarState } = useSidebar(); 

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={cn(
        "flex items-center p-2 h-10 w-full",
        sidebarState === 'collapsed' ? 'justify-center' : 'justify-between'
      )}>
        <div className={cn(
            "h-5 w-5 bg-muted rounded-full animate-pulse",
            sidebarState === 'collapsed' ? '' : 'mr-2'
        )}></div>
        {sidebarState !== 'collapsed' && <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>}
      </div>
    );
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDarkMode = currentTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  const label = isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode";

  if (sidebarState === 'collapsed') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-full h-10 p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            aria-label={label}
          >
            {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" className="bg-card text-card-foreground border-border">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group">
      <div className="flex items-center space-x-2">
        {isDarkMode ? 
            <Moon className="h-5 w-5 text-sidebar-primary group-hover:text-sidebar-accent-foreground" /> : 
            <Sun className="h-5 w-5 text-sidebar-primary group-hover:text-sidebar-accent-foreground" />
        }
        <span className="text-sm text-sidebar-foreground group-hover:text-sidebar-accent-foreground">
          {isDarkMode ? "Dark Mode" : "Light Mode"}
        </span>
      </div>
      <Switch
        checked={isDarkMode}
        onCheckedChange={toggleTheme}
        aria-label={label}
        className="data-[state=checked]:bg-sidebar-primary data-[state=unchecked]:bg-sidebar-border group-hover:data-[state=unchecked]:bg-sidebar-foreground/20"
      />
    </div>
  );
}
