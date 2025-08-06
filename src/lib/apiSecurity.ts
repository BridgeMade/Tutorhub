import { supabase } from './supabase';
import { handleError } from '../utils/errorHandler';
import { isValidUUID, sanitizeText } from '../utils/validation';

// ===========================================
// API SECURITY UTILITIES
// ===========================================

/**
 * Verify user authentication and authorization
 */
export const verifyAuth = async (requiredRole?: string): Promise<{
  user: any;
  profile: any;
  authorized: boolean;
  error?: string;
}> => {
  try {
    // Get current user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        user: null,
        profile: null,
        authorized: false,
        error: 'Authentication required'
      };
    }

    // Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        user,
        profile: null,
        authorized: false,
        error: 'User profile not found'
      };
    }

    // Check if account is active
    if (profile.status === 'suspended' || profile.status === 'banned') {
      return {
        user,
        profile,
        authorized: false,
        error: 'Account suspended'
      };
    }

    // Check role-based authorization
    if (requiredRole && profile.role !== requiredRole && profile.role !== 'admin') {
      return {
        user,
        profile,
        authorized: false,
        error: 'Insufficient permissions'
      };
    }

    return {
      user,
      profile,
      authorized: true
    };
  } catch (error) {
    return {
      user: null,
      profile: null,
      authorized: false,
      error: 'Authentication verification failed'
    };
  }
};

/**
 * Check if user has permission to access specific resource
 */
export const checkResourcePermission = async (
  resourceType: 'lesson' | 'resource' | 'message' | 'profile',
  resourceId: string,
  action: 'read' | 'write' | 'delete' = 'read'
): Promise<{ authorized: boolean; error?: string }> => {
  try {
    const { profile, authorized } = await verifyAuth();
    
    if (!authorized || !profile) {
      return { authorized: false, error: 'Authentication required' };
    }

    // Validate resource ID
    if (!isValidUUID(resourceId)) {
      return { authorized: false, error: 'Invalid resource ID' };
    }

    // Admin has access to everything
    if (profile.role === 'admin') {
      return { authorized: true };
    }

    // Check specific resource permissions
    switch (resourceType) {
      case 'lesson':
        return await checkLessonPermission(profile, resourceId, action);
      case 'resource':
        return await checkResourceFilePermission(profile, resourceId, action);
      case 'message':
        return await checkMessagePermission(profile, resourceId, action);
      case 'profile':
        return await checkProfilePermission(profile, resourceId, action);
      default:
        return { authorized: false, error: 'Unknown resource type' };
    }
  } catch (error) {
    return { authorized: false, error: 'Permission check failed' };
  }
};

/**
 * Check lesson access permissions
 */
async function checkLessonPermission(
  profile: any,
  lessonId: string,
  action: string
): Promise<{ authorized: boolean; error?: string }> {
  try {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('student_id, tutor_id, created_by')
      .eq('id', lessonId)
      .single();

    if (error || !lesson) {
      return { authorized: false, error: 'Lesson not found' };
    }

    // User must be involved in the lesson
    const isParticipant = lesson.student_id === profile.id || 
                         lesson.tutor_id === profile.id ||
                         lesson.created_by === profile.id;

    if (!isParticipant) {
      return { authorized: false, error: 'Access denied to lesson' };
    }

    // Check action-specific permissions
    if (action === 'delete' || action === 'write') {
      // Only creator or admin can modify/delete
      if (lesson.created_by !== profile.id && profile.role !== 'admin') {
        return { authorized: false, error: 'Insufficient permissions for this action' };
      }
    }

    return { authorized: true };
  } catch (error) {
    return { authorized: false, error: 'Lesson permission check failed' };
  }
}

/**
 * Check resource file access permissions
 */
async function checkResourceFilePermission(
  profile: any,
  resourceId: string,
  action: string
): Promise<{ authorized: boolean; error?: string }> {
  try {
    const { data: resource, error } = await supabase
      .from('resources')
      .select('created_by, is_public, tutor_id')
      .eq('id', resourceId)
      .single();

    if (error || !resource) {
      return { authorized: false, error: 'Resource not found' };
    }

    // Public resources can be read by anyone
    if (action === 'read' && resource.is_public) {
      return { authorized: true };
    }

    // Owner has full access
    if (resource.created_by === profile.id || resource.tutor_id === profile.id) {
      return { authorized: true };
    }

    // For private resources, check if user has been assigned the resource
    if (!resource.is_public && action === 'read') {
      const { data: assignment } = await supabase
        .from('session_resources')
        .select('id')
        .eq('resource_id', resourceId)
        .eq('lessons.student_id', profile.id)
        .limit(1);

      if (assignment && assignment.length > 0) {
        return { authorized: true };
      }
    }

    return { authorized: false, error: 'Access denied to resource' };
  } catch (error) {
    return { authorized: false, error: 'Resource permission check failed' };
  }
}

