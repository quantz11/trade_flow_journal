
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
      premarketCondition: z.array(z.string()).describe('The premarket condition(s) (e.g., Fair Value Area, Sweep).'),
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
      poiCombination: z.array(z.string()).describe('The specific Point of Interest (POI) combination.'),
      reactionToPoiCombination: z.array(z.string()).describe('The specific Reaction to Point of Interest (POI) combination.'),
      entryType: z.string().describe('The specific entry type most commonly or effectively associated with this pattern (e.g., Market, Limit).'),
      premarketConditionCombination: z.array(z.string()).optional().describe('The specific Premarket Condition(s) combination, if a strong factor in the pattern.'),
      strategy: z.string().describe(
        "A detailed, actionable trading strategy. Should include: entry idea (aligning with identified 'entryType'), key TP considerations, and key SL considerations. Mention trade direction (Long/Short)."
      ),
      confidence: z.number().describe('A confidence score (0-1) for the effectiveness of this strategy based on past data. Higher confidence if supported by multiple wins with good RR.'),
      exampleTrades: z.array(
        z.object({
          date: z.string().describe('The date of the example trade.'),
          outcome: z.string().describe('The outcome of the example trade.'),
          rrRatio: z.number().optional().describe('The RR Ratio of the example trade, if available.'),
        })
      ).describe('Example trades that demonstrate this strategy (preferably winning trades).'),
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
  prompt: `You are an expert trading strategy analyst. Analyze the following trading journal entries to identify recurring trading patterns.
Your goal is to suggest actionable trading strategies based on combinations of Point of Interest (POI), Reaction to POI, Premarket Conditions, and the Entry Type used.

Journal Entries:
{{#each journalEntries}}
  - Pair: {{{pair}}}, Date: {{{date}}}, Type: {{{type}}}, Premarket Condition(s): {{#each premarketCondition}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}, POI: {{#each poi}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}, Reaction to POI: {{#each reactionToPoi}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}, Entry Type: {{{entryType}}}, Session: {{{session}}}, Psychology: {{#if psychology}}{{#each psychology}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}N/A{{/if}}, Outcome: {{{outcome}}}{{#if rrRatio}}, RR Ratio: {{{rrRatio}}}R{{/if}}{{#if tradingviewChartUrl}}, Chart: {{{tradingviewChartUrl}}}{{/if}}{{#if tp.length}}, TP: {{#each tp}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}{{#if sl.length}}, SL: {{#each sl}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{/each}}

Based on these entries, identify and include all discernible trading patterns. For each pattern:
1.  Specify the 'poiCombination' and 'reactionToPoiCombination'.
2.  Specify the 'entryType' that is most commonly or effectively associated with this pattern's success.
3.  If Premarket Condition(s) are a strong recurring factor for the pattern's success, include the 'premarketConditionCombination'.
4.  Formulate an actionable 'strategy'. This description must be detailed:
    *   Clearly state the trade direction (Long/Short).
    *   Describe the entry idea/conditions, aligning with the identified 'entryType' (e.g., "Consider a Limit entry upon a bullish rejection from the [POI] after price sweeps liquidity below it during [Premarket Condition]").
    *   Suggest key Take Profit (TP) considerations based on observed successful TP reasons/levels for this pattern (e.g., "Target previous structural high or an imbalance fill").
    *   Suggest key Stop Loss (SL) considerations based on observed SL reasons/levels for this pattern (e.g., "Place stop loss below the low of the POI confirmation candle").
5.  Provide a 'confidence' score (0-1) for the strategy. This score should primarily reflect the pattern's historical profitability (number of wins vs. losses for the pattern, and their RR Ratios) and consistency. Patterns with more 'Win' outcomes, especially those with favorable Risk-Reward (RR) Ratios, should receive higher confidence scores.
6.  List 'exampleTrades' that support this strategy, prioritizing winning examples.
7.  Consider 'psychology': If you notice a strong correlation where certain psychological states (e.g., "Disciplined") consistently accompany winning trades for a pattern, or negative states (e.g., "FOMO") accompany losses, briefly mention this as part of the 'strategy' description.

Even if a pattern has low confidence (e.g., few occurrences, mixed results), include it in the 'suggestedStrategies' if it's a recurring combination.
If absolutely no recurring patterns (profitable or otherwise) can be identified from the journal entries, then and only then return an empty array for suggestedStrategies.

Ensure the output strictly adheres to the JSON schema provided for TradingPatternOutput.
`,
});

const analyzeTradingPatternsFlow = ai.defineFlow(
  {
    name: 'analyzeTradingPatternsFlow',
    inputSchema: TradingPatternInputSchema,
    outputSchema: TradingPatternOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);

    if (!output) {
      console.error('TradingPatternAnalysisFlow: AI Prompt returned successfully but the output was empty or not in the expected format.');
      throw new Error('AI model generated an empty or invalid response. The prompt might need adjustment or the input data could be problematic.');
    }
    return output;
  }
);

