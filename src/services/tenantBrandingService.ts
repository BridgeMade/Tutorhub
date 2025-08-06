import { supabase } from '../lib/supabase';
import { logger, LogCategory } from '../lib/logger';

// ===========================================
// TENANT BRANDING SERVICE
// ===========================================

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'suspended' | 'trial';
  subscriptionTier: 'starter' | 'professional' | 'enterprise';
  adminEmail: string;
  customDomain?: string;
  subdomain?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface BrandingTheme {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'modern' | 'academic' | 'creative';
  previewImageUrl?: string;
  isPremium: boolean;
  themeConfig: Record<string, any>;
  usageCount: number;
  createdAt: string;
}

export interface BrandingAsset {
  id: string;
  tenantId: string;
  assetType: 'logo' | 'favicon' | 'background' | 'icon';
  assetVariant?: 'primary' | 'dark' | 'light' | 'icon';
  filename: string;
  originalFilename: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  isActive: boolean;
  usageContext: string;
  uploadedAt: string;
}

export interface TenantBrandingConfig {
  id: string;
  tenantId: string;
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
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
  borderColor: string;
  
  // Typography
  primaryFont: string;
  secondaryFont: string;
  fontSource: 'google' | 'system' | 'custom';
  
  // Custom styling
  customCss?: string;
  customJs?: string;
  
  // Contact info
  supportEmail?: string;
  supportPhone?: string;
  supportHours?: string;
  contactAddress?: string;
  
  // Social media
  socialFacebook?: string;
  socialTwitter?: string;
  socialLinkedin?: string;
  socialInstagram?: string;
  socialYoutube?: string;
  
  // Legal
  termsUrl?: string;
  privacyUrl?: string;
  cookiePolicyUrl?: string;
  
  // Email branding
  emailFromName?: string;
  emailFromAddress?: string;
  emailReplyTo?: string;
  emailFooterText?: string;
  
  // Settings
  showPlatformBranding: boolean;
  allowCustomCss: boolean;
  allowCustomJs: boolean;
  
  createdAt: string;
  updatedAt: string;
}

class TenantBrandingService {
  
  // ===========================================
  // TENANT MANAGEMENT
  // ===========================================
  
  async createTenant(tenantData: {
    name: string;
    slug: string;
    adminEmail: string;
    companyName?: string;
    subscriptionTier?: 'starter' | 'professional' | 'enterprise';
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('create_tenant_with_branding', {
          p_name: tenantData.name,
          p_slug: tenantData.slug,
          p_admin_email: tenantData.adminEmail,
          p_company_name: tenantData.companyName || tenantData.name
        });

      if (error) throw error;

      logger.info(LogCategory.SYSTEM, 'Tenant created successfully', {
        tenantId: data,
        name: tenantData.name,
        slug: tenantData.slug
      });

      return data;
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to create tenant', error as Error);
      throw error;
    }
  }

