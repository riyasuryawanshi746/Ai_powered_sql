"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, CheckCircle } from "lucide-react";
import UploadDropzone from "@/components/upload/UploadDropzone";
import SchemaViewer from "@/components/schema/SchemaViewer";
import { useAppStore } from "@/store/useAppStore";
import { listTables } from "@/lib/api";
import type { TableSchema } from "@/types";

export default function UploadPage() {
  const router = useRouter();
  const { addTable, setActiveTable } = useAppStore();
  const [uploadedSchema, setUploadedSchema] = useState<TableSchema | null>(null);

  const handleUploadSuccess = async (schema: TableSchema) => {
    setUploadedSchema(schema);
    // Add to global store
    addTable({
      table_id: schema.table_id,
      table_name: schema.table_name,
      original_filename: schema.original_filename,
      row_count: schema.row_count,
      column_count: schema.column_count,
      created_at: schema.created_at,
    });
    setActiveTable(schema.table_id, schema);
  };

  const handleGoToWorkspace = () => {
    router.push("/workspace");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 mb-5 shadow-xl shadow-violet-500/30">
          <FileText className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Upload Your Dataset</h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Upload a CSV file to get started. We'll parse it, detect column types, and
          create a queryable database — ready in seconds.
        </p>
      </div>

      {/* Upload Zone */}
      <UploadDropzone onSuccess={handleUploadSuccess} />

      {/* Schema Preview */}
      {uploadedSchema && (
        <div className="mt-8 space-y-5 animate-slide-up">
          {/* Success Banner */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-300">
                Dataset ready — {uploadedSchema.row_count.toLocaleString()} rows, {uploadedSchema.column_count} columns
              </p>
              <p className="text-xs text-emerald-500 mt-0.5">
                Table: <span className="font-mono">{uploadedSchema.table_name}</span>
              </p>
            </div>
            <button
              onClick={handleGoToWorkspace}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
            >
              Analyze
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Schema Viewer */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-white">Detected Schema</h2>
            <SchemaViewer schema={uploadedSchema} />
          </div>

          {/* Tips */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">💡 Example questions you can ask:</h3>
            <ul className="space-y-1.5">
              {[
                `What are the top 10 ${uploadedSchema.columns[0]?.name || "values"} by count?`,
                `Show me the distribution of ${uploadedSchema.columns[1]?.name || "categories"}`,
                "What is the average value grouped by category?",
                "Find records where any column is null",
              ].map((q) => (
                <li key={q} className="text-sm text-slate-400 flex items-center gap-2">
                  <span className="text-violet-400">→</span> {q}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tips when no upload yet */}
      {!uploadedSchema && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "📂", title: "Any CSV format", desc: "UTF-8 or Latin-1 encoded, comma or tab separated" },
            { icon: "⚡", title: "Instant parsing", desc: "Up to 50MB files processed in seconds" },
            { icon: "🔍", title: "Auto type detection", desc: "Columns auto-typed as TEXT, INTEGER, REAL, or DATE" },
          ].map((tip) => (
            <div key={tip.title} className="glass-card p-4 text-center">
              <div className="text-2xl mb-2">{tip.icon}</div>
              <p className="text-sm font-medium text-white mb-1">{tip.title}</p>
              <p className="text-xs text-slate-500">{tip.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
