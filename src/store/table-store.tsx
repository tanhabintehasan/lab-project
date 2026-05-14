'use client';

import { create } from 'zustand';
import { createContext, useContext, useState, ReactNode } from 'react';

// ─── Types ───────────────────────────────────────────────────

export interface TableState {
  searchQuery: string;
  page: number;
  pageSize: number;
  sortField: string | null;
  sortOrder: 'asc' | 'desc';
  visibleColumns: Record<string, boolean>;
  selectedIds: string[];

  setSearchQuery: (q: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSort: (field: string | null, order: 'asc' | 'desc') => void;
  toggleColumn: (key: string) => void;
  setColumnVisibility: (cols: Record<string, boolean>) => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  reset: () => void;
}

export type TableStore = ReturnType<typeof createTableStore>;

// ─── Factory ─────────────────────────────────────────────────

export function createTableStore(defaultPageSize = 20) {
  return create<TableState>((set) => ({
    searchQuery: '',
    page: 1,
    pageSize: defaultPageSize,
    sortField: null,
    sortOrder: 'desc',
    visibleColumns: {},
    selectedIds: [],

    setSearchQuery: (q) => set({ searchQuery: q, page: 1 }),
    setPage: (page) => set({ page }),
    setPageSize: (pageSize) => set({ pageSize, page: 1 }),
    setSort: (field, order) => set({ sortField: field, sortOrder: order }),
    toggleColumn: (key) =>
      set((s) => ({
        visibleColumns: { ...s.visibleColumns, [key]: !s.visibleColumns[key] },
      })),
    setColumnVisibility: (cols) => set({ visibleColumns: cols }),
    toggleSelect: (id) =>
      set((s) => {
        const set = new Set(s.selectedIds);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        return { selectedIds: Array.from(set) };
      }),
    selectAll: (ids) => set({ selectedIds: ids }),
    deselectAll: () => set({ selectedIds: [] }),
    reset: () =>
      set({
        searchQuery: '',
        page: 1,
        sortField: null,
        sortOrder: 'desc',
        selectedIds: [],
      }),
  }));
}

// ─── React Context ───────────────────────────────────────────

const TableStoreContext = createContext<TableStore | null>(null);

export function TableStoreProvider({
  children,
  defaultPageSize,
}: {
  children: ReactNode;
  defaultPageSize?: number;
}) {
  const [store] = useState(() => createTableStore(defaultPageSize));
  return <TableStoreContext.Provider value={store}>{children}</TableStoreContext.Provider>;
}

export function useTableStore() {
  const store = useContext(TableStoreContext);
  if (!store) {
    throw new Error('useTableStore must be used within a <TableStoreProvider>');
  }
  return store;
}
