/**
 * API client: typed wrappers around fetch calls to the FastAPI backend.
 */

import type {
  UploadResponse,
  TableSchema,
  TableListItem,
  QueryRequest,
  QueryResponse,
  QueryHistoryItem,
} from "@/types";

// Allow for QueryRequest type to be used in API
interface QueryRequest {
  table_id: string;
  question: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Upload ────────────────────────────────────────────────────────────────────

export async function uploadCSV(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    body: form,
  });
  return handleResponse<UploadResponse>(res);
}

// ─── Tables ────────────────────────────────────────────────────────────────────

export async function listTables(): Promise<TableListItem[]> {
  const res = await fetch(`${BASE_URL}/api/tables`);
  return handleResponse<TableListItem[]>(res);
}

export async function getSchema(tableId: string): Promise<TableSchema> {
  const res = await fetch(`${BASE_URL}/api/schema/${tableId}`);
  return handleResponse<TableSchema>(res);
}

// ─── Query ─────────────────────────────────────────────────────────────────────

export async function runQuery(payload: QueryRequest): Promise<QueryResponse> {
  console.log("QUERY PAYLOAD", payload);

  const res = await fetch(`${BASE_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  console.log("STATUS", res.status);
  console.log("BODY", await res.clone().text());

  return handleResponse<QueryResponse>(res);
}

// ─── History ───────────────────────────────────────────────────────────────────

export async function getHistory(limit = 50): Promise<QueryHistoryItem[]> {
  const res = await fetch(`${BASE_URL}/api/history?limit=${limit}`);
  return handleResponse<QueryHistoryItem[]>(res);
}

export async function getHistoryItem(queryId: string): Promise<QueryResponse> {
  const res = await fetch(`${BASE_URL}/api/history/${queryId}`);
  return handleResponse<QueryResponse>(res);
}

export async function deleteHistoryItem(queryId: string): Promise<void> {
  await fetch(`${BASE_URL}/api/history/${queryId}`, { method: "DELETE" });
}

// ─── Health ────────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<{
  status: string;
  gemini_configured: boolean;
}> {
  const res = await fetch(`${BASE_URL}/api/health`);
  return handleResponse(res);
}
