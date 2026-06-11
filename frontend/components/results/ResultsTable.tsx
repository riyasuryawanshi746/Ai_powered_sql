"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Download } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface ResultsTableProps {
  results: Record<string, unknown>[];
  rowCount: number;
}

type SortDir = "asc" | "desc" | null;

export default function ResultsTable({ results, rowCount }: ResultsTableProps) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const pageSize = 25;

  const columns = useMemo(
    () => (results.length > 0 ? Object.keys(results[0]) : []),
    [results]
  );

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return results;
    return [...results].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [results, sortKey, sortDir]);

  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(results.length / pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleDownload = () => {
    const header = columns.join(",");
    const rows = results.map((r) =>
      columns.map((c) => {
        const v = r[c];
        if (v == null) return "";
        if (typeof v === "string" && v.includes(",")) return `"${v}"`;
        return String(v);
      }).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-sm">No results returned for this query.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stats + download */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Showing <span className="text-white font-medium">{paginated.length}</span> of{" "}
          <span className="text-white font-medium">{formatNumber(rowCount)}</span> rows
        </p>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs transition-all border border-white/10"
        >
          <Download className="w-3 h-3" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-sm">
            <thead className="bg-white/5 sticky top-0">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="px-4 py-3 text-left font-medium text-slate-300 cursor-pointer hover:text-white whitespace-nowrap group"
                  >
                    <div className="flex items-center gap-1">
                      <span>{col}</span>
                      <span className="text-slate-600 group-hover:text-slate-400">
                        {sortKey === col ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        )}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    "transition-colors",
                    i % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]",
                    "hover:bg-white/5"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="px-4 py-2.5 text-slate-300 font-mono text-xs whitespace-nowrap max-w-48 truncate"
                    >
                      {row[col] == null ? (
                        <span className="text-slate-600 italic">null</span>
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
