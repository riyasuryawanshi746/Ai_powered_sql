// lib/chartEngine.ts

export type ChartType = "bar" | "line" | "pie" | "scatter" | "none";

export interface ChartConfig {
  x_key: string;
  y_key: string;
}

export interface ChartSelection {
  chart_type: ChartType;
  chart_config: ChartConfig | null;
}

interface ColMeta {
  key: string;
  isNumeric: boolean;
  isDate: boolean;
  uniqueCount: number;
}

function inferColMeta(key: string, rows: Record<string, unknown>[]): ColMeta {
  const sample = rows.slice(0, 50).map((r) => r[key]);
  const nonNull = sample.filter((v) => v != null && v !== "");

  const isNumeric = nonNull.length > 0 && nonNull.every((v) => !isNaN(Number(v)));

  const isDate =
    !isNumeric &&
    nonNull.length > 0 &&
    nonNull.every((v) => {
      const s = String(v);
      return !isNaN(Date.parse(s)) && isNaN(Number(s));
    });

  const uniqueCount = new Set(nonNull.map(String)).size;

  return { key, isNumeric, isDate, uniqueCount };
}

export function selectChart(
  rows: Record<string, unknown>[],
  hint?: Partial<{ chart_type: ChartType; x_key: string; y_key: string }>
): ChartSelection {
  if (!rows || rows.length === 0) return { chart_type: "none", chart_config: null };

  const keys = Object.keys(rows[0]);
  if (keys.length < 2) return { chart_type: "none", chart_config: null };

  // Build metadata for all columns
  const meta: Record<string, ColMeta> = {};
  for (const k of keys) meta[k] = inferColMeta(k, rows);

  // Resolve x and y keys
  const xKey = hint?.x_key ?? keys[0];
  const yKey = hint?.y_key ?? keys[1];
  const xMeta = meta[xKey];
  const yMeta = meta[yKey];

  if (!xMeta || !yMeta) return { chart_type: "none", chart_config: null };

  const config: ChartConfig = { x_key: xKey, y_key: yKey };

  // --- Rule 1: Time series → LINE ---
  if (xMeta.isDate) {
    return { chart_type: "line", chart_config: config };
  }

  // --- Rule 2: Both numeric + no date → SCATTER ---
  if (xMeta.isNumeric && yMeta.isNumeric) {
    return { chart_type: "scatter", chart_config: config };
  }

  // --- Rule 3: Categorical x + numeric y ---
  if (!xMeta.isNumeric && yMeta.isNumeric) {
    // Pie: ≤8 unique categories and hint suggests pie or column name implies share/pct
    const isPieHint = hint?.chart_type === "pie";
    const isPieName =
      /share|pct|percent|proportion|ratio/i.test(yKey) ||
      /share|pct|percent|proportion|ratio/i.test(xKey);

    if ((isPieHint || isPieName) && xMeta.uniqueCount <= 8) {
      return { chart_type: "pie", chart_config: config };
    }

    // Default categorical → BAR
    return { chart_type: "bar", chart_config: config };
  }

  // --- Rule 4: Categorical x + categorical y → BAR on count ---
  return { chart_type: "bar", chart_config: config };
}