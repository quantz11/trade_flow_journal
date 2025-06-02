
import type { JournalEntryField } from "@/types";

export const FIRESTORE_COLLECTIONS = {
  JOURNAL_ENTRIES: "journalEntries",
  USER_SETTINGS: "userSettings", // Changed from SETTINGS
  CUSTOM_COLUMNS: "customTableColumns", // Remains global
};

export const INITIAL_OPTIONS: Record<JournalEntryField, string[]> = {
  pair: ["EUR/USD", "GBP/USD", "USD/JPY", "BTC/USD", "ETH/USD"],
  type: ["Long", "Short"],
  premarketCondition: ["Fair Value Area", "Sweep", "Run", "Fair Value Gap"],
  poi: ["Order Block", "Fair Value Gap", "Liquidity Pool", "Support Level", "Resistance Level", "Trendline"],
  reactionToPoi: ["Strong Rejection", "Consolidation", "Breakthrough", "Slow Reaction", "No Reaction"],
  entryType: ["Market", "Limit", "Stop", "Scaled Entry"],
  session: ["London", "New York", "Asian", "Overlap"],
  psychology: ["Confident", "Fearful", "Disciplined", "Impatient", "Greedy", "FOMO", "Neutral", "Anxious", "Overconfident"],
  outcome: ["Win", "Loss", "Breakeven"],
  rrRatio: [], // No predefined options, user enters number
  tradingviewChartUrl: [], // No predefined options, user enters URL
  tp: ["Structure", "Liquidity", "Imbalance Fill", "Fibonacci Level"],
  sl: ["Structure", "Volatility Based", "Fixed Pips", "Previous Candle High/Low"],
};

export const FIELD_LABELS: Record<JournalEntryField, string> = {
  date: "Date",
  pair: "Trading Pair",
  type: "Trade Type",
  premarketCondition: "Premarket Condition",
  poi: "Point of Interest (POI)",
  reactionToPoi: "Reaction to POI",
  entryType: "Entry Type",
  session: "Trading Session",
  psychology: "Psychology/Emotions",
  outcome: "Outcome",
  rrRatio: "RR Ratio",
  tradingviewChartUrl: "TradingView Chart URL",
  tp: "Take Profit (TP)",
  sl: "Stop Loss (SL)",
};

export const MULTI_SELECT_FIELDS: JournalEntryField[] = ['poi', 'reactionToPoi', 'psychology', 'tp', 'sl', 'premarketCondition'];
