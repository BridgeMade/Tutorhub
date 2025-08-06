import { PostgrestError } from '@supabase/supabase-js';

// Error types for different categories
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  FILE_UPLOAD = 'FILE_UPLOAD',
  BOOKING = 'BOOKING',
  MESSAGING = 'MESSAGING',
  PAYMENT = 'PAYMENT',
  UNKNOWN = 'UNKNOWN'
}

// Severity levels for error classification
export enum ErrorSeverity {
  LOW = 'LOW',       // Non-critical, user can continue
  MEDIUM = 'MEDIUM', // Impacts functionality but workaround exists
  HIGH = 'HIGH',     // Blocks user workflow
  CRITICAL = 'CRITICAL' // System failure, requires immediate attention
}

// Standard error interface
export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  technicalDetails?: string;
  code?: string;
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  retryable: boolean;
}

// Error logging interface
export interface ErrorLog extends AppError {
  id: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  stack?: string;
}

class ErrorHandler {
  private errorLogs: ErrorLog[] = [];
  private maxLogs = 100; // Keep last 100 errors in memory

  /**
   * Handle and process any error
   */
  handle(error: any, context?: Record<string, any>): AppError {
    const appError = this.categorizeError(error, context);
    this.logError(appError, error);
    return appError;
  }

  /**
   * Categorize error into AppError format
   */
  private categorizeError(error: any, context?: Record<string, any>): AppError {
    const timestamp = new Date();
    let appError: AppError;

    // Handle Supabase PostgrestError
    if (this.isPostgrestError(error)) {
      appError = this.handlePostgrestError(error, context);
    }
    // Handle network errors
    else if (this.isNetworkError(error)) {
      appError = this.handleNetworkError(error, context);
    }
    // Handle validation errors
    else if (this.isValidationError(error)) {
      appError = this.handleValidationError(error, context);
    }
    // Handle authentication errors
    else if (this.isAuthError(error)) {
      appError = this.handleAuthError(error, context);
    }
    // Handle file upload errors
    else if (this.isFileUploadError(error)) {
      appError = this.handleFileUploadError(error, context);
    }
    // Handle generic errors
    else {
      appError = this.handleGenericError(error, context);
    }

    appError.timestamp = timestamp;
    appError.context = context;
    
    return appError;
  }

  /**
   * Handle Supabase database errors
   */
  private handlePostgrestError(error: PostgrestError, context?: Record<string, any>): AppError {
    let userMessage = 'A database error occurred. Please try again.';
    let severity = ErrorSeverity.MEDIUM;
    let retryable = true;

    // Map common PostgreSQL error codes to user-friendly messages
    switch (error.code) {
      case '23505': // Unique constraint violation
        userMessage = 'This record already exists. Please check your input.';
        severity = ErrorSeverity.LOW;
        retryable = false;
        break;
      case '23503': // Foreign key constraint violation
        userMessage = 'Related record not found. Please refresh and try again.';
        severity = ErrorSeverity.MEDIUM;
        retryable = true;
        break;
      case '42501': // Insufficient privilege
        userMessage = 'You don\'t have permission to perform this action.';
        severity = ErrorSeverity.HIGH;
        retryable = false;
        break;
      case 'PGRST116': // No rows found
        userMessage = 'The requested information was not found.';
        severity = ErrorSeverity.LOW;
        retryable = false;
        break;
      default:
        if (error.message?.includes('connection')) {
          userMessage = 'Connection error. Please check your internet and try again.';
          severity = ErrorSeverity.HIGH;
        }
    }

    return {
      type: ErrorType.DATABASE,
      severity,
      message: error.message || 'Database error',
      userMessage,
      technicalDetails: `Code: ${error.code}, Details: ${error.details}`,
      code: error.code,
      context,
      timestamp: new Date(),
      retryable
    };
  }

  /**
   * Handle network-related errors
   */
  private handleNetworkError(error: any, context?: Record<string, any>): AppError {
    return {
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.HIGH,
      message: error.message || 'Network error',
      userMessage: 'Connection problem. Please check your internet connection and try again.',
      technicalDetails: error.stack,
      context,
      timestamp: new Date(),
      retryable: true
    };
  }

  /**
   * Handle validation errors
   */
  private handleValidationError(error: any, context?: Record<string, any>): AppError {
    const message = error.message || 'Validation failed';
    let userMessage = 'Please check your input and try again.';

    // Extract field-specific validation messages
    if (error.issues && Array.isArray(error.issues)) {
      const fieldErrors = error.issues.map((issue: any) => issue.message).join(', ');
      userMessage = `Please fix the following: ${fieldErrors}`;
    }

    return {
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      message,
      userMessage,
      technicalDetails: JSON.stringify(error.issues || error),
      context,
      timestamp: new Date(),
      retryable: false
    };
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any, context?: Record<string, any>): AppError {
    let userMessage = 'Authentication failed. Please log in again.';
    
    if (error.message?.includes('Invalid login credentials')) {
      userMessage = 'Invalid email or password. Please try again.';
    } else if (error.message?.includes('Email not confirmed')) {
      userMessage = 'Please check your email and click the confirmation link.';
    } else if (error.message?.includes('refresh_token_not_found')) {
      userMessage = 'Your session has expired. Please log in again.';
    }

    return {
      type: ErrorType.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      message: error.message || 'Authentication error',
      userMessage,
      technicalDetails: error.stack,
      context,
      timestamp: new Date(),
      retryable: true
    };
  }

