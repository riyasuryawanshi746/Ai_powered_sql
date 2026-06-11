"use client";

import { useState } from "react";
import { Copy, Check, Code2 } from "lucide-react";
import { formatMs } from "@/lib/utils";

interface SQLPreviewProps {
  sql: string;
  executionTimeMs?: number;
}

// ─── SQL Highlighter ──────────────────────────────────────────────────────────
//
// Strategy: tokenize the raw SQL into an array of typed tokens first, then
// render each token as a <span> with the correct color class. This avoids
// the regex self-corruption bug that occurs when running multiple .replace()
// passes over the same string — earlier passes insert <span> tags, and later
// passes then match keywords/numbers *inside* those tag attributes.

type TokenType = "keyword" | "string" | "number" | "default";

interface Token {
  type: TokenType;
  value: string;
}

const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "GROUP", "BY", "ORDER", "HAVING",
  "LIMIT", "OFFSET", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "CROSS",
  "FULL", "ON", "AS", "AND", "OR", "NOT", "IN", "LIKE", "ILIKE",
  "BETWEEN", "IS", "NULL", "COUNT", "SUM", "AVG", "MAX", "MIN",
  "DISTINCT", "DESC", "ASC", "WITH", "UNION", "ALL", "EXCEPT",
  "INTERSECT", "CASE", "WHEN", "THEN", "ELSE", "END", "INSERT",
  "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE",
  "DROP", "ALTER", "INDEX", "VIEW", "EXISTS", "RETURNING", "OVER",
  "PARTITION", "WINDOW", "FILTER", "COALESCE", "NULLIF", "CAST",
]);

function tokenizeSQL(sql: string): Token[] {
  const tokens: Token[] = [];
  // Regex groups (in priority order):
  //   1. Single-quoted string literals  → 'text'
  //   2. Double-quoted identifiers      → "column"
  //   3. Line comments                  → --...
  //   4. Block comments                 → /* ... */
  //   5. Numbers (int + float)          → 42, 3.14
  //   6. Words (keywords + identifiers) → SELECT, tableName
  //   7. Everything else                → operators, punctuation
  const TOKENIZER =
    /('(?:[^'\\]|\\.)*')|("(?:[^"\\]|\\.)*")|(--[^\n]*)|(\/\*[\s\S]*?\*\/)|((?<!\w)\d+\.?\d*(?!\w))|([A-Za-z_][A-Za-z0-9_]*)|([^])/g;

  let match: RegExpExecArray | null;
  while ((match = TOKENIZER.exec(sql)) !== null) {
    const [full, strSingle, strDouble, lineComment, blockComment, num, word, other] = match;

    if (strSingle || strDouble) {
      tokens.push({ type: "string", value: full });
    } else if (lineComment || blockComment) {
      tokens.push({ type: "default", value: full }); // could be "comment" type if desired
    } else if (num) {
      tokens.push({ type: "number", value: full });
    } else if (word) {
      const upper = word.toUpperCase();
      tokens.push({ type: SQL_KEYWORDS.has(upper) ? "keyword" : "default", value: upper === word ? full : full });
    } else {
      tokens.push({ type: "default", value: full });
    }
  }
  return tokens;
}

function renderTokens(tokens: Token[]): string {
  return tokens
    .map(({ type, value }) => {
      // Escape HTML entities before inserting into innerHTML
      const escaped = value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

      switch (type) {
        case "keyword":
          return `<span class="sql-kw">${escaped.toUpperCase()}</span>`;
        case "string":
          return `<span class="sql-str">${escaped}</span>`;
        case "number":
          return `<span class="sql-num">${escaped}</span>`;
        default:
          return escaped;
      }
    })
    .join("");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SQLPreview({ sql, executionTimeMs }: SQLPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = renderTokens(tokenizeSQL(sql));

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
              · executed in {formatMs(executionTimeMs)}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs transition-all"
          aria-label={copied ? "Copied to clipboard" : "Copy SQL"}
        >
          {copied ? (
            <><Check className="w-3 h-3 text-emerald-400" /> Copied!</>
          ) : (
            <><Copy className="w-3 h-3" /> Copy</>
          )}
        </button>
      </div>

      {/* Token color styles — scoped to this component */}
      <style>{`
        .sql-kw  { color: #a78bfa; font-weight: 600; }
        .sql-str { color: #fbbf24; }
        .sql-num { color: #22d3ee; }
      `}</style>

      {/* SQL Code */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>
    </div>
  );
}