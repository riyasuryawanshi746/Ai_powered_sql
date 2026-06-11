"use client";

import { ChevronDown, ChevronRight, Table2, Hash, Type, Calendar } from "lucide-react";
import { useState } from "react";
import { cn, sqlTypeBadgeColor, formatNumber } from "@/lib/utils";
import type { TableSchema, ColumnInfo } from "@/types";

interface SchemaViewerProps {
  schema: TableSchema;
  compact?: boolean;
}

function TypeIcon({ sqlType }: { sqlType: string }) {
  switch (sqlType.toUpperCase()) {
    case "INTEGER":
      return <Hash className="w-3 h-3" />;
    case "REAL":
      return <span className="text-xs font-bold">#.#</span>;
    case "TEXT":
      return <Type className="w-3 h-3" />;
    default:
      return <Calendar className="w-3 h-3" />;
  }
}

function ColumnRow({ col }: { col: ColumnInfo }) {
  const [showSamples, setShowSamples] = useState(false);

  return (
    <div className="group">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
        onClick={() => setShowSamples((v) => !v)}
      >
        <span className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border",
          sqlTypeBadgeColor(col.sql_type)
        )}>
          <TypeIcon sqlType={col.sql_type} />
          {col.sql_type}
        </span>
        <span className="text-sm text-slate-200 font-mono flex-1 truncate">
          {col.name}
        </span>
        {col.nullable && (
          <span className="text-[10px] text-slate-500">nullable</span>
        )}
        <ChevronRight className={cn(
          "w-3 h-3 text-slate-600 transition-transform",
          showSamples && "rotate-90"
        )} />
      </div>

      {showSamples && col.sample_values.length > 0 && (
        <div className="mx-3 mb-1 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
          <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Sample values</p>
          <div className="flex flex-wrap gap-1">
            {col.sample_values.map((v, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-white/10 rounded text-xs text-slate-300 font-mono"
              >
                {String(v)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchemaViewer({ schema, compact = false }: SchemaViewerProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="w-6 h-6 rounded bg-violet-500/20 flex items-center justify-center flex-shrink-0">
          <Table2 className="w-3 h-3 text-violet-400" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-white truncate">{schema.table_name}</p>
          {!compact && (
            <p className="text-xs text-slate-400">
              {formatNumber(schema.row_count)} rows · {schema.column_count} columns
            </p>
          )}
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-slate-400 transition-transform",
          !expanded && "-rotate-90"
        )} />
      </button>

      {/* Columns */}
      {expanded && (
        <div className="border-t border-white/10 py-1 max-h-96 overflow-y-auto">
          {schema.columns.map((col) => (
            <ColumnRow key={col.name} col={col} />
          ))}
        </div>
      )}
    </div>
  );
}