  /**
   * Handle file upload errors
   */
  private handleFileUploadError(error: any, context?: Record<string, any>): AppError {
    let userMessage = 'File upload failed. Please try again.';
    
    if (error.message?.includes('File too large')) {
      userMessage = 'File is too large. Please choose a smaller file.';
    } else if (error.message?.includes('Invalid file type')) {
      userMessage = 'Invalid file type. Please choose a supported file format.';
    } else if (error.message?.includes('Storage quota exceeded')) {
      userMessage = 'Storage limit reached. Please contact support.';
    }

    return {
      type: ErrorType.FILE_UPLOAD,
      severity: ErrorSeverity.MEDIUM,
      message: error.message || 'File upload error',
      userMessage,
      technicalDetails: error.stack,
      context,
      timestamp: new Date(),
      retryable: true
    };
  }

  /**
   * Handle generic/unknown errors
   */
  private handleGenericError(error: any, context?: Record<string, any>): AppError {
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: error.message || 'An unexpected error occurred',
      userMessage: 'Something went wrong. Please try again or contact support if the problem persists.',
      technicalDetails: error.stack || error.toString(),
      context,
      timestamp: new Date(),
      retryable: true
    };
  }

  /**
   * Log error for debugging and monitoring
   */
  private logError(appError: AppError, originalError: any): void {
    const errorLog: ErrorLog = {
      ...appError,
      id: this.generateErrorId(),
      sessionId: this.getSessionId(),
      userAgent: navigator?.userAgent,
      url: window?.location?.href,
      stack: originalError?.stack
    };

    // Add to in-memory log
    this.errorLogs.unshift(errorLog);
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs.pop();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error [${appError.type}] - ${appError.severity}`);
      console.error('User Message:', appError.userMessage);
      console.error('Technical Details:', appError.technicalDetails);
      console.error('Context:', appError.context);
      console.error('Original Error:', originalError);
      console.groupEnd();
    }

    // Send to monitoring service (implement based on your monitoring solution)
    this.sendToMonitoring(errorLog);
  }

  /**
   * Send error to monitoring service
   */
  private sendToMonitoring(errorLog: ErrorLog): void {
    // TODO: Implement monitoring service integration
    // Examples: Sentry, LogRocket, Datadog, etc.
    
    // For now, we'll just store critical errors locally
    if (errorLog.severity === ErrorSeverity.CRITICAL) {
      localStorage.setItem(`error_${errorLog.id}`, JSON.stringify(errorLog));
    }
  }

  /**
   * Type guards for error categorization
   */
  private isPostgrestError(error: any): error is PostgrestError {
    return error && (error.code || error.details || error.hint);
  }

  private isNetworkError(error: any): boolean {
    return error && (
      error.message?.includes('fetch') ||
      error.message?.includes('network') ||
      error.message?.includes('Failed to fetch') ||
      error.name === 'NetworkError'
    );
  }

  private isValidationError(error: any): boolean {
    return error && (
      error.issues ||
      error.name === 'ZodError' ||
      error.message?.includes('validation')
    );
  }

  private isAuthError(error: any): boolean {
    return error && (
      error.message?.includes('auth') ||
      error.message?.includes('login') ||
      error.message?.includes('token') ||
      error.message?.includes('unauthorized')
    );
  }

  private isFileUploadError(error: any): boolean {
    return error && (
      error.message?.includes('upload') ||
      error.message?.includes('file') ||
      error.message?.includes('storage')
    );
  }

  /**
   * Utility methods
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    return sessionStorage.getItem('session_id') || 'unknown';
  }

  /**
   * Public methods for external use
   */
  getRecentErrors(): ErrorLog[] {
    return [...this.errorLogs];
  }

  clearErrorLogs(): void {
    this.errorLogs = [];
  }

  /**
   * Create user-friendly error messages for common scenarios
   */
  createBookingError(message: string): AppError {
    return {
      type: ErrorType.BOOKING,
      severity: ErrorSeverity.MEDIUM,
      message,
      userMessage: 'Booking failed. Please check your selection and try again.',
      timestamp: new Date(),
      retryable: true
    };
  }

  createMessagingError(message: string): AppError {
    return {
      type: ErrorType.MESSAGING,
      severity: ErrorSeverity.MEDIUM,
      message,
      userMessage: 'Message could not be sent. Please try again.',
      timestamp: new Date(),
      retryable: true
    };
  }

  createPaymentError(message: string): AppError {
    return {
      type: ErrorType.PAYMENT,
      severity: ErrorSeverity.HIGH,
      message,
      userMessage: 'Payment processing failed. Please check your payment details and try again.',
      timestamp: new Date(),
      retryable: true
    };
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Utility function for components
export const handleError = (error: any, context?: Record<string, any>): AppError => {
  return errorHandler.handle(error, context);
};