/**
 * Check message access permissions
 */
async function checkMessagePermission(
  profile: any,
  messageId: string,
  action: string
): Promise<{ authorized: boolean; error?: string }> {
  try {
    const { data: message, error } = await supabase
      .from('messages')
      .select('sender_id, recipient_id, conversation_id')
      .eq('id', messageId)
      .single();

    if (error || !message) {
      return { authorized: false, error: 'Message not found' };
    }

    // User must be sender or recipient
    const isParticipant = message.sender_id === profile.id || 
                         message.recipient_id === profile.id;

    if (!isParticipant) {
      return { authorized: false, error: 'Access denied to message' };
    }

    // Only sender can delete/edit
    if ((action === 'delete' || action === 'write') && message.sender_id !== profile.id) {
      return { authorized: false, error: 'Only sender can modify message' };
    }

    return { authorized: true };
  } catch (error) {
    return { authorized: false, error: 'Message permission check failed' };
  }
}

/**
 * Check profile access permissions
 */
async function checkProfilePermission(
  profile: any,
  profileId: string,
  action: string
): Promise<{ authorized: boolean; error?: string }> {
  // User can always read their own profile
  if (action === 'read' && profile.id === profileId) {
    return { authorized: true };
  }

  // User can only write to their own profile
  if ((action === 'write' || action === 'delete') && profile.id !== profileId) {
    return { authorized: false, error: 'Can only modify own profile' };
  }

  // For reading other profiles, check privacy settings
  if (action === 'read' && profile.id !== profileId) {
    try {
      const { data: targetProfile, error } = await supabase
        .from('profiles')
        .select('privacy_settings, role')
        .eq('id', profileId)
        .single();

      if (error || !targetProfile) {
        return { authorized: false, error: 'Profile not found' };
      }

      // Public profiles can be viewed by anyone
      if (targetProfile.privacy_settings?.profile_visibility === 'public') {
        return { authorized: true };
      }

      // Private profiles only visible to connected users
      // (You could add logic here to check if users are connected through lessons)
      return { authorized: false, error: 'Profile is private' };
    } catch (error) {
      return { authorized: false, error: 'Profile permission check failed' };
    }
  }

  return { authorized: true };
}

/**
 * Log security events for monitoring
 */
