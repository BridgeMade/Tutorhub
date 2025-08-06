import { supabase } from './supabase';

// ===========================================
// COMPREHENSIVE LOGGING SYSTEM
// ===========================================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum LogCategory {
  AUTHENTICATION = 'authentication',
  SESSION = 'session',
  PAYMENT = 'payment',
  RESOURCE = 'resource',
  MESSAGE = 'message',
  SYSTEM = 'system',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  USER_ACTION = 'user_action',
  API = 'api',
  DATABASE = 'database',
  EMAIL = 'email',
  PRIVACY = 'privacy',
  ANALYTICS = 'analytics'
}

export interface LogEntry {
  id?: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  metadata?: Record<string, any>;
  stackTrace?: string;
  timestamp: string;
  environment: string;
}

export interface LogFilter {
  level?: LogLevel[];
  category?: LogCategory[];
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

class Logger {
  private environment: string;
  private enableConsoleLogging: boolean;
  private enableDatabaseLogging: boolean;
  private logBuffer: LogEntry[] = [];
  private bufferSize: number = 100;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.enableConsoleLogging = process.env.REACT_APP_ENABLE_CONSOLE_LOGGING !== 'false';
    this.enableDatabaseLogging = process.env.REACT_APP_ENABLE_DATABASE_LOGGING !== 'false';

    // Start buffer flush timer
    this.startFlushTimer();

    // Flush buffer on window unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  /**
   * Log debug information
   */
  debug(
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>,
    context?: Partial<LogEntry>
  ): void {
    this.log(LogLevel.DEBUG, category, message, metadata, context);
  }

  /**
   * Log general information
   */
  info(
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>,
    context?: Partial<LogEntry>
  ): void {
    this.log(LogLevel.INFO, category, message, metadata, context);
  }

  /**
   * Log warnings
   */
  warn(
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>,
    context?: Partial<LogEntry>
  ): void {
    this.log(LogLevel.WARN, category, message, metadata, context);
  }

  /**
   * Log errors
   */
  error(
    category: LogCategory,
    message: string,
    error?: Error,
    metadata?: Record<string, any>,
    context?: Partial<LogEntry>
  ): void {
    const logContext = {
      ...context,
      stackTrace: error?.stack,
      metadata: {
        ...metadata,
        errorName: error?.name,
        errorMessage: error?.message
      }
    };

    this.log(LogLevel.ERROR, category, message, logContext.metadata, logContext);
  }

  /**
   * Log critical errors
   */
  critical(
    category: LogCategory,
    message: string,
    error?: Error,
    metadata?: Record<string, any>,
    context?: Partial<LogEntry>
  ): void {
    const logContext = {
      ...context,
      stackTrace: error?.stack,
      metadata: {
        ...metadata,
        errorName: error?.name,
        errorMessage: error?.message
      }
    };

    this.log(LogLevel.CRITICAL, category, message, logContext.metadata, logContext);
  }

  /**
   * Core logging method
   */
  public log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>,
    context?: Partial<LogEntry>
  ): void {
    const logEntry: LogEntry = {
      level,
      category,
      message,
      userId: context?.userId || this.getCurrentUserId(),
      sessionId: context?.sessionId || this.getSessionId(),
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
      endpoint: context?.endpoint,
      method: context?.method,
      statusCode: context?.statusCode,
      duration: context?.duration,
      metadata: this.sanitizeMetadata(metadata),
      stackTrace: context?.stackTrace,
      timestamp: new Date().toISOString(),
      environment: this.environment
    };

    // Console logging
    if (this.enableConsoleLogging) {
      this.logToConsole(logEntry);
    }

    // Add to buffer for database logging
    if (this.enableDatabaseLogging) {
      this.addToBuffer(logEntry);
    }

    // Immediate flush for critical errors
    if (level === LogLevel.CRITICAL) {
      this.flush();
    }
  }

