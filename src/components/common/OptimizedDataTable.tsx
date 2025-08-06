import React, { memo, useMemo, useCallback, useState } from 'react';
import { VirtualizedList, DebouncedInput } from './PerformanceOptimizer';
import { useCachedData, useRenderPerformance } from '../../hooks/usePerformance';
import { CacheKeys, CacheTags } from '../../services/cacheService';

// ===========================================
// OPTIMIZED DATA TABLE COMPONENT
// ===========================================

export interface TableColumn<T> {
  key: keyof T;
  header: string;
  width?: number;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyField: keyof T;
  loading?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  virtualized?: boolean;
  containerHeight?: number;
  onRowClick?: (row: T, index: number) => void;
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  className?: string;
  cacheKey?: string;
  cacheTags?: string[];
}

export function OptimizedDataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  loading = false,
  searchable = false,
  sortable = false,
  paginated = false,
  pageSize = 50,
  virtualized = false,
  containerHeight = 400,
  onRowClick,
  onSort,
  className = '',
  cacheKey,
  cacheTags = []
}: TableProps<T>) {
  useRenderPerformance('OptimizedDataTable');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchQuery && searchable) {
      const query = searchQuery.toLowerCase();
      result = result.filter(row =>
        columns.some(column => {
          const value = row[column.key];
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    // Apply sorting
    if (sortColumn && sortable) {
      result.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        if (aValue === bValue) return 0;
        
        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchQuery, sortColumn, sortDirection, columns, searchable, sortable]);

  // Memoized paginated data
  const paginatedData = useMemo(() => {
    if (!paginated) return processedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, paginated, currentPage, pageSize]);

  const totalPages = Math.ceil(processedData.length / pageSize);

  // Handle column sort
  const handleSort = useCallback((column: keyof T) => {
    if (!sortable) return;

    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    onSort?.(column, newDirection);
  }, [sortColumn, sortDirection, sortable, onSort]);

  // Handle row click
  const handleRowClick = useCallback((row: T, index: number) => {
    onRowClick?.(row, index);
  }, [onRowClick]);

  // Render table row
  const renderRow = useCallback((row: T, index: number) => (
    <tr
      key={row[keyField] as string}
      className={`border-b hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
      onClick={() => handleRowClick(row, index)}
    >
      {columns.map((column) => (
        <td key={column.key as string} className="px-4 py-3 text-sm">
          {column.render
            ? column.render(row[column.key], row, index)
            : row[column.key]?.toString() || ''
          }
        </td>
      ))}
    </tr>
  ), [columns, keyField, onRowClick, handleRowClick]);

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow border ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  const displayData = paginated ? paginatedData : processedData;

  return (
    <div className={`bg-white rounded-lg shadow border ${className}`}>
      {/* Search Bar */}
      {searchable && (
        <div className="p-4 border-b">
          <DebouncedInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        {virtualized && displayData.length > 50 ? (
          // Virtualized Table for Large Datasets
          <div>
            {/* Table Header */}
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key as string}
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                      }`}
                      style={{ width: column.width }}
                      onClick={() => column.sortable !== false && handleSort(column.key)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.header}</span>
                        {sortable && column.sortable !== false && sortColumn === column.key && (
                          <span className="text-orange-500">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
            
            {/* Virtualized Body */}
            <VirtualizedList
              items={displayData}
              renderItem={(row, index) => (
                <table className="w-full">
                  <tbody>
                    {renderRow(row, index)}
                  </tbody>
                </table>
              )}
              itemHeight={60}
              containerHeight={containerHeight}
              className="border-t"
            />
          </div>
        ) : (
          // Standard Table
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key as string}
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.header}</span>
                      {sortable && column.sortable !== false && sortColumn === column.key && (
                        <span className="text-orange-500">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                    No data available
                  </td>
                </tr>
              ) : (
                displayData.map((row, index) => renderRow(row, index))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} results
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded text-sm ${
                      currentPage === page
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Memoized export
export default memo(OptimizedDataTable) as typeof OptimizedDataTable;