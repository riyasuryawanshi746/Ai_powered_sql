"use client";

import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { BarChart2, TrendingUp, PieChart as PieIcon, Scatter as ScatterIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChartConfig } from "@/types";

interface ChartPanelProps {
  chartType: "bar" | "line" | "pie" | "scatter" | "none";
  chartConfig?: ChartConfig;
  data: Record<string, unknown>[];
}

// Premium color palette
const COLORS = [
  "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#14b8a6", "#6366f1",
];

const CHART_TYPES = [
  { id: "bar", label: "Bar", icon: BarChart2 },
  { id: "line", label: "Line", icon: TrendingUp },
  { id: "pie", label: "Pie", icon: PieIcon },
] as const;

const tooltipStyle = {
  backgroundColor: "#0f172a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#e2e8f0",
  fontSize: "12px",
};

export default function ChartPanel({ chartType, chartConfig, data }: ChartPanelProps) {
  const [activeType, setActiveType] = useState(chartType === "none" ? "bar" : chartType);

  if (!chartConfig || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-500">
        <BarChart2 className="w-10 h-10 mb-2 opacity-30" />
        <p className="text-sm">No chart data available</p>
        <p className="text-xs mt-1">Run a query to see visualizations</p>
      </div>
    );
  }

  const { x_key, y_key } = chartConfig;

  // Normalize numeric values
  const cleanData = data.slice(0, 50).map((row) => ({
    ...row,
    [y_key]: Number(row[y_key]) || 0,
  }));

  const renderChart = () => {
    switch (activeType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cleanData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey={x_key}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={60}
              />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={50} />
              <Tooltip contentStyle={tooltipStyle} />
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
            <LineChart data={cleanData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey={x_key} tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={50} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
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
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                wrapperStyle={{ color: "#94a3b8", fontSize: 11 }}
                formatter={(value) => (
                  <span className="text-slate-300">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Chart type switcher */}
      <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 w-fit">
        {CHART_TYPES.map(({ id, label, icon: Icon }) => (
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
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-fade-in">
        {renderChart()}
      </div>

      <p className="text-xs text-slate-600 text-center">
        Auto-selected: <span className="text-violet-400">{chartType}</span> chart
        · Showing top {Math.min(50, data.length)} rows
      </p>
    </div>
  );
}
