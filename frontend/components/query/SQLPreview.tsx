"use client";

import { useState } from "react";
import { Copy, Check, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SQLPreviewProps {
  sql: string;
  executionTimeMs?: number;
}

export default function SQLPreview({ sql, executionTimeMs }: SQLPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple keyword highlighting without a heavy library
  const highlightSQL = (sql: string): string => {
    const keywords = [
      "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING",
      "LIMIT", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "ON",
      "AS", "AND", "OR", "NOT", "IN", "LIKE", "BETWEEN", "IS",
      "NULL", "COUNT", "SUM", "AVG", "MAX", "MIN", "DISTINCT",
      "BY", "DESC", "ASC", "WITH", "UNION", "ALL",
    ];
    let result = sql;
    keywords.forEach((kw) => {
      result = result.replace(
        new RegExp(`\\b${kw}\\b`, "gi"),
        `<span class="text-violet-400 font-semibold">${kw}</span>`
      );
    });
    // Highlight strings
    result = result.replace(
      /'([^']*)'/g,
      `<span class="text-amber-400">'$1'</span>`
    );
    // Highlight numbers
    result = result.replace(
      /\b(\d+\.?\d*)\b/g,
      `<span class="text-cyan-400">$1</span>`
    );
    return result;
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Generated SQL
          </span>
          {executionTimeMs != null && (
            <span className="text-xs text-slate-500">
              · executed in {executionTimeMs}ms
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs transition-all"
        >
          {copied ? (
            <><Check className="w-3 h-3 text-emerald-400" /> Copied!</>
          ) : (
            <><Copy className="w-3 h-3" /> Copy</>
          )}
        </button>
      </div>

      {/* SQL Code */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
          <code
            dangerouslySetInnerHTML={{ __html: highlightSQL(sql) }}
          />
        </pre>
      </div>
    </div>
  );
}
