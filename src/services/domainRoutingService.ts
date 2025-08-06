import { supabase } from '../lib/supabase';
import { logger, LogCategory } from '../lib/logger';

// ===========================================
// DOMAIN ROUTING SERVICE FOR MULTI-TENANT
// ===========================================

export interface DomainConfig {
  tenantId: string;
  customDomain?: string;
  subdomain?: string;
  isActive: boolean;
  sslEnabled: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed';
  dnsRecords?: {
    type: string;
    name: string;
    value: string;
    status: 'pending' | 'verified';
  }[];
}

export interface TenantRouteInfo {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  brandingConfig: any;
  isActive: boolean;
  subscriptionTier: string;
}

class DomainRoutingService {
  
  // ===========================================
  // DOMAIN RESOLUTION
  // ===========================================
  
  async resolveTenantByDomain(hostname: string): Promise<TenantRouteInfo | null> {
    try {
      logger.info(LogCategory.SYSTEM, 'Resolving tenant by domain', { hostname });
      
      // Use the database function to get tenant by domain
      const { data, error } = await supabase
        .rpc('get_tenant_by_domain', { domain_name: hostname });

      if (error) {
        logger.error(LogCategory.SYSTEM, 'Database error resolving tenant', error);
        throw error;
      }

      if (!data || data.length === 0) {
        logger.warn(LogCategory.SYSTEM, 'No tenant found for domain', { hostname });
        return null;
      }

      const tenantData = data[0];
      
      return {
        tenantId: tenantData.tenant_id,
        tenantName: tenantData.tenant_name,
        tenantSlug: tenantData.tenant_slug,
        brandingConfig: tenantData.branding_config,
        isActive: true,
        subscriptionTier: 'professional' // Would come from tenant data
      };
      
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to resolve tenant by domain', error as Error, { hostname });
      return null;
    }
  }

