import { z } from 'zod';
import DOMPurify from 'dompurify';

// ===========================================
// CORE VALIDATION SCHEMAS
// ===========================================

// Common validation patterns
const emailSchema = z.string()
  .email('Please enter a valid email address')
  .max(254, 'Email address is too long')
  .toLowerCase()
  .trim();

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password is too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');

const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters long')
  .max(100, 'Name is too long')
  .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .trim();

const phoneSchema = z.string()
  .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
  .optional();

const urlSchema = z.string()
  .url('Please enter a valid URL')
  .max(2048, 'URL is too long')
  .optional();

const uuidSchema = z.string()
  .uuid('Invalid ID format');

// ===========================================
// USER VALIDATION SCHEMAS
// ===========================================

export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: nameSchema,
  role: z.enum(['student', 'tutor', 'admin'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  }),
  phoneNumber: phoneSchema,
  gradeLevel: z.string()
    .min(1, 'Please select a grade level')
    .max(50, 'Grade level is too long')
    .optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const userProfileUpdateSchema = z.object({
  fullName: nameSchema,
  phoneNumber: phoneSchema,
  bio: z.string()
    .max(1000, 'Bio is too long')
    .optional(),
  hourlyRate: z.number()
    .min(0, 'Hourly rate cannot be negative')
    .max(10000, 'Hourly rate is too high')
    .optional(),
  experienceYears: z.number()
    .min(0, 'Experience cannot be negative')
    .max(50, 'Experience years is too high')
    .int('Experience must be a whole number')
    .optional(),
  qualifications: z.array(z.string().max(200, 'Qualification is too long'))
    .max(10, 'Too many qualifications')
    .optional(),
  subjects: z.array(uuidSchema)
    .max(20, 'Too many subjects selected')
    .optional(),
  profilePicture: urlSchema
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

export const passwordResetSchema = z.object({
  email: emailSchema
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string()
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'New passwords do not match',
  path: ['confirmNewPassword']
});

// ===========================================
// SESSION VALIDATION SCHEMAS
// ===========================================

export const sessionBookingSchema = z.object({
  tutorId: uuidSchema,
  subjectId: uuidSchema,
  scheduledAt: z.string()
    .datetime('Please enter a valid date and time')
    .refine(date => new Date(date) > new Date(), {
      message: 'Session must be scheduled in the future'
    }),
  duration: z.number()
    .min(15, 'Session must be at least 15 minutes')
    .max(480, 'Session cannot exceed 8 hours')
    .int('Duration must be in whole minutes'),
  notes: z.string()
    .max(500, 'Notes are too long')
    .optional(),
  sessionType: z.enum(['one-time', 'recurring'])
    .optional()
    .default('one-time')
});

export const sessionUpdateSchema = z.object({
  scheduledAt: z.string()
    .datetime('Please enter a valid date and time')
    .refine(date => new Date(date) > new Date(), {
      message: 'Session must be scheduled in the future'
    })
    .optional(),
  duration: z.number()
    .min(15, 'Session must be at least 15 minutes')
    .max(480, 'Session cannot exceed 8 hours')
    .int('Duration must be in whole minutes')
    .optional(),
  notes: z.string()
    .max(500, 'Notes are too long')
    .optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'])
    .optional()
});

export const rescheduleRequestSchema = z.object({
  lessonId: uuidSchema,
  requestType: z.enum(['reschedule', 'cancel']),
  reason: z.string()
    .min(10, 'Please provide a detailed reason')
    .max(500, 'Reason is too long'),
  proposedDate: z.string()
    .datetime('Please enter a valid date and time')
    .refine(date => new Date(date) > new Date(), {
      message: 'New session time must be in the future'
    })
    .optional(),
  proposedDuration: z.number()
    .min(15, 'Session must be at least 15 minutes')
    .max(480, 'Session cannot exceed 8 hours')
    .int('Duration must be in whole minutes')
    .optional()
});

// ===========================================
// RESOURCE VALIDATION SCHEMAS
// ===========================================

export const resourceUploadSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title is too long'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description is too long'),
  categoryId: uuidSchema,
  subjectId: uuidSchema,
  gradeLevelId: uuidSchema,
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedTimeMinutes: z.number()
    .min(1, 'Estimated time must be at least 1 minute')
    .max(1440, 'Estimated time cannot exceed 24 hours')
    .int('Estimated time must be in whole minutes'),
  tags: z.array(z.string().max(50, 'Tag is too long'))
    .max(10, 'Too many tags'),
  isPublic: z.boolean().default(true),
  file: z.object({
    name: z.string().max(255, 'Filename is too long'),
    size: z.number().max(100 * 1024 * 1024, 'File size cannot exceed 100MB'),
    type: z.string().regex(/^(application\/pdf|image\/|text\/|application\/vnd\.|application\/msword)/, 'Invalid file type')
  })
});

