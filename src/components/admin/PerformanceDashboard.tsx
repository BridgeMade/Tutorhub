import React, { useState, useEffect, useCallback } from 'react';
import { usePerformanceStats } from '../../hooks/usePerformance';
import { PerformanceReport, PerformanceMetric } from '../../services/performanceService';
import { CacheStats } from '../../services/cacheService';
import { OptimizedDataTable, TableColumn } from '../common/OptimizedDataTable';
import { PerformanceOptimizer } from '../common/PerformanceOptimizer';

// ===========================================
// PERFORMANCE DASHBOARD COMPONENT
// ===========================================

interface PerformanceData {
  performance: PerformanceReport;
  cache: CacheStats;
}

const PerformanceDashboard: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [recentMetrics, setRecentMetrics] = useState<PerformanceMetric[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h'>('1h');
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { getStats, getMetrics, clearStats } = usePerformanceStats();

  // Load performance data
  const loadPerformanceData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [stats, metrics] = await Promise.all([
        getStats(),
        Promise.resolve(getMetrics())
      ]);

      setPerformanceData(stats);
      
      // Filter metrics by time range
      const timeRangeMs = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000
      }[selectedTimeRange];

      const cutoff = Date.now() - timeRangeMs;
      const filteredMetrics = metrics.filter(m => m.timestamp > cutoff);
      setRecentMetrics(filteredMetrics);

    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getStats, getMetrics, selectedTimeRange]);

  // Auto-refresh effect
  useEffect(() => {
    loadPerformanceData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadPerformanceData, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadPerformanceData, autoRefresh]);

  // Handle clear stats
  const handleClearStats = useCallback(() => {
    if (confirm('Are you sure you want to clear all performance data?')) {
      clearStats();
      loadPerformanceData();
    }
  }, [clearStats, loadPerformanceData]);

  // Metrics table columns
  const metricsColumns: TableColumn<PerformanceMetric>[] = [
    {
      key: 'name',
      header: 'Metric Name',
      width: 200,
      sortable: true
    },
    {
      key: 'value',
      header: 'Value',
      width: 100,
      sortable: true,
      render: (value, row) => `${value.toFixed(2)} ${row.unit}`
    },
    {
      key: 'timestamp',
      header: 'Time',
      width: 150,
      sortable: true,
      render: (timestamp) => new Date(timestamp).toLocaleTimeString()
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (tags) => tags ? Object.entries(tags).map(([k, v]) => `${k}:${v}`).join(', ') : '-'
    }
  ];

  if (isLoading && !performanceData) {
    return (
      <PerformanceOptimizer componentName="PerformanceDashboard" memoryMonitoring>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </PerformanceOptimizer>
    );
  }

  return (
    <PerformanceOptimizer componentName="PerformanceDashboard" memoryMonitoring>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${(performanceData?.performance.pageLoadTime ?? 0) < 3000 ? 'bg-green-500' : (performanceData?.performance.pageLoadTime ?? 0) < 5000 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
              <span className="text-sm text-gray-600">
                {(performanceData?.performance.pageLoadTime ?? 0) < 3000 ? 'Good' : (performanceData?.performance.pageLoadTime ?? 0) < 5000 ? 'Fair' : 'Poor'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
            </select>

            {/* Auto-refresh Toggle */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Auto-refresh</span>
            </label>

            {/* Actions */}
            <button
              onClick={loadPerformanceData}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>

            <button
              onClick={handleClearStats}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Clear Stats
            </button>
          </div>
        </div>

        {performanceData && (
          <>
            {/* Core Web Vitals */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Page Load Time"
                  value={`${Math.round(performanceData.performance.pageLoadTime)}ms`}
                  status={performanceData.performance.pageLoadTime < 3000 ? 'good' : performanceData.performance.pageLoadTime < 5000 ? 'fair' : 'poor'}
                  target="< 3000ms"
                />
                <MetricCard
                  title="First Contentful Paint"
                  value={`${Math.round(performanceData.performance.firstContentfulPaint)}ms`}
                  status={performanceData.performance.firstContentfulPaint < 1800 ? 'good' : performanceData.performance.firstContentfulPaint < 3000 ? 'fair' : 'poor'}
                  target="< 1800ms"
                />
                <MetricCard
                  title="Largest Contentful Paint"
                  value={`${Math.round(performanceData.performance.largestContentfulPaint)}ms`}
                  status={performanceData.performance.largestContentfulPaint < 2500 ? 'good' : performanceData.performance.largestContentfulPaint < 4000 ? 'fair' : 'poor'}
                  target="< 2500ms"
                />
                <MetricCard
                  title="Cumulative Layout Shift"
                  value={performanceData.performance.cumulativeLayoutShift.toFixed(3)}
                  status={performanceData.performance.cumulativeLayoutShift < 0.1 ? 'good' : performanceData.performance.cumulativeLayoutShift < 0.25 ? 'fair' : 'poor'}
                  target="< 0.100"
                />
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Memory & Resources */}
              <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Memory & Resources</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory Usage:</span>
                    <span className="font-medium">{performanceData.performance.memoryUsage}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">JS Heap Size:</span>
                    <span className="font-medium">{performanceData.performance.jsHeapSize}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network Requests:</span>
                    <span className="font-medium">{performanceData.performance.networkRequests.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Slow Requests:</span>
                    <span className="font-medium text-red-600">
                      {performanceData.performance.networkRequests.filter(r => r.duration > 2000).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cache Performance */}
              <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cache Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hit Rate:</span>
                    <span className={`font-medium ${performanceData.cache.hitRate > 80 ? 'text-green-600' : performanceData.cache.hitRate > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {performanceData.cache.hitRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Entries:</span>
                    <span className="font-medium">{performanceData.cache.totalEntries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory Usage:</span>
                    <span className="font-medium">{Math.round(performanceData.cache.memoryUsage / 1024)}KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Hits:</span>
                    <span className="font-medium text-green-600">{performanceData.cache.totalHits}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Slow Queries */}
            {performanceData.performance.slowQueries.length > 0 && (
              <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Slow Database Queries</h3>
                <div className="space-y-2">
                  {performanceData.performance.slowQueries.map((query, index) => (
                    <div key={index} className="border border-red-200 bg-red-50 rounded p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800">
                            {query.table} - {query.duration}ms
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            {query.query.length > 100 ? `${query.query.substring(0, 100)}...` : query.query}
                          </p>
                        </div>
                        <span className="text-xs text-red-500">
                          {new Date(query.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Metrics Table */}
            <div className="bg-white rounded-lg shadow border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Recent Performance Metrics</h3>
              </div>
              <OptimizedDataTable
                data={recentMetrics}
                columns={metricsColumns}
                keyField="timestamp"
                searchable
                sortable
                paginated
                pageSize={20}
                virtualized={recentMetrics.length > 100}
                containerHeight={400}
              />
            </div>
          </>
        )}
      </div>
    </PerformanceOptimizer>
  );
};

// ===========================================
// HELPER COMPONENTS
// ===========================================

interface MetricCardProps {
  title: string;
  value: string;
  status: 'good' | 'fair' | 'poor';
  target: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, status, target }) => {
  const statusColors = {
    good: 'bg-green-50 text-green-700 border-green-200',
    fair: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    poor: 'bg-red-50 text-red-700 border-red-200'
  };

  const statusIcons = {
    good: '✅',
    fair: '⚠️',
    poor: '❌'
  };

  return (
    <div className={`border rounded-lg p-4 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-75">{title}</span>
        <span className="text-lg">{statusIcons[status]}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs opacity-75">Target: {target}</div>
    </div>
  );
};

export default PerformanceDashboard;