/**
 * Shared TypeScript types used across the frontend.
 */

export interface ColumnInfo {
  name: string;
  dtype: string;
  sql_type: string;
  nullable: boolean;
  sample_values: (string | number | null)[];
}

export interface TableSchema {
  table_id: string;
  table_name: string;
  original_filename: string;
  row_count: number;
  column_count: number;
  columns: ColumnInfo[];
  created_at: string;
}

export interface TableListItem {
  table_id: string;
  table_name: string;
  original_filename: string;
  row_count: number;
  column_count: number;
  created_at: string;
}

export interface ChartConfig {
  x_key: string;
  y_key: string;
  label_key?: string;
}

export interface QueryResponse {
  query_id: string;
  table_name: string;
  question: string;
  sql: string;
  results: Record<string, unknown>[];
  row_count: number;
  chart_type: "bar" | "line" | "pie" | "scatter" | "none";
  chart_config?: ChartConfig;
  insights: string[];
  execution_time_ms: number;
  error?: string;
}

export interface QueryHistoryItem {
  query_id: string;
  table_id: string;
  table_name: string;
  question: string;
  sql: string;
  chart_type: string;
  row_count: number;
  execution_time_ms: number;
  created_at: string;
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  schema?: TableSchema;
}
