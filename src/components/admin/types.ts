import { ReactNode } from 'react';

/** Single column definition for AdminDataTable */
export interface AdminColumn<T = unknown> {
  /** Unique key for this column (used for visibility toggling) */
  key: string;
  /** Header label shown in the table head */
  header: string;
  /** Render function for cell content */
  cell: (row: T) => ReactNode;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** The server field name to sort by (defaults to `key` if not provided) */
  sortField?: string;
  /** CSS width (e.g. "120px", "15%") */
  width?: string;
  /** Whether this column is visible by default */
  defaultVisible?: boolean;
}

/** Bulk action item shown when rows are selected */
export interface AdminBulkAction {
  /** Display label */
  label: string;
  /** Callback receives selected row IDs */
  action: (ids: string[]) => void | Promise<void>;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  /** Optional icon (Lucide icon component) */
  icon?: React.ComponentType<{ className?: string }>;
}

/** Query params emitted by the table when state changes */
export interface TableQueryParams {
  q: string;
  page: number;
  pageSize: number;
  sort: string | null;
  order: 'asc' | 'desc';
}

/** Props for AdminDataTable */
export interface AdminDataTableProps<T = unknown> {
  /** Column definitions */
  columns: AdminColumn<T>[];
  /** Data rows */
  data: T[];
  /** Total count for pagination */
  total: number;
  /** Loading state */
  isLoading?: boolean;
  /** Called whenever query params change (search, page, sort, pageSize) */
  onQueryChange: (params: TableQueryParams) => void;
  /** Bulk actions (enables row selection) */
  bulkActions?: AdminBulkAction[];
  /** Click handler for a row */
  onRowClick?: (row: T) => void;
  /** Extract unique row ID (defaults to row.id) */
  rowId?: (row: T) => string;
  /** Default page size */
  defaultPageSize?: number;
  /** Default sort field */
  defaultSortField?: string | null;
  /** Default sort order */
  defaultSortOrder?: 'asc' | 'desc';
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Additional className for the wrapper */
  className?: string;
}