  /**
   * Log to browser console
   */
  private logToConsole(entry: LogEntry): void {
    const consoleMessage = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(consoleMessage, entry.metadata);
        break;
      case LogLevel.INFO:
        console.info(consoleMessage, entry.metadata);
        break;
      case LogLevel.WARN:
        console.warn(consoleMessage, entry.metadata);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(consoleMessage, entry.metadata);
        if (entry.stackTrace) {
          console.error('Stack trace:', entry.stackTrace);
        }
        break;
    }
  }

  /**
   * Add log entry to buffer
   */
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  /**
   * Flush buffer to database
   */
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const { error } = await supabase
        .from('application_logs')
        .insert(logsToFlush);

      if (error) {
        console.error('Failed to flush logs to database:', error);
        // Put logs back in buffer on failure
        this.logBuffer.unshift(...logsToFlush);
      }
    } catch (error) {
      console.error('Error flushing logs:', error);
      // Put logs back in buffer on failure
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  /**
   * Start automatic buffer flushing
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop automatic buffer flushing
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Get logs from database
   */
  async getLogs(filter: LogFilter = {}): Promise<{ logs: LogEntry[]; total: number }> {
    try {
      let query = supabase
        .from('application_logs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filter.level && filter.level.length > 0) {
        query = query.in('level', filter.level);
      }

      if (filter.category && filter.category.length > 0) {
        query = query.in('category', filter.category);
      }

      if (filter.userId) {
        query = query.eq('userId', filter.userId);
      }

      if (filter.startDate) {
        query = query.gte('timestamp', filter.startDate);
      }

      if (filter.endDate) {
        query = query.lte('timestamp', filter.endDate);
      }

      if (filter.search) {
        query = query.or(`message.ilike.%${filter.search}%,metadata->>'errorMessage'.ilike.%${filter.search}%`);
      }

      // Pagination
      const limit = filter.limit || 100;
      const offset = filter.offset || 0;
      
      query = query
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        logs: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching logs:', error);
      return { logs: [], total: 0 };
    }
  }

  /**
   * Get log statistics
   */
  async getLogStats(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    totalLogs: number;
    logsByLevel: Record<LogLevel, number>;
    logsByCategory: Record<LogCategory, number>;
    errorRate: number;
    criticalErrors: number;
  }> {
    try {
      const timeRanges = {
        hour: 1,
        day: 24,
        week: 24 * 7,
        month: 24 * 30
      };

      const hours = timeRanges[timeRange];
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('application_logs')
        .select('level, category')
        .gte('timestamp', startTime);

      if (error) throw error;

      const logs = data || [];
      const totalLogs = logs.length;

      const logsByLevel = logs.reduce((acc: Record<LogLevel, number>, log: any) => {
        acc[log.level as LogLevel] = (acc[log.level as LogLevel] || 0) + 1;
        return acc;
      }, {} as Record<LogLevel, number>);

      const logsByCategory = logs.reduce((acc: Record<LogCategory, number>, log: any) => {
        acc[log.category as LogCategory] = (acc[log.category as LogCategory] || 0) + 1;
        return acc;
      }, {} as Record<LogCategory, number>);

      const errorCount = (logsByLevel[LogLevel.ERROR] || 0) + (logsByLevel[LogLevel.CRITICAL] || 0);
      const errorRate = totalLogs > 0 ? (errorCount / totalLogs) * 100 : 0;
      const criticalErrors = logsByLevel[LogLevel.CRITICAL] || 0;

      return {
        totalLogs,
        logsByLevel,
        logsByCategory,
        errorRate,
        criticalErrors
      };
    } catch (error) {
      console.error('Error fetching log stats:', error);
      return {
        totalLogs: 0,
        logsByLevel: {} as Record<LogLevel, number>,
        logsByCategory: {} as Record<LogCategory, number>,
        errorRate: 0,
        criticalErrors: 0
      };
    }
  }

  /**
   * Sanitize metadata to prevent sensitive data logging
   */
  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined;

    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth', 'authorization',
      'credit', 'card', 'ssn', 'social', 'security', 'bank', 'account'
    ];

    const sanitized = { ...metadata };

    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Get current user ID from session/auth
   */
  private getCurrentUserId(): string | undefined {
    try {
      // This would normally get user ID from your auth system
      // For now, return undefined to be filled by context
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get session ID
   */
  private getSessionId(): string | undefined {
    try {
      if (typeof window !== 'undefined') {
        return sessionStorage.getItem('sessionId') || undefined;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
}

// ===========================================
// SPECIALIZED LOGGERS
// ===========================================

export class PerformanceLogger {
  private static timers: Map<string, number> = new Map();

  static startTimer(label: string): void {
    this.timers.set(label, performance.now());
  }

  static endTimer(label: string, metadata?: Record<string, any>): void {
    const startTime = this.timers.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.timers.delete(label);

      logger.info(
        LogCategory.PERFORMANCE,
        `Performance metric: ${label}`,
        {
          ...metadata,
          duration: Math.round(duration),
          label
        }
      );
    }
  }

  static logPageLoad(pageName: string, loadTime: number): void {
    logger.info(
      LogCategory.PERFORMANCE,
      `Page load: ${pageName}`,
      {
        pageName,
        loadTime: Math.round(loadTime),
        type: 'page_load'
      }
    );
  }

  static logAPICall(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    success: boolean
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    
    logger.log(
      level,
      LogCategory.API,
      `API call: ${method} ${endpoint}`,
      {
        endpoint,
        method,
        duration: Math.round(duration),
        statusCode,
        success,
        type: 'api_call'
      }
    );
  }
}

export class SecurityLogger {
  static logAuthAttempt(
    success: boolean,
    userId?: string,
    reason?: string,
    metadata?: Record<string, any>
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    const message = success ? 'Authentication successful' : 'Authentication failed';

    logger.log(
      level,
      LogCategory.AUTHENTICATION,
      message,
      {
        ...metadata,
        success,
        reason,
        type: 'auth_attempt'
      },
      { userId }
    );
  }

  static logPermissionDenied(
    resource: string,
    action: string,
    userId?: string,
    reason?: string
  ): void {
    logger.warn(
      LogCategory.SECURITY,
      `Permission denied: ${action} on ${resource}`,
      {
        resource,
        action,
        reason,
        type: 'permission_denied'
      },
      { userId }
    );
  }

  static logSuspiciousActivity(
    activity: string,
    userId?: string,
    ipAddress?: string,
    metadata?: Record<string, any>
  ): void {
    logger.error(
      LogCategory.SECURITY,
      `Suspicious activity detected: ${activity}`,
      undefined,
      {
        ...metadata,
        activity,
        type: 'suspicious_activity'
      },
      { userId, ipAddress }
    );
  }
}

export class UserActionLogger {
  static logUserAction(
    action: string,
    userId: string,
    resourceType?: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ): void {
    logger.info(
      LogCategory.USER_ACTION,
      `User action: ${action}`,
      {
        ...metadata,
        action,
        resourceType,
        resourceId,
        type: 'user_action'
      },
      { userId }
    );
  }

  static logSessionBooking(
    userId: string,
    sessionId: string,
    tutorId: string,
    subject: string
  ): void {
    this.logUserAction(
      'session_booked',
      userId,
      'session',
      sessionId,
      { tutorId, subject }
    );
  }

  static logResourceAccess(
    userId: string,
    resourceId: string,
    resourceType: string,
    accessType: 'view' | 'download'
  ): void {
    this.logUserAction(
      `resource_${accessType}`,
      userId,
      'resource',
      resourceId,
      { resourceType, accessType }
    );
  }

  static logPayment(
    userId: string,
    amount: number,
    currency: string,
    status: 'success' | 'failed' | 'pending'
  ): void {
    logger.info(
      LogCategory.PAYMENT,
      `Payment ${status}`,
      {
        amount,
        currency,
        status,
        type: 'payment'
      },
      { userId }
    );
  }
}

// ===========================================
// MONITORING INTEGRATION
// ===========================================

export class MonitoringIntegration {
  static sendToExternalService(logEntry: LogEntry): void {
    // Integration with external monitoring services
    // This would send logs to services like DataDog, New Relic, etc.
    
    if (logEntry.level === LogLevel.CRITICAL) {
      // Send critical errors to alerting system
      this.sendAlert(logEntry);
    }

    // Send metrics to monitoring service
    this.sendMetrics(logEntry);
  }

  private static sendAlert(logEntry: LogEntry): void {
    // Implementation for alerting system
    console.warn('CRITICAL ERROR ALERT:', logEntry.message);
  }

  private static sendMetrics(logEntry: LogEntry): void {
    // Implementation for metrics collection
    // This could integrate with Prometheus, InfluxDB, etc.
  }
}

// ===========================================
// SINGLETON LOGGER INSTANCE
// ===========================================

export const logger = new Logger();

// Classes are already exported above

export default logger;