"use client";

import { Lightbulb, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightsPanelProps {
  insights: string[];
  isLoading?: boolean;
}

const INSIGHT_ICONS = [Lightbulb, TrendingUp, AlertCircle];
const INSIGHT_COLORS = [
  "from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-300",
  "from-cyan-500/20 to-cyan-600/10 border-cyan-500/20 text-cyan-300",
  "from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-300",
];

export default function InsightsPanel({ insights, isLoading }: InsightsPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-white/5 border border-white/10 animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-600">
        <Sparkles className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-sm">AI insights will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">AI Business Insights</h3>
      </div>

      {insights.map((insight, i) => {
        const Icon = INSIGHT_ICONS[i % INSIGHT_ICONS.length];
        const colorClass = INSIGHT_COLORS[i % INSIGHT_COLORS.length];

        return (
          <div
            key={i}
            className={cn(
              "p-3 rounded-xl border bg-gradient-to-br animate-slide-up",
              colorClass
            )}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex-shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-sm leading-relaxed text-slate-200">{insight}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
