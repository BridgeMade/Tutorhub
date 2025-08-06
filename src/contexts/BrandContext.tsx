import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { logger, LogCategory } from '../lib/logger';

// ===========================================
// BRAND CONTEXT FOR MULTI-TENANT THEMING
// ===========================================

export interface BrandConfig {
  // Tenant information
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  
  // Company branding
  companyName: string;
  companyTagline?: string;
  companyDescription?: string;
  websiteUrl?: string;
  
  // Visual assets
  logoUrl?: string;
  logoDarkUrl?: string;
  logoLightUrl?: string;
  logoIconUrl?: string;
  faviconUrl?: string;
  
  // Color scheme
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
  };
  
  // Typography
  fonts: {
    primary: string;
    secondary: string;
    source: 'google' | 'system' | 'custom';
  };
  
  // Contact information
  contact: {
    supportEmail?: string;
    supportPhone?: string;
    supportHours?: string;
    address?: string;
  };
  
  // Social media
  social: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  
  // Legal
  legal: {
    termsUrl?: string;
    privacyUrl?: string;
    cookiePolicyUrl?: string;
  };
  
  // Email branding
  email: {
    fromName?: string;
    fromAddress?: string;
    replyTo?: string;
    footerText?: string;
  };
  
  // Advanced settings
  customCss?: string;
  customJs?: string;
  showPlatformBranding: boolean;
}

interface BrandContextType {
  brand: BrandConfig | null;
  isLoading: boolean;
  error: string | null;
  updateBranding: (updates: Partial<BrandConfig>) => Promise<void>;
  loadBrandingByDomain: (domain: string) => Promise<void>;
  loadBrandingByTenant: (tenantId: string) => Promise<void>;
  applyTheme: (themeId: string, customOverrides?: Record<string, any>) => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

// Default brand configuration
const defaultBrandConfig: BrandConfig = {
  tenantId: '',
  tenantName: 'TutorKai',
  tenantSlug: 'default',
  companyName: 'TutorKai',
  colors: {
    primary: '#6366f1', // Innovative indigo - tech leadership
    secondary: '#64748b',
    accent: '#8b5cf6', // Purple - innovation and ambition
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    background: '#ffffff',
    surface: '#f8fafc',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0'
  },
  fonts: {
    primary: 'Inter',
    secondary: 'Inter',
    source: 'google'
  },
  contact: {},
  social: {},
  legal: {},
  email: {},
  showPlatformBranding: true
};

export const BrandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [brand, setBrand] = useState<BrandConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load branding on mount
  useEffect(() => {
    loadInitialBranding();
  }, []);

  // Apply CSS variables when brand changes
  useEffect(() => {
    if (brand) {
      applyCSSVariables(brand);
      loadCustomFonts(brand.fonts);
      injectCustomCSS(brand.customCss);
    }
  }, [brand]);

  const loadInitialBranding = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to determine tenant from current domain
      const currentDomain = window.location.hostname;
      
