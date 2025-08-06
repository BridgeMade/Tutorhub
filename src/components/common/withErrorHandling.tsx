import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorAlert } from './ErrorAlert';
import { useErrorHandler } from '../../hooks/useErrorHandler';

// HOC to add error handling to any component
export function withErrorHandling<T extends object>(
  Component: React.ComponentType<T>,
  options?: {
    showErrorAlert?: boolean;
    autoRetry?: boolean;
    maxRetries?: number;
  }
) {
  const WrappedComponent = (props: T) => {
    const { error, clearError } = useErrorHandler(options);

    return (
      <ErrorBoundary>
        <div className="relative">
          {options?.showErrorAlert && error && (
            <div className="mb-4">
              <ErrorAlert
                error={error}
                onClose={clearError}
                autoClose={true}
              />
            </div>
          )}
          <Component {...props} />
        </div>
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorHandling(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Enhanced version with more comprehensive error handling
export function withComprehensiveErrorHandling<T extends object>(
  Component: React.ComponentType<T>,
  options?: {
    errorBoundary?: boolean;
    errorAlert?: boolean;
    autoRetry?: boolean;
    maxRetries?: number;
    retryDelay?: number;
    logErrors?: boolean;
  }
) {
  const {
    errorBoundary = true,
    errorAlert = true,
    autoRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
    logErrors = true
  } = options || {};

  const WrappedComponent = (props: T) => {
    const { 
      error, 
      clearError, 
      retryLastAction 
    } = useErrorHandler({
      autoRetry,
      maxRetries,
      retryDelay,
      onError: logErrors ? (error) => {
        console.error('Component Error:', error);
      } : undefined
    });

    const componentWithErrorAlert = (
      <div className="relative">
        {errorAlert && error && (
          <div className="mb-4">
            <ErrorAlert
              error={error}
              onClose={clearError}
              onRetry={error.retryable ? retryLastAction : undefined}
              autoClose={true}
            />
          </div>
        )}
        <Component {...props} />
      </div>
    );

    if (errorBoundary) {
      return (
        <ErrorBoundary>
          {componentWithErrorAlert}
        </ErrorBoundary>
      );
    }

    return componentWithErrorAlert;
  };

  WrappedComponent.displayName = `withComprehensiveErrorHandling(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for easy error handling in functional components
export const useComponentErrorHandler = (options?: {
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}) => {
  const errorHandler = useErrorHandler(options);
  
  return {
    ...errorHandler,
    ErrorDisplay: ({ className }: { className?: string }) => 
      errorHandler.error ? (
        <ErrorAlert
          error={errorHandler.error}
          onClose={errorHandler.clearError}
          onRetry={errorHandler.error.retryable ? errorHandler.retryLastAction : undefined}
          className={className}
          autoClose={true}
        />
      ) : null
  };
};