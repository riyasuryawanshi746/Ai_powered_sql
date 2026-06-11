import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number with commas: 1500000 → "1,500,000" */
export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

/** Format milliseconds as human-readable: 1234 → "1.2s" */
export function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Truncate a string with ellipsis */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

/** Format a UTC date string as local readable */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

/** Get badge color for SQL type */
export function sqlTypeBadgeColor(sqlType: string): string {
  switch (sqlType.toUpperCase()) {
    case "INTEGER":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "REAL":
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    case "TEXT":
      return "bg-green-500/20 text-green-300 border-green-500/30";
    default:
      return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  }
}

/** Chart type to emoji */
export function chartTypeIcon(chartType: string): string {
  switch (chartType) {
    case "bar":
      return "📊";
    case "line":
      return "📈";
    case "pie":
      return "🥧";
    case "scatter":
      return "🔵";
    default:
      return "📋";
  }
}