      if (currentDomain === 'localhost' || currentDomain.includes('localhost')) {
        // Development mode - use default branding
        setBrand(defaultBrandConfig);
      } else {
        // Production - load by domain
        await loadBrandingByDomain(currentDomain);
      }
    } catch (err) {
      logger.error(LogCategory.SYSTEM, 'Failed to load initial branding', err as Error);
      setError('Failed to load branding configuration');
      setBrand(defaultBrandConfig); // Fallback to default
    } finally {
      setIsLoading(false);
    }
  };

  const loadBrandingByDomain = async (domain: string) => {
    try {
      const { data, error: supabaseError } = await supabase
        .rpc('get_tenant_by_domain', { domain_name: domain });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (data && data.length > 0) {
        const tenantData = data[0];
        const brandConfig = buildBrandConfig(tenantData);
        setBrand(brandConfig);
        
        logger.info(LogCategory.SYSTEM, 'Loaded branding by domain', {
          domain,
          tenantId: tenantData.tenant_id
        });
      } else {
        // No tenant found for domain - use default
        setBrand(defaultBrandConfig);
      }
    } catch (err) {
      logger.error(LogCategory.SYSTEM, 'Failed to load branding by domain', err as Error, { domain });
      throw err;
    }
  };

  const loadBrandingByTenant = async (tenantId: string) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('tenant_branding')
        .select(`
          *,
          tenants (
            id,
            name,
            slug
          )
        `)
        .eq('tenant_id', tenantId)
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (data) {
        const brandConfig = buildBrandConfig({
          tenant_id: data.tenants.id,
          tenant_name: data.tenants.name,
          tenant_slug: data.tenants.slug,
          branding_config: data
        });
        setBrand(brandConfig);
        
        logger.info(LogCategory.SYSTEM, 'Loaded branding by tenant', { tenantId });
      }
    } catch (err) {
      logger.error(LogCategory.SYSTEM, 'Failed to load branding by tenant', err as Error, { tenantId });
      throw err;
    }
  };

  const updateBranding = async (updates: Partial<BrandConfig>) => {
    if (!brand) return;

    try {
      // Update local state immediately for optimistic UI
      setBrand(prev => prev ? { ...prev, ...updates } : null);

      // Update in database
      const { error: supabaseError } = await supabase
        .from('tenant_branding')
        .update({
          company_name: updates.companyName,
          company_tagline: updates.companyTagline,
          company_description: updates.companyDescription,
          website_url: updates.websiteUrl,
          logo_url: updates.logoUrl,
          logo_dark_url: updates.logoDarkUrl,
          logo_light_url: updates.logoLightUrl,
          logo_icon_url: updates.logoIconUrl,
          favicon_url: updates.faviconUrl,
          primary_color: updates.colors?.primary,
          secondary_color: updates.colors?.secondary,
          accent_color: updates.colors?.accent,
          success_color: updates.colors?.success,
          warning_color: updates.colors?.warning,
          error_color: updates.colors?.error,
          info_color: updates.colors?.info,
          background_color: updates.colors?.background,
          surface_color: updates.colors?.surface,
          text_primary_color: updates.colors?.textPrimary,
          text_secondary_color: updates.colors?.textSecondary,
          border_color: updates.colors?.border,
          primary_font: updates.fonts?.primary,
          secondary_font: updates.fonts?.secondary,
          font_source: updates.fonts?.source,
          support_email: updates.contact?.supportEmail,
          support_phone: updates.contact?.supportPhone,
          support_hours: updates.contact?.supportHours,
          contact_address: updates.contact?.address,
          social_facebook: updates.social?.facebook,
          social_twitter: updates.social?.twitter,
          social_linkedin: updates.social?.linkedin,
          social_instagram: updates.social?.instagram,
          social_youtube: updates.social?.youtube,
          terms_url: updates.legal?.termsUrl,
          privacy_url: updates.legal?.privacyUrl,
          cookie_policy_url: updates.legal?.cookiePolicyUrl,
          email_from_name: updates.email?.fromName,
          email_from_address: updates.email?.fromAddress,
          email_reply_to: updates.email?.replyTo,
          email_footer_text: updates.email?.footerText,
          custom_css: updates.customCss,
          custom_js: updates.customJs,
          show_platform_branding: updates.showPlatformBranding
        })
        .eq('tenant_id', brand.tenantId);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Log the update
      await supabase
        .from('branding_analytics')
        .insert({
          tenant_id: brand.tenantId,
          event_type: 'branding_updated',
          event_data: updates
        });

      logger.info(LogCategory.SYSTEM, 'Branding updated successfully', {
        tenantId: brand.tenantId,
        updates: Object.keys(updates)
      });

    } catch (err) {
      logger.error(LogCategory.SYSTEM, 'Failed to update branding', err as Error);
      // Revert optimistic update
      await loadBrandingByTenant(brand.tenantId);
      throw err;
    }
  };

  const applyTheme = async (themeId: string, customOverrides?: Record<string, any>) => {
    if (!brand) return;

    try {
      // Get theme configuration
      const { data: theme, error: themeError } = await supabase
        .from('branding_themes')
        .select('theme_config')
        .eq('id', themeId)
        .single();

      if (themeError) {
        throw new Error(themeError.message);
      }

      // Apply theme with custom overrides
      const themeConfig = { ...theme.theme_config, ...customOverrides };
      
      await updateBranding({
        colors: {
          ...brand.colors,
          primary: themeConfig.primary_color || brand.colors.primary,
          secondary: themeConfig.secondary_color || brand.colors.secondary,
          accent: themeConfig.accent_color || brand.colors.accent,
          background: themeConfig.background_color || brand.colors.background,
          textPrimary: themeConfig.text_primary_color || brand.colors.textPrimary
        },
        fonts: {
          ...brand.fonts,
          primary: themeConfig.primary_font || brand.fonts.primary
        }
      });

      // Record theme application
      await supabase
        .from('tenant_themes')
        .upsert({
          tenant_id: brand.tenantId,
          theme_id: themeId,
          custom_overrides: customOverrides || {},
          is_active: true
        });

      logger.info(LogCategory.SYSTEM, 'Theme applied successfully', {
        tenantId: brand.tenantId,
        themeId,
        customOverrides
      });

    } catch (err) {
      logger.error(LogCategory.SYSTEM, 'Failed to apply theme', err as Error);
      throw err;
    }
  };

  const value: BrandContextType = {
    brand,
    isLoading,
    error,
    updateBranding,
    loadBrandingByDomain,
    loadBrandingByTenant,
    applyTheme
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
};

