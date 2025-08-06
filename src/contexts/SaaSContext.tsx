import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { logger, LogCategory } from '../lib/logger';

// ===========================================
// SAAS PLATFORM CONTEXT
// ===========================================
// Manages B2B SaaS specific features, subscription tiers, and platform-level settings

export interface SubscriptionTier {
  id: string;
  name: 'starter' | 'professional' | 'enterprise';
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: SubscriptionFeature[];
  limits: SubscriptionLimits;
  isPopular?: boolean;
}

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  included: boolean;
  limit?: number;
  unlimited?: boolean;
}

export interface SubscriptionLimits {
  maxUsers: number;
  maxTutors: number;
  maxStudents: number;
  maxSessions: number;
  storageGB: number;
  customBranding: boolean;
  customDomain: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
}

export interface PlatformSettings {
  platformName: string;
  platformTagline: string;
  supportEmail: string;
  salesEmail: string;
  mainWebsiteUrl: string;
  documentationUrl: string;
  statusPageUrl: string;
  termsOfServiceUrl: string;
  privacyPolicyUrl: string;
  marketingEnabled: boolean;
  analyticsEnabled: boolean;
  maintenanceMode: boolean;
}

export interface SaaSContextType {
  // Subscription Management
  subscriptionTiers: SubscriptionTier[];
  getSubscriptionTier: (tierId: string) => SubscriptionTier | null;
  
  // Platform Settings
  platformSettings: PlatformSettings;
  updatePlatformSettings: (settings: Partial<PlatformSettings>) => Promise<void>;
  
  // Feature Flags
  isFeatureEnabled: (featureName: string, tenantTier?: string) => boolean;
  
  // Platform Analytics
  getPlatformMetrics: () => Promise<{
    totalTenants: number;
    activeTenants: number;
    totalRevenue: number;
    averageSessionsPerTenant: number;
  }>;
  
  // Tenant Management
  createTenantWithTier: (tenantData: any, tierId: string) => Promise<string>;
  upgradeTenantTier: (tenantId: string, newTierId: string) => Promise<void>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

const SaaSContext = createContext<SaaSContextType | undefined>(undefined);

// Default subscription tiers for TutorKai
const DEFAULT_SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'starter',
    name: 'starter',
    displayName: 'Starter',
    description: 'Perfect for small tutoring businesses getting started',
    monthlyPrice: 29,
    yearlyPrice: 290, // 2 months free
    features: [
      { id: 'basic_scheduling', name: 'Basic Scheduling', description: 'Simple session booking and calendar', included: true },
      { id: 'student_management', name: 'Student Management', description: 'Manage up to 50 students', included: true, limit: 50 },
      { id: 'progress_tracking', name: 'Progress Tracking', description: 'Basic progress reports', included: true },
      { id: 'email_notifications', name: 'Email Notifications', description: 'Automated email reminders', included: true },
      { id: 'basic_branding', name: 'Basic Branding', description: 'Logo and color customization', included: true },
      { id: 'standard_support', name: 'Standard Support', description: 'Email support during business hours', included: true },
      { id: 'custom_domain', name: 'Custom Domain', description: 'Use your own domain name', included: false },
      { id: 'api_access', name: 'API Access', description: 'Integrate with external tools', included: false },
      { id: 'advanced_analytics', name: 'Advanced Analytics', description: 'Detailed reports and insights', included: false }
    ],
    limits: {
      maxUsers: 3,
      maxTutors: 2,
      maxStudents: 50,
      maxSessions: 200,
      storageGB: 5,
      customBranding: true,
      customDomain: false,
      apiAccess: false,
      prioritySupport: false,
      whiteLabel: false
    }
  },
  {
    id: 'professional',
    name: 'professional',
    displayName: 'Professional',
    description: 'Ideal for growing tutoring businesses with advanced needs',
    monthlyPrice: 79,
    yearlyPrice: 790, // 2 months free
    isPopular: true,
    features: [
      { id: 'advanced_scheduling', name: 'Advanced Scheduling', description: 'Complex scheduling with recurring sessions', included: true },
      { id: 'unlimited_students', name: 'Unlimited Students', description: 'Manage unlimited students', included: true, unlimited: true },
      { id: 'advanced_progress', name: 'Advanced Progress Tracking', description: 'Detailed analytics and reports', included: true },
      { id: 'automated_billing', name: 'Automated Billing', description: 'Automatic payment processing', included: true },
      { id: 'full_branding', name: 'Full Branding', description: 'Complete brand customization', included: true },
      { id: 'custom_domain', name: 'Custom Domain', description: 'Use your own domain name', included: true },
      { id: 'api_access', name: 'API Access', description: 'Full API access for integrations', included: true },
      { id: 'priority_support', name: 'Priority Support', description: 'Priority email and chat support', included: true },
      { id: 'advanced_analytics', name: 'Advanced Analytics', description: 'Comprehensive reports and insights', included: true }
    ],
    limits: {
      maxUsers: 10,
      maxTutors: 8,
      maxStudents: -1, // unlimited
      maxSessions: 1000,
      storageGB: 50,
      customBranding: true,
      customDomain: true,
      apiAccess: true,
      prioritySupport: true,
      whiteLabel: false
    }
  },
  {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'For large organizations requiring maximum flexibility and support',
    monthlyPrice: 199,
    yearlyPrice: 1990, // 2 months free
    features: [
      { id: 'everything_professional', name: 'Everything in Professional', description: 'All Professional features included', included: true },
      { id: 'white_label', name: 'White Label', description: 'Complete brand removal option', included: true },
      { id: 'sso_integration', name: 'SSO Integration', description: 'Single sign-on with your identity provider', included: true },
      { id: 'dedicated_support', name: 'Dedicated Support', description: 'Dedicated account manager and phone support', included: true },
      { id: 'custom_integrations', name: 'Custom Integrations', description: 'Bespoke integrations and features', included: true },
      { id: 'advanced_security', name: 'Advanced Security', description: 'Enhanced security features and compliance', included: true },
      { id: 'unlimited_everything', name: 'Unlimited Usage', description: 'No limits on users, students, or sessions', included: true, unlimited: true }
    ],
    limits: {
      maxUsers: -1, // unlimited
      maxTutors: -1, // unlimited
      maxStudents: -1, // unlimited
      maxSessions: -1, // unlimited
      storageGB: 500,
      customBranding: true,
      customDomain: true,
      apiAccess: true,
      prioritySupport: true,
      whiteLabel: true
    }
  }
];

