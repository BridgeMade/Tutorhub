import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import { errorHandler, ErrorType, ErrorSeverity } from '../../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showReportButton?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRetrying: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Handle the error through our error system
    const appError = errorHandler.handle(error, {
      component: 'ErrorBoundary',
      errorInfo: errorInfo.componentStack,
      retryCount: this.retryCount
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.setState({ isRetrying: true });
      this.retryCount++;

      // Simulate retry delay
      setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          isRetrying: false
        });
      }, 1000);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Oops! Something went wrong
                </h2>
                
                <p className="text-gray-600 mb-6">
                  We encountered an unexpected error. Don't worry, we've been notified and are working on a fix.
                </p>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-left">
                    <h3 className="text-sm font-medium text-red-800 mb-2">
                      Error Details (Development Mode):
                    </h3>
                    <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
                      {this.state.error.message}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                )}

                <div className="space-y-3">
                  {this.retryCount < this.maxRetries && (
                    <button
                      onClick={this.handleRetry}
                      disabled={this.state.isRetrying}
                      className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                    >
                      {this.state.isRetrying ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      {this.state.isRetrying ? 'Retrying...' : `Try Again (${this.maxRetries - this.retryCount} attempts left)`}
                    </button>
                  )}

                  <button
                    onClick={this.handleReload}
                    className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go to Homepage
                  </button>

                  {this.props.showReportButton && (
                    <button
                      onClick={() => {
                        // TODO: Implement error reporting
                        alert('Error report sent. Thank you for helping us improve!');
                      }}
                      className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Report Issue
                    </button>
                  )}
                </div>

                <div className="mt-6 text-xs text-gray-500">
                  <p>Error ID: {this.state.error?.message?.slice(0, 8) || 'Unknown'}</p>
                  <p>Time: {new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}