import React, { memo, useMemo, useCallback, useEffect, useState, Suspense } from 'react';
import { useRenderPerformance, useMemoryMonitoring } from '../../hooks/usePerformance';
import { performanceService } from '../../services/performanceService';
import { logger, LogCategory } from '../../lib/logger';

// ===========================================
// PERFORMANCE OPTIMIZATION COMPONENTS
// ===========================================

interface PerformanceOptimizerProps {
  componentName: string;
  memoryMonitoring?: boolean;
  renderThreshold?: number;
  children: React.ReactNode;
}

/**
 * HOC for performance monitoring and optimization alerts
 */
export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = memo(({
  componentName,
  memoryMonitoring = false,
  renderThreshold = 100,
  children
}) => {
  const { measureUpdate } = useRenderPerformance(componentName);
  const [renderWarning, setRenderWarning] = useState(false);

  // Optional memory monitoring
  if (memoryMonitoring) {
    useMemoryMonitoring(componentName);
  }

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      
      if (renderTime > renderThreshold) {
        setRenderWarning(true);
        logger.warn(LogCategory.PERFORMANCE, `Slow render detected: ${componentName}`, {
          renderTime,
          threshold: renderThreshold
        });
        
        // Hide warning after 5 seconds
        setTimeout(() => setRenderWarning(false), 5000);
      }
    };
  }, [componentName, renderThreshold]);

  return (
    <div className="relative">
      {renderWarning && (
        <div className="absolute top-0 right-0 z-50 bg-yellow-100 border border-yellow-400 text-yellow-700 px-2 py-1 rounded text-xs">
          Slow render: {componentName}
        </div>
      )}
      {children}
    </div>
  );
});

/**
 * Optimized list component with virtualization for large datasets
 */
interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5,
  className = ''
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={visibleRange.startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Optimized image component with lazy loading and performance monitoring
 */
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjYWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TG9hZGluZy4uLjwvdGV4dD48L3N2Zz4=',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const imageElement = document.querySelector(`[data-src="${src}"]`);
    if (imageElement) {
      observer.observe(imageElement);
    }

    return () => observer.disconnect();
  }, [src]);

  const handleLoad = useCallback(() => {
    const loadTime = performance.now();
    performanceService.recordMetric({
      name: 'image-load',
      value: loadTime,
      unit: 'ms',
      timestamp: Date.now(),
      tags: { src: src.substring(0, 50) }
    });

    setIsLoaded(true);
    onLoad?.();
  }, [src, onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
    logger.warn(LogCategory.PERFORMANCE, 'Image failed to load', { src });
  }, [src, onError]);

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Failed to load</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {!isLoaded && (
        <img
          src={placeholder}
          alt="Loading..."
          className={`absolute inset-0 ${className}`}
        />
      )}
      {isInView && (
        <img
          data-src={src}
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
});

/**
 * Debounced input component for performance optimization
 */
interface DebouncedInputProps {
  value: string;
  onChange: (value: string) => void;
  delay?: number;
  placeholder?: string;
  className?: string;
}

export const DebouncedInput: React.FC<DebouncedInputProps> = memo(({
  value,
  onChange,
  delay = 300,
  placeholder,
  className = ''
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [localValue, onChange, delay, value]);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
});

/**
 * Memoized expensive computation component
 */
interface MemoizedComputationProps<T, R> {
  input: T;
  computeFunction: (input: T) => R;
  dependencies?: any[];
  children: (result: R) => React.ReactNode;
}

export function MemoizedComputation<T, R>({
  input,
  computeFunction,
  dependencies = [],
  children
}: MemoizedComputationProps<T, R>) {
  const result = useMemo(() => {
    const startTime = performance.now();
    const computed = computeFunction(input);
    const duration = performance.now() - startTime;

    // Log expensive computations
    if (duration > 50) {
      logger.warn(LogCategory.PERFORMANCE, 'Expensive computation detected', {
        duration,
        inputType: typeof input
      });
    }

    return computed;
  }, [input, computeFunction, ...dependencies]);

  return <>{children(result)}</>;
}

/**
 * Lazy wrapper component for code splitting
 */
interface LazyWrapperProps {
  loading?: React.ComponentType;
  error?: React.ComponentType<{ error: Error; retry: () => void }>;
  children: React.ReactNode;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  loading: LoadingComponent = () => <div>Loading...</div>,
  error: ErrorComponent = ({ error, retry }) => (
    <div className="p-4 text-center">
      <p className="text-red-600 mb-2">Failed to load component</p>
      <button onClick={retry} className="bg-blue-500 text-white px-4 py-2 rounded">
        Retry
      </button>
    </div>
  ),
  children
}) => {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <ErrorBoundary FallbackComponent={ErrorComponent}>
        {children}
      </ErrorBoundary>
    </Suspense>
  );
};

/**
 * Error boundary for performance monitoring
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  FallbackComponent: React.ComponentType<{ error: Error; retry: () => void }>;
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(LogCategory.PERFORMANCE, 'React Error Boundary caught error', error, {
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <this.props.FallbackComponent
          error={this.state.error}
          retry={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Performance monitoring display component
 */
export const PerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = async () => {
      try {
        const report = await performanceService.generateReport();
        setStats(report);
      } catch (error) {
        logger.error(LogCategory.PERFORMANCE, 'Failed to get performance stats', error as Error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (!stats || !isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg text-xs z-50"
        title="Show Performance Stats"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border shadow-lg rounded-lg p-4 max-w-sm z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">Performance</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      <div className="text-xs space-y-1">
        <div>Page Load: {Math.round(stats.pageLoadTime)}ms</div>
        <div>Memory: {stats.memoryUsage}MB</div>
        <div>Cache Hit Rate: {Math.round(stats.cachePerformance.hitRate)}%</div>
        <div>Slow Requests: {stats.networkRequests.filter((r: any) => r.duration > 2000).length}</div>
      </div>
    </div>
  );
};

export default PerformanceOptimizer;