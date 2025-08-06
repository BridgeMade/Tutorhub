import React, { useState, useEffect, useCallback } from 'react';
import { logger, LogLevel, LogCategory } from '../../lib/logger';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// ===========================================
// MONITORING DASHBOARD COMPONENT
// ===========================================

interface SystemMetrics {
  totalLogs: number;
  errorRate: number;
  criticalErrors: number;
  responseTime: number;
  uptime: number;
  activeUsers: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface LogSummary {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, any>;
}

const MonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalLogs: 0,
    errorRate: 0,
    criticalErrors: 0,
    responseTime: 0,
    uptime: 0,
    activeUsers: 0,
    memoryUsage: 0,
    cpuUsage: 0
  });

  const [recentLogs, setRecentLogs] = useState<LogSummary[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alertsCount, setAlertsCount] = useState(0);

  // Chart data
  const [errorTrendData, setErrorTrendData] = useState<any>(null);
  const [categoryDistribution, setCategoryDistribution] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);

  // Load monitoring data
  const loadMonitoringData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get log statistics
      const logStats = await logger.getLogStats(timeRange === '1h' ? 'hour' : 
                                               timeRange === '6h' ? 'day' : 
                                               timeRange === '24h' ? 'day' : 'week');

      // Get recent logs
      const { logs } = await logger.getLogs({
        limit: 50,
        startDate: new Date(Date.now() - getTimeRangeMs(timeRange)).toISOString()
      });

      // Update metrics
      setMetrics({
        totalLogs: logStats.totalLogs,
        errorRate: logStats.errorRate,
        criticalErrors: logStats.criticalErrors,
        responseTime: getAverageResponseTime(logs),
        uptime: getSystemUptime(),
        activeUsers: await getActiveUsersCount(),
        memoryUsage: getMemoryUsage(),
        cpuUsage: getCPUUsage()
      });

      // Update recent logs
      setRecentLogs(logs.slice(0, 20).map(log => ({
        timestamp: log.timestamp,
        level: log.level,
        category: log.category,
        message: log.message,
        metadata: log.metadata
      })));

      // Update chart data
      updateChartData(logs, logStats);

      // Count alerts (critical errors and high error rates)
      const alerts = logStats.criticalErrors + (logStats.errorRate > 10 ? 1 : 0);
      setAlertsCount(alerts);

    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  // Update chart data
  const updateChartData = (logs: any[], logStats: any) => {
    // Error trend data
    const hourlyErrors = generateHourlyErrorData(logs);
    setErrorTrendData({
      labels: hourlyErrors.labels,
      datasets: [
        {
          label: 'Errors',
          data: hourlyErrors.errors,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1
        },
        {
          label: 'Critical',
          data: hourlyErrors.critical,
          borderColor: 'rgb(220, 38, 38)',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          tension: 0.1
        }
      ]
    });

    // Category distribution
    const categories = Object.entries(logStats.logsByCategory);
    setCategoryDistribution({
      labels: categories.map(([category]) => category),
      datasets: [{
        data: categories.map(([, count]) => count),
        backgroundColor: [
          '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6',
          '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6b7280'
        ]
      }]
    });

    // Performance data
    const performanceMetrics = getPerformanceMetrics(logs);
    setPerformanceData({
      labels: performanceMetrics.labels,
      datasets: [
        {
          label: 'Response Time (ms)',
          data: performanceMetrics.responseTimes,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
        },
        {
          label: 'Memory Usage (MB)',
          data: performanceMetrics.memoryUsage,
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
        }
      ]
    });
  };

  // Auto-refresh functionality
  useEffect(() => {
    loadMonitoringData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadMonitoringData, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadMonitoringData, autoRefresh]);

  if (isLoading && recentLogs.length === 0) {
    return (
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
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
          {alertsCount > 0 && (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
              {alertsCount} Alert{alertsCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
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

          {/* Manual Refresh */}
          <button
            onClick={loadMonitoringData}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow border p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatusIndicator
            label="System Health"
            status={metrics.errorRate < 5 ? 'healthy' : metrics.errorRate < 15 ? 'warning' : 'critical'}
            value={`${(100 - metrics.errorRate).toFixed(1)}%`}
          />
          <StatusIndicator
            label="Response Time"
            status={metrics.responseTime < 500 ? 'healthy' : metrics.responseTime < 1000 ? 'warning' : 'critical'}
            value={`${metrics.responseTime}ms`}
          />
          <StatusIndicator
            label="Active Users"
            status="healthy"
            value={metrics.activeUsers.toString()}
          />
          <StatusIndicator
            label="Uptime"
            status="healthy"
            value={formatUptime(metrics.uptime)}
          />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Logs"
          value={metrics.totalLogs}
          change={0}
          icon="📊"
          color="blue"
        />
        <MetricCard
          title="Error Rate"
          value={`${metrics.errorRate.toFixed(1)}%`}
          change={0}
          icon="⚠️"
          color={metrics.errorRate > 10 ? "red" : metrics.errorRate > 5 ? "yellow" : "green"}
        />
        <MetricCard
          title="Critical Errors"
          value={metrics.criticalErrors}
          change={0}
          icon="🚨"
          color={metrics.criticalErrors > 0 ? "red" : "green"}
        />
        <MetricCard
          title="Memory Usage"
          value={`${metrics.memoryUsage}MB`}
          change={0}
          icon="💾"
          color={metrics.memoryUsage > 100 ? "red" : metrics.memoryUsage > 50 ? "yellow" : "green"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Trend Chart */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Trends</h3>
          {errorTrendData && (
            <div className="h-64">
              <Line
                data={errorTrendData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Categories</h3>
          {categoryDistribution && (
            <div className="h-64">
              <Doughnut
                data={categoryDistribution}
                options={{
                  responsive: true,
                  maintainAspectRatio: false
                }}
              />
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow border p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          {performanceData && (
            <div className="h-64">
              <Bar
                data={performanceData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Logs</h2>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {recentLogs.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No logs found in the selected time range
            </div>
          ) : (
            <div className="divide-y">
              {recentLogs.map((log, index) => (
                <LogRow key={index} log={log} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===========================================
// COMPONENT HELPERS
// ===========================================

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center">
        <span className="text-2xl mr-3">{icon}</span>
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change !== 0 && (
            <p className={`text-xs ${change > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatusIndicatorProps {
  label: string;
  status: 'healthy' | 'warning' | 'critical';
  value: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ label, status, value }) => {
  const statusColors = {
    healthy: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600'
  };

  const statusIcons = {
    healthy: '✅',
    warning: '⚠️',
    critical: '❌'
  };

  return (
    <div className="flex items-center space-x-3">
      <span className="text-xl">{statusIcons[status]}</span>
      <div>
        <p className={`font-medium ${statusColors[status]}`}>{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

interface LogRowProps {
  log: LogSummary;
}

const LogRow: React.FC<LogRowProps> = ({ log }) => {
  const levelColors = {
    debug: 'text-gray-600 bg-gray-100',
    info: 'text-blue-600 bg-blue-100',
    warn: 'text-yellow-600 bg-yellow-100',
    error: 'text-red-600 bg-red-100',
    critical: 'text-red-700 bg-red-200'
  };

  const categoryIcons = {
    authentication: '🔐',
    session: '📅',
    payment: '💳',
    resource: '📚',
    message: '💬',
    system: '⚙️',
    security: '🛡️',
    performance: '⚡',
    user_action: '👤',
    api: '🔌',
    database: '🗄️',
    email: '📧',
    privacy: '🔒',
    analytics: '📊'
  } as Record<LogCategory, string>;

  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors[log.level]}`}>
              {log.level.toUpperCase()}
            </span>
            <span className="text-lg">{categoryIcons[log.category] || '📝'}</span>
            <span className="text-sm font-medium text-gray-600">{log.category}</span>
          </div>
          <p className="text-gray-900 mb-1">{log.message}</p>
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <details className="text-xs text-gray-600">
              <summary className="cursor-pointer hover:text-gray-800">Metadata</summary>
              <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>
        <div className="text-xs text-gray-500 ml-4">
          {new Date(log.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

function getTimeRangeMs(range: string): number {
  const ranges = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };
  return ranges[range as keyof typeof ranges] || ranges['1h'];
}

function getAverageResponseTime(logs: any[]): number {
  const apiLogs = logs.filter(log => log.metadata?.type === 'api_call' && log.metadata?.duration);
  if (apiLogs.length === 0) return 0;
  
  const totalTime = apiLogs.reduce((sum, log) => sum + log.metadata.duration, 0);
  return Math.round(totalTime / apiLogs.length);
}

function getSystemUptime(): number {
  // In a real implementation, this would get actual system uptime
  return Math.floor(Math.random() * 100000) + 500000; // Mock data
}

async function getActiveUsersCount(): Promise<number> {
  // In a real implementation, this would query active sessions
  return Math.floor(Math.random() * 100) + 50; // Mock data
}

function getMemoryUsage(): number {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return Math.round(memory.usedJSHeapSize / 1024 / 1024);
  }
  return Math.floor(Math.random() * 50) + 20; // Mock data
}

function getCPUUsage(): number {
  // Browser doesn't have direct CPU access, this would be server-side
  return Math.floor(Math.random() * 30) + 10; // Mock data
}

function generateHourlyErrorData(logs: any[]) {
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - (23 - i), 0, 0, 0);
    return hour.getHours().toString().padStart(2, '0') + ':00';
  });

  const errors = hours.map(() => Math.floor(Math.random() * 10));
  const critical = hours.map(() => Math.floor(Math.random() * 3));

  return { labels: hours, errors, critical };
}

function getPerformanceMetrics(logs: any[]) {
  const labels = ['API Calls', 'Database', 'Rendering', 'Network', 'Memory'];
  const responseTimes = labels.map(() => Math.floor(Math.random() * 500) + 100);
  const memoryUsage = labels.map(() => Math.floor(Math.random() * 50) + 20);

  return { labels, responseTimes, memoryUsage };
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  return `${days}d ${hours}h`;
}

export default MonitoringDashboard;