import { useEffect, useCallback, useRef } from 'react';
import { performanceService } from '../services/performanceService';
import { cacheService, CacheKeys, CacheTags } from '../services/cacheService';
import { logger, LogCategory } from '../lib/logger';

// ===========================================
// PERFORMANCE MONITORING HOOKS
// ===========================================

/**
 * Hook to measure component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
    
    return () => {
      const duration = performance.now() - renderStartRef.current;
      performanceService.recordMetric({
        name: `component-render-${componentName}`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { component: componentName }
      });
    };
  });

  const measureUpdate = useCallback((updateType: string) => {
    const duration = performance.now() - renderStartRef.current;
    performanceService.recordMetric({
      name: `component-update-${componentName}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      tags: { component: componentName, updateType }
    });
  }, [componentName]);

  return { measureUpdate };
}

/**
 * Hook to measure page load performance
 */
export function usePagePerformance(pageName: string) {
  useEffect(() => {
    const startTime = performance.now();
    performanceService.mark(`page-${pageName}-load`);

    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      performanceService.recordMetric({
        name: `page-load-${pageName}`,
        value: loadTime,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { page: pageName }
      });

      logger.info(LogCategory.PERFORMANCE, `Page load completed: ${pageName}`, {
        loadTime,
        page: pageName
      });
    };

    // Measure when DOM is ready
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad, { once: true });
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, [pageName]);
}

/**
 * Hook for cached data fetching with performance monitoring
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    tags?: string[];
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes
    tags = [],
    enabled = true,
    onSuccess,
    onError
  } = options;

  const fetchData = useCallback(async (): Promise<T> => {
    if (!enabled) {
      throw new Error('Data fetching is disabled');
    }

    try {
      const data = await performanceService.measureAsync(
        `cache-fetch-${key}`,
        () => cacheService.cachedCall(key, fetcher, ttl, tags)
      );

      onSuccess?.(data);
      return data;
    } catch (error) {
      const errorObj = error as Error;
      logger.error(LogCategory.PERFORMANCE, `Cached data fetch failed: ${key}`, errorObj);
      onError?.(errorObj);
      throw error;
    }
  }, [key, fetcher, ttl, tags, enabled, onSuccess, onError]);

  const invalidateCache = useCallback(async () => {
    await cacheService.delete(key);
    logger.debug(LogCategory.PERFORMANCE, `Cache invalidated: ${key}`);
  }, [key]);

  const invalidateByTags = useCallback(async (tagsToInvalidate: string[]) => {
    const cleared = await cacheService.clearByTags(tagsToInvalidate);
    logger.debug(LogCategory.PERFORMANCE, `Cache cleared by tags`, {
      tags: tagsToInvalidate,
      cleared
    });
  }, []);

  return {
    fetchData,
    invalidateCache,
    invalidateByTags
  };
}

/**
 * Hook to monitor network request performance
 */
export function useNetworkPerformance() {
  const measureRequest = useCallback(async <T>(
    url: string,
    method: string,
    requestFunction: () => Promise<Response>
  ): Promise<Response> => {
    const startTime = performance.now();
    
    try {
      const response = await requestFunction();
      const duration = performance.now() - startTime;

      performanceService.recordNetworkRequest({
        url,
        method,
        duration,
        status: response.status,
        size: parseInt(response.headers.get('content-length') || '0'),
        type: url.includes('/api/') ? 'api' : 'static'
      });

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      performanceService.recordNetworkRequest({
        url,
        method,
        duration,
        status: 0,
        size: 0,
        type: 'api'
      });

      throw error;
    }
  }, []);

  return { measureRequest };
}

/**
 * Hook for Supabase query performance monitoring
 */
export function useSupabasePerformance() {
  const measureQuery = useCallback(async <T>(
    queryName: string,
    queryFunction: () => Promise<{ data: T; error: any }>,
    tableName?: string
  ) => {
    return performanceService.measureSupabaseQuery(queryName, queryFunction, tableName);
  }, []);

  const cachedQuery = useCallback(async <T>(
    cacheKey: string,
    queryName: string,
    queryFunction: () => Promise<{ data: T; error: any }>,
    options: {
      ttl?: number;
      tags?: string[];
      tableName?: string;
    } = {}
  ) => {
    const { ttl = 5 * 60 * 1000, tags = [], tableName } = options;

    return cacheService.cachedCall(
      cacheKey,
      () => performanceService.measureSupabaseQuery(queryName, queryFunction, tableName),
      ttl,
      tags
    );
  }, []);

  return { measureQuery, cachedQuery };
}

/**
 * Hook to monitor memory usage
 */
export function useMemoryMonitoring(componentName: string) {
  useEffect(() => {
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        
        performanceService.recordMetric({
          name: `memory-usage-${componentName}`,
          value: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          unit: 'MB',
          timestamp: Date.now(),
          tags: { component: componentName }
        });
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [componentName]);
}

/**
 * Hook for form performance monitoring
 */
export function useFormPerformance(formName: string) {
  const startTimeRef = useRef<number>(0);

  const startMeasurement = useCallback(() => {
    startTimeRef.current = performance.now();
    performanceService.mark(`form-${formName}-start`);
  }, [formName]);

  const measureSubmission = useCallback((success: boolean, validationErrors?: number) => {
    const duration = performance.now() - startTimeRef.current;
    
    performanceService.recordMetric({
      name: `form-submission-${formName}`,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      tags: {
        form: formName,
        success: success.toString(),
        validationErrors: validationErrors?.toString() || '0'
      }
    });

    performanceService.measure(`form-${formName}-submission`);
  }, [formName]);

  const measureValidation = useCallback((validationDuration: number, errors: number) => {
    performanceService.recordMetric({
      name: `form-validation-${formName}`,
      value: validationDuration,
      unit: 'ms',
      timestamp: Date.now(),
      tags: {
        form: formName,
        errors: errors.toString()
      }
    });
  }, [formName]);

  return {
    startMeasurement,
    measureSubmission,
    measureValidation
  };
}

/**
 * Hook to get performance statistics
 */
export function usePerformanceStats() {
  const getStats = useCallback(async () => {
    const [performanceReport, cacheStats] = await Promise.all([
      performanceService.generateReport(),
      Promise.resolve(cacheService.getStats())
    ]);

    return {
      performance: performanceReport,
      cache: cacheStats
    };
  }, []);

  const getMetrics = useCallback((metricName?: string) => {
    return performanceService.getMetrics(metricName);
  }, []);

  const getAverageMetric = useCallback((metricName: string, timeWindow?: number) => {
    return performanceService.getAverageMetric(metricName, timeWindow);
  }, []);

  const clearStats = useCallback(() => {
    performanceService.clear();
  }, []);

  return {
    getStats,
    getMetrics,
    getAverageMetric,
    clearStats
  };
}

/**
 * Hook for lazy loading performance
 */
export function useLazyLoadPerformance(componentName: string) {
  const measureLazyLoad = useCallback(() => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      performanceService.recordMetric({
        name: `lazy-load-${componentName}`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { component: componentName }
      });
    };
  }, [componentName]);

  return { measureLazyLoad };
}

/**
 * Hook for route change performance
 */
export function useRoutePerformance() {
  const measureRouteChange = useCallback((from: string, to: string) => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      performanceService.recordMetric({
        name: 'route-change',
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { from, to }
      });

      logger.info(LogCategory.PERFORMANCE, `Route change completed`, {
        from,
        to,
        duration
      });
    };
  }, []);

  return { measureRouteChange };
}