/**
 * Zustand global store for the Analytics Workspace.
 * Tracks the active table, query state, and results.
 */

import { create } from "zustand";
import type {
  TableSchema,
  TableListItem,
  QueryResponse,
} from "@/types";

interface AppState {
  // Tables
  tables: TableListItem[];
  setTables: (tables: TableListItem[]) => void;
  addTable: (table: TableListItem) => void;

  // Active table / schema
  activeTableId: string | null;
  activeSchema: TableSchema | null;
  setActiveTable: (id: string, schema: TableSchema) => void;

  // Query state
  question: string;
  setQuestion: (q: string) => void;
  isQuerying: boolean;
  setIsQuerying: (v: boolean) => void;

  // Results
  queryResult: QueryResponse | null;
  setQueryResult: (r: QueryResponse | null) => void;
  queryError: string | null;
  setQueryError: (e: string | null) => void;

  // Reset
  resetResults: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  tables: [],
  setTables: (tables) => set({ tables }),
  addTable: (table) =>
    set((s) => ({ tables: [table, ...s.tables] })),

  activeTableId: null,
  activeSchema: null,
  setActiveTable: (id, schema) =>
    set({ activeTableId: id, activeSchema: schema }),

  question: "",
  setQuestion: (question) => set({ question }),
  isQuerying: false,
  setIsQuerying: (isQuerying) => set({ isQuerying }),

  queryResult: null,
  setQueryResult: (queryResult) => set({ queryResult }),
  queryError: null,
  setQueryError: (queryError) => set({ queryError }),

  resetResults: () =>
    set({ queryResult: null, queryError: null, question: "" }),
}));
