// Simple rate limiting implementation for React app
import { supabase } from '../lib/supabase';

// ===========================================
// RATE LIMITING IMPLEMENTATION
// ===========================================

interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (req: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  statusCode?: number;
}

interface RateLimitViolation {
  id: string;
  ip_address: string;
  rule_name: string;
  violation_count: number;
  window_start: string;
  user_agent?: string;
  endpoint?: string;
  created_at: string;
}

interface RateLimitStats {
  suspiciousIPs: string[];
  blockedIPs: string[];
  ruleCounts: Record<string, number>;
  recentViolations: RateLimitViolation[];
}

// Rate limiting rules configuration
export const rateLimitRules = {
  // Authentication endpoints - strict limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per window
    keyGenerator: (req: any) => `auth:${getClientIP(req)}`,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    statusCode: 429
  } as RateLimitRule,

  // Registration - prevent spam
  registration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registrations per hour per IP
    keyGenerator: (req: any) => `register:${getClientIP(req)}`,
    message: 'Registration limit exceeded. Please try again later.',
    statusCode: 429
  } as RateLimitRule,

  // Password reset - prevent abuse
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 reset attempts per hour
    keyGenerator: (req: any) => `reset:${getClientIP(req)}`,
    message: 'Too many password reset attempts. Please try again later.',
    statusCode: 429
  } as RateLimitRule,

  // General API calls
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    keyGenerator: (req: any) => `general:${getUserID(req) || getClientIP(req)}`,
    message: 'Rate limit exceeded. Please slow down.',
    statusCode: 429
  } as RateLimitRule,

  // File upload endpoints
  upload: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10, // 10 uploads per 5 minutes
    keyGenerator: (req: any) => `upload:${getUserID(req) || getClientIP(req)}`,
    message: 'Upload rate limit exceeded. Please wait before uploading more files.',
    statusCode: 429
  } as RateLimitRule,

  // Search endpoints
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
    keyGenerator: (req: any) => `search:${getClientIP(req)}`,
    message: 'Search rate limit exceeded. Please wait before searching again.',
    statusCode: 429
  } as RateLimitRule,

  // Messaging endpoints
  messaging: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 messages per minute
    keyGenerator: (req: any) => `message:${getUserID(req)}`,
    message: 'Messaging rate limit exceeded. Please slow down.',
    statusCode: 429
  } as RateLimitRule,

  // Booking endpoints
  booking: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5, // 5 booking attempts per 5 minutes
    keyGenerator: (req: any) => `booking:${getUserID(req)}`,
    message: 'Booking rate limit exceeded. Please wait before making another booking.',
    statusCode: 429
  } as RateLimitRule,

  // Admin endpoints
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // 50 admin actions per minute
    keyGenerator: (req: any) => `admin:${getUserID(req)}`,
    message: 'Admin rate limit exceeded.',
    statusCode: 429
  } as RateLimitRule
};

// Create rate limiter middleware (simplified for React context)
export function createRateLimiter(ruleName: keyof typeof rateLimitRules) {
  const rule = rateLimitRules[ruleName];
  
  return async (req: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const key = rule.keyGenerator(req);
      const now = new Date();
      const windowStart = new Date(now.getTime() - rule.windowMs);

      // Check current usage in this window
      const { data: violations, error } = await supabase
        .from('rate_limit_violations')
        .select('*')
        .eq('rule_name', ruleName)
        .eq('key', key)
        .gte('window_start', windowStart.toISOString());

      if (error) throw error;

      const currentCount = violations?.length || 0;

      if (currentCount >= rule.maxRequests) {
        // Log violation
        await logRateLimitViolation(
          getClientIP(req),
          ruleName,
          key,
          currentCount + 1,
          now.toISOString(),
          req.headers?.get?.('user-agent') || 'unknown',
          req.url || 'unknown'
        );

        return {
          success: false,
          error: rule.message || 'Rate limit exceeded'
        };
      }

      // Log this request
      await supabase
        .from('rate_limit_violations')
        .insert({
          ip_address: getClientIP(req),
          rule_name: ruleName,
          key,
          violation_count: currentCount + 1,
          window_start: now.toISOString(),
          user_agent: req.headers?.get?.('user-agent') || 'unknown',
          endpoint: req.url || 'unknown'
        });

      return { success: true };

    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow the request through
      return { success: true };
    }
  };
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Get client IP address from request
 */
