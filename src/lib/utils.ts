
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Revised color palette for better visibility and aesthetics, now with borders
const colorPairs: {
  background: string;
  text: string;
  hoverBackground: string;
  border: string;
}[] = [
  { // Sky Blue
    background: 'bg-sky-100 dark:bg-sky-800',
    text: 'text-sky-700 dark:text-sky-200',
    hoverBackground: 'hover:bg-sky-200 dark:hover:bg-sky-700',
    border: 'border-sky-400 dark:border-sky-600',
  },
  { // Emerald Green
    background: 'bg-emerald-100 dark:bg-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-200',
    hoverBackground: 'hover:bg-emerald-200 dark:hover:bg-emerald-700',
    border: 'border-emerald-400 dark:border-emerald-600',
  },
  { // Rose Pink
    background: 'bg-rose-100 dark:bg-rose-800',
    text: 'text-rose-700 dark:text-rose-200',
    hoverBackground: 'hover:bg-rose-200 dark:hover:bg-rose-700',
    border: 'border-rose-400 dark:border-rose-600',
  },
  { // Amber Yellow/Orange
    background: 'bg-amber-100 dark:bg-amber-800',
    text: 'text-amber-700 dark:text-amber-200',
    hoverBackground: 'hover:bg-amber-200 dark:hover:bg-amber-700',
    border: 'border-amber-400 dark:border-amber-600',
  },
  { // Violet
    background: 'bg-violet-100 dark:bg-violet-800',
    text: 'text-violet-700 dark:text-violet-200',
    hoverBackground: 'hover:bg-violet-200 dark:hover:bg-violet-700',
    border: 'border-violet-400 dark:border-violet-600',
  },
  { // Teal
    background: 'bg-teal-100 dark:bg-teal-800',
    text: 'text-teal-700 dark:text-teal-200',
    hoverBackground: 'hover:bg-teal-200 dark:hover:bg-teal-700',
    border: 'border-teal-400 dark:border-teal-600',
  },
  { // Fuchsia
    background: 'bg-fuchsia-100 dark:bg-fuchsia-800',
    text: 'text-fuchsia-700 dark:text-fuchsia-200',
    hoverBackground: 'hover:bg-fuchsia-200 dark:hover:bg-fuchsia-700',
    border: 'border-fuchsia-400 dark:border-fuchsia-600',
  },
  { // Lime Green
    background: 'bg-lime-100 dark:bg-lime-800',
    text: 'text-lime-700 dark:text-lime-200',
    hoverBackground: 'hover:bg-lime-200 dark:hover:bg-lime-700',
    border: 'border-lime-400 dark:border-lime-600',
  },
  { // Indigo
    background: 'bg-indigo-100 dark:bg-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-200',
    hoverBackground: 'hover:bg-indigo-200 dark:hover:bg-indigo-700',
    border: 'border-indigo-400 dark:border-indigo-600',
  },
  { // A slightly more prominent gray than pure slate-100 for light mode
    background: 'bg-gray-200 dark:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-200',
    hoverBackground: 'hover:bg-gray-300 dark:hover:bg-gray-600',
    border: 'border-gray-400 dark:border-gray-500',
  }
];

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getTextBasedTailwindColors(text: string): {
  background: string;
  text: string;
  hoverBackground: string;
  border: string;
} {
  if (!text) {
    // Default for empty or null text - using the last color (gray) as a neutral default
    return colorPairs[colorPairs.length - 1];
  }
  const index = simpleHash(text) % colorPairs.length;
  return colorPairs[index];
}
