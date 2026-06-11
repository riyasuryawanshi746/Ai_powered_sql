"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  History, Trash2, ExternalLink, Loader2, Search,
  CheckCircle, AlertCircle, BarChart2, Clock
} from "lucide-react";
import { getHistory, deleteHistoryItem } from "@/lib/api";
import { formatDate, formatMs, chartTypeIcon, cn } from "@/lib/utils";
import type { QueryHistoryItem } from "@/types";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getHistory(100);
        setHistory(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteHistoryItem(id);
      setHistory((h) => h.filter((item) => item.query_id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = history.filter(
    (h) =>
      h.question.toLowerCase().includes(search.toLowerCase()) ||
      h.table_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Query History</h1>
            <p className="text-sm text-slate-400">
              {history.length} queries across all datasets
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by question or table…"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-colors"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading history…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">
            {search ? "No matching queries found." : "No queries yet. Start by asking a question in the workspace."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.query_id}
              className={cn(
                "glass-card p-5 hover:border-violet-500/20 transition-all duration-200 animate-fade-in",
                item.error && "border-red-500/20 bg-red-500/5"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Status icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {item.error ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white leading-snug mb-1.5">
                    {item.question}
                  </p>

                  {/* Meta chips */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 font-mono">
                      {item.table_name}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      {chartTypeIcon(item.chart_type)} {item.chart_type}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <BarChart2 className="w-3 h-3" />
                      {item.row_count.toLocaleString()} rows
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatMs(item.execution_time_ms)}
                    </span>
                    <span className="text-slate-600">{formatDate(item.created_at)}</span>
                  </div>

                  {item.error && (
                    <p className="mt-2 text-xs text-red-400 font-mono line-clamp-1">
                      {item.error}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => router.push("/workspace")}
                    className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                    title="Open in workspace"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.query_id)}
                    disabled={deleting === item.query_id}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40"
                    title="Delete"
                  >
                    {deleting === item.query_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
