// Sanitization middleware for React app
import { z } from 'zod';
import { 
  sanitizeText, 
  sanitizeHtml, 
  sanitizeEmail, 
  sanitizeUrl 
} from '../utils/validation';

// ===========================================
// SANITIZATION MIDDLEWARE
// ===========================================

export interface SanitizationConfig {
  body?: boolean;
  query?: boolean;
  params?: boolean;
  customSanitizers?: Record<string, (value: any) => any>;
}

export interface ValidationConfig {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}

/**
 * Client-side data sanitization functions
 */
export class ClientSanitizer {
  static sanitizeFormData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Sanitize based on field type
        if (key.toLowerCase().includes('email')) {
          sanitized[key] = sanitizeEmail(value);
        } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
          sanitized[key] = sanitizeUrl(value);
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

  static validateFormData<T>(data: Record<string, any>, schema: z.ZodSchema<T>): {
    success: boolean;
    data?: T;
    errors?: z.ZodError;
  } {
    try {
      const result = schema.safeParse(data);
      return {
        success: result.success,
        data: result.success ? result.data : undefined,
        errors: result.success ? undefined : result.error
      };
    } catch (error) {
      return {
        success: false,
        errors: error as z.ZodError
      };
    }
  }

  static sanitizeAndValidate<T>(
    data: Record<string, any>, 
    schema: z.ZodSchema<T>
  ): {
    success: boolean;
    data?: T;
    sanitizedData: Record<string, any>;
    errors?: z.ZodError;
  } {
    const sanitizedData = this.sanitizeFormData(data);
    const validation = this.validateFormData(sanitizedData, schema);
    
    return {
      ...validation,
      sanitizedData
    };
  }
}

/**
 * Rate limiting for client-side requests
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class ClientRateLimiter {
  private static records = new Map<string, RateLimitRecord>();

  static checkLimit(key: string, config: RateLimitConfig): {
    allowed: boolean;
    retryAfter?: number;
    remaining: number;
  } {
    const { windowMs, maxRequests } = config;
    const now = Date.now();
    const record = this.records.get(key) || { count: 0, resetTime: now + windowMs };

    // Reset if window has passed
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    // Check if limit exceeded
    if (record.count >= maxRequests) {
      return {
        allowed: false,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
        remaining: 0
      };
    }

    // Increment count
    record.count++;
    this.records.set(key, record);

    return {
      allowed: true,
      remaining: maxRequests - record.count
    };
  }

  static clearKey(key: string): void {
    this.records.delete(key);
  }

  static clearAll(): void {
    this.records.clear();
  }
}

/**
 * Security headers for client-side requests
 */
export class SecurityHeaders {
  static getSecureHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' https:",
        "connect-src 'self' https:",
        "media-src 'self'",
        "object-src 'none'",
        "child-src 'none'",
        "worker-src 'self'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'"
      ].join('; ')
    };
  }

  static applyCorsHeaders(): Record<string, string> {
    return {
      'Access-Control-Allow-Origin': process.env.REACT_APP_ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    };
  }
}

/**
 * Input validation helpers
 */
export class InputValidator {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  static containsSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
      /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
      /['"]\s*(OR|AND)\s+['"]/i,
      /;\s*(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER)/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  static containsXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }

  static sanitizeInput(input: string): string {
    if (this.containsSqlInjection(input) || this.containsXSS(input)) {
      throw new Error('Invalid input detected');
    }
    
    return sanitizeText(input);
  }
}

/**
 * CSRF protection helpers
 */
export class CSRFProtection {
  private static token: string | null = null;

  static generateToken(): string {
    const token = crypto.getRandomValues(new Uint32Array(4))
      .reduce((acc, val) => acc + val.toString(16), '');
    
    this.token = token;
    sessionStorage.setItem('csrf_token', token);
    return token;
  }

  static getToken(): string | null {
    if (!this.token) {
      this.token = sessionStorage.getItem('csrf_token');
    }
    return this.token;
  }

  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken === token;
  }

  static clearToken(): void {
    this.token = null;
    sessionStorage.removeItem('csrf_token');
  }
}

export default {
  ClientSanitizer,
  ClientRateLimiter,
  SecurityHeaders,
  InputValidator,
  CSRFProtection
};