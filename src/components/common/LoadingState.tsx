import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  size = 'md',
  text,
  fullScreen = false,
  overlay = false,
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'md':
        return 'h-6 w-6';
      case 'lg':
        return 'h-8 w-8';
      case 'xl':
        return 'h-12 w-12';
      default:
        return 'h-6 w-6';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      case 'xl':
        return 'text-xl';
      default:
        return 'text-base';
    }
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-white z-50'
    : overlay
    ? 'absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-10'
    : 'flex flex-col items-center justify-center py-8';

  return (
    <div className={`${containerClasses} ${className}`}>
      <Loader2 className={`animate-spin text-orange-600 ${getSizeClasses()}`} />
      {text && (
        <p className={`mt-2 text-gray-600 ${getTextSize()}`}>
          {text}
        </p>
      )}
    </div>
  );
};

// Inline loading spinner for buttons and small components
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}> = ({
  size = 'sm',
  className = '',
  color = 'text-current'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'md':
        return 'h-4 w-4';
      case 'lg':
        return 'h-5 w-5';
      default:
        return 'h-3 w-3';
    }
  };

  return (
    <Loader2 className={`animate-spin ${color} ${getSizeClasses()} ${className}`} />
  );
};

// Loading skeleton for content placeholders
export const LoadingSkeleton: React.FC<{
  lines?: number;
  className?: string;
  avatar?: boolean;
}> = ({
  lines = 3,
  className = '',
  avatar = false
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {avatar && (
        <div className="flex items-start space-x-4 mb-4">
          <div className="rounded-full bg-gray-300 h-10 w-10"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/6"></div>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={`h-4 bg-gray-300 rounded ${
              i === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

// Loading states for specific UI patterns
export const LoadingCard: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`border border-gray-200 rounded-lg p-6 ${className}`}>
      <LoadingSkeleton lines={4} avatar={true} />
    </div>
  );
};

export const LoadingTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({
  rows = 5,
  columns = 4,
  className = ''
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {/* Table header */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }, (_, i) => (
          <div key={i} className="h-4 bg-gray-300 rounded"></div>
        ))}
      </div>
      
      {/* Table rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4 mb-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <div key={colIndex} className="h-3 bg-gray-200 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Button loading state
export const LoadingButton: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}> = ({
  loading,
  children,
  loadingText,
  disabled,
  className = '',
  onClick,
  type = 'button'
}) => {
  const isDisabled = loading || disabled;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center ${className} ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading && <LoadingSpinner className="mr-2" />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
};

// Page-level loading state
export const PageLoading: React.FC<{
  message?: string;
}> = ({ message = 'Loading...' }) => {
  return (
    <LoadingState
      size="lg"
      text={message}
      fullScreen={true}
    />
  );
};

// Section loading state
export const SectionLoading: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = 'Loading...', className = '' }) => {
  return (
    <div className={`relative min-h-32 ${className}`}>
      <LoadingState
        size="md"
        text={message}
        overlay={true}
      />
    </div>
  );
};