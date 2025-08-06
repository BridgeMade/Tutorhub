import { useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logger, PerformanceLogger, UserActionLogger, LogCategory } from '../lib/logger';

// ===========================================
// PERFORMANCE MONITORING HOOK
// ===========================================

export const usePerformanceMonitoring = () => {
  const location = useLocation();
  const pageLoadStartTime = useRef<number>();
  const apiCallTimers = useRef<Map<string, number>>(new Map());

  // Track page loads
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      PerformanceLogger.logPageLoad(location.pathname, loadTime);
    };
  }, [location.pathname]);

  // Track API calls
  const trackAPICall = useCallback((
    endpoint: string,
    method: string = 'GET'
  ) => {
    const key = `${method}:${endpoint}`;
    const startTime = performance.now();
    apiCallTimers.current.set(key, startTime);

    return {
      end: (statusCode: number = 200, success: boolean = true) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        apiCallTimers.current.delete(key);
        
        PerformanceLogger.logAPICall(endpoint, method, duration, statusCode, success);
      }
    };
  }, []);

  // Track component render times
  const trackRender = useCallback((componentName: string) => {
    PerformanceLogger.startTimer(`render:${componentName}`);
    
    return () => {
      PerformanceLogger.endTimer(`render:${componentName}`);
    };
  }, []);

  // Track user interactions
  const trackInteraction = useCallback((
    action: string,
    element: string,
    metadata?: Record<string, any>
  ) => {
    logger.info(
      LogCategory.USER_ACTION,
      `User interaction: ${action} on ${element}`,
      {
        action,
        element,
        ...metadata,
        timestamp: Date.now()
      }
    );
  }, []);

  return {
    trackAPICall,
    trackRender,
    trackInteraction
  };
};

// ===========================================
// ERROR MONITORING HOOK
// ===========================================

export const useErrorMonitoring = () => {
  useEffect(() => {
    // Global error handler
    const handleError = (event: ErrorEvent) => {
      logger.error(
        LogCategory.SYSTEM,
        'Unhandled JavaScript error',
        event.error,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript_error'
        }
      );
    };

    // Promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error(
        LogCategory.SYSTEM,
        'Unhandled promise rejection',
        new Error(String(event.reason)),
        {
          reason: event.reason,
          type: 'promise_rejection'
        }
      );
    };

    // Resource loading errors
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      logger.error(
        LogCategory.SYSTEM,
        'Resource loading error',
        undefined,
        {
          tagName: target.tagName,
          src: (target as any).src || (target as any).href,
          type: 'resource_error'
        }
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    document.addEventListener('error', handleResourceError, true);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('error', handleResourceError, true);
    };
  }, []);

  const reportError = useCallback((
    error: Error,
    context?: string,
    metadata?: Record<string, any>
  ) => {
    logger.error(
      LogCategory.SYSTEM,
      `Error in ${context || 'unknown context'}`,
      error,
      {
        context,
        ...metadata,
        type: 'reported_error'
      }
    );
  }, []);

  return { reportError };
};

// ===========================================
// USER ACTIVITY MONITORING HOOK
// ===========================================

export const useUserActivityMonitoring = (userId?: string) => {
  const activityBuffer = useRef<Array<{ action: string; timestamp: number; metadata?: any }>>([]);
  const lastActivityTime = useRef<number>(Date.now());
  const sessionStartTime = useRef<number>(Date.now());

  // Track session duration
  useEffect(() => {
    const updateLastActivity = () => {
      lastActivityTime.current = Date.now();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateLastActivity, true);
    });

    // Log session activity periodically
    const sessionLogger = setInterval(() => {
      const sessionDuration = Date.now() - sessionStartTime.current;
      const idleTime = Date.now() - lastActivityTime.current;
      
      if (userId && idleTime < 60000) { // Only log if user was active in last minute
        logger.info(
          LogCategory.USER_ACTION,
          'Session activity',
          {
            sessionDuration: Math.round(sessionDuration / 1000),
            idleTime: Math.round(idleTime / 1000),
            activitiesCount: activityBuffer.current.length,
            type: 'session_activity'
          },
          { userId }
        );
        
        // Clear activity buffer
        activityBuffer.current = [];
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateLastActivity, true);
      });
      clearInterval(sessionLogger);
    };
  }, [userId]);

  const trackAction = useCallback((
    action: string,
    resourceType?: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ) => {
    if (userId) {
      UserActionLogger.logUserAction(action, userId, resourceType, resourceId, metadata);
    }
    
    // Add to activity buffer
    activityBuffer.current.push({
      action,
      timestamp: Date.now(),
      metadata: { resourceType, resourceId, ...metadata }
    });
  }, [userId]);

  const trackSessionBooking = useCallback((
    sessionId: string,
    tutorId: string,
    subject: string
  ) => {
    if (userId) {
      UserActionLogger.logSessionBooking(userId, sessionId, tutorId, subject);
    }
  }, [userId]);

  const trackResourceAccess = useCallback((
    resourceId: string,
    resourceType: string,
    accessType: 'view' | 'download'
  ) => {
    if (userId) {
      UserActionLogger.logResourceAccess(userId, resourceId, resourceType, accessType);
    }
  }, [userId]);

  return {
    trackAction,
    trackSessionBooking,
    trackResourceAccess
  };
};

