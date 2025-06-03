
"use client";

import React, { useState, useTransition } from "react";
import { Loader2, Brain, Lightbulb, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getJournalEntries } from "@/lib/firestore-service";
import { analyzeTradingPatterns } from "@/ai/flows/trading-pattern-analyzer";
import type { JournalEntry, AIJournalEntry, AISuggestedStrategy } from "@/types";
import { format } from "date-fns";
import { cn, getTextBasedTailwindColors } from "@/lib/utils";
import { useUser } from "@/context/user-context"; // Import useUser

export function AnalysisResults() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AISuggestedStrategy[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isAnalyzing, startTransition] = useTransition();
  const { username } = useUser(); // Get username from context

  const handleAnalyzePatterns = async () => {
    if (!username) {
      toast({
        title: "Not Logged In",
        description: "You must be logged in to analyze patterns.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      setError(null);
      setAnalysisResult(null);

      try {
        const journalEntries: JournalEntry[] = await getJournalEntries(username); // Pass username
        if (journalEntries.length === 0) {
          toast({
            title: "No Data",
            description: "No journal entries found to analyze for your account. Please add some entries first.",
            variant: "default",
          });
          return;
        }

        const aiInput: AIJournalEntry[] = journalEntries.map(entry => ({
          ...entry,
          date: format(new Date(entry.date), "yyyy-MM-dd"),
          premarketCondition: Array.isArray(entry.premarketCondition) ? entry.premarketCondition : [],
          rrRatio: entry.rrRatio,
          tp: entry.tp || [],
          sl: entry.sl || [],
          psychology: entry.psychology || [],
          poi: entry.poi || [],
          reactionToPoi: entry.reactionToPoi || [],
        }));

        const result = await analyzeTradingPatterns({ journalEntries: aiInput });
        setAnalysisResult(result.suggestedStrategies);
        toast({
          title: "Analysis Complete",
          description: "Trading patterns analyzed successfully.",
        });

      } catch (err: any) {
        console.error("Error analyzing trading patterns:", err);
        setError(err.message || "Failed to analyze trading patterns. Please try again.");
        toast({
          title: "Analysis Failed",
          description: err.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  if (!username) { // Optional: Render a message or placeholder if not logged in
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Brain className="mr-2 h-7 w-7 text-primary" />
            AI Pattern Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please log in to analyze your trading patterns.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <Brain className="mr-2 h-7 w-7 text-primary" />
          AI Pattern Analysis
        </CardTitle>
        <CardDescription>
          Discover recurring profitable patterns from your trading journal entries.
          The AI will analyze Premarket Condition, Point of Interest (POI), Reaction to POI, and Entry Type combinations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button onClick={handleAnalyzePatterns} disabled={isAnalyzing || !username} className="w-full md:w-auto">
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
            </>
          ) : (
            "Analyze Trading Patterns"
          )}
        </Button>

        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardHeader className="flex flex-row items-center space-x-2 p-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive text-lg">Analysis Error</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {analysisResult && analysisResult.length === 0 && !isAnalyzing && (
           <Card className="border-primary bg-primary/10">
            <CardHeader className="flex flex-row items-center space-x-2 p-4">
              <Lightbulb className="h-5 w-5 text-primary" />
              <CardTitle className="text-primary text-lg">No Clear Patterns Found</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-primary-foreground">
                The AI could not identify significant recurring profitable patterns with high confidence from the current data.
                More journal entries might be needed for a clearer analysis.
              </p>
            </CardContent>
          </Card>
        )}

        {analysisResult && analysisResult.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Suggested Strategies:</h3>
            <Accordion type="single" collapsible className="w-full">
              {analysisResult.map((strategy, index) => (
                <AccordionItem value={`item-${index}`} key={index} className="bg-card border border-border rounded-lg mb-3">
                  <AccordionTrigger className="hover:no-underline px-4 py-3 text-left">
                    <div className="flex flex-col md:flex-row md:items-center justify-between w-full">
                      <span className="font-medium text-base text-primary flex-1 mb-2 md:mb-0">Strategy for Matched Conditions</span>
                      <Badge variant={strategy.confidence > 0.7 ? "default" : strategy.confidence > 0.4 ? "secondary" : "outline"} className="md:ml-4">
                        Confidence: {(strategy.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 space-y-3 text-sm">
                    {strategy.premarketConditionCombination && strategy.premarketConditionCombination.length > 0 && (
                        <div>
                            <strong>Premarket Condition(s):</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                            {strategy.premarketConditionCombination.map(p => {
                                const colors = getTextBasedTailwindColors(p);
                                return (
                                <Badge
                                    key={p}
                                    className={cn(
                                    "whitespace-nowrap",
                                    colors.background,
                                    colors.text,
                                    colors.hoverBackground,
                                    colors.border
                                    )}
                                >
                                    {p}
                                </Badge>
                                );
                            })}
                            </div>
                        </div>
                    )}
                    <div>
                      <strong>Point of Interest (POI):</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {strategy.poiCombination.map(p => {
                           const colors = getTextBasedTailwindColors(p);
                           return (
                            <Badge
                              key={p}
                              className={cn(
                                "whitespace-nowrap",
                                colors.background,
                                colors.text,
                                colors.hoverBackground,
                                colors.border
                              )}
                            >
                              {p}
                            </Badge>
                           );
                        })}
                      </div>
                    </div>
                    <div>
                      <strong>Reaction to POI:</strong>
                       <div className="flex flex-wrap gap-1 mt-1">
                        {strategy.reactionToPoiCombination.map(r => {
                          const colors = getTextBasedTailwindColors(r);
                          return (
                            <Badge
                              key={r}
                              className={cn(
                                "whitespace-nowrap",
                                colors.background,
                                colors.text,
                                colors.hoverBackground,
                                colors.border
                              )}
                            >
                              {r}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                        <strong>Entry Type:</strong>
                        <span className="ml-1 text-foreground">{strategy.entryType || 'N/A'}</span>
                    </div>
                    <p><strong>Suggested Action:</strong> <span className="text-foreground">{strategy.strategy}</span></p>

                    {strategy.exampleTrades.length > 0 && (
                      <div>
                        <strong>Supporting Trades ({strategy.exampleTrades.length}):</strong>
                        <ul className="list-disc list-inside pl-1 mt-1 space-y-1">
                          {strategy.exampleTrades.slice(0,3).map((trade, i) => (
                            <li key={i}>
                              Date: {trade.date} - Outcome: <Badge variant={trade.outcome.toLowerCase() === 'win' ? 'default' : trade.outcome.toLowerCase() === 'loss' ? 'destructive' : 'secondary'} className="capitalize">{trade.outcome}</Badge>
                              {trade.rrRatio !== undefined && ` - RR: ${trade.rrRatio}R`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
      {analysisResult && analysisResult.length > 0 && (
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Note: These suggestions are based on patterns in your past trades and are not financial advice.
            </p>
        </CardFooter>
      )}
    </Card>
  );
}
