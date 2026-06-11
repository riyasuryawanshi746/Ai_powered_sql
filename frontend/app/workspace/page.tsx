"use client";

import { useEffect, useState } from "react";
import { Database, ChevronDown, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import QueryInput from "@/components/query/QueryInput";
import SQLPreview from "@/components/query/SQLPreview";
import ResultsTable from "@/components/results/ResultsTable";
import ChartPanel from "@/components/charts/ChartPanel";
import InsightsPanel from "@/components/insights/InsightsPanel";
import SchemaViewer from "@/components/schema/SchemaViewer";
import { useAppStore } from "@/store/useAppStore";
import { listTables, getSchema, runQuery } from "@/lib/api";
import { cn, formatNumber } from "@/lib/utils";
import type { TableListItem, TableSchema } from "@/types";

export default function WorkspacePage() {
  const {
    tables, setTables,
    activeTableId, activeSchema, setActiveTable,
    isQuerying, setIsQuerying,
    queryResult, setQueryResult,
    queryError, setQueryError,
  } = useAppStore();

  const [loadingTables, setLoadingTables] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "sql">("results");

  // Load tables on mount
  useEffect(() => {
    const load = async () => {
      setLoadingTables(true);
      try {
        const data = await listTables();
        setTables(data);
        // Auto-select first table if nothing active
        if (data.length > 0 && !activeTableId) {
          const first = data[0];
          const schema = await getSchema(first.table_id);
          setActiveTable(first.table_id, schema);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTables(false);
      }
    };
    load();
  }, []);

  const handleSelectTable = async (t: TableListItem) => {
    try {
      const schema = await getSchema(t.table_id);
      setActiveTable(t.table_id, schema);
      setQueryResult(null);
      setQueryError(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuery = async (question: string) => {
    if (!activeTableId) return;
    setIsQuerying(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const result = await runQuery({ table_id: activeTableId, question });
      setQueryResult(result);
      setActiveTab("results");
    } catch (err: unknown) {
      setQueryError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-black/20 px-4 py-2 flex items-center gap-3">
        <Database className="w-4 h-4 text-violet-400" />
        <span className="text-sm text-slate-400">Workspace</span>
        {activeSchema && (
          <>
            <ChevronDown className="w-3 h-3 text-slate-600 rotate-[-90deg]" />
            <span className="text-sm font-medium text-white">{activeSchema.table_name}</span>
            <span className="text-xs text-slate-500">
              ({formatNumber(activeSchema.row_count)} rows)
            </span>
          </>
        )}
        <div className="ml-auto">
          <button
            onClick={() => window.location.reload()}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main 3-panel layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Panel: Schema + Tables ─────────────────────────── */}
        <aside className="w-64 xl:w-72 flex-shrink-0 border-r border-white/10 overflow-y-auto bg-black/10 flex flex-col">
          {/* Tables list */}
          <div className="p-3 border-b border-white/10">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Uploaded Tables
            </h2>
            {loadingTables ? (
              <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading…
              </div>
            ) : tables.length === 0 ? (
              <div className="text-xs text-slate-600 py-2">
                No tables yet.{" "}
                <a href="/upload" className="text-violet-400 underline">Upload a CSV</a>
              </div>
            ) : (
              <div className="space-y-1">
                {tables.map((t) => (
                  <button
                    key={t.table_id}
                    onClick={() => handleSelectTable(t)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg transition-colors",
                      activeTableId === t.table_id
                        ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                        : "hover:bg-white/5 text-slate-400 hover:text-white"
                    )}
                  >
                    <p className="text-xs font-medium truncate">{t.table_name}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {formatNumber(t.row_count)} rows · {t.column_count} cols
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Schema viewer */}
          <div className="flex-1 p-3">
            {activeSchema ? (
              <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Schema
                </h2>
                <SchemaViewer schema={activeSchema} compact />
              </div>
            ) : (
              <div className="text-xs text-slate-600 text-center pt-8">
                Select a table to view schema
              </div>
            )}
          </div>
        </aside>

        {/* ── Center Panel: Query + Results ──────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Query Input */}
          <div className="p-4 border-b border-white/10">
            <QueryInput
              onSubmit={handleQuery}
              isLoading={isQuerying}
              disabled={!activeTableId}
            />
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Error state */}
            {queryError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-300">Query Failed</p>
                  <p className="text-xs text-red-400 mt-1 font-mono">{queryError}</p>
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {isQuerying && (
              <div className="space-y-3 animate-fade-in">
                <div className="h-24 rounded-xl bg-white/5 animate-shimmer" />
                <div className="h-48 rounded-xl bg-white/5 animate-shimmer" />
              </div>
            )}

            {/* Results */}
            {queryResult && !isQuerying && (
              <div className="animate-slide-up space-y-4">
                {/* Tab switcher */}
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 w-fit">
                  {(["results", "sql"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all",
                        activeTab === tab
                          ? "bg-white/10 text-white"
                          : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {tab === "sql" ? "SQL Query" : "Results"}
                    </button>
                  ))}
                  <span className="ml-2 text-xs text-slate-600">
                    {formatNumber(queryResult.row_count)} rows
                  </span>
                </div>

                {activeTab === "sql" ? (
                  <SQLPreview
                    sql={queryResult.sql}
                    executionTimeMs={queryResult.execution_time_ms}
                  />
                ) : (
                  <ResultsTable
                    results={queryResult.results}
                    rowCount={queryResult.row_count}
                  />
                )}
              </div>
            )}

            {/* Empty state */}
            {!queryResult && !isQuerying && !queryError && (
              <div className="flex flex-col items-center justify-center h-48 text-slate-600">
                <Database className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">Ask a question above to query your dataset</p>
              </div>
            )}
          </div>
        </main>

        {/* ── Right Panel: Charts + Insights ──────────────────────── */}
        <aside className="w-80 xl:w-96 flex-shrink-0 border-l border-white/10 overflow-y-auto bg-black/10">
          <div className="p-4 space-y-6">
            {/* Charts */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Visualization
              </h2>
              <ChartPanel
                chartType={queryResult?.chart_type ?? "none"}
                chartConfig={queryResult?.chart_config}
                data={queryResult?.results ?? []}
              />
            </div>

            {/* Insights */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                AI Insights
              </h2>
              <InsightsPanel
                insights={queryResult?.insights ?? []}
                isLoading={isQuerying}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