  async validateDomain(domain: string): Promise<{
    isValid: boolean;
    isAvailable: boolean;
    suggestions?: string[];
    errors?: string[];
  }> {
    const errors: string[] = [];
    
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.(?:[a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
    
    if (!domainRegex.test(domain)) {
      errors.push('Invalid domain format');
    }
    
    if (domain.includes('tutorkai')) {
      errors.push('Domain cannot contain "tutorkai"');
    }
    
    if (domain.length > 253) {
      errors.push('Domain too long (max 253 characters)');
    }

    // Check if domain is already taken
    let isAvailable = true;
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id')
        .eq('custom_domain', domain)
        .single();
        
      if (data) {
        isAvailable = false;
        errors.push('Domain already in use');
      }
    } catch (error) {
      // If no results, domain is available
    }

    return {
      isValid: errors.length === 0,
      isAvailable,
      errors: errors.length > 0 ? errors : undefined,
      suggestions: !isAvailable ? this.generateDomainSuggestions(domain) : undefined
    };
  }

  private generateDomainSuggestions(domain: string): string[] {
    const [name, tld] = domain.split('.');
    return [
      `${name}-tutoring.${tld}`,
      `${name}-education.${tld}`,
      `${name}academy.${tld}`,
      `learn${name}.${tld}`,
      `${name}hub.${tld}`
    ];
  }

  // ===========================================
  // DOMAIN CONFIGURATION
  // ===========================================
  
  async configureDomain(tenantId: string, domainConfig: {
    customDomain?: string;
    subdomain?: string;
  }): Promise<DomainConfig> {
    try {
      // Validate inputs
      if (domainConfig.customDomain) {
        const validation = await this.validateDomain(domainConfig.customDomain);
        if (!validation.isValid || !validation.isAvailable) {
          throw new Error(`Invalid domain: ${validation.errors?.join(', ')}`);
        }
      }

      if (domainConfig.subdomain) {
        const subdomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/;
        if (!subdomainRegex.test(domainConfig.subdomain)) {
          throw new Error('Invalid subdomain format');
        }
        
        // Check subdomain availability
        const { data: existingSubdomain } = await supabase
          .from('tenants')
          .select('id')
          .eq('subdomain', domainConfig.subdomain)
          .neq('id', tenantId)
          .single();
          
        if (existingSubdomain) {
          throw new Error('Subdomain already in use');
        }
      }

      // Update tenant domain configuration
      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          custom_domain: domainConfig.customDomain,
          subdomain: domainConfig.subdomain,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (updateError) throw updateError;

      // Generate DNS records for custom domain
      const dnsRecords = domainConfig.customDomain ? 
        this.generateDNSRecords(domainConfig.customDomain) : undefined;

      // Log the configuration change
      await this.logDomainEvent(tenantId, 'domain_configured', {
        customDomain: domainConfig.customDomain,
        subdomain: domainConfig.subdomain,
        dnsRecords
      });

      logger.info(LogCategory.SYSTEM, 'Domain configured successfully', {
        tenantId,
        customDomain: domainConfig.customDomain,
        subdomain: domainConfig.subdomain
      });

      return {
        tenantId,
        customDomain: domainConfig.customDomain,
        subdomain: domainConfig.subdomain,
        isActive: true,
        sslEnabled: false, // Will be enabled after verification
        verificationStatus: domainConfig.customDomain ? 'pending' : 'verified',
        dnsRecords
      };

    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to configure domain', error as Error, { tenantId });
      throw error;
    }
  }

  private generateDNSRecords(domain: string): DomainConfig['dnsRecords'] {
    return [
      {
        type: 'CNAME',
        name: domain,
        value: 'proxy.tutorkai.com',
        status: 'pending'
      },
      {
        type: 'TXT',
        name: `_tutorkai-challenge.${domain}`,
        value: `tutorkai-verification=${this.generateVerificationToken()}`,
        status: 'pending'
      }
    ];
  }

  private generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // ===========================================
  // DOMAIN VERIFICATION
  // ===========================================
  
  async verifyDomain(tenantId: string, domain: string): Promise<{
    isVerified: boolean;
    sslReady: boolean;
    errors?: string[];
  }> {
    try {
      // In a real implementation, this would:
      // 1. Check DNS records
      // 2. Verify domain ownership
      // 3. Setup SSL certificate
      // 4. Configure CDN/proxy routing
      
      // For now, simulate verification process
      const verificationResult = await this.performDNSVerification(domain);
      
      if (verificationResult.isVerified) {
        // Update tenant verification status
        await supabase
          .from('tenants')
          .update({
            custom_domain: domain,
            updated_at: new Date().toISOString()
          })
          .eq('id', tenantId);

        await this.logDomainEvent(tenantId, 'domain_verified', { domain });
      }

      return verificationResult;
      
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to verify domain', error as Error, { tenantId, domain });
      return {
        isVerified: false,
        sslReady: false,
        errors: ['Verification failed']
      };
    }
  }

  private async performDNSVerification(domain: string): Promise<{
    isVerified: boolean;
    sslReady: boolean;
    errors?: string[];
  }> {
    // Simulate DNS verification
    // In production, this would use DNS lookup libraries
    
    try {
      // Check if domain resolves to our servers
      const dnsLookup = await this.lookupDNS(domain);
      
      if (dnsLookup.cname === 'proxy.tutorkai.com') {
        return {
          isVerified: true,
          sslReady: true
        };
      } else {
        return {
          isVerified: false,
          sslReady: false,
          errors: [`DNS not configured correctly. Expected CNAME to point to proxy.tutorkai.com, found: ${dnsLookup.cname || 'none'}`]
        };
      }
    } catch (error) {
      return {
        isVerified: false,
        sslReady: false,
        errors: ['DNS lookup failed']
      };
    }
  }

  private async lookupDNS(domain: string): Promise<{ cname?: string; ip?: string }> {
    // Simulate DNS lookup
    // In production, use node:dns or similar
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate successful DNS configuration
        resolve({ cname: 'proxy.tutorkai.com' });
      }, 1000);
    });
  }

  // ===========================================
  // ROUTING UTILITIES
  // ===========================================
  
  async getTenantDomains(tenantId: string): Promise<{
    customDomain?: string;
    subdomain?: string;
    defaultDomain: string;
    allDomains: string[];
  }> {
    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('custom_domain, subdomain, slug')
        .eq('id', tenantId)
        .single();

      if (error) throw error;

      const customDomain = tenant.custom_domain;
      const subdomain = tenant.subdomain;
      const defaultDomain = `${tenant.slug}.tutorkai.com`;
      
      const allDomains = [defaultDomain];
      if (subdomain) allDomains.push(`${subdomain}.tutorkai.com`);
      if (customDomain) allDomains.push(customDomain);

      return {
        customDomain,
        subdomain,
        defaultDomain,
        allDomains
      };
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get tenant domains', error as Error, { tenantId });
      throw error;
    }
  }

  // ===========================================
  // MIDDLEWARE INTEGRATION
  // ===========================================
  
  createRoutingMiddleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const hostname = req.get('host');
        
        // Skip localhost and development domains
        if (hostname?.includes('localhost') || hostname?.includes('127.0.0.1')) {
          req.tenant = null;
          return next();
        }

        // Resolve tenant by domain
        const tenantInfo = await this.resolveTenantByDomain(hostname);
        
        if (tenantInfo) {
          req.tenant = tenantInfo;
          
          // Set tenant-specific headers
          res.set('X-Tenant-ID', tenantInfo.tenantId);
          res.set('X-Tenant-Name', tenantInfo.tenantName);
          
          logger.info(LogCategory.SYSTEM, 'Tenant resolved from domain', {
            hostname,
            tenantId: tenantInfo.tenantId,
            tenantName: tenantInfo.tenantName
          });
        } else {
          req.tenant = null;
          
          // For unknown domains, could redirect to main platform or show 404
          logger.warn(LogCategory.SYSTEM, 'Unknown domain accessed', { hostname });
        }
        
        next();
      } catch (error) {
        logger.error(LogCategory.SYSTEM, 'Domain routing middleware error', error as Error);
        req.tenant = null;
        next();
      }
    };
  }

  // ===========================================
  // ANALYTICS AND LOGGING
  // ===========================================
  
  private async logDomainEvent(
    tenantId: string,
    eventType: string,
    eventData: any
  ): Promise<void> {
    try {
      await supabase
        .from('branding_analytics')
        .insert({
          tenant_id: tenantId,
          event_type: eventType,
          event_data: eventData
        });
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to log domain event', error as Error);
    }
  }

  async getDomainAnalytics(tenantId: string): Promise<{
    totalRequests: number;
    uniqueVisitors: number;
    topReferrers: string[];
    domainHealth: 'healthy' | 'warning' | 'error';
  }> {
    try {
      // In production, this would integrate with analytics service
      // For now, return mock data
      return {
        totalRequests: Math.floor(Math.random() * 10000),
        uniqueVisitors: Math.floor(Math.random() * 1000),
        topReferrers: ['google.com', 'facebook.com', 'direct'],
        domainHealth: 'healthy'
      };
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get domain analytics', error as Error, { tenantId });
      throw error;
    }
  }
}

export const domainRoutingService = new DomainRoutingService();
export default domainRoutingService;