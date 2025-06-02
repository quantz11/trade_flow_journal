
"use client";

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { format } from 'date-fns';
import { Loader2, AlertTriangle, Info, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { LineChart, CartesianGrid, XAxis, YAxis, Line, ResponsiveContainer } from 'recharts';
import type { ChartConfig } from "@/components/ui/chart";
import { useUser } from '@/context/user-context';
import { getJournalEntries } from '@/lib/firestore-service';
import type { JournalEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ProcessedChartData {
  tradeNumber: number;
  cumulativeRR: number;
  date: string; 
  tooltipLabel: string;
}

const chartConfig = {
  cumulativeRR: {
    label: 'Cumulative RR',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function EquityCurveChart() {
  const { username } = useUser();
  const { toast } = useToast();
  const [chartData, setChartData] = useState<ProcessedChartData[]>([]);
  const [isLoading, startLoadingTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (username && !hasFetched) {
      startLoadingTransition(async () => {
        setError(null);
        setChartData([]);
        try {
          const entries: JournalEntry[] = await getJournalEntries(username);
          setHasFetched(true); 

          if (entries.length === 0) {
            setChartData([]);
            return;
          }

          const sortedEntries = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          let currentCumulativeRR = 0;
          const processedData: ProcessedChartData[] = [
            { // Baseline point
              tradeNumber: 0,
              cumulativeRR: 0,
              date: sortedEntries.length > 0 ? new Date(new Date(sortedEntries[0].date).getTime() - 86400000).toISOString() : new Date().toISOString(), // One day before first trade or today
              tooltipLabel: "Start"
            }
          ];

          sortedEntries.forEach((entry, index) => {
            let points = 0;
            if (typeof entry.rrRatio === 'number' && entry.rrRatio > 0) {
              if (entry.outcome === 'Win') {
                points = entry.rrRatio;
              } else if (entry.outcome === 'Loss') {
                points = -entry.rrRatio;
              } else if (entry.outcome === 'Breakeven') {
                points = 0; // Explicitly handle Breakeven
              }
            }
            currentCumulativeRR += points;
            processedData.push({
              tradeNumber: index + 1,
              cumulativeRR: parseFloat(currentCumulativeRR.toFixed(2)),
              date: entry.date,
              tooltipLabel: `Trade ${index + 1} (${format(new Date(entry.date), "MMM dd")})`,
            });
          });
          setChartData(processedData);

        } catch (err: any) {
          console.error("Error fetching or processing journal entries for chart:", err);
          setError(err.message || "Failed to load data for the equity curve.");
          toast({
            title: "Chart Error",
            description: err.message || "Could not load equity curve data.",
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
            <TrendingUp className="mr-2 h-6 w-6 text-primary" />
            Equity Curve (RR)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Please log in to view your equity curve.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <TrendingUp className="mr-2 h-6 w-6 text-primary" />
            Equity Curve (RR)
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

  if (chartData.length <= 1 && hasFetched) { // <=1 because we always have the baseline "Start" point
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <TrendingUp className="mr-2 h-6 w-6 text-primary" />
            Equity Curve (RR)
          </CardTitle>
          <CardDescription>
            Tracks your cumulative Risk-Reward (RR) over time. Wins add RR, losses subtract RR.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center h-64 text-center">
          <Info className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Not enough trade data to display the equity curve.</p>
          <p className="text-xs text-muted-foreground mt-1">Log some trades with RR values to see your progress.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
            <TrendingUp className="mr-2 h-6 w-6 text-primary" />
            Equity Curve (Cumulative RR)
        </CardTitle>
        <CardDescription>
            Tracks your cumulative Risk-Reward (RR) over time. Wins add their RR, losses subtract their RR. Breakeven trades result in 0 change.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="tooltipLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value, index) => {
                  // Show fewer ticks if too many points to avoid clutter
                  if (chartData.length > 20 && index % Math.ceil(chartData.length / 10) !== 0 && index !== chartData.length -1 && index !== 0) {
                    return '';
                  }
                  return value;
                }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                domain={['auto', 'auto']}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideIndicator />}
              />
              <Line
                dataKey="cumulativeRR"
                type="monotone"
                stroke="var(--color-cumulativeRR)"
                strokeWidth={2}
                dot={chartData.length < 50} // Show dots if not too many points
              />
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