// Default platform settings
const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: 'TutorKai',
  platformTagline: 'The Future of Tutoring Business Management',
  supportEmail: 'support@tutorkai.com',
  salesEmail: 'sales@tutorkai.com',
  mainWebsiteUrl: 'https://tutorkai.com',
  documentationUrl: 'https://docs.tutorkai.com',
  statusPageUrl: 'https://status.tutorkai.com',
  termsOfServiceUrl: 'https://tutorkai.com/terms',
  privacyPolicyUrl: 'https://tutorkai.com/privacy',
  marketingEnabled: true,
  analyticsEnabled: true,
  maintenanceMode: false
};

interface SaaSProviderProps {
  children: ReactNode;
}

export const SaaSProvider: React.FC<SaaSProviderProps> = ({ children }) => {
  const [subscriptionTiers] = useState<SubscriptionTier[]>(DEFAULT_SUBSCRIPTION_TIERS);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize platform settings from database
  useEffect(() => {
    loadPlatformSettings();
  }, []);

  const loadPlatformSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setPlatformSettings({
          platformName: data.platform_name || DEFAULT_PLATFORM_SETTINGS.platformName,
          platformTagline: data.platform_tagline || DEFAULT_PLATFORM_SETTINGS.platformTagline,
          supportEmail: data.support_email || DEFAULT_PLATFORM_SETTINGS.supportEmail,
          salesEmail: data.sales_email || DEFAULT_PLATFORM_SETTINGS.salesEmail,
          mainWebsiteUrl: data.main_website_url || DEFAULT_PLATFORM_SETTINGS.mainWebsiteUrl,
          documentationUrl: data.documentation_url || DEFAULT_PLATFORM_SETTINGS.documentationUrl,
          statusPageUrl: data.status_page_url || DEFAULT_PLATFORM_SETTINGS.statusPageUrl,
          termsOfServiceUrl: data.terms_of_service_url || DEFAULT_PLATFORM_SETTINGS.termsOfServiceUrl,
          privacyPolicyUrl: data.privacy_policy_url || DEFAULT_PLATFORM_SETTINGS.privacyPolicyUrl,
          marketingEnabled: data.marketing_enabled ?? DEFAULT_PLATFORM_SETTINGS.marketingEnabled,
          analyticsEnabled: data.analytics_enabled ?? DEFAULT_PLATFORM_SETTINGS.analyticsEnabled,
          maintenanceMode: data.maintenance_mode ?? DEFAULT_PLATFORM_SETTINGS.maintenanceMode
        });
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to load platform settings', error as Error);
      // Continue with default settings
    }
  };

  const getSubscriptionTier = (tierId: string): SubscriptionTier | null => {
    return subscriptionTiers.find(tier => tier.id === tierId) || null;
  };

  const updatePlatformSettings = async (settings: Partial<PlatformSettings>): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          id: 1, // Single row for platform settings
          platform_name: settings.platformName,
          platform_tagline: settings.platformTagline,
          support_email: settings.supportEmail,
          sales_email: settings.salesEmail,
          main_website_url: settings.mainWebsiteUrl,
          documentation_url: settings.documentationUrl,
          status_page_url: settings.statusPageUrl,
          terms_of_service_url: settings.termsOfServiceUrl,
          privacy_policy_url: settings.privacyPolicyUrl,
          marketing_enabled: settings.marketingEnabled,
          analytics_enabled: settings.analyticsEnabled,
          maintenance_mode: settings.maintenanceMode,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setPlatformSettings(prev => ({ ...prev, ...settings }));
      
      logger.info(LogCategory.SYSTEM, 'Platform settings updated', { settings });
    } catch (error) {
      const errorMessage = 'Failed to update platform settings';
      setError(errorMessage);
      logger.error(LogCategory.SYSTEM, errorMessage, error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isFeatureEnabled = (featureName: string, tenantTier?: string): boolean => {
    if (!tenantTier) return false;

    const tier = getSubscriptionTier(tenantTier);
    if (!tier) return false;

    const feature = tier.features.find(f => f.id === featureName);
    return feature?.included || false;
  };

  const getPlatformMetrics = async (): Promise<{
    totalTenants: number;
    activeTenants: number;
    totalRevenue: number;
    averageSessionsPerTenant: number;
  }> => {
    try {
      // Get tenant metrics
      const { data: tenantMetrics, error: tenantError } = await supabase
        .rpc('get_platform_metrics');

      if (tenantError) throw tenantError;

      return tenantMetrics || {
        totalTenants: 0,
        activeTenants: 0,
        totalRevenue: 0,
        averageSessionsPerTenant: 0
      };
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get platform metrics', error as Error);
      return {
        totalTenants: 0,
        activeTenants: 0,
        totalRevenue: 0,
        averageSessionsPerTenant: 0
      };
    }
  };

  const createTenantWithTier = async (tenantData: any, tierId: string): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      const tier = getSubscriptionTier(tierId);
      if (!tier) {
        throw new Error(`Invalid subscription tier: ${tierId}`);
      }

      const { data, error } = await supabase
        .rpc('create_tenant_with_subscription', {
          p_name: tenantData.name,
          p_slug: tenantData.slug,
          p_admin_email: tenantData.adminEmail,
          p_subscription_tier: tierId,
          p_company_name: tenantData.companyName || tenantData.name
        });

      if (error) throw error;

      logger.info(LogCategory.SYSTEM, 'Tenant created with subscription tier', {
        tenantId: data,
        tierId,
        tierName: tier.displayName
      });

      return data;
    } catch (error) {
      const errorMessage = 'Failed to create tenant with subscription';
      setError(errorMessage);
      logger.error(LogCategory.SYSTEM, errorMessage, error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeTenantTier = async (tenantId: string, newTierId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const newTier = getSubscriptionTier(newTierId);
      if (!newTier) {
        throw new Error(`Invalid subscription tier: ${newTierId}`);
      }

      const { error } = await supabase
        .from('tenants')
        .update({
          subscription_tier: newTierId,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) throw error;

      logger.info(LogCategory.SYSTEM, 'Tenant tier upgraded', {
        tenantId,
        newTierId,
        newTierName: newTier.displayName
      });
    } catch (error) {
      const errorMessage = 'Failed to upgrade tenant tier';
      setError(errorMessage);
      logger.error(LogCategory.SYSTEM, errorMessage, error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: SaaSContextType = {
    subscriptionTiers,
    getSubscriptionTier,
    platformSettings,
    updatePlatformSettings,
    isFeatureEnabled,
    getPlatformMetrics,
    createTenantWithTier,
    upgradeTenantTier,
    isLoading,
    error
  };

  return (
    <SaaSContext.Provider value={contextValue}>
      {children}
    </SaaSContext.Provider>
  );
};

export const useSaaS = (): SaaSContextType => {
  const context = useContext(SaaSContext);
  if (context === undefined) {
    throw new Error('useSaaS must be used within a SaaSProvider');
  }
  return context;
};

export default SaaSContext;