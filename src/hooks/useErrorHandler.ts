import { useState, useCallback } from 'react';
import { AppError, errorHandler, ErrorType } from '../utils/errorHandler';

interface UseErrorHandlerReturn {
  error: AppError | null;
  isLoading: boolean;
  clearError: () => void;
  handleError: (error: any, context?: Record<string, any>) => AppError;
  executeWithErrorHandling: <T>(
    asyncFn: () => Promise<T>,
    context?: Record<string, any>
  ) => Promise<T | null>;
  retryLastAction: () => Promise<void>;
}

interface UseErrorHandlerOptions {
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: AppError) => void;
  onRetry?: () => void;
  onSuccess?: () => void;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn => {
  const {
    autoRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRetry,
    onSuccess
  } = options;

  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastAction, setLastAction] = useState<{
    fn: () => Promise<any>;
    context?: Record<string, any>;
  } | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  const handleError = useCallback((err: any, context?: Record<string, any>): AppError => {
    const appError = errorHandler.handle(err, context);
    setError(appError);
    onError?.(appError);
    return appError;
  }, [onError]);

  const retryLastAction = useCallback(async () => {
    if (!lastAction || retryCount >= maxRetries) {
      return;
    }

    onRetry?.();
    setRetryCount(prev => prev + 1);
    
    // Add delay before retry
    if (retryDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await lastAction.fn();
      onSuccess?.();
      return result;
    } catch (err) {
      const appError = handleError(err, lastAction.context);
      
      // Auto-retry if enabled and error is retryable
      if (autoRetry && appError.retryable && retryCount < maxRetries) {
        setTimeout(() => retryLastAction(), retryDelay);
      }
    } finally {
      setIsLoading(false);
    }
  }, [lastAction, retryCount, maxRetries, retryDelay, autoRetry, onRetry, onSuccess, handleError]);

  const executeWithErrorHandling = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> => {
    setLastAction({ fn: asyncFn, context });
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      setRetryCount(0);
      onSuccess?.();
      return result;
    } catch (err) {
      const appError = handleError(err, context);
      
      // Auto-retry if enabled and error is retryable
      if (autoRetry && appError.retryable && retryCount < maxRetries) {
        setTimeout(() => retryLastAction(), retryDelay);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [autoRetry, maxRetries, retryDelay, retryCount, handleError, onSuccess, retryLastAction]);

  return {
    error,
    isLoading,
    clearError,
    handleError,
    executeWithErrorHandling,
    retryLastAction
  };
};

// Specialized hooks for common operations
export const useAsyncOperation = (options: UseErrorHandlerOptions = {}) => {
  const errorHandler = useErrorHandler(options);
  
  return {
    ...errorHandler,
    execute: errorHandler.executeWithErrorHandling
  };
};

export const useApiCall = (options: UseErrorHandlerOptions = {}) => {
  return useErrorHandler({
    autoRetry: true,
    maxRetries: 2,
    retryDelay: 1000,
    ...options
  });
};

export const useFileUpload = (options: UseErrorHandlerOptions = {}) => {
  return useErrorHandler({
    autoRetry: false, // Don't auto-retry file uploads
    ...options
  });
};

export const useBooking = (options: UseErrorHandlerOptions = {}) => {
  return useErrorHandler({
    autoRetry: true,
    maxRetries: 1,
    retryDelay: 2000,
    ...options
  });
};

// Hook for form validation errors
export const useFormErrors = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const hasError = useCallback((field: string) => {
    return !!fieldErrors[field];
  }, [fieldErrors]);

  const getError = useCallback((field: string) => {
    return fieldErrors[field] || '';
  }, [fieldErrors]);

  const setErrors = useCallback((errors: Record<string, string>) => {
    setFieldErrors(errors);
  }, []);

  return {
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    hasError,
    getError,
    setErrors
  };
};