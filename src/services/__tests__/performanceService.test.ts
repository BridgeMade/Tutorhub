import { performanceService } from '../performanceService';
import { mockPerformance } from '../../utils/testUtils';

// ===========================================
// PERFORMANCE SERVICE UNIT TESTS
// ===========================================

describe('PerformanceService', () => {
  beforeEach(() => {
    // Clear performance data before each test
    performanceService.clear();
    jest.clearAllMocks();
    
    // Mock performance.now() to return predictable values
    let mockTime = 1000;
    jest.spyOn(performance, 'now').mockImplementation(() => mockTime += 100);
  });

  describe('Performance Marking and Measurement', () => {
    test('should create performance marks', () => {
      const markName = 'test-operation';
      const metadata = { component: 'TestComponent' };

      performanceService.mark(markName, metadata);

      // Verify the mark was created (implementation detail)
      expect(performance.now).toHaveBeenCalled();
    });

    test('should measure duration between marks', () => {
      const markName = 'test-measurement';
      
      performanceService.mark(markName);
      const duration = performanceService.measure(markName);

      expect(duration).toBeGreaterThan(0);
      expect(typeof duration).toBe('number');
    });

    test('should handle measuring non-existent marks', () => {
      const duration = performanceService.measure('non-existent-mark');
      expect(duration).toBe(0);
    });

    test('should accept custom duration values', () => {
      const markName = 'custom-duration-mark';
      const customDuration = 500;

      performanceService.mark(markName);
      const duration = performanceService.measure(markName, customDuration);

      expect(duration).toBe(customDuration);
    });
  });

  describe('Metric Recording', () => {
    test('should record performance metrics', () => {
      const metric = {
        name: 'test-metric',
        value: 123.45,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { category: 'test' }
      };

      performanceService.recordMetric(metric);

      const metrics = performanceService.getMetrics('test-metric');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toEqual(metric);
    });

    test('should limit metrics array size', () => {
      // Add more than 1000 metrics
      for (let i = 0; i < 1200; i++) {
        performanceService.recordMetric({
          name: `metric-${i}`,
          value: i,
          unit: 'ms',
          timestamp: Date.now()
        });
      }

      const allMetrics = performanceService.getMetrics();
      expect(allMetrics.length).toBeLessThanOrEqual(500); // Should be trimmed
    });
  });

  describe('Network Request Monitoring', () => {
    test('should record network requests', () => {
      const networkRequest = {
        url: '/api/users',
        method: 'GET',
        duration: 250,
        status: 200,
        size: 1024,
        type: 'api' as const
      };

      performanceService.recordNetworkRequest(networkRequest);

      // Generate report to access network requests
      return performanceService.generateReport().then(report => {
        expect(report.networkRequests).toContainEqual(networkRequest);
      });
    });

    test('should detect slow network requests', () => {
      const slowRequest = {
        url: '/api/slow-endpoint',
        method: 'POST',
        duration: 6000, // 6 seconds
        status: 200,
        size: 2048,
        type: 'api' as const
      };

      // Mock console.warn to capture warning
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      performanceService.recordNetworkRequest(slowRequest);

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('Slow Query Monitoring', () => {
    test('should record slow database queries', () => {
      const slowQuery = {
        query: 'SELECT * FROM users WHERE complex_condition = true',
        duration: 1500,
        table: 'users',
        timestamp: Date.now()
      };

      performanceService.recordSlowQuery(slowQuery);

      return performanceService.generateReport().then(report => {
        expect(report.slowQueries).toContainEqual(slowQuery);
      });
    });

    test('should limit slow queries array size', () => {
      // Add more than 50 slow queries
      for (let i = 0; i < 60; i++) {
        performanceService.recordSlowQuery({
          query: `SELECT * FROM table${i}`,
          duration: 1000 + i,
          table: `table${i}`,
          timestamp: Date.now()
        });
      }

      return performanceService.generateReport().then(report => {
        expect(report.slowQueries.length).toBeLessThanOrEqual(25);
      });
    });
  });

  describe('Performance Report Generation', () => {
    test('should generate comprehensive performance report', async () => {
      const report = await performanceService.generateReport();

      expect(report).toHaveProperty('pageLoadTime');
      expect(report).toHaveProperty('firstContentfulPaint');
      expect(report).toHaveProperty('largestContentfulPaint');
      expect(report).toHaveProperty('cumulativeLayoutShift');
      expect(report).toHaveProperty('memoryUsage');
      expect(report).toHaveProperty('networkRequests');
      expect(report).toHaveProperty('slowQueries');
      expect(report).toHaveProperty('cachePerformance');

      expect(Array.isArray(report.networkRequests)).toBe(true);
      expect(Array.isArray(report.slowQueries)).toBe(true);
      expect(typeof report.cachePerformance).toBe('object');
    });
  });

  describe('Metric Retrieval and Analysis', () => {
    test('should get metrics by name', () => {
      const metric1 = {
        name: 'component-render',
        value: 50,
        unit: 'ms',
        timestamp: Date.now()
      };
      const metric2 = {
        name: 'component-render',
        value: 75,
        unit: 'ms',
        timestamp: Date.now() + 1000
      };
      const metric3 = {
        name: 'api-call',
        value: 200,
        unit: 'ms',
        timestamp: Date.now() + 2000
      };

      performanceService.recordMetric(metric1);
      performanceService.recordMetric(metric2);
      performanceService.recordMetric(metric3);

      const renderMetrics = performanceService.getMetrics('component-render');
      expect(renderMetrics).toHaveLength(2);
      expect(renderMetrics).toContain(metric1);
      expect(renderMetrics).toContain(metric2);
    });

    test('should calculate average metric values', () => {
      const baseTime = Date.now();
      
      performanceService.recordMetric({
        name: 'test-average',
        value: 100,
        unit: 'ms',
        timestamp: baseTime
      });
      performanceService.recordMetric({
        name: 'test-average',
        value: 200,
        unit: 'ms',
        timestamp: baseTime + 1000
      });
      performanceService.recordMetric({
        name: 'test-average',
        value: 300,
        unit: 'ms',
        timestamp: baseTime + 2000
      });

      const average = performanceService.getAverageMetric('test-average');
      expect(average).toBe(200); // (100 + 200 + 300) / 3
    });

    test('should calculate average within time window', () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      const twoHoursAgo = now - (2 * 60 * 60 * 1000);

      // Old metric (outside time window)
      performanceService.recordMetric({
        name: 'windowed-metric',
        value: 500,
        unit: 'ms',
        timestamp: twoHoursAgo
      });

      // Recent metrics (within time window)
      performanceService.recordMetric({
        name: 'windowed-metric',
        value: 100,
        unit: 'ms',
        timestamp: oneHourAgo + 1000
      });
      performanceService.recordMetric({
        name: 'windowed-metric',
        value: 200,
        unit: 'ms',
        timestamp: now
      });

      const timeWindow = 90 * 60 * 1000; // 90 minutes
      const average = performanceService.getAverageMetric('windowed-metric', timeWindow);
      expect(average).toBe(150); // (100 + 200) / 2, excluding the old metric
    });
  });

  describe('Helper Methods', () => {
    test('should measure component render time', () => {
      const componentName = 'TestComponent';
      const renderFunction = jest.fn().mockReturnValue('rendered');

      const result = performanceService.measureComponentRender(componentName, renderFunction);

      expect(result).toBe('rendered');
      expect(renderFunction).toHaveBeenCalled();
      
      // Should have recorded a metric
      const renderMetrics = performanceService.getMetrics(`component-render-${componentName}`);
      expect(renderMetrics.length).toBeGreaterThan(0);
    });

    test('should handle component render errors', () => {
      const componentName = 'FailingComponent';
      const renderFunction = jest.fn().mockImplementation(() => {
        throw new Error('Render failed');
      });

      expect(() => {
        performanceService.measureComponentRender(componentName, renderFunction);
      }).toThrow('Render failed');

      // Should still record the metric even if render failed
      const renderMetrics = performanceService.getMetrics(`component-render-${componentName}`);
      expect(renderMetrics.length).toBeGreaterThan(0);
    });

    test('should measure async operations', async () => {
      const operationName = 'async-operation';
      const asyncFunction = jest.fn().mockResolvedValue('async result');
      const metadata = { type: 'database' };

      const result = await performanceService.measureAsync(operationName, asyncFunction, metadata);

      expect(result).toBe('async result');
      expect(asyncFunction).toHaveBeenCalled();

      const metrics = performanceService.getMetrics(operationName);
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].tags).toEqual(metadata);
    });

    test('should handle async operation errors', async () => {
      const operationName = 'failing-async-operation';
      const asyncFunction = jest.fn().mockRejectedValue(new Error('Async failed'));

      await expect(
        performanceService.measureAsync(operationName, asyncFunction)
      ).rejects.toThrow('Async failed');

      // Should still record the metric
      const metrics = performanceService.getMetrics(operationName);
      expect(metrics.length).toBeGreaterThan(0);
    });

    test('should measure Supabase query performance', async () => {
      const queryName = 'get-users';
      const tableName = 'users';
      const mockQuery = jest.fn().mockResolvedValue({
        data: [{ id: 1, name: 'John' }],
        error: null
      });

      const result = await performanceService.measureSupabaseQuery(queryName, mockQuery, tableName);

      expect(result.data).toEqual([{ id: 1, name: 'John' }]);
      expect(mockQuery).toHaveBeenCalled();

      const metrics = performanceService.getMetrics(`supabase-query-${queryName}`);
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].tags).toEqual({ table: tableName });
    });

    test('should detect slow Supabase queries', async () => {
      const queryName = 'slow-query';
      const mockQuery = jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ data: [], error: null });
          }, 1500); // 1.5 seconds
        });
      });

      await performanceService.measureSupabaseQuery(queryName, mockQuery, 'users');

      return performanceService.generateReport().then(report => {
        const slowQuery = report.slowQueries.find(q => q.query === queryName);
        expect(slowQuery).toBeDefined();
        expect(slowQuery?.duration).toBeGreaterThan(1000);
      });
    });
  });

  describe('Data Management', () => {
    test('should clear all performance data', () => {
      // Add some data
      performanceService.recordMetric({
        name: 'test-metric',
        value: 100,
        unit: 'ms',
        timestamp: Date.now()
      });

      performanceService.recordNetworkRequest({
        url: '/api/test',
        method: 'GET',
        duration: 200,
        status: 200,
        size: 1024,
        type: 'api'
      });

      performanceService.clear();

      const metrics = performanceService.getMetrics();
      expect(metrics).toHaveLength(0);
    });
  });
});