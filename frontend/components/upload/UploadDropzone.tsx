"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadCSV } from "@/lib/api";
import type { TableSchema } from "@/types";

interface UploadDropzoneProps {
  onSuccess: (schema: TableSchema) => void;
}

export default function UploadDropzone({ onSuccess }: UploadDropzoneProps) {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;

      setFileName(file.name);
      setStatus("uploading");
      setMessage("");

      try {
        const response = await uploadCSV(file);
        if (response.success && response.schema) {
          setStatus("success");
          setMessage(response.message);
          onSuccess(response.schema);
        } else {
          throw new Error(response.message || "Upload failed");
        }
      } catch (err: unknown) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Upload failed. Please try again.");
      }
    },
    [onSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    disabled: status === "uploading",
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300",
          isDragActive
            ? "border-violet-400 bg-violet-500/10 scale-[1.01]"
            : status === "success"
            ? "border-emerald-500/50 bg-emerald-500/5"
            : status === "error"
            ? "border-red-500/50 bg-red-500/5"
            : "border-white/20 bg-white/5 hover:border-violet-400/50 hover:bg-violet-500/5"
        )}
      >
        <input {...getInputProps()} />

        {/* Icon */}
        <div className="flex justify-center mb-4">
          {status === "uploading" ? (
            <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          ) : status === "success" ? (
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
          ) : status === "error" ? (
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          ) : (
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
                isDragActive ? "bg-violet-500/30" : "bg-white/10"
              )}
            >
              {isDragActive ? (
                <FileText className="w-8 h-8 text-violet-300" />
              ) : (
                <Upload className="w-8 h-8 text-slate-400" />
              )}
            </div>
          )}
        </div>

        {/* Text */}
        {status === "uploading" ? (
          <div>
            <p className="text-lg font-semibold text-white">Uploading {fileName}...</p>
            <p className="text-sm text-slate-400 mt-1">Parsing CSV and creating database table</p>
          </div>
        ) : status === "success" ? (
          <div>
            <p className="text-lg font-semibold text-emerald-400">Upload Successful!</p>
            <p className="text-sm text-slate-400 mt-1">{message}</p>
          </div>
        ) : status === "error" ? (
          <div>
            <p className="text-lg font-semibold text-red-400">Upload Failed</p>
            <p className="text-sm text-red-300 mt-1">{message}</p>
            <p className="text-xs text-slate-500 mt-2">Click or drag to try again</p>
          </div>
        ) : isDragActive ? (
          <div>
            <p className="text-lg font-semibold text-violet-300">Drop your CSV here!</p>
            <p className="text-sm text-slate-400 mt-1">Release to start uploading</p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-semibold text-white">
              Drag & drop your CSV file here
            </p>
            <p className="text-sm text-slate-400 mt-1">
              or <span className="text-violet-400 underline underline-offset-2">click to browse</span>
            </p>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
              <span>✓ CSV format</span>
              <span>✓ Up to 50MB</span>
              <span>✓ Any column types</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