export const logSecurityEvent = async (
  eventType: 'auth_failure' | 'permission_denied' | 'suspicious_activity' | 'data_breach_attempt',
  details: {
    userId?: string;
    ip?: string;
    userAgent?: string;
    resource?: string;
    action?: string;
    reason?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> => {
  try {
    await supabase
      .from('security_audit_logs')
      .insert({
        event_type: eventType,
        user_id: details.userId,
        ip_address: details.ip,
        user_agent: details.userAgent,
        resource_type: details.resource,
        action_attempted: details.action,
        denial_reason: details.reason,
        metadata: details.metadata || {},
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't fail the main operation if logging fails
  }
};

/**
 * Detect and prevent common attack patterns
 */
export const detectAttackPatterns = (input: string): {
  safe: boolean;
  threats: string[];
} => {
  const threats: string[] = [];

  // SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(--|\/\*|\*\/)/,
    /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i
  ];

  // XSS patterns
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /(javascript:|data:text\/html|vbscript:)/i,
    /(onload|onerror|onclick|onmouseover|onfocus|onblur)=/i,
    /<iframe|<object|<embed|<link|<meta/i
  ];

  // Path traversal patterns
  const pathTraversalPatterns = [
    /\.\.[\/\\]/,
    /(\/etc\/passwd|\/etc\/shadow|\/windows\/system32)/i,
    /\b(file:\/\/|ftp:\/\/)\b/i
  ];

  // Command injection patterns
  const commandInjectionPatterns = [
    /[;&|`$(){}[\]]/,
    /\b(bash|sh|cmd|powershell|nc|netcat|wget|curl)\b/i
  ];

  // Check SQL injection
  sqlPatterns.forEach(pattern => {
    if (pattern.test(input)) {
      threats.push('SQL injection attempt detected');
    }
  });

  // Check XSS
  xssPatterns.forEach(pattern => {
    if (pattern.test(input)) {
      threats.push('Cross-site scripting (XSS) attempt detected');
    }
  });

  // Check path traversal
  pathTraversalPatterns.forEach(pattern => {
    if (pattern.test(input)) {
      threats.push('Path traversal attempt detected');
    }
  });

  // Check command injection
  commandInjectionPatterns.forEach(pattern => {
    if (pattern.test(input)) {
      threats.push('Command injection attempt detected');
    }
  });

  return {
    safe: threats.length === 0,
    threats
  };
};

/**
 * Sanitize and validate API inputs
 */
export const sanitizeApiInput = (
  data: Record<string, any>,
  config: {
    maxDepth?: number;
    maxStringLength?: number;
    allowedKeys?: string[];
    requiredKeys?: string[];
  } = {}
): { 
  sanitized: Record<string, any>; 
  valid: boolean; 
  errors: string[] 
} => {
  const {
    maxDepth = 5,
    maxStringLength = 10000,
    allowedKeys,
    requiredKeys = []
  } = config;

  const errors: string[] = [];
  const sanitized: Record<string, any> = {};

  // Check required keys
  requiredKeys.forEach(key => {
    if (!(key in data)) {
      errors.push(`Required field missing: ${key}`);
    }
  });

  // Sanitize each field
  for (const [key, value] of Object.entries(data)) {
    // Check allowed keys
    if (allowedKeys && !allowedKeys.includes(key)) {
      errors.push(`Unauthorized field: ${key}`);
      continue;
    }

    try {
      sanitized[key] = sanitizeValue(value, maxStringLength, maxDepth);
    } catch (error) {
      errors.push(`Invalid value for field ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    sanitized,
    valid: errors.length === 0,
    errors
  };
};

/**
 * Recursively sanitize values
 */
function sanitizeValue(value: any, maxStringLength: number, maxDepth: number, currentDepth = 0): any {
  if (currentDepth > maxDepth) {
    throw new Error('Maximum nesting depth exceeded');
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    // Check for attack patterns
    const attackCheck = detectAttackPatterns(value);
    if (!attackCheck.safe) {
      throw new Error(`Security threat detected: ${attackCheck.threats.join(', ')}`);
    }

    // Limit string length
    if (value.length > maxStringLength) {
      throw new Error(`String too long (max ${maxStringLength} characters)`);
    }

    return sanitizeText(value);
  }

  if (typeof value === 'number') {
    // Check for invalid numbers
    if (!Number.isFinite(value)) {
      throw new Error('Invalid number value');
    }
    return value;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    // Limit array size
    if (value.length > 1000) {
      throw new Error('Array too large (max 1000 elements)');
    }

    return value.map(item => sanitizeValue(item, maxStringLength, maxDepth, currentDepth + 1));
  }

  if (typeof value === 'object') {
    // Limit object size
    const keys = Object.keys(value);
    if (keys.length > 100) {
      throw new Error('Object too large (max 100 properties)');
    }

    const sanitizedObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      // Sanitize key
      const sanitizedKey = sanitizeText(key, 100);
      sanitizedObj[sanitizedKey] = sanitizeValue(val, maxStringLength, maxDepth, currentDepth + 1);
    }
    return sanitizedObj;
  }

  // For any other type, convert to string and sanitize
  return sanitizeText(String(value));
}

/**
 * Create secure API response
 */
export const createSecureResponse = (
  data: any,
  options: {
    removeFields?: string[];
    encryptFields?: string[];
    addSecurityHeaders?: boolean;
  } = {}
) => {
  const { removeFields = [], encryptFields = [], addSecurityHeaders = true } = options;

  let responseData = data;

  // Remove sensitive fields
  if (removeFields.length > 0 && typeof responseData === 'object') {
    responseData = { ...responseData };
    removeFields.forEach(field => {
      delete responseData[field];
    });
  }

  // Encrypt sensitive fields (simplified - in production use proper encryption)
  if (encryptFields.length > 0 && typeof responseData === 'object') {
    responseData = { ...responseData };
    encryptFields.forEach(field => {
      if (responseData[field]) {
        responseData[field] = '***ENCRYPTED***';
      }
    });
  }

  const response = {
    data: responseData,
    timestamp: new Date().toISOString(),
    ...(addSecurityHeaders && {
      security: {
        contentType: 'application/json',
        cacheControl: 'no-cache, no-store, must-revalidate',
        pragma: 'no-cache'
      }
    })
  };

  return response;
};

export default {
  verifyAuth,
  checkResourcePermission,
  logSecurityEvent,
  detectAttackPatterns,
  sanitizeApiInput,
  createSecureResponse
};