  async getTenant(tenantId: string): Promise<TenantInfo | null> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error) throw error;

      return data ? {
        id: data.id,
        name: data.name,
        slug: data.slug,
        status: data.status,
        subscriptionTier: data.subscription_tier,
        adminEmail: data.admin_email,
        customDomain: data.custom_domain,
        subdomain: data.subdomain,
        createdAt: data.created_at,
        lastLoginAt: data.last_login_at
      } : null;
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get tenant', error as Error, { tenantId });
      throw error;
    }
  }

  async getAllTenants(): Promise<TenantInfo[]> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((tenant: any) => ({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        subscriptionTier: tenant.subscription_tier,
        adminEmail: tenant.admin_email,
        customDomain: tenant.custom_domain,
        subdomain: tenant.subdomain,
        createdAt: tenant.created_at,
        lastLoginAt: tenant.last_login_at
      }));
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get all tenants', error as Error);
      throw error;
    }
  }

  async updateTenant(tenantId: string, updates: Partial<TenantInfo>): Promise<void> {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: updates.name,
          status: updates.status,
          subscription_tier: updates.subscriptionTier,
          admin_email: updates.adminEmail,
          custom_domain: updates.customDomain,
          subdomain: updates.subdomain,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) throw error;

      logger.info(LogCategory.SYSTEM, 'Tenant updated successfully', {
        tenantId,
        updates: Object.keys(updates)
      });
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to update tenant', error as Error, { tenantId });
      throw error;
    }
  }

  // ===========================================
  // BRANDING CONFIGURATION
  // ===========================================

  async getTenantBranding(tenantId: string): Promise<TenantBrandingConfig | null> {
    try {
      const { data, error } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (error) throw error;

      return data ? {
        id: data.id,
        tenantId: data.tenant_id,
        companyName: data.company_name,
        companyTagline: data.company_tagline,
        companyDescription: data.company_description,
        websiteUrl: data.website_url,
        logoUrl: data.logo_url,
        logoDarkUrl: data.logo_dark_url,
        logoLightUrl: data.logo_light_url,
        logoIconUrl: data.logo_icon_url,
        faviconUrl: data.favicon_url,
        primaryColor: data.primary_color,
        secondaryColor: data.secondary_color,
        accentColor: data.accent_color,
        successColor: data.success_color,
        warningColor: data.warning_color,
        errorColor: data.error_color,
        infoColor: data.info_color,
        backgroundColor: data.background_color,
        surfaceColor: data.surface_color,
        textPrimaryColor: data.text_primary_color,
        textSecondaryColor: data.text_secondary_color,
        borderColor: data.border_color,
        primaryFont: data.primary_font,
        secondaryFont: data.secondary_font,
        fontSource: data.font_source,
        customCss: data.custom_css,
        customJs: data.custom_js,
        supportEmail: data.support_email,
        supportPhone: data.support_phone,
        supportHours: data.support_hours,
        contactAddress: data.contact_address,
        socialFacebook: data.social_facebook,
        socialTwitter: data.social_twitter,
        socialLinkedin: data.social_linkedin,
        socialInstagram: data.social_instagram,
        socialYoutube: data.social_youtube,
        termsUrl: data.terms_url,
        privacyUrl: data.privacy_url,
        cookiePolicyUrl: data.cookie_policy_url,
        emailFromName: data.email_from_name,
        emailFromAddress: data.email_from_address,
        emailReplyTo: data.email_reply_to,
        emailFooterText: data.email_footer_text,
        showPlatformBranding: data.show_platform_branding,
        allowCustomCss: data.allow_custom_css,
        allowCustomJs: data.allow_custom_js,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } : null;
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get tenant branding', error as Error, { tenantId });
      throw error;
    }
  }

  async updateTenantBranding(tenantId: string, branding: Partial<TenantBrandingConfig>): Promise<void> {
    try {
      const { error } = await supabase
        .from('tenant_branding')
        .upsert({
          tenant_id: tenantId,
          company_name: branding.companyName,
          company_tagline: branding.companyTagline,
          company_description: branding.companyDescription,
          website_url: branding.websiteUrl,
          logo_url: branding.logoUrl,
          logo_dark_url: branding.logoDarkUrl,
          logo_light_url: branding.logoLightUrl,
          logo_icon_url: branding.logoIconUrl,
          favicon_url: branding.faviconUrl,
          primary_color: branding.primaryColor,
          secondary_color: branding.secondaryColor,
          accent_color: branding.accentColor,
          success_color: branding.successColor,
          warning_color: branding.warningColor,
          error_color: branding.errorColor,
          info_color: branding.infoColor,
          background_color: branding.backgroundColor,
          surface_color: branding.surfaceColor,
          text_primary_color: branding.textPrimaryColor,
          text_secondary_color: branding.textSecondaryColor,
          border_color: branding.borderColor,
          primary_font: branding.primaryFont,
          secondary_font: branding.secondaryFont,
          font_source: branding.fontSource,
          custom_css: branding.customCss,
          custom_js: branding.customJs,
          support_email: branding.supportEmail,
          support_phone: branding.supportPhone,
          support_hours: branding.supportHours,
          contact_address: branding.contactAddress,
          social_facebook: branding.socialFacebook,
          social_twitter: branding.socialTwitter,
          social_linkedin: branding.socialLinkedin,
          social_instagram: branding.socialInstagram,
          social_youtube: branding.socialYoutube,
          terms_url: branding.termsUrl,
          privacy_url: branding.privacyUrl,
          cookie_policy_url: branding.cookiePolicyUrl,
          email_from_name: branding.emailFromName,
          email_from_address: branding.emailFromAddress,
          email_reply_to: branding.emailReplyTo,
          email_footer_text: branding.emailFooterText,
          show_platform_branding: branding.showPlatformBranding,
          allow_custom_css: branding.allowCustomCss,
          allow_custom_js: branding.allowCustomJs,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Log the update for analytics
      await this.logBrandingEvent(tenantId, 'branding_updated', branding);

      logger.info(LogCategory.SYSTEM, 'Tenant branding updated successfully', {
        tenantId,
        updates: Object.keys(branding)
      });
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to update tenant branding', error as Error, { tenantId });
      throw error;
    }
  }

  // ===========================================
  // BRANDING THEMES
  // ===========================================

  async getBrandingThemes(): Promise<BrandingTheme[]> {
    try {
      const { data, error } = await supabase
        .from('branding_themes')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;

      return data.map((theme: any) => ({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        category: theme.category,
        previewImageUrl: theme.preview_image_url,
        isPremium: theme.is_premium,
        themeConfig: theme.theme_config,
        usageCount: theme.usage_count,
        createdAt: theme.created_at
      }));
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get branding themes', error as Error);
      throw error;
    }
  }

  async applyTheme(tenantId: string, themeId: string, customOverrides?: Record<string, any>): Promise<void> {
    try {
      // Get theme configuration
      const { data: theme, error: themeError } = await supabase
        .from('branding_themes')
        .select('theme_config')
        .eq('id', themeId)
        .single();

      if (themeError) throw themeError;

      // Apply theme with custom overrides
      const themeConfig = { ...theme.theme_config, ...customOverrides };

      // Update tenant branding with theme colors
      await this.updateTenantBranding(tenantId, {
        primaryColor: themeConfig.primary_color,
        secondaryColor: themeConfig.secondary_color,
        accentColor: themeConfig.accent_color,
        backgroundColor: themeConfig.background_color,
        textPrimaryColor: themeConfig.text_primary_color,
        primaryFont: themeConfig.primary_font
      });

      // Record theme application
      await supabase
        .from('tenant_themes')
        .upsert({
          tenant_id: tenantId,
          theme_id: themeId,
          custom_overrides: customOverrides || {},
          is_active: true
        });

      // Update theme usage count
      await supabase
        .rpc('increment_theme_usage', { theme_id: themeId });

      logger.info(LogCategory.SYSTEM, 'Theme applied successfully', {
        tenantId,
        themeId,
        customOverrides
      });
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to apply theme', error as Error, { tenantId, themeId });
      throw error;
    }
  }

  // ===========================================
  // ASSET MANAGEMENT
  // ===========================================

  async getTenantAssets(tenantId: string): Promise<BrandingAsset[]> {
    try {
      const { data, error } = await supabase
        .from('branding_assets')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      return data.map((asset: any) => ({
        id: asset.id,
        tenantId: asset.tenant_id,
        assetType: asset.asset_type,
        assetVariant: asset.asset_variant,
        filename: asset.filename,
        originalFilename: asset.original_filename,
        filePath: asset.file_path,
        fileUrl: asset.file_url,
        fileSize: asset.file_size,
        mimeType: asset.mime_type,
        width: asset.width,
        height: asset.height,
        isActive: asset.is_active,
        usageContext: asset.usage_context,
        uploadedAt: asset.uploaded_at
      }));
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get tenant assets', error as Error, { tenantId });
      throw error;
    }
  }

  async deleteAsset(assetId: string): Promise<void> {
    try {
      // Get asset info first
      const { data: asset, error: fetchError } = await supabase
        .from('branding_assets')
        .select('file_path')
        .eq('id', assetId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('branding-assets')
        .remove([asset.file_path]);

      if (storageError) {
        logger.warn(LogCategory.SYSTEM, 'Failed to delete asset from storage', storageError);
      }

      // Mark as inactive in database
      const { error: dbError } = await supabase
        .from('branding_assets')
        .update({ is_active: false })
        .eq('id', assetId);

      if (dbError) throw dbError;

      logger.info(LogCategory.SYSTEM, 'Asset deleted successfully', { assetId });
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to delete asset', error as Error, { assetId });
      throw error;
    }
  }

  // ===========================================
  // ANALYTICS
  // ===========================================

  async logBrandingEvent(
    tenantId: string, 
    eventType: string, 
    eventData: any,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await supabase
        .from('branding_analytics')
        .insert({
          tenant_id: tenantId,
          event_type: eventType,
          event_data: eventData,
          user_id: userId,
          ip_address: ipAddress,
          user_agent: userAgent
        });
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to log branding event', error as Error);
      // Don't throw - analytics logging shouldn't break the main flow
    }
  }

  async getBrandingAnalytics(tenantId: string, days: number = 30): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentEvents: any[];
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('branding_analytics')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const eventsByType = data.reduce((acc: any, event: any) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalEvents: data.length,
        eventsByType,
        recentEvents: data.slice(0, 10)
      };
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get branding analytics', error as Error, { tenantId });
      throw error;
    }
  }
}

export const tenantBrandingService = new TenantBrandingService();
export default tenantBrandingService;