export const resourceAssignmentSchema = z.object({
  sessionId: uuidSchema,
  resourceId: uuidSchema,
  assignmentType: z.enum(['preparation', 'reference', 'homework', 'follow_up']),
  isRequired: z.boolean().default(false),
  notes: z.string()
    .max(300, 'Notes are too long')
    .optional()
});

// ===========================================
// MESSAGING VALIDATION SCHEMAS
// ===========================================

export const messageSchema = z.object({
  recipientId: uuidSchema,
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message is too long'),
  messageType: z.enum(['text', 'image', 'file', 'system'])
    .default('text'),
  relatedLessonId: uuidSchema.optional(),
  isUrgent: z.boolean().default(false)
});

// ===========================================
// NOTIFICATION VALIDATION SCHEMAS
// ===========================================

export const notificationPreferencesSchema = z.object({
  pushNotificationsEnabled: z.boolean(),
  emailNotificationsEnabled: z.boolean(),
  smsNotificationsEnabled: z.boolean(),
  inAppNotificationsEnabled: z.boolean(),
  sessionReminders: z.boolean(),
  bookingConfirmations: z.boolean(),
  rescheduleRequests: z.boolean(),
  resourceUpdates: z.boolean(),
  systemUpdates: z.boolean(),
  marketingCommunications: z.boolean(),
  reminderTimeBefore: z.number()
    .min(15, 'Reminder time must be at least 15 minutes')
    .max(1440, 'Reminder time cannot exceed 24 hours')
    .int('Reminder time must be in whole minutes')
});

// ===========================================
// PAYMENT VALIDATION SCHEMAS
// ===========================================

export const paymentMethodSchema = z.object({
  type: z.enum(['card', 'bank_account', 'ewallet']),
  isDefault: z.boolean().default(false),
  cardDetails: z.object({
    holderName: nameSchema,
    last4Digits: z.string().regex(/^\d{4}$/, 'Invalid card digits'),
    expiryMonth: z.number().min(1).max(12),
    expiryYear: z.number().min(new Date().getFullYear())
  }).optional()
});

// ===========================================
// SANITIZATION FUNCTIONS
// ===========================================

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false
  });
};

/**
 * Sanitize and validate text input
 */
export const sanitizeText = (text: string, maxLength: number = 1000): string => {
  if (typeof text !== 'string') return '';
  
  return text
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Sanitize file names
 */
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 255);
};

/**
 * Validate and sanitize email
 */
export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim().slice(0, 254);
};

/**
 * Sanitize search queries
 */
export const sanitizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .slice(0, 100)
    .replace(/[<>'"]/g, '')
    .replace(/\s+/g, ' ');
};

// ===========================================
// VALIDATION UTILITIES
// ===========================================

/**
 * File type validation
 */
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1));
    }
    return file.type === type;
  });
};

/**
 * File size validation
 */
export const validateFileSize = (file: File, maxSizeBytes: number): boolean => {
  return file.size <= maxSizeBytes;
};

/**
 * Image dimension validation
 */
export const validateImageDimensions = (
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img.width <= maxWidth && img.height <= maxHeight);
    };
    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
};

/**
 * UUID validation
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * SQL injection prevention
 */
export const escapeSqlString = (str: string): string => {
  return str.replace(/'/g, "''").replace(/;/g, '');
};

/**
 * URL validation and sanitization
 */
export const sanitizeUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

// ===========================================
// RATE LIMITING HELPERS
// ===========================================

/**
 * Rate limiting validation for API calls
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (req: any) => string;
}

export const defaultRateLimits: Record<string, RateLimitConfig> = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per window
    keyGenerator: (req) => req.ip + ':auth'
  },
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per window
    keyGenerator: (req) => req.ip
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 uploads per hour
    keyGenerator: (req) => req.userId || req.ip
  }
};

// ===========================================
// VALIDATION ERROR TYPES
// ===========================================

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SanitizationError extends Error {
  constructor(message: string, public originalValue?: any) {
    super(message);
    this.name = 'SanitizationError';
  }
}

// ===========================================
// EXPORT ALL SCHEMAS FOR EASY IMPORT
// ===========================================

export const validationSchemas = {
  user: {
    registration: userRegistrationSchema,
    profileUpdate: userProfileUpdateSchema,
    login: loginSchema,
    passwordReset: passwordResetSchema,
    changePassword: changePasswordSchema
  },
  session: {
    booking: sessionBookingSchema,
    update: sessionUpdateSchema,
    rescheduleRequest: rescheduleRequestSchema
  },
  resource: {
    upload: resourceUploadSchema,
    assignment: resourceAssignmentSchema
  },
  messaging: {
    message: messageSchema
  },
  notification: {
    preferences: notificationPreferencesSchema
  },
  payment: {
    method: paymentMethodSchema
  }
};

export default validationSchemas;