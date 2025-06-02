
import type { Timestamp } from "firebase/firestore";

// Type for data coming from the journal entry form
export interface JournalFormData {
  username?: string; // Added for Firestore scoping
  pair: string;
  date: Date; // Form uses Date object
  type: string;
  premarketCondition: string[];
  poi: string[];
  reactionToPoi: string[];
  entryType: string;
  session: string;
  psychology: string[];
  outcome: string;
  rrRatio?: number;
  tradingviewChartUrl?: string;
  tp: string[];
  sl: string[];
  customData?: { [key: string]: string };
}

// Type for journal entries retrieved from Firestore and consumed by client components
export interface JournalEntry {
  id?: string;
  username: string; // Added for Firestore scoping
  pair: string;
  date: string; // ISO Date string
  type: string;
  premarketCondition: string[];
  poi: string[];
  reactionToPoi: string[];
  entryType: string;
  session: string;
  psychology: string[];
  outcome: string;
  rrRatio?: number;
  tradingviewChartUrl?: string;
  tp: string[];
  sl: string[];
  createdAt?: string; // ISO Date string
  customData?: { [key: string]: string };
}

export type JournalEntryField =
  | 'pair'
  | 'date'
  | 'type'
  | 'premarketCondition'
  | 'poi'
  | 'reactionToPoi'
  | 'entryType'
  | 'session'
  | 'psychology'
  | 'outcome'
  | 'rrRatio'
  | 'tradingviewChartUrl'
  | 'tp'
  | 'sl';

export const JOURNAL_ENTRY_FIELDS: JournalEntryField[] = [
  'date', 'pair', 'type', 'premarketCondition', 'poi', 'reactionToPoi', 'tp', 'sl', 'entryType', 'session', 'psychology', 'outcome', 'rrRatio', 'tradingviewChartUrl'
];

export interface FieldOption {
  value: string;
  label: string;
}

export interface MultiSelectItem {
  value: string;
  label: string;
}

export type AIJournalEntry = {
  // username is not directly sent to AI, but data is already scoped
  pair: string;
  date: string; // YYYY-MM-DD
  type: string;
  premarketCondition: string[];
  poi: string[];
  reactionToPoi: string[];
  entryType: string;
  session: string;
  psychology: string[];
  outcome: string;
  rrRatio?: number;
  tradingviewChartUrl?: string;
  tp: string[];
  sl: string[];
};

export type AISuggestedStrategy = {
  poiCombination: string[];
  reactionToPoiCombination: string[];
  strategy: string;
  confidence: number;
  exampleTrades: {
    date: string;
    outcome: string;
    rrRatio?: number;
  }[];
};

export type AIAnalysisOutput = {
  suggestedStrategies: AISuggestedStrategy[];
};

export interface CustomColumn {
  id: string;
  name: string;
}
