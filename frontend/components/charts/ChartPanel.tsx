"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  Cell,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChart2, TrendingUp, PieChart as PieIcon, Dot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChartConfig } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChartType = "bar" | "line" | "pie" | "scatter" | "none";

interface ChartPanelProps {
  chartType: ChartType;
  chartConfig?: ChartConfig;
  data: Record<string, unknown>[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = [
  "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#14b8a6", "#6366f1",
];

const CHART_TABS = [
  { id: "bar",     label: "Bar",     icon: BarChart2  },
  { id: "line",    label: "Line",    icon: TrendingUp },
  { id: "pie",     label: "Pie",     icon: PieIcon    },
  { id: "scatter", label: "Scatter", icon: Dot        },
] as const;

const TOOLTIP_STYLE = {
  backgroundColor: "#0f172a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
};

// ─── Chart Selection Engine ───────────────────────────────────────────────────
//
// Rules (in priority order):
//   1. x is date/time           → LINE
//   2. x and y both numeric     → SCATTER
//   3. x categorical, y numeric → PIE  (if ≤8 unique x values + pie hint)
//   4. x categorical, y numeric → BAR  (default for categorical x)
//   5. Fallback                 → BAR
//
// Invariants enforced:
//   - SCATTER is never selected when x is categorical
//   - PIE is never selected when unique x count > 8

function isDateString(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (!isNaN(Number(value))) return false; // pure number strings are not dates
  return !isNaN(Date.parse(value));
}

function isNumericValue(value: unknown): boolean {
  return value != null && value !== "" && !isNaN(Number(value));
}

function analyzeColumn(
  key: string,
  rows: Record<string, unknown>[],
  sampleSize = 50
): { isNumeric: boolean; isDate: boolean; uniqueCount: number } {
  const sample = rows.slice(0, sampleSize).map((r) => r[key]).filter((v) => v != null && v !== "");

  const isNumeric = sample.length > 0 && sample.every(isNumericValue);
  const isDate    = !isNumeric && sample.length > 0 && sample.every(isDateString);
  const uniqueCount = new Set(sample.map(String)).size;

  return { isNumeric, isDate, uniqueCount };
}

function resolveChartType(
  backendHint: ChartType,
  xKey: string,
  yKey: string,
  rows: Record<string, unknown>[]
): "bar" | "line" | "pie" | "scatter" {
  if (!rows.length) return "bar";

  const x = analyzeColumn(xKey, rows);
  const y = analyzeColumn(yKey, rows);

  // Rule 1: time series → line
  if (x.isDate) return "line";

  // Rule 2: both numeric → scatter (only valid use of scatter)
  if (x.isNumeric && y.isNumeric) return "scatter";

  // Rule 3 & 4: categorical x + numeric y
  if (!x.isNumeric && y.isNumeric) {
    const isPieHint = backendHint === "pie";
    const isPieName = /share|pct|percent|proportion|ratio/i.test(xKey + yKey);
    if ((isPieHint || isPieName) && x.uniqueCount <= 8) return "pie";
    return "bar";
  }

  // Rule 5: fallback
  return "bar";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChartPanel({ chartType, chartConfig, data }: ChartPanelProps) {
  const [activeType, setActiveType] = useState<"bar" | "line" | "pie" | "scatter">("bar");

  useEffect(() => {
    if (!chartConfig || data.length === 0) return;
    const resolved = resolveChartType(chartType, chartConfig.x_key, chartConfig.y_key, data);
    setActiveType(resolved);
  }, [chartType, chartConfig, data]);

  if (!chartConfig || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-white/10 rounded-xl">
        <p className="text-sm font-medium text-slate-400">No chart data available</p>
        <p className="text-xs text-slate-500 mt-1">Run a query to see visualizations</p>
      </div>
    );
  }

  const { x_key, y_key } = chartConfig;

  // Limit to 50 rows; coerce y to number for recharts
  const cleanData = data.slice(0, 50).map((row) => ({
    ...row,
    [y_key]: Number(row[y_key]) || 0,
  }));

  // Scatter needs both axes as numbers
  const scatterData = cleanData.map((row) => ({
    x: Number(row[x_key]) || 0,
    y: Number(row[y_key]) || 0,
  }));

  const renderChart = () => {
    switch (activeType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cleanData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
              <XAxis
                dataKey={x_key}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={60}
              />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={50} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey={y_key} radius={[4, 4, 0, 0]}>
                {cleanData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={cleanData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey={x_key} tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={50} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              <Line
                type="monotone"
                dataKey={y_key}
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={{ fill: "#8b5cf6", r: 3 }}
                activeDot={{ r: 5, fill: "#06b6d4" }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={cleanData}
                dataKey={y_key}
                nameKey={x_key}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={40}
                paddingAngle={2}
              >
                {cleanData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend formatter={(value) => <span className="text-slate-300">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                type="number"
                dataKey="x"
                name={x_key}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                label={{ value: x_key, position: "insideBottom", offset: -5, fill: "#94a3b8", fontSize: 11 }}
                height={40}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={y_key}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                width={50}
              />
              <ZAxis range={[30, 30]} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(value, name) => [value, name === "x" ? x_key : y_key]}
              />
              <Scatter data={scatterData} fill="#8b5cf6" fillOpacity={0.75} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Chart type tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        {CHART_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveType(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              activeType === id
                ? "bg-white/10 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-fade-in">
        {renderChart()}
      </div>

      <p className="text-xs text-slate-600 text-center">
        Auto-selected:{" "}
        <span className="text-violet-400">{activeType}</span> chart · Showing top{" "}
        {Math.min(50, data.length)} rows
      </p>
    </div>
  );
}