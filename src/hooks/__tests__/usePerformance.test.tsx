import React from 'react';
import { renderHook, act } from '@testing-library/react';
import {
  useRenderPerformance,
  usePagePerformance,
  useCachedData,
  useNetworkPerformance,
  useSupabasePerformance,
  useMemoryMonitoring,
  useFormPerformance,
  usePerformanceStats
} from '../usePerformance';
import { performanceService } from '../../services/performanceService';
import { cacheService } from '../../services/cacheService';

// ===========================================
// PERFORMANCE HOOKS UNIT TESTS
// ===========================================

// Mock the services
jest.mock('../../services/performanceService');
jest.mock('../../services/cacheService');

const mockPerformanceService = performanceService as jest.Mocked<typeof performanceService>;
const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;

describe('Performance Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockPerformanceService.recordMetric.mockResolvedValue(undefined);
    mockPerformanceService.measureAsync.mockImplementation(async (_, fn) => fn());
    mockPerformanceService.measureSupabaseQuery.mockImplementation(async (_, fn) => fn());
    mockCacheService.cachedCall.mockImplementation(async (_, fn) => fn());
  });

  describe('useRenderPerformance', () => {
    test('should measure component render performance', () => {
      const TestComponent: React.FC = () => {
        useRenderPerformance('TestComponent');
        return <div>Test Component</div>;
      };

      const { unmount } = renderHook(() => useRenderPerformance('TestComponent'));

      // Should record performance metric on unmount
      unmount();

      expect(mockPerformanceService.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'component-render-TestComponent',
          unit: 'ms',
          tags: { component: 'TestComponent' }
        })
      );
    });

    test('should provide measureUpdate function', () => {
      const { result } = renderHook(() => useRenderPerformance('TestComponent'));

      act(() => {
        result.current.measureUpdate('props-change');
      });

      expect(mockPerformanceService.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'component-update-TestComponent',
          tags: { component: 'TestComponent', updateType: 'props-change' }
        })
      );
    });
  });

  describe('usePagePerformance', () => {
    test('should measure page load performance', () => {
      // Mock document.readyState
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true
      });

      renderHook(() => usePagePerformance('HomePage'));

      expect(mockPerformanceService.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'page-load-HomePage',
          unit: 'ms',
          tags: { page: 'HomePage' }
        })
      );
    });

    test('should wait for window load event if document not ready', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true
      });

      renderHook(() => usePagePerformance('HomePage'));

      // Should not record metric immediately
      expect(mockPerformanceService.recordMetric).not.toHaveBeenCalled();

      // Simulate window load event
      act(() => {
        window.dispatchEvent(new Event('load'));
      });

      expect(mockPerformanceService.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'page-load-HomePage'
        })
      );
    });
  });

  describe('useCachedData', () => {
    test('should fetch data with caching', async () => {
      const mockFetcher = jest.fn().mockResolvedValue('cached data');
      const mockOnSuccess = jest.fn();

      const { result } = renderHook(() =>
        useCachedData('test-key', mockFetcher, {
          ttl: 1000,
          tags: ['test'],
          onSuccess: mockOnSuccess
        })
      );

      await act(async () => {
        const data = await result.current.fetchData();
        expect(data).toBe('cached data');
      });

      expect(mockCacheService.cachedCall).toHaveBeenCalledWith(
        'test-key',
        mockFetcher,
        1000,
        ['test']
      );
      expect(mockPerformanceService.measureAsync).toHaveBeenCalledWith(
        'cache-fetch-test-key',
        expect.any(Function)
      );
    });

    test('should handle fetch errors', async () => {
      const mockFetcher = jest.fn().mockRejectedValue(new Error('Fetch failed'));
      const mockOnError = jest.fn();

      const { result } = renderHook(() =>
        useCachedData('test-key', mockFetcher, {
          onError: mockOnError
        })
      );

      await act(async () => {
        try {
          await result.current.fetchData();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });

    test('should provide cache invalidation functions', async () => {
      const { result } = renderHook(() =>
        useCachedData('test-key', jest.fn())
      );

      await act(async () => {
        await result.current.invalidateCache();
      });

      expect(mockCacheService.delete).toHaveBeenCalledWith('test-key');

      await act(async () => {
        await result.current.invalidateByTags(['user', 'session']);
      });

      expect(mockCacheService.clearByTags).toHaveBeenCalledWith(['user', 'session']);
    });

    test('should respect enabled flag', async () => {
      const mockFetcher = jest.fn();

      const { result } = renderHook(() =>
        useCachedData('test-key', mockFetcher, { enabled: false })
      );

      await act(async () => {
        try {
          await result.current.fetchData();
        } catch (error) {
          expect(error.message).toBe('Data fetching is disabled');
        }
      });

      expect(mockFetcher).not.toHaveBeenCalled();
    });
  });

  describe('useNetworkPerformance', () => {
    test('should measure network request performance', async () => {
      const mockResponse = new Response('response body', { status: 200 });
      const mockRequestFunction = jest.fn().mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useNetworkPerformance());

      await act(async () => {
        const response = await result.current.measureRequest(
          '/api/test',
          'GET',
          mockRequestFunction
        );
        expect(response).toBe(mockResponse);
      });

      expect(mockPerformanceService.recordNetworkRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/test',
          method: 'GET',
          status: 200,
          type: 'api'
        })
      );
    });

    test('should handle network request failures', async () => {
      const mockRequestFunction = jest.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useNetworkPerformance());

      await act(async () => {
        try {
          await result.current.measureRequest('/api/test', 'GET', mockRequestFunction);
        } catch (error) {
          expect(error.message).toBe('Network error');
        }
      });

      expect(mockPerformanceService.recordNetworkRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/test',
          method: 'GET',
          status: 0,
          type: 'api'
        })
      );
    });
  });

  describe('useSupabasePerformance', () => {
    test('should measure Supabase query performance', async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        data: [{ id: 1, name: 'Test' }],
        error: null
      });

      const { result } = renderHook(() => useSupabasePerformance());

      await act(async () => {
        const queryResult = await result.current.measureQuery(
          'get-users',
          mockQuery,
          'users'
        );
        expect(queryResult.data).toEqual([{ id: 1, name: 'Test' }]);
      });

      expect(mockPerformanceService.measureSupabaseQuery).toHaveBeenCalledWith(
        'get-users',
        mockQuery,
        'users'
      );
    });

    test('should provide cached query functionality', async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        data: [{ id: 1, name: 'Test' }],
        error: null
      });

      const { result } = renderHook(() => useSupabasePerformance());

      await act(async () => {
        await result.current.cachedQuery(
          'users-cache-key',
          'get-users',
          mockQuery,
          { ttl: 1000, tags: ['users'], tableName: 'users' }
        );
      });

      expect(mockCacheService.cachedCall).toHaveBeenCalledWith(
        'users-cache-key',
        expect.any(Function),
        1000,
        ['users']
      );
    });
  });

  describe('useMemoryMonitoring', () => {
    test('should monitor component memory usage', () => {
      jest.useFakeTimers();

      renderHook(() => useMemoryMonitoring('TestComponent'));

      // Fast-forward time to trigger memory monitoring
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(mockPerformanceService.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'memory-usage-TestComponent',
          unit: 'MB',
          tags: { component: 'TestComponent' }
        })
      );

      jest.useRealTimers();
    });
  });

  describe('useFormPerformance', () => {
    test('should provide form performance measurement functions', () => {
      const { result } = renderHook(() => useFormPerformance('LoginForm'));

      act(() => {
        result.current.startMeasurement();
      });

      expect(mockPerformanceService.mark).toHaveBeenCalledWith('form-LoginForm-start');

      act(() => {
        result.current.measureSubmission(true, 0);
      });

      expect(mockPerformanceService.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'form-submission-LoginForm',
          tags: {
            form: 'LoginForm',
            success: 'true',
            validationErrors: '0'
          }
        })
      );

      act(() => {
        result.current.measureValidation(50, 2);
      });

      expect(mockPerformanceService.recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'form-validation-LoginForm',
          value: 50,
          tags: {
            form: 'LoginForm',
            errors: '2'
          }
        })
      );
    });
  });

  describe('usePerformanceStats', () => {
    test('should provide performance statistics functions', async () => {
      const mockReport = {
        pageLoadTime: 1500,
        memoryUsage: 25,
        cachePerformance: { hitRate: 85 }
      };
      const mockCacheStats = { totalEntries: 100 };

      mockPerformanceService.generateReport.mockResolvedValue(mockReport as any);
      mockCacheService.getStats.mockReturnValue(mockCacheStats as any);

      const { result } = renderHook(() => usePerformanceStats());

      await act(async () => {
        const stats = await result.current.getStats();
        expect(stats.performance).toBe(mockReport);
        expect(stats.cache).toBe(mockCacheStats);
      });

      expect(mockPerformanceService.generateReport).toHaveBeenCalled();
      expect(mockCacheService.getStats).toHaveBeenCalled();
    });

    test('should get metrics by name', () => {
      const mockMetrics = [
        { name: 'test-metric', value: 100, unit: 'ms', timestamp: Date.now() }
      ];
      mockPerformanceService.getMetrics.mockReturnValue(mockMetrics);

      const { result } = renderHook(() => usePerformanceStats());

      act(() => {
        const metrics = result.current.getMetrics('test-metric');
        expect(metrics).toBe(mockMetrics);
      });

      expect(mockPerformanceService.getMetrics).toHaveBeenCalledWith('test-metric');
    });

    test('should get average metric values', () => {
      mockPerformanceService.getAverageMetric.mockReturnValue(150);

      const { result } = renderHook(() => usePerformanceStats());

      act(() => {
        const average = result.current.getAverageMetric('test-metric', 3600000);
        expect(average).toBe(150);
      });

      expect(mockPerformanceService.getAverageMetric).toHaveBeenCalledWith('test-metric', 3600000);
    });

    test('should clear performance stats', () => {
      const { result } = renderHook(() => usePerformanceStats());

      act(() => {
        result.current.clearStats();
      });

      expect(mockPerformanceService.clear).toHaveBeenCalled();
    });
  });
});