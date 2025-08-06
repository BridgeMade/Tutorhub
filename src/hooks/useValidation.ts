import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { validationSchemas, sanitizeText, sanitizeHtml, sanitizeEmail } from '../utils/validation';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData?: any;
}

export interface UseValidationOptions {
  sanitize?: boolean;
  validateOnChange?: boolean;
  debounceMs?: number;
}

/**
 * Hook for form validation with Zod schemas
 */
export const useValidation = <T extends z.ZodSchema>(
  schema: T,
  options: UseValidationOptions = {}
) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  
  const { sanitize = true, validateOnChange = false, debounceMs = 300 } = options;

  const validate = useCallback(async (data: any): Promise<ValidationResult> => {
    setIsValidating(true);
    
    try {
      let processedData = data;

      // Apply sanitization if enabled
      if (sanitize) {
        processedData = sanitizeFormData(data);
      }

      // Validate with schema
      const result = await schema.safeParseAsync(processedData);
      
      if (result.success) {
        setErrors({});
        return {
          isValid: true,
          errors: {},
          sanitizedData: result.data
        };
      } else {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach(error => {
          const field = error.path.join('.');
          fieldErrors[field] = error.message;
        });
        
        setErrors(fieldErrors);
        return {
          isValid: false,
          errors: fieldErrors,
          sanitizedData: processedData
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setErrors({ general: errorMessage });
      return {
        isValid: false,
        errors: { general: errorMessage }
      };
    } finally {
      setIsValidating(false);
    }
  }, [schema, sanitize]);

  const validateField = useCallback(async (fieldName: string, value: any): Promise<boolean> => {
    try {
      const fieldSchema = (schema as any).shape?.[fieldName];
      if (!fieldSchema) return true;

      const result = await fieldSchema.safeParseAsync(value);
      
      if (result.success) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
        return true;
      } else {
        setErrors(prev => ({
          ...prev,
          [fieldName]: result.error.errors[0]?.message || 'Invalid value'
        }));
        return false;
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: 'Validation error'
      }));
      return false;
    }
  }, [schema]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);
  const hasFieldError = useCallback((fieldName: string) => !!errors[fieldName], [errors]);

  return {
    validate,
    validateField,
    errors,
    clearErrors,
    clearFieldError,
    hasErrors,
    hasFieldError,
    isValidating,
    getFieldError: (fieldName: string) => errors[fieldName] || null
  };
};

/**
 * Predefined validation hooks for common forms
 */

export const useUserRegistrationValidation = (options?: UseValidationOptions) => {
  return useValidation(validationSchemas.user.registration, options);
};

export const useLoginValidation = (options?: UseValidationOptions) => {
  return useValidation(validationSchemas.user.login, options);
};

export const useSessionBookingValidation = (options?: UseValidationOptions) => {
  return useValidation(validationSchemas.session.booking, options);
};

export const useResourceUploadValidation = (options?: UseValidationOptions) => {
  return useValidation(validationSchemas.resource.upload, options);
};

export const useMessageValidation = (options?: UseValidationOptions) => {
  return useValidation(validationSchemas.messaging.message, options);
};

export const useProfileUpdateValidation = (options?: UseValidationOptions) => {
  return useValidation(validationSchemas.user.profileUpdate, options);
};

export const useRescheduleRequestValidation = (options?: UseValidationOptions) => {
  return useValidation(validationSchemas.session.rescheduleRequest, options);
};

/**
 * File validation hooks
 */
export const useFileValidation = () => {
  const validateFile = useCallback((
    file: File,
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      const errors: string[] = [];

      // Check file size
      if (options.maxSize && file.size > options.maxSize) {
        errors.push(`File size must be less than ${formatFileSize(options.maxSize)}`);
      }

      // Check file type
      if (options.allowedTypes && !options.allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      })) {
        errors.push(`File type ${file.type} is not allowed`);
      }

      // For images, check dimensions
      if (file.type.startsWith('image/') && (options.maxWidth || options.maxHeight)) {
        const img = new Image();
        img.onload = () => {
          if (options.maxWidth && img.width > options.maxWidth) {
            errors.push(`Image width must be less than ${options.maxWidth}px`);
          }
          if (options.maxHeight && img.height > options.maxHeight) {
            errors.push(`Image height must be less than ${options.maxHeight}px`);
          }
          
          resolve({
            isValid: errors.length === 0,
            errors: errors.reduce((acc, error, index) => {
              acc[`file_${index}`] = error;
              return acc;
            }, {} as Record<string, string>)
          });
        };
        img.onerror = () => {
          errors.push('Invalid image file');
          resolve({
            isValid: false,
            errors: { file: 'Invalid image file' }
          });
        };
        img.src = URL.createObjectURL(file);
      } else {
        resolve({
          isValid: errors.length === 0,
          errors: errors.reduce((acc, error, index) => {
            acc[`file_${index}`] = error;
            return acc;
          }, {} as Record<string, string>)
        });
      }
    });
  }, []);

  return { validateFile };
};

/**
 * Real-time input validation hook
 */
export const useInputValidation = (
  validationFn: (value: string) => boolean | string,
  debounceMs = 300
) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async (inputValue: string) => {
    setIsValidating(true);
    
    try {
      const result = validationFn(inputValue);
      
      if (typeof result === 'string') {
        setError(result);
      } else if (!result) {
        setError('Invalid input');
      } else {
        setError(null);
      }
    } catch (error) {
      setError('Validation error');
    } finally {
      setIsValidating(false);
    }
  }, [validationFn]);

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validate(newValue);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [validate, debounceMs]);

  return {
    value,
    setValue: handleChange,
    error,
    isValidating,
    isValid: !error && value.length > 0,
    clearError: () => setError(null)
  };
};

/**
 * Password strength validation hook
 */
export const usePasswordStrength = () => {
  const checkStrength = useCallback((password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    
    let strength: 'weak' | 'fair' | 'good' | 'strong';
    if (score < 2) strength = 'weak';
    else if (score < 3) strength = 'fair';
    else if (score < 4) strength = 'good';
    else strength = 'strong';

    return {
      score,
      strength,
      checks,
      isValid: score >= 3
    };
  }, []);

  return { checkStrength };
};

/**
 * Email validation hook with real-time checking
 */
export const useEmailValidation = () => {
  const [isChecking, setIsChecking] = useState(false);
  
  const validateEmail = useCallback(async (email: string) => {
    if (!email) return { isValid: false, error: 'Email is required' };
    
    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    setIsChecking(true);
    
    try {
      // You could add additional checks here like:
      // - Email deliverability checking
      // - Domain validation
      // - Disposable email detection
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      return { isValid: true, error: null };
    } catch (error) {
      return { isValid: false, error: 'Email validation failed' };
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { validateEmail, isChecking };
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Sanitize form data object
 */
function sanitizeFormData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      if (key.toLowerCase().includes('email')) {
        sanitized[key] = sanitizeEmail(value);
      } else if (key.toLowerCase().includes('html') || key.toLowerCase().includes('content')) {
        sanitized[key] = sanitizeHtml(value);
      } else {
        sanitized[key] = sanitizeText(value);
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default useValidation;