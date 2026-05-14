'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Columns3,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { TableStoreProvider, useTableStore } from '@/store/table-store';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import type {
  AdminDataTableProps,
  AdminColumn,
  AdminBulkAction,
  TableQueryParams,
} from './types';

// ─── Helpers ─────────────────────────────────────────────────

function useDebouncedEffect(
  fn: () => void,
  deps: unknown[],
  delay = 300
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(fn, delay);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function getRowId<T>(row: T, rowIdFn?: (row: T) => string): string {
  if (rowIdFn) return rowIdFn(row);
  const r = row as Record<string, unknown>;
  if (typeof r.id === 'string') return r.id;
  if (typeof r.id === 'number') return String(r.id);
  if (typeof r._id === 'string') return r._id;
  if (typeof r._id === 'number') return String(r._id);
  return String(r);
}

// ─── Toolbar ─────────────────────────────────────────────────

function Toolbar<T>({
  columns,
  bulkActions,
}: {
  columns: AdminColumn<T>[];
  bulkActions?: AdminBulkAction[];
}) {
  const store = useTableStore();
  const searchQuery = store((s) => s.searchQuery);
  const setSearchQuery = store((s) => s.setSearchQuery);
  const selectedIds = store((s) => s.selectedIds);
  const deselectAll = store((s) => s.deselectAll);

  const [colMenuOpen, setColMenuOpen] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  // Close column menu on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) {
        setColMenuOpen(false);
      }
    }
    if (colMenuOpen) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [colMenuOpen]);

  const visibleColumns = store((s) => s.visibleColumns);
  const toggleColumn = store((s) => s.toggleColumn);

  const allVisible = useMemo(() => {
    return columns.every((c) => visibleColumns[c.key] !== false);
  }, [columns, visibleColumns]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <SearchInput
          onSearch={setSearchQuery}
          placeholder="搜索..."
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Column visibility toggle */}
        <div className="relative" ref={colMenuRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setColMenuOpen((v) => !v)}
            className="gap-1.5"
          >
            <Columns3 className="w-4 h-4" />
            <span className="hidden sm:inline">列</span>
          </Button>

          {colMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
              <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase">显示列</span>
                <button
                  onClick={() => {
                    columns.forEach((c) => {
                      const isVisible = visibleColumns[c.key] !== false;
                      if ((c.defaultVisible !== false) !== isVisible) {
                        toggleColumn(c.key);
                      }
                    });
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  重置
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {columns.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={visibleColumns[col.key] !== false}
                      onChange={() => toggleColumn(col.key)}
                    />
                    <span className="text-sm text-gray-700">{col.header}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {bulkActions && selectedIds.length > 0 && (
        <div className="sm:ml-auto flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <span className="text-sm text-blue-800 font-medium">
            已选择 {selectedIds.length} 项
          </span>
          <div className="h-4 w-px bg-blue-200" />
          <div className="flex items-center gap-1.5">
            {bulkActions.map((action, i) => (
              <Button
                key={i}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => action.action(selectedIds)}
                className="gap-1"
              >
                {action.icon && <action.icon className="w-3.5 h-3.5" />}
                {action.label}
              </Button>
            ))}
          </div>
          <button
            onClick={deselectAll}
            className="ml-1 p-1 rounded hover:bg-blue-100 text-blue-600"
            title="取消选择"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sort Indicator ──────────────────────────────────────────

function SortIcon({
  active,
  order,
}: {
  active: boolean;
  order: 'asc' | 'desc';
}) {
  return (
    <span className="inline-flex flex-col ml-1 -space-y-1">
      <ChevronUp
        className={cn(
          'w-3 h-3',
          active && order === 'asc' ? 'text-blue-600' : 'text-gray-300'
        )}
      />
      <ChevronDown
        className={cn(
          'w-3 h-3',
          active && order === 'desc' ? 'text-blue-600' : 'text-gray-300'
        )}
      />
    </span>
  );
}

// ─── Data Table Inner ────────────────────────────────────────

function DataTableInner<T>({
  columns,
  data,
  total,
  isLoading,
  onQueryChange,
  bulkActions,
  onRowClick,
  rowId,
  defaultPageSize,
  defaultSortField,
  defaultSortOrder,
  emptyMessage,
  emptyDescription,
  className,
}: AdminDataTableProps<T>) {
  const store = useTableStore();

  const searchQuery = store((s) => s.searchQuery);
  const page = store((s) => s.page);
  const pageSize = store((s) => s.pageSize);
  const sortField = store((s) => s.sortField);
  const sortOrder = store((s) => s.sortOrder);
  const selectedIds = store((s) => s.selectedIds);
  const visibleColumns = store((s) => s.visibleColumns);

  const setPage = store((s) => s.setPage);
  const setPageSize = store((s) => s.setPageSize);
  const setSort = store((s) => s.setSort);
  const toggleSelect = store((s) => s.toggleSelect);
  const selectAll = store((s) => s.selectAll);
  const deselectAll = store((s) => s.deselectAll);

  // Initialise default visibility and sort
  useEffect(() => {
    const initVisibility: Record<string, boolean> = {};
    columns.forEach((c) => {
      initVisibility[c.key] = c.defaultVisible !== false;
    });
    store.setState((s) => ({
      visibleColumns: { ...initVisibility, ...s.visibleColumns },
      pageSize: defaultPageSize ?? s.pageSize,
      sortField: defaultSortField ?? s.sortField,
      sortOrder: defaultSortOrder ?? s.sortOrder,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Emit query changes (debounced for search)
  useDebouncedEffect(
    () => {
      onQueryChange({
        q: searchQuery,
        page,
        pageSize,
        sort: sortField,
        order: sortOrder,
      });
    },
    [searchQuery, page, pageSize, sortField, sortOrder],
    300
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const visibleCols = useMemo(
    () => columns.filter((c) => visibleColumns[c.key] !== false),
    [columns, visibleColumns]
  );

  const allIds = useMemo(() => data.map((r) => getRowId(r, rowId)), [data, rowId]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
  const someSelected = allIds.some((id) => selectedIds.includes(id)) && !allSelected;

  const handleSort = (col: AdminColumn<T>) => {
    if (!col.sortable) return;
    const field = col.sortField || col.key;
    if (sortField === field) {
      setSort(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field, 'asc');
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect only the currently visible rows
      const visibleSet = new Set(allIds);
      selectAll(selectedIds.filter((id) => !visibleSet.has(id)));
    } else {
      selectAll(Array.from(new Set([...selectedIds, ...allIds])));
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Toolbar columns={columns} bulkActions={bulkActions} />

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              {bulkActions && (
                <TableHead className="w-10 px-3">
                  <Checkbox
                    indeterminate={someSelected}
                    checked={allSelected}
                    onChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {visibleCols.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    'whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none'
                  )}
                  style={{ width: col.width }}
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center">
                    {col.header}
                    {col.sortable && (
                      <SortIcon
                        active={sortField === (col.sortField || col.key)}
                        order={sortOrder}
                      />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={visibleCols.length + (bulkActions ? 1 : 0)}
                  className="p-0"
                >
                  <TableSkeleton rows={Math.min(pageSize, 8)} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleCols.length + (bulkActions ? 1 : 0)}
                  className="py-12"
                >
                  <EmptyState
                    title={emptyMessage || '暂无数据'}
                    description={emptyDescription || '没有找到匹配的记录'}
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => {
                const id = getRowId(row, rowId);
                const isSelected = selectedIds.includes(id);
                return (
                  <TableRow
                    key={id + '-' + idx}
                    className={cn(
                      onRowClick && 'cursor-pointer',
                      isSelected && 'bg-blue-50/50'
                    )}
                    onClick={() => {
                      if (onRowClick) onRowClick(row);
                    }}
                  >
                    {bulkActions && (
                      <TableCell className="w-10 px-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleSelect(id)}
                        />
                      </TableCell>
                    )}
                    {visibleCols.map((col) => (
                      <TableCell key={col.key}>
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Footer: Pagination + Page size */}
        <div className="border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>
              共 <span className="font-medium text-gray-700">{total}</span> 条记录
            </span>
            <span className="hidden sm:inline">·</span>
            <div className="flex items-center gap-1.5">
              <span>每页</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-7 px-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {[10, 15, 20, 50, 100].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span>条</span>
            </div>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Public Wrapper ──────────────────────────────────────────

export function AdminDataTable<T = unknown>(props: AdminDataTableProps<T>) {
  return (
    <TableStoreProvider defaultPageSize={props.defaultPageSize}>
      <DataTableInner {...props} />
    </TableStoreProvider>
  );
}