// ===========================================
// SYSTEM HEALTH MONITORING HOOK
// ===========================================

export const useSystemHealthMonitoring = () => {
  useEffect(() => {
    // Monitor memory usage
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        };

        // Log warning if memory usage is high
        if (memoryUsage.used / memoryUsage.limit > 0.8) {
          logger.warn(
            LogCategory.PERFORMANCE,
            'High memory usage detected',
            {
              memoryUsage,
              type: 'memory_warning'
            }
          );
        }

        // Log memory stats periodically
        logger.debug(
          LogCategory.PERFORMANCE,
          'Memory usage stats',
          {
            memoryUsage,
            type: 'memory_stats'
          }
        );
      }
    };

    // Monitor connection status
    const handleOnline = () => {
      logger.info(
        LogCategory.SYSTEM,
        'Connection restored',
        {
          type: 'connection_restored',
          timestamp: Date.now()
        }
      );
    };

    const handleOffline = () => {
      logger.warn(
        LogCategory.SYSTEM,
        'Connection lost',
        {
          type: 'connection_lost',
          timestamp: Date.now()
        }
      );
    };

    // Monitor visibility changes
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      logger.info(
        LogCategory.USER_ACTION,
        isVisible ? 'Page became visible' : 'Page became hidden',
        {
          visible: isVisible,
          type: 'visibility_change',
          timestamp: Date.now()
        }
      );
    };

    // Set up monitoring intervals
    const memoryInterval = setInterval(checkMemoryUsage, 60000); // Every minute
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial health check
    logger.info(
      LogCategory.SYSTEM,
      'System health monitoring started',
      {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        type: 'health_check_start'
      }
    );

    return () => {
      clearInterval(memoryInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};

// ===========================================
// COMBINED MONITORING HOOK
// ===========================================

export const useMonitoring = (userId?: string) => {
  const performance = usePerformanceMonitoring();
  const errorMonitoring = useErrorMonitoring();
  const userActivity = useUserActivityMonitoring(userId);
  
  useSystemHealthMonitoring();

  return {
    ...performance,
    ...errorMonitoring,
    ...userActivity
  };
};

// ===========================================
// REAL-TIME METRICS HOOK
// ===========================================

export const useRealTimeMetrics = () => {
  const metricsBuffer = useRef<Record<string, number>>({});
  const lastFlush = useRef<number>(Date.now());

  const incrementMetric = useCallback((metric: string, value: number = 1) => {
    metricsBuffer.current[metric] = (metricsBuffer.current[metric] || 0) + value;
  }, []);

  const setMetric = useCallback((metric: string, value: number) => {
    metricsBuffer.current[metric] = value;
  }, []);

  const flushMetrics = useCallback(() => {
    const now = Date.now();
    const timeSinceLastFlush = now - lastFlush.current;
    
    if (Object.keys(metricsBuffer.current).length > 0) {
      logger.info(
        LogCategory.PERFORMANCE,
        'Real-time metrics',
        {
          metrics: { ...metricsBuffer.current },
          timeWindow: timeSinceLastFlush,
          type: 'realtime_metrics'
        }
      );
      
      // Clear buffer
      metricsBuffer.current = {};
      lastFlush.current = now;
    }
  }, []);

  // Auto-flush every 30 seconds
  useEffect(() => {
    const interval = setInterval(flushMetrics, 30000);
    return () => clearInterval(interval);
  }, [flushMetrics]);

  return {
    incrementMetric,
    setMetric,
    flushMetrics
  };
};

export default useMonitoring;