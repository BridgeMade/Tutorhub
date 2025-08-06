import React, { useState, useEffect } from 'react';
import { X, AlertCircle, AlertTriangle, Info, CheckCircle, RefreshCw } from 'lucide-react';
import { AppError, ErrorSeverity, ErrorType } from '../../utils/errorHandler';

export interface ErrorAlertProps {
  error: AppError | null;
  onClose?: () => void;
  onRetry?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  className?: string;
  showTechnicalDetails?: boolean;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onClose,
  onRetry,
  autoClose = false,
  autoCloseDelay = 5000,
  className = '',
  showTechnicalDetails = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      
      if (autoClose && error.severity !== ErrorSeverity.CRITICAL) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleRetry = () => {
    onRetry?.();
    handleClose();
  };

  if (!error || !isVisible) {
    return null;
  }

  const getAlertStyles = () => {
    switch (error.severity) {
      case ErrorSeverity.LOW:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case ErrorSeverity.MEDIUM:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case ErrorSeverity.HIGH:
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case ErrorSeverity.CRITICAL:
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (error.severity) {
      case ErrorSeverity.LOW:
        return <Info className="h-5 w-5 text-blue-400" />;
      case ErrorSeverity.MEDIUM:
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case ErrorSeverity.HIGH:
        return <AlertTriangle className="h-5 w-5 text-orange-400" />;
      case ErrorSeverity.CRITICAL:
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      default:
        return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  const getTitle = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Connection Problem';
      case ErrorType.AUTHENTICATION:
        return 'Authentication Required';
      case ErrorType.AUTHORIZATION:
        return 'Access Denied';
      case ErrorType.VALIDATION:
        return 'Invalid Input';
      case ErrorType.DATABASE:
        return 'Data Error';
      case ErrorType.FILE_UPLOAD:
        return 'Upload Failed';
      case ErrorType.BOOKING:
        return 'Booking Error';
      case ErrorType.MESSAGING:
        return 'Message Error';
      case ErrorType.PAYMENT:
        return 'Payment Error';
      default:
        return 'Error';
    }
  };

  return (
    <div className={`rounded-md border p-4 ${getAlertStyles()} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium">
                {getTitle()}
              </h3>
              <div className="mt-1 text-sm">
                <p>{error.userMessage}</p>
              </div>

              {/* Technical details toggle (development mode or explicit prop) */}
              {(process.env.NODE_ENV === 'development' || showTechnicalDetails) && error.technicalDetails && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs underline hover:no-underline focus:outline-none"
                  >
                    {showDetails ? 'Hide' : 'Show'} technical details
                  </button>
                  
                  {showDetails && (
                    <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs font-mono">
                      <p><strong>Type:</strong> {error.type}</p>
                      <p><strong>Code:</strong> {error.code || 'N/A'}</p>
                      <p><strong>Time:</strong> {error.timestamp.toLocaleString()}</p>
                      {error.technicalDetails && (
                        <div className="mt-1">
                          <strong>Details:</strong>
                          <pre className="whitespace-pre-wrap text-xs mt-1 max-h-32 overflow-auto">
                            {error.technicalDetails}
                          </pre>
                        </div>
                      )}
                      {error.context && Object.keys(error.context).length > 0 && (
                        <div className="mt-1">
                          <strong>Context:</strong>
                          <pre className="whitespace-pre-wrap text-xs mt-1">
                            {JSON.stringify(error.context, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-3 flex space-x-2">
                {error.retryable && onRetry && (
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-opacity-75 hover:bg-opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: error.severity === ErrorSeverity.CRITICAL ? '#DC2626' :
                                      error.severity === ErrorSeverity.HIGH ? '#EA580C' :
                                      error.severity === ErrorSeverity.MEDIUM ? '#D97706' : '#2563EB'
                    }}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Try Again
                  </button>
                )}
              </div>
            </div>

            <div className="ml-3 flex-shrink-0">
              <button
                onClick={handleClose}
                className="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  color: error.severity === ErrorSeverity.CRITICAL ? '#DC2626' :
                         error.severity === ErrorSeverity.HIGH ? '#EA580C' :
                         error.severity === ErrorSeverity.MEDIUM ? '#D97706' : '#2563EB'
                }}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast notification variant for errors
export const ErrorToast: React.FC<ErrorAlertProps & { 
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}> = ({ 
  error, 
  onClose, 
  onRetry, 
  position = 'top-right',
  ...props 
}) => {
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50'
  };

  if (!error) return null;

  return (
    <div className={`${positionClasses[position]} max-w-sm w-full`}>
      <ErrorAlert
        error={error}
        onClose={onClose}
        onRetry={onRetry}
        autoClose={true}
        className="shadow-lg"
        {...props}
      />
    </div>
  );
};

// Success notification for completed actions
export const SuccessAlert: React.FC<{
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  className?: string;
}> = ({
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 3000,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`rounded-md border p-4 bg-green-50 border-green-200 text-green-800 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-green-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        {onClose && (
          <div className="ml-3 flex-shrink-0">
            <button
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
              className="inline-flex rounded-md text-green-400 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};