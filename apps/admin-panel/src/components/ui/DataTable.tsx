'use client';

import { useState, useMemo, type ReactNode } from 'react';

export interface Column<T> {
  header: string;
  accessor: keyof T | string;
  sortable?: boolean;
  render?: (value: any, row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  loading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchable?: boolean;
  onRowClick?: (row: T) => void;
  keyExtractor?: (row: T) => string;
  keyField?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export default function DataTable<T>({
  columns,
  data,
  total,
  page = 1,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  loading,
  searchValue: externalSearchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  searchable = false,
  onRowClick,
  keyExtractor,
  keyField,
  emptyTitle = 'No data found',
  emptyDescription = 'Try adjusting your search or filters.',
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [internalSearch, setInternalSearch] = useState('');

  const searchValue = externalSearchValue ?? (searchable ? internalSearch : undefined);
  const handleSearchChange = onSearchChange ?? (searchable ? setInternalSearch : undefined);

  const getRowKey = (row: T, index: number): string => {
    if (keyExtractor) return keyExtractor(row);
    if (keyField) return String((row as Record<string, unknown>)[keyField] ?? index);
    return String(index);
  };

  const filteredData = useMemo(() => {
    if (!searchable || !internalSearch) return data;
    const q = internalSearch.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = getNestedValue(row, String(col.accessor));
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, internalSearch, searchable, columns]);

  const sortedData = useMemo(() => {
    const source = searchable ? filteredData : data;
    if (!sortColumn) return source;
    const sorted = [...data].sort((a, b) => {
      const aVal = getNestedValue(a, sortColumn);
      const bVal = getNestedValue(b, sortColumn);
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal;
      return String(aVal).localeCompare(String(bVal));
    });
    return sortDir === 'desc' ? sorted.reverse() : sorted;
  }, [data, filteredData, searchable, sortColumn, sortDir]);

  const handleSort = (accessor: string) => {
    if (sortColumn === accessor) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(accessor);
      setSortDir('asc');
    }
  };

  const totalRecords = total ?? data.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="card overflow-hidden p-0">
        {handleSearchChange && (
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="h-9 w-64 animate-pulse rounded-lg bg-gray-200" />
          </div>
        )}
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-4">
              {columns.map((_, ci) => (
                <div key={ci} className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      {/* Search bar */}
      {handleSearchChange && (
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="relative max-w-sm">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={searchValue ?? ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="input pl-10"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500">
              {columns.map((col) => (
                <th
                  key={String(col.accessor)}
                  className={`px-4 py-3 font-semibold ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''} ${col.className ?? ''}`}
                  onClick={col.sortable ? () => handleSort(String(col.accessor)) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortColumn === String(col.accessor) && (
                      <span className="text-brand-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedData.map((row, i) => (
              <tr
                key={getRowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`transition-colors hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td key={String(col.accessor)} className={`px-4 py-3 ${col.className ?? ''}`}>
                    {col.render
                      ? col.render(getNestedValue(row, String(col.accessor)), row)
                      : (getNestedValue(row, String(col.accessor)) as ReactNode) ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {sortedData.length === 0 && (
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <svg className="mb-4 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <p className="text-sm font-semibold text-gray-700">{emptyTitle}</p>
          <p className="mt-1 text-xs text-gray-400">{emptyDescription}</p>
        </div>
      )}

      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalRecords)} of {totalRecords}</span>
            {onPageSizeChange && (
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="input ml-2 w-auto py-1 text-xs"
                aria-label="Page size"
              >
                {[10, 20, 50, 100].map((s) => (
                  <option key={s} value={s}>{s} / page</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="rounded-lg px-2.5 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40"
              aria-label="Previous page"
            >
              ‹ Prev
            </button>
            {pageNumbers.map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  p === page ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="rounded-lg px-2.5 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40"
              aria-label="Next page"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