function getClientIP(req: any): string {
  // In a browser context, we can't get real IP
  // This would be handled on the server side
  return req.ip || 
         req.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers?.get?.('x-real-ip') ||
         req.connection?.remoteAddress ||
         '127.0.0.1';
}

/**
 * Extract user ID from request (if authenticated)
 */
function getUserID(req: any): string | null {
  try {
    // In a real implementation, extract from JWT token or session
    const authHeader = req.headers?.get?.('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // This would decode JWT token
      return 'user_id_from_token';
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Log rate limit violation to database
 */
async function logRateLimitViolation(
  ipAddress: string,
  ruleName: string,
  key: string,
  violationCount: number,
  windowStart: string,
  userAgent: string,
  endpoint: string
): Promise<void> {
  try {
    await supabase
      .from('rate_limit_violations')
      .insert({
        ip_address: ipAddress,
        rule_name: ruleName,
        key,
        violation_count: violationCount,
        window_start: windowStart,
        user_agent: userAgent,
        endpoint,
        created_at: new Date().toISOString()
      });

    // Check if IP should be blocked (multiple violations across different rules)
    const { data: recentViolations } = await supabase
      .from('rate_limit_violations')
      .select('rule_name')
      .eq('ip_address', ipAddress)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const uniqueRuleViolations = new Set(recentViolations?.map((v: any) => v.rule_name) || []).size;

    if (uniqueRuleViolations >= 3) {
      // Block IP for repeated violations across multiple rules
      await supabase
        .from('blocked_ips')
        .upsert({
          ip_address: ipAddress,
          reason: 'Multiple rate limit violations',
          blocked_at: new Date().toISOString(),
          blocked_by: 'system'
        });
    }
  } catch (error) {
    console.error('Failed to log rate limit violation:', error);
  }
}

// ===========================================
// MONITORING AND STATS
// ===========================================

/**
 * Get rate limiting statistics for monitoring dashboard
 */
export async function getRateLimitStats(): Promise<RateLimitStats> {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Get recent violations
    const { data: violations } = await supabase
      .from('rate_limit_violations')
      .select('*')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(100);

    // Get blocked IPs
    const { data: blockedIPs } = await supabase
      .from('blocked_ips')
      .select('ip_address')
      .is('unblocked_at', null);

    // Identify suspicious IPs (high violation count)
    const ipViolationCounts = (violations || []).reduce((acc: Record<string, number>, v: any) => {
      acc[v.ip_address] = (acc[v.ip_address] || 0) + 1;
      return acc;
    }, {});

    const suspiciousIPs = Object.entries(ipViolationCounts)
      .filter(([, count]) => (count as number) >= 10)
      .map(([ip]) => ip);

    const ruleCounts = (violations || []).reduce((acc: Record<string, number>, v: any) => {
      acc[v.rule_name] = (acc[v.rule_name] || 0) + 1;
      return acc;
    }, {});

    return {
      suspiciousIPs,
      blockedIPs: blockedIPs?.map((b: any) => b.ip_address) || [],
      ruleCounts,
      recentViolations: violations || []
    };

  } catch (error) {
    console.error('Failed to get rate limit stats:', error);
    return {
      suspiciousIPs: [],
      blockedIPs: [],
      ruleCounts: {},
      recentViolations: []
    };
  }
}

/**
 * Get top rate limit violators for security monitoring
 */
export async function getTopViolators(limit: number = 10): Promise<Array<{ ip: string; violations: number }>> {
  try {
    const { data: violations } = await supabase
      .from('rate_limit_violations')
      .select('ip_address, violation_count')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('violation_count', { ascending: false })
      .limit(10);

    const topViolators = violations?.map((v: any) => ({
      ip: v.ip_address,
      violations: v.violation_count
    })) || [];

    const ruleCounts: Record<string, number> = {};
    violations?.forEach((v: any) => {
      ruleCounts[v.rule_name] = (ruleCounts[v.rule_name] || 0) + 1;
    });

    return topViolators;

  } catch (error) {
    console.error('Failed to get top violators:', error);
    return [];
  }
}

export default createRateLimiter;