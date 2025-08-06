import React, { useState, useCallback, FormEvent, ReactNode } from 'react';
import { z } from 'zod';
import { useValidation } from '../../hooks/useValidation';
import { ErrorAlert } from '../common/ErrorAlert';
import { LoadingButton } from '../common/LoadingState';
import { ErrorType, ErrorSeverity } from '../../utils/errorHandler';

// ===========================================
// SECURE FORM COMPONENTS
// ===========================================

export interface SecureFormProps {
  schema: z.ZodSchema;
  onSubmit: (data: any) => Promise<void> | void;
  children: ReactNode;
  className?: string;
  submitText?: string;
  resetOnSubmit?: boolean;
  showErrors?: boolean;
  sanitize?: boolean;
}

/**
 * Secure form wrapper with built-in validation and sanitization
 */
export const SecureForm: React.FC<SecureFormProps> = ({
  schema,
  onSubmit,
  children,
  className = '',
  submitText = 'Submit',
  resetOnSubmit = false,
  showErrors = true,
  sanitize = true
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    validate,
    errors,
    clearErrors,
    hasErrors
  } = useValidation(schema, { sanitize });

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await validate(formData);
      
      if (result.isValid) {
        await onSubmit(result.sanitizedData || formData);
        
        if (resetOnSubmit) {
          setFormData({});
          clearErrors();
        }
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validate, onSubmit, resetOnSubmit, clearErrors]);

  const updateField = useCallback((name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {showErrors && (submitError || hasErrors) && (
        <ErrorAlert
          error={{
            type: ErrorType.VALIDATION,
            severity: ErrorSeverity.MEDIUM,
            message: submitError || 'Please fix the errors below',
            userMessage: submitError || 'Please fix the errors below',
            technicalDetails: Object.entries(errors).map(([field, message]) => `${field}: ${message}`).join(', '),
            timestamp: new Date(),
            retryable: false
          }}
          onClose={() => {
            setSubmitError(null);
            clearErrors();
          }}
        />
      )}

      <FormContext.Provider value={{
        formData,
        updateField,
        errors,
        isSubmitting
      }}>
        {children}
      </FormContext.Provider>

      <LoadingButton
        type="submit"
        loading={isSubmitting}
        disabled={isSubmitting}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
      >
        {submitText}
      </LoadingButton>
    </form>
  );
};

// ===========================================
// FORM CONTEXT
// ===========================================

interface FormContextValue {
  formData: Record<string, any>;
  updateField: (name: string, value: any) => void;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

const FormContext = React.createContext<FormContextValue | null>(null);

const useFormContext = () => {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('Form components must be used within a SecureForm');
  }
  return context;
};

// ===========================================
// SECURE INPUT COMPONENTS
// ===========================================

export interface SecureInputProps {
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  label?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  maxLength?: number;
  pattern?: string;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  name,
  type = 'text',
  label,
  placeholder,
  required = false,
  autoComplete,
  className = '',
  maxLength,
  pattern
}) => {
  const { formData, updateField, errors, isSubmitting } = useFormContext();
  const value = formData[name] || '';
  const error = errors[name];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateField(name, e.target.value);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        maxLength={maxLength}
        pattern={pattern}
        disabled={isSubmitting}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export interface SecureTextareaProps {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  rows?: number;
  maxLength?: number;
}

export const SecureTextarea: React.FC<SecureTextareaProps> = ({
  name,
  label,
  placeholder,
  required = false,
  className = '',
  rows = 3,
  maxLength
}) => {
  const { formData, updateField, errors, isSubmitting } = useFormContext();
  const value = formData[name] || '';
  const error = errors[name];

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateField(name, e.target.value);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        maxLength={maxLength}
        disabled={isSubmitting}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
          disabled:bg-gray-100 disabled:cursor-not-allowed resize-vertical
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
      />
      
      {maxLength && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{error || ''}</span>
          <span>{value.length}/{maxLength}</span>
        </div>
      )}
      
      {error && !maxLength && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export interface SecureSelectProps {
  name: string;
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const SecureSelect: React.FC<SecureSelectProps> = ({
  name,
  label,
  options,
  placeholder,
  required = false,
  className = ''
}) => {
  const { formData, updateField, errors, isSubmitting } = useFormContext();
  const value = formData[name] || '';
  const error = errors[name];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateField(name, e.target.value);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        required={required}
        disabled={isSubmitting}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export interface SecureCheckboxProps {
  name: string;
  label: string;
  required?: boolean;
  className?: string;
}

export const SecureCheckbox: React.FC<SecureCheckboxProps> = ({
  name,
  label,
  required = false,
  className = ''
}) => {
  const { formData, updateField, errors, isSubmitting } = useFormContext();
  const checked = formData[name] || false;
  const error = errors[name];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateField(name, e.target.checked);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-start">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          required={required}
          disabled={isSubmitting}
          className={`
            mt-1 h-4 w-4 text-orange-600 border-gray-300 rounded
            focus:ring-2 focus:ring-orange-500
            disabled:cursor-not-allowed
            ${error ? 'border-red-500' : ''}
          `}
        />
        <label htmlFor={name} className="ml-2 block text-sm text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      
      {error && (
        <p className="text-sm text-red-600 ml-6">{error}</p>
      )}
    </div>
  );
};

// ===========================================
// FILE UPLOAD COMPONENT
// ===========================================

export interface SecureFileUploadProps {
  name: string;
  label?: string;
  accept?: string;
  maxSize?: number;
  required?: boolean;
  className?: string;
  onFileSelect?: (file: File | null) => void;
}

export const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
  name,
  label,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  required = false,
  className = '',
  onFileSelect
}) => {
  const { formData, updateField, errors, isSubmitting } = useFormContext();
  const [dragActive, setDragActive] = useState(false);
  const file = formData[name] as File | null;
  const error = errors[name];

  const handleFile = useCallback((selectedFile: File | null) => {
    if (selectedFile) {
      // Validate file size
      if (selectedFile.size > maxSize) {
        updateField(name, null);
        return;
      }

      // Validate file type
      if (accept && !accept.split(',').some(type => {
        const trimmedType = type.trim();
        if (trimmedType.endsWith('/*')) {
          return selectedFile.type.startsWith(trimmedType.slice(0, -1));
        }
        return selectedFile.type === trimmedType;
      })) {
        updateField(name, null);
        return;
      }
    }

    updateField(name, selectedFile);
    onFileSelect?.(selectedFile);
  }, [name, updateField, maxSize, accept, onFileSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const removeFile = useCallback(() => {
    handleFile(null);
  }, [handleFile]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center
          transition-colors duration-200
          ${dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300'}
          ${error ? 'border-red-500' : ''}
          ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:border-orange-500'}
          ${className}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={isSubmitting}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {file ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm font-medium text-gray-900">{file.name}</span>
              <button
                type="button"
                onClick={removeFile}
                disabled={isSubmitting}
                className="text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-400">
              <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-orange-600">Click to upload</span> or drag and drop
            </div>
            {accept && (
              <p className="text-xs text-gray-500">
                Accepted: {accept}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Max size: {formatFileSize(maxSize)}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default SecureForm;