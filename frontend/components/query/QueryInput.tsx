"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { SendHorizonal, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueryInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const EXAMPLE_QUESTIONS = [
  "What are the top 10 customers by revenue?",
  "Show me monthly sales trends",
  "Which product category has the highest profit margin?",
  "Find all records where revenue exceeded $10,000",
];

export default function QueryInput({ onSubmit, isLoading, disabled }: QueryInputProps) {
  const [question, setQuestion] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const q = question.trim();
    if (!q || isLoading || disabled) return;
    onSubmit(q);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleExample = (ex: string) => {
    setQuestion(ex);
    textareaRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      {/* Input Box */}
      <div className={cn(
        "relative rounded-xl border transition-all duration-200",
        disabled
          ? "border-white/10 bg-white/5 opacity-50"
          : "border-white/20 bg-white/5 focus-within:border-violet-500/50 focus-within:bg-violet-500/5 focus-within:shadow-lg focus-within:shadow-violet-500/10"
      )}>
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || disabled}
          placeholder={
            disabled
              ? "Upload a CSV file first to enable querying…"
              : "Ask anything about your data… e.g. \"Show me top 5 products by sales\""
          }
          rows={3}
          className="w-full bg-transparent px-4 pt-4 pb-12 text-sm text-white placeholder-slate-500 resize-none outline-none"
        />

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="text-xs text-slate-500">
              {disabled ? "Select a dataset to start" : "Ctrl+Enter to submit"}
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!question.trim() || isLoading || disabled}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              question.trim() && !isLoading && !disabled
                ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:opacity-90 shadow-lg shadow-violet-500/20"
                : "bg-white/10 text-slate-500 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <SendHorizonal className="w-3 h-3" />
                Ask AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Example questions */}
      {!disabled && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((ex) => (
            <button
              key={ex}
              onClick={() => handleExample(ex)}
              className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/10 transition-all"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
