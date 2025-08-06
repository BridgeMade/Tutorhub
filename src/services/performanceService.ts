import { logger, LogCategory } from '../lib/logger';
import { cacheService } from './cacheService';

// ===========================================
// PERFORMANCE MONITORING SERVICE
// ===========================================

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface PerformanceMark {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  totalBlockingTime: number;
  timeToInteractive: number;
  memoryUsage: number;
  jsHeapSize: number;
  networkRequests: NetworkMetric[];
  slowQueries: SlowQueryMetric[];
  cachePerformance: CacheMetric;
}

interface NetworkMetric {
  url: string;
  method: string;
  duration: number;
  status: number;
  size: number;
  type: 'api' | 'static' | 'other';
}

interface SlowQueryMetric {
  query: string;
  duration: number;
  table: string;
  timestamp: number;
}

interface CacheMetric {
  hitRate: number;
  missRate: number;
  totalEntries: number;
  memoryUsage: number;
}

class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, PerformanceMark> = new Map();
  private networkRequests: NetworkMetric[] = [];
  private slowQueries: SlowQueryMetric[] = [];
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.initializeObservers();
    this.startPeriodicReporting();
  }

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string, metadata?: Record<string, any>): void {
    const mark: PerformanceMark = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.marks.set(name, mark);
    
    // Also use browser's Performance API
    if ('mark' in performance) {
      performance.mark(`${name}-start`);
    }

    logger.debug(LogCategory.PERFORMANCE, `Performance mark started: ${name}`, metadata);
  }

  /**
   * Measure the duration since a mark was created
   */
  measure(name: string, customValue?: number): number {
    const mark = this.marks.get(name);
    
    if (!mark) {
      logger.warn(LogCategory.PERFORMANCE, `Performance mark not found: ${name}`);
      return 0;
    }

    const duration = customValue ?? (performance.now() - mark.startTime);
    mark.duration = duration;

    // Use browser's Performance API
    if ('mark' in performance && 'measure' in performance) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }

    // Record metric
    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      tags: mark.metadata
    });

    logger.debug(LogCategory.PERFORMANCE, `Performance measurement completed: ${name}`, {
      duration,
      metadata: mark.metadata
    });

    return duration;
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics (last 1000)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }

    // Log significant performance issues
    if (this.isSignificantMetric(metric)) {
      logger.warn(LogCategory.PERFORMANCE, `Performance issue detected: ${metric.name}`, {
        value: metric.value,
        unit: metric.unit,
        tags: metric.tags
      });
    }
  }

  /**
   * Record network request performance
   */
  recordNetworkRequest(request: NetworkMetric): void {
    this.networkRequests.push(request);

    // Keep only recent requests (last 100)
    if (this.networkRequests.length > 100) {
      this.networkRequests = this.networkRequests.slice(-50);
    }

    // Log slow requests
    if (request.duration > 5000) { // 5 seconds
      logger.warn(LogCategory.PERFORMANCE, `Slow network request detected`, {
        url: request.url,
        duration: request.duration,
        status: request.status
      });
    }
  }

  /**
   * Record slow database query
   */
  recordSlowQuery(query: SlowQueryMetric): void {
    this.slowQueries.push(query);

    // Keep only recent queries (last 50)
    if (this.slowQueries.length > 50) {
      this.slowQueries = this.slowQueries.slice(-25);
    }

    logger.warn(LogCategory.PERFORMANCE, `Slow database query detected`, {
      query: query.query.substring(0, 100) + '...',
      duration: query.duration,
      table: query.table
    });
  }

  /**
   * Generate comprehensive performance report
   */
  async generateReport(): Promise<PerformanceReport> {
    const vitals = await this.getWebVitals();
    const cacheStats = cacheService.getStats();

    const report: PerformanceReport = {
      pageLoadTime: vitals.pageLoadTime,
      firstContentfulPaint: vitals.firstContentfulPaint,
      largestContentfulPaint: vitals.largestContentfulPaint,
      cumulativeLayoutShift: vitals.cumulativeLayoutShift,
      firstInputDelay: vitals.firstInputDelay,
      totalBlockingTime: vitals.totalBlockingTime,
      timeToInteractive: vitals.timeToInteractive,
      memoryUsage: this.getMemoryUsage(),
      jsHeapSize: this.getJSHeapSize(),
      networkRequests: [...this.networkRequests],
      slowQueries: [...this.slowQueries],
      cachePerformance: {
        hitRate: cacheStats.hitRate,
        missRate: cacheStats.missRate,
        totalEntries: cacheStats.totalEntries,
        memoryUsage: cacheStats.memoryUsage
      }
    };

    logger.info(LogCategory.PERFORMANCE, 'Performance report generated', {
      pageLoadTime: report.pageLoadTime,
      cacheHitRate: report.cachePerformance.hitRate,
      slowNetworkRequests: this.networkRequests.filter(r => r.duration > 2000).length,
      slowQueries: this.slowQueries.length
    });

    return report;
  }

  /**
   * Get performance metrics by name
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (!name) {
      return [...this.metrics];
    }
    
    return this.metrics.filter(metric => metric.name === name);
  }

  /**
   * Get average metric value
   */
  getAverageMetric(name: string, timeWindow?: number): number {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0;
    const relevantMetrics = this.metrics.filter(m => 
      m.name === name && m.timestamp > cutoff
    );

    if (relevantMetrics.length === 0) {
      return 0;
    }

    const sum = relevantMetrics.reduce((total, metric) => total + metric.value, 0);
    return sum / relevantMetrics.length;
  }

  /**
   * Clear all performance data
   */
  clear(): void {
    this.metrics = [];
    this.marks.clear();
    this.networkRequests = [];
    this.slowQueries = [];

    logger.info(LogCategory.PERFORMANCE, 'Performance data cleared');
  }

  // ===========================================
  // HELPER METHODS FOR SPECIFIC MEASUREMENTS
  // ===========================================

  /**
   * Measure React component render time
   */
  measureComponentRender<T>(
    componentName: string,
    renderFunction: () => T
  ): T {
    this.mark(`component-render-${componentName}`);
    
    try {
      const result = renderFunction();
      this.measure(`component-render-${componentName}`);
      return result;
    } catch (error) {
      this.measure(`component-render-${componentName}`);
      throw error;
    }
  }

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(
    operationName: string,
    asyncFunction: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.mark(operationName, metadata);
    
    try {
      const result = await asyncFunction();
      this.measure(operationName);
      return result;
    } catch (error) {
      this.measure(operationName);
      throw error;
    }
  }

  /**
   * Measure Supabase query performance
   */
  async measureSupabaseQuery<T>(
    queryName: string,
    queryFunction: () => Promise<{ data: T; error: any }>,
    tableName?: string
  ): Promise<{ data: T; error: any }> {
    const startTime = performance.now();
    
    try {
      const result = await queryFunction();
      const duration = performance.now() - startTime;

      this.recordMetric({
        name: `supabase-query-${queryName}`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { table: tableName || 'unknown' }
      });

      // Record slow queries
      if (duration > 1000) { // 1 second
        this.recordSlowQuery({
          query: queryName,
          duration,
          table: tableName || 'unknown',
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric({
        name: `supabase-query-error-${queryName}`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { table: tableName || 'unknown', error: 'true' }
      });

      throw error;
    }
  }

  // ===========================================
  // PRIVATE METHODS
  // ===========================================

  private initializeObservers(): void {
    // Initialize Performance Observer for Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        this.observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.processPerformanceEntry(entry);
          }
        });

        // Observe different types of performance entries
        this.observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift'] });
      } catch (error) {
        logger.warn(LogCategory.PERFORMANCE, 'Failed to initialize PerformanceObserver', { error });
      }
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        this.recordMetric({
          name: 'page-load-time',
          value: navEntry.loadEventEnd - navEntry.fetchStart,
          unit: 'ms',
          timestamp: Date.now()
        });
        break;

      case 'paint':
        this.recordMetric({
          name: entry.name.replace('-', '-'),
          value: entry.startTime,
          unit: 'ms',
          timestamp: Date.now()
        });
        break;

      case 'largest-contentful-paint':
        this.recordMetric({
          name: 'largest-contentful-paint',
          value: entry.startTime,
          unit: 'ms',
          timestamp: Date.now()
        });
        break;

      case 'layout-shift':
        const lsEntry = entry as any;
        if (!lsEntry.hadRecentInput) {
          this.recordMetric({
            name: 'cumulative-layout-shift',
            value: lsEntry.value,
            unit: 'score',
            timestamp: Date.now()
          });
        }
        break;
    }
  }

  private async getWebVitals(): Promise<{
    pageLoadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
    totalBlockingTime: number;
    timeToInteractive: number;
  }> {
    const defaultValues = {
      pageLoadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      totalBlockingTime: 0,
      timeToInteractive: 0
    };

    if (!('performance' in window)) {
      return defaultValues;
    }

    try {
      return {
        pageLoadTime: this.getAverageMetric('page-load-time') || 0,
        firstContentfulPaint: this.getAverageMetric('first-contentful-paint') || 0,
        largestContentfulPaint: this.getAverageMetric('largest-contentful-paint') || 0,
        cumulativeLayoutShift: this.getAverageMetric('cumulative-layout-shift') || 0,
        firstInputDelay: this.getAverageMetric('first-input-delay') || 0,
        totalBlockingTime: this.getAverageMetric('total-blocking-time') || 0,
        timeToInteractive: this.getAverageMetric('time-to-interactive') || 0
      };
    } catch (error) {
      logger.warn(LogCategory.PERFORMANCE, 'Failed to get web vitals', { error });
      return defaultValues;
    }
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  private getJSHeapSize(): number {
    if ('memory' in performance) {
      return Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  private isSignificantMetric(metric: PerformanceMetric): boolean {
    const thresholds: Record<string, number> = {
      'page-load-time': 3000,
      'first-contentful-paint': 2000,
      'largest-contentful-paint': 4000,
      'cumulative-layout-shift': 0.1,
      'first-input-delay': 100,
      'component-render': 100,
      'supabase-query': 1000
    };

    const threshold = thresholds[metric.name] || Infinity;
    return metric.value > threshold;
  }

  private startPeriodicReporting(): void {
    // Generate performance report every 5 minutes
    setInterval(async () => {
      try {
        const report = await this.generateReport();
        
        // Log summary metrics
        logger.info(LogCategory.PERFORMANCE, 'Periodic performance summary', {
          pageLoadTime: report.pageLoadTime,
          memoryUsage: report.memoryUsage,
          cacheHitRate: report.cachePerformance.hitRate,
          slowRequests: report.networkRequests.filter(r => r.duration > 2000).length
        });

        // Clear old data to prevent memory leaks
        if (this.metrics.length > 500) {
          this.metrics = this.metrics.slice(-250);
        }
      } catch (error) {
        logger.error(LogCategory.PERFORMANCE, 'Failed to generate periodic performance report', error as Error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();
export default performanceService;