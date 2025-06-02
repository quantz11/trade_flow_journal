
"use client";

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { Loader2, AlertTriangle, Info, PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, TooltipProps } from 'recharts';
import { useUser } from '@/context/user-context';
import { getJournalEntries } from '@/lib/firestore-service';
import type { JournalEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface SessionChartData {
  session: string; // The actual session name, e.g., "London"
  count: number;
  fill: string; // CSS variable like "var(--color-london)"
}

export function SessionPieChart() {
  const { username } = useUser();
  const { toast } = useToast();
  const [chartData, setChartData] = useState<SessionChartData[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [isLoading, startLoadingTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (username && !hasFetched) {
      startLoadingTransition(async () => {
        setError(null);
        setChartData([]);
        setChartConfig({});
        try {
          const entries: JournalEntry[] = await getJournalEntries(username);
          setHasFetched(true);

          if (entries.length === 0) {
            setChartData([]);
            return;
          }

          const sessionCounts: { [key: string]: number } = {};
          entries.forEach(entry => {
            if (entry.session && entry.session.trim() !== "") {
              sessionCounts[entry.session] = (sessionCounts[entry.session] || 0) + 1;
            } else {
              sessionCounts["Unknown"] = (sessionCounts["Unknown"] || 0) + 1;
            }
          });
          
          if (Object.keys(sessionCounts).length === 0) {
             setChartData([]);
             return;
          }

          const uniqueSessions = Object.keys(sessionCounts);
          const newChartConfig: ChartConfig = {};
          const newChartData: SessionChartData[] = [];

          uniqueSessions.forEach((session, index) => {
            const configKey = session.toLowerCase().replace(/[^a-z0-9]/gi, '') || `session${index}`;
            newChartConfig[configKey] = {
              label: session, // Original proper-cased session name
              color: `hsl(var(--chart-${(index % 5) + 1}))`, // Cycle through 5 chart colors
            };
            newChartData.push({
              session: configKey, // Use the sanitized key for data mapping
              count: sessionCounts[session],
              fill: `var(--color-${configKey})`,
            });
          });
          
          setChartConfig(newChartConfig);
          setChartData(newChartData);

        } catch (err: any) {
          console.error("Error fetching or processing journal entries for session chart:", err);
          setError(err.message || "Failed to load data for the session distribution chart.");
          toast({
            title: "Chart Error",
            description: err.message || "Could not load session distribution data.",
            variant: "destructive",
          });
        }
      });
    }
  }, [username, toast, hasFetched]);

  if (!username) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <PieChartIcon className="mr-2 h-6 w-6 text-primary" />
            Trading Session Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Please log in to view your session distribution.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <PieChartIcon className="mr-2 h-6 w-6 text-primary" />
            Trading Session Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading chart data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg border-destructive bg-destructive/10">
        <CardHeader className="flex flex-row items-center space-x-2 p-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive text-lg">Error Loading Chart</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
            <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0 && hasFetched) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <PieChartIcon className="mr-2 h-6 w-6 text-primary" />
            Trading Session Distribution
          </CardTitle>
          <CardDescription>
            Shows the proportion of trades taken in each session.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center h-64 text-center">
          <Info className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No trade data with session information available.</p>
          <p className="text-xs text-muted-foreground mt-1">Log some trades with sessions to see the distribution.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
            <PieChartIcon className="mr-2 h-6 w-6 text-primary" />
            Trading Session Distribution
        </CardTitle>
        <CardDescription>
            Shows the proportion of trades taken in each session. "Unknown" if session was not specified.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full aspect-square">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="session" />} 
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="session" // This refers to the key in chartData, which is the sanitized session name
                cx="50%"
                cy="50%"
                outerRadius={100}
                labelLine={false}
              >
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.session}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="session" />}
                className="[&>*]:justify-center"
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

