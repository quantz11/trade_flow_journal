
'use server';

/**
 * @fileOverview An AI agent that analyzes trading journal entries and suggests optimal trading strategies.
 *
 * - analyzeTradingPatterns - A function that analyzes trading patterns and suggests strategies.
 * - TradingPatternInput - The input type for the analyzeTradingPatterns function.
 * - TradingPatternOutput - The return type for the analyzeTradingPatterns function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TradingPatternInputSchema = z.object({
  journalEntries: z.array(
    z.object({
      pair: z.string().describe('The trading pair (e.g., EUR/USD).'),
      date: z.string().describe('The date of the trade (YYYY-MM-DD).'),
      type: z.string().describe('The type of trade (Long or Short).'),
      premarketCondition: z.array(z.string()).describe('The premarket condition(s) (e.g., Fair Value Area, Sweep).'), // Changed to array
      poi: z.array(z.string()).describe('The Point of Interest(s) for the trade (e.g., Order Block, Fair Value Gap, Liquidity).'),
      reactionToPoi: z.array(z.string()).describe('The Reaction(s) to the Point of Interest (e.g., Strong Rejection, Consolidation, Breakthrough).'),
      entryType: z.string().describe('The entry type (e.g., Market, Limit, Stop).'),
      session: z.string().describe('The trading session (e.g., London, New York, Asian).'),
      psychology: z.array(z.string()).optional().describe('The trader psychology/emotions (e.g., Confident, Fearful, Disciplined).'),
      outcome: z.string().describe('The outcome of the trade (Win, Loss, Breakeven).'),
      rrRatio: z.number().optional().describe('The Risk/Reward ratio for the trade (e.g., 2.5 for 2.5R).'),
      tradingviewChartUrl: z.string().optional().describe('Optional URL to a TradingView chart analysis.'),
      tp: z.array(z.string()).optional().describe('Reasons or levels for Take Profit (TP).'),
      sl: z.array(z.string()).optional().describe('Reasons or levels for Stop Loss (SL).'),
    })
  ).describe('An array of trading journal entries.'),
});

export type TradingPatternInput = z.infer<typeof TradingPatternInputSchema>;

const TradingPatternOutputSchema = z.object({
  suggestedStrategies: z.array(
    z.object({
      poiCombination: z.array(z.string()).describe('The specific Point of Interest combination.'),
      reactionToPoiCombination: z.array(z.string()).describe('The specific Reaction to Point of Interest combination.'),
      strategy: z.string().describe('The suggested trading strategy for this POI/Reaction combination.'),
      confidence: z.number().describe('A confidence score (0-1) for the effectiveness of this strategy based on past data.'),
      exampleTrades: z.array(
        z.object({
          date: z.string().describe('The date of the example trade.'),
          outcome: z.string().describe('The outcome of the example trade.'),
          rrRatio: z.number().optional().describe('The RR Ratio of the example trade, if available.'),
        })
      ).describe('Example trades that demonstrate this strategy.'),
    })
  ).describe('An array of suggested trading strategies based on recurring profitable patterns.'),
});

export type TradingPatternOutput = z.infer<typeof TradingPatternOutputSchema>;

export async function analyzeTradingPatterns(input: TradingPatternInput): Promise<TradingPatternOutput> {
  return analyzeTradingPatternsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tradingPatternAnalysisPrompt',
  input: {schema: TradingPatternInputSchema},
  output: {schema: TradingPatternOutputSchema},
  prompt: `You are an expert trading strategy analyst. Analyze the following trading journal entries to identify recurring profitable patterns based on Point of Interest (POI) and Reaction to POI combinations. Suggest optimal trading strategies based on these patterns.

Journal Entries:
{{#each journalEntries}}
  - Pair: {{{pair}}}, Date: {{{date}}}, Type: {{{type}}}, Premarket Condition(s): {{#each premarketCondition}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}, POI: {{#each poi}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}, Reaction to POI: {{#each reactionToPoi}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}, Entry Type: {{{entryType}}}, Session: {{{session}}}, Psychology: {{#each psychology}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}, Outcome: {{{outcome}}}{{#if rrRatio}}, RR Ratio: {{{rrRatio}}}R{{/if}}{{#if tradingviewChartUrl}}, Chart: {{{tradingviewChartUrl}}}{{/if}}{{#if tp.length}}, TP: {{#each tp}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}{{#if sl.length}}, SL: {{#each sl}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{/each}}

Based on these entries, identify profitable patterns related to specific POI and Reaction to POI combinations. Provide a confidence score (0-1) for each suggested strategy based on the historical success rate.
Consider the RR Ratio when evaluating profitability. Higher RR ratios on winning trades are more significant.
Also consider if specific TP or SL strategies contribute to patterns.
Consider the Premarket Condition(s) when identifying patterns.

For each suggested strategy, include example trades (date, outcome, and rrRatio if available) that support the strategy's effectiveness.

Ensure the output is a JSON array of suggested trading strategies. Each strategy must include the poiCombination, reactionToPoiCombination, strategy, confidence, and exampleTrades.

Consider the following when identifying patterns:
  - Frequency of occurrence: How often does this POI/Reaction combination lead to a profitable outcome?
  - Consistency: How consistent is the profitable outcome across different trading pairs, sessions, and entry types?
  - Risk-reward ratio: What is the average risk-reward ratio associated with this pattern? Look for patterns with favorable RR ratios.
  - TP/SL patterns: Are there common Take Profit or Stop Loss strategies associated with profitable outcomes for certain POI/Reaction combinations?
  - Premarket condition patterns: Does the premarket condition influence the success of certain POI/Reaction combinations?
`,
});

const analyzeTradingPatternsFlow = ai.defineFlow(
  {
    name: 'analyzeTradingPatternsFlow',
    inputSchema: TradingPatternInputSchema,
    outputSchema: TradingPatternOutputSchema,
  },
  async input => {
    // The prompt() call itself will throw an error if there's a network issue
    // or an API key problem that Genkit can detect.
    const {output} = await prompt(input);

    if (!output) {
      // This condition handles cases where the prompt executed successfully
      // but the AI model did not return any structured output,
      // or the output did not match the expected schema.
      console.error('TradingPatternAnalysisFlow: AI Prompt returned successfully but the output was empty or not in the expected format.');
      throw new Error('AI model generated an empty or invalid response. The prompt might need adjustment or the input data could be problematic.');
    }
    return output;
  }
);