// Hook to use brand context
export const useBrand = (): BrandContextType => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};

// Helper functions
function buildBrandConfig(data: any): BrandConfig {
  const branding = data.branding_config || {};
  
  return {
    tenantId: data.tenant_id,
    tenantName: data.tenant_name,
    tenantSlug: data.tenant_slug,
    companyName: branding.company_name || data.tenant_name,
    companyTagline: branding.company_tagline,
    companyDescription: branding.company_description,
    websiteUrl: branding.website_url,
    logoUrl: branding.logo_url,
    logoDarkUrl: branding.logo_dark_url,
    logoLightUrl: branding.logo_light_url,
    logoIconUrl: branding.logo_icon_url,
    faviconUrl: branding.favicon_url,
    colors: {
      primary: branding.primary_color || '#ea580c',
      secondary: branding.secondary_color || '#64748b',
      accent: branding.accent_color || '#f97316',
      success: branding.success_color || '#10b981',
      warning: branding.warning_color || '#f59e0b',
      error: branding.error_color || '#ef4444',
      info: branding.info_color || '#3b82f6',
      background: branding.background_color || '#ffffff',
      surface: branding.surface_color || '#f8fafc',
      textPrimary: branding.text_primary_color || '#0f172a',
      textSecondary: branding.text_secondary_color || '#64748b',
      border: branding.border_color || '#e2e8f0'
    },
    fonts: {
      primary: branding.primary_font || 'Inter',
      secondary: branding.secondary_font || 'Inter',
      source: branding.font_source || 'google'
    },
    contact: {
      supportEmail: branding.support_email,
      supportPhone: branding.support_phone,
      supportHours: branding.support_hours,
      address: branding.contact_address
    },
    social: {
      facebook: branding.social_facebook,
      twitter: branding.social_twitter,
      linkedin: branding.social_linkedin,
      instagram: branding.social_instagram,
      youtube: branding.social_youtube
    },
    legal: {
      termsUrl: branding.terms_url,
      privacyUrl: branding.privacy_url,
      cookiePolicyUrl: branding.cookie_policy_url
    },
    email: {
      fromName: branding.email_from_name,
      fromAddress: branding.email_from_address,
      replyTo: branding.email_reply_to,
      footerText: branding.email_footer_text
    },
    customCss: branding.custom_css,
    customJs: branding.custom_js,
    showPlatformBranding: branding.show_platform_branding !== false
  };
}

function applyCSSVariables(brand: BrandConfig) {
  const root = document.documentElement;
  
  // Apply color variables
  Object.entries(brand.colors).forEach(([key, value]) => {
    const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });
  
  // Apply font variables
  root.style.setProperty('--font-primary', brand.fonts.primary);
  root.style.setProperty('--font-secondary', brand.fonts.secondary);
}

function loadCustomFonts(fonts: BrandConfig['fonts']) {
  if (fonts.source === 'google') {
    const fontFamilies = [fonts.primary, fonts.secondary]
      .filter((font, index, arr) => font && arr.indexOf(font) === index)
      .map(font => font.replace(' ', '+'))
      .join('|');
    
    if (fontFamilies) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}:wght@300;400;500;600;700&display=swap`;
      link.rel = 'stylesheet';
      
      // Remove existing font link
      const existingLink = document.querySelector('link[href*="fonts.googleapis.com"]');
      if (existingLink) {
        existingLink.remove();
      }
      
      document.head.appendChild(link);
    }
  }
}

function injectCustomCSS(customCss?: string) {
  // Remove existing custom CSS
  const existingStyle = document.querySelector('#tenant-custom-css');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  if (customCss) {
    const style = document.createElement('style');
    style.id = 'tenant-custom-css';
    style.textContent = customCss;
    document.head.appendChild(style);
  }
}

export default BrandProvider;