import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Upload, 
  Eye, 
  Save, 
  RefreshCw, 
  Monitor, 
  Smartphone, 
  Globe,
  Settings,
  Image,
  Type,
  Mail,
  Link,
  Shield
} from 'lucide-react';
import { useBrand } from '../../contexts/BrandContext';
import { BrandedCard } from '../branding/BrandedComponents';
import { supabase } from '../../lib/supabase';
import { logger, LogCategory } from '../../lib/logger';
import toast from 'react-hot-toast';

// ===========================================
// TENANT BRANDING MANAGEMENT DASHBOARD
// ===========================================

interface TenantBrandingDashboardProps {
  tenantId?: string;
  onSave?: (brandConfig: any) => void;
}

interface BrandingFormData {
  // Company Information
  companyName: string;
  companyTagline: string;
  companyDescription: string;
  websiteUrl: string;
  
  // Visual Assets
  logoUrl: string;
  logoDarkUrl: string;
  logoLightUrl: string;
  logoIconUrl: string;
  faviconUrl: string;
  
  // Color Scheme
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
  borderColor: string;
  
  // Typography
  primaryFont: string;
  secondaryFont: string;
  fontSource: 'google' | 'system' | 'custom';
  
  // Contact Information
  supportEmail: string;
  supportPhone: string;
  supportHours: string;
  contactAddress: string;
  
  // Social Media
  socialFacebook: string;
  socialTwitter: string;
  socialLinkedin: string;
  socialInstagram: string;
  socialYoutube: string;
  
  // Legal Pages
  termsUrl: string;
  privacyUrl: string;
  cookiePolicyUrl: string;
  
  // Email Branding
  emailFromName: string;
  emailFromAddress: string;
  emailReplyTo: string;
  emailFooterText: string;
  
  // Advanced Settings
  customCss: string;
  customJs: string;
  showPlatformBranding: boolean;
}

const defaultFormData: BrandingFormData = {
  companyName: '',
  companyTagline: '',
  companyDescription: '',
  websiteUrl: '',
  logoUrl: '',
  logoDarkUrl: '',
  logoLightUrl: '',
  logoIconUrl: '',
  faviconUrl: '',
  primaryColor: '#6366f1',
  secondaryColor: '#64748b',
  accentColor: '#8b5cf6',
  successColor: '#10b981',
  warningColor: '#f59e0b',
  errorColor: '#ef4444',
  backgroundColor: '#ffffff',
  surfaceColor: '#f8fafc',
  textPrimaryColor: '#0f172a',
  textSecondaryColor: '#64748b',
  borderColor: '#e2e8f0',
  primaryFont: 'Inter',
  secondaryFont: 'Inter',
  fontSource: 'google',
  supportEmail: '',
  supportPhone: '',
  supportHours: '',
  contactAddress: '',
  socialFacebook: '',
  socialTwitter: '',
  socialLinkedin: '',
  socialInstagram: '',
  socialYoutube: '',
  termsUrl: '',
  privacyUrl: '',
  cookiePolicyUrl: '',
  emailFromName: '',
  emailFromAddress: '',
  emailReplyTo: '',
  emailFooterText: '',
  customCss: '',
  customJs: '',
  showPlatformBranding: true
};

export const TenantBrandingDashboard: React.FC<TenantBrandingDashboardProps> = ({
  tenantId,
  onSave
}) => {
  const { brand, updateBranding } = useBrand();
  const [formData, setFormData] = useState<BrandingFormData>(defaultFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);

  // Load existing branding data
  useEffect(() => {
    if (brand) {
      setFormData({
        companyName: brand.companyName || '',
        companyTagline: brand.companyTagline || '',
        companyDescription: brand.companyDescription || '',
        websiteUrl: brand.websiteUrl || '',
        logoUrl: brand.logoUrl || '',
        logoDarkUrl: brand.logoDarkUrl || '',
        logoLightUrl: brand.logoLightUrl || '',
        logoIconUrl: brand.logoIconUrl || '',
        faviconUrl: brand.faviconUrl || '',
        primaryColor: brand.colors.primary,
        secondaryColor: brand.colors.secondary,
        accentColor: brand.colors.accent,
        successColor: brand.colors.success,
        warningColor: brand.colors.warning,
        errorColor: brand.colors.error,
        backgroundColor: brand.colors.background,
        surfaceColor: brand.colors.surface,
        textPrimaryColor: brand.colors.textPrimary,
        textSecondaryColor: brand.colors.textSecondary,
        borderColor: brand.colors.border,
        primaryFont: brand.fonts.primary,
        secondaryFont: brand.fonts.secondary,
        fontSource: brand.fonts.source,
        supportEmail: brand.contact.supportEmail || '',
        supportPhone: brand.contact.supportPhone || '',
        supportHours: brand.contact.supportHours || '',
        contactAddress: brand.contact.address || '',
        socialFacebook: brand.social.facebook || '',
        socialTwitter: brand.social.twitter || '',
        socialLinkedin: brand.social.linkedin || '',
        socialInstagram: brand.social.instagram || '',
        socialYoutube: brand.social.youtube || '',
        termsUrl: brand.legal.termsUrl || '',
        privacyUrl: brand.legal.privacyUrl || '',
        cookiePolicyUrl: brand.legal.cookiePolicyUrl || '',
        emailFromName: brand.email.fromName || '',
        emailFromAddress: brand.email.fromAddress || '',
        emailReplyTo: brand.email.replyTo || '',
        emailFooterText: brand.email.footerText || '',
        customCss: brand.customCss || '',
        customJs: brand.customJs || '',
        showPlatformBranding: brand.showPlatformBranding
      });
    }
  }, [brand]);

  const handleInputChange = (field: keyof BrandingFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleColorChange = (field: keyof BrandingFormData, color: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: color
    }));
    
    // Apply live preview
    if (showPreview) {
      const root = document.documentElement;
      const cssVar = `--color-${field.replace('Color', '').replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, color);
    }
  };

  const handleFileUpload = async (field: keyof BrandingFormData, file: File) => {
    setIsLoading(true);
    
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${brand?.tenantId || 'default'}/${field}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('branding-assets')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('branding-assets')
        .getPublicUrl(fileName);

      const publicUrl = publicData.publicUrl;
      
      // Update form data
      handleInputChange(field, publicUrl);
      
      // Log asset upload
      await supabase
        .from('branding_assets')
        .insert({
          tenant_id: brand?.tenantId,
          asset_type: field.replace('Url', ''),
          filename: fileName,
          original_filename: file.name,
          file_path: fileName,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          is_active: true,
          usage_context: 'branding_dashboard'
        });

      toast.success(`${field} uploaded successfully`);
      
    } catch (error) {
      logger.error(LogCategory.USER_ACTION, 'Failed to upload branding asset', error as Error);
      toast.error(`Failed to upload ${field}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const brandingUpdate = {
        companyName: formData.companyName,
        companyTagline: formData.companyTagline,
        companyDescription: formData.companyDescription,
        websiteUrl: formData.websiteUrl,
        logoUrl: formData.logoUrl,
        logoDarkUrl: formData.logoDarkUrl,
        logoLightUrl: formData.logoLightUrl,
        logoIconUrl: formData.logoIconUrl,
        faviconUrl: formData.faviconUrl,
        colors: {
          primary: formData.primaryColor,
          secondary: formData.secondaryColor,
          accent: formData.accentColor,
          success: formData.successColor,
          warning: formData.warningColor,
          error: formData.errorColor,
          info: formData.primaryColor, // Use primary for info
          background: formData.backgroundColor,
          surface: formData.surfaceColor,
          textPrimary: formData.textPrimaryColor,
          textSecondary: formData.textSecondaryColor,
          border: formData.borderColor
        },
        fonts: {
          primary: formData.primaryFont,
          secondary: formData.secondaryFont,
          source: formData.fontSource
        },
        contact: {
          supportEmail: formData.supportEmail,
          supportPhone: formData.supportPhone,
          supportHours: formData.supportHours,
          address: formData.contactAddress
        },
        social: {
          facebook: formData.socialFacebook,
          twitter: formData.socialTwitter,
          linkedin: formData.socialLinkedin,
          instagram: formData.socialInstagram,
          youtube: formData.socialYoutube
        },
        legal: {
          termsUrl: formData.termsUrl,
          privacyUrl: formData.privacyUrl,
          cookiePolicyUrl: formData.cookiePolicyUrl
        },
        email: {
          fromName: formData.emailFromName,
          fromAddress: formData.emailFromAddress,
          replyTo: formData.emailReplyTo,
          footerText: formData.emailFooterText
        },
        customCss: formData.customCss,
        customJs: formData.customJs,
        showPlatformBranding: formData.showPlatformBranding
      };

      await updateBranding(brandingUpdate);
      
      if (onSave) {
        onSave(brandingUpdate);
      }
      
      toast.success('Branding updated successfully!');
      
    } catch (error) {
      logger.error(LogCategory.USER_ACTION, 'Failed to save branding', error as Error);
      toast.error('Failed to save branding changes');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
    if (!showPreview) {
      // Apply current colors for preview
      const root = document.documentElement;
      root.style.setProperty('--color-primary', formData.primaryColor);
      root.style.setProperty('--color-secondary', formData.secondaryColor);
      root.style.setProperty('--color-accent', formData.accentColor);
    }
  };

  const renderCompanyTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Your Company Name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tagline
          </label>
          <input
            type="text"
            value={formData.companyTagline}
            onChange={(e) => handleInputChange('companyTagline', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Your company tagline"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Description
          </label>
          <textarea
            value={formData.companyDescription}
            onChange={(e) => handleInputChange('companyDescription', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Brief description of your company"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website URL
          </label>
          <input
            type="url"
            value={formData.websiteUrl}
            onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="https://yourcompany.com"
          />
        </div>
      </div>
    </div>
  );

  const renderLogosTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { field: 'logoUrl', label: 'Primary Logo', description: 'Main logo for light backgrounds' },
          { field: 'logoDarkUrl', label: 'Dark Logo', description: 'Logo variant for dark backgrounds' },
          { field: 'logoLightUrl', label: 'Light Logo', description: 'Logo variant for light backgrounds' },
          { field: 'logoIconUrl', label: 'Icon Logo', description: 'Icon-only version for small spaces' },
          { field: 'faviconUrl', label: 'Favicon', description: 'Browser tab icon (16x16 or 32x32)' }
        ].map(({ field, label, description }) => (
          <div key={field} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
              </label>
              <p className="text-xs text-gray-500 mb-2">{description}</p>
              
              <div className="flex items-center space-x-3">
                <input
                  type="url"
                  value={formData[field as keyof BrandingFormData] as string}
                  onChange={(e) => handleInputChange(field as keyof BrandingFormData, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://example.com/logo.png"
                />
                
                <label className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(field as keyof BrandingFormData, file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              
              {formData[field as keyof BrandingFormData] && (
                <div className="mt-2">
                  <img
                    src={formData[field as keyof BrandingFormData] as string}
                    alt={label}
                    className="h-12 w-auto border rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderColorsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[
          { field: 'primaryColor', label: 'Primary', description: 'Main brand color' },
          { field: 'secondaryColor', label: 'Secondary', description: 'Supporting color' },
          { field: 'accentColor', label: 'Accent', description: 'Highlight color' },
          { field: 'successColor', label: 'Success', description: 'Success messages' },
          { field: 'warningColor', label: 'Warning', description: 'Warning messages' },
          { field: 'errorColor', label: 'Error', description: 'Error messages' },
          { field: 'backgroundColor', label: 'Background', description: 'Page background' },
          { field: 'surfaceColor', label: 'Surface', description: 'Card backgrounds' },
          { field: 'textPrimaryColor', label: 'Text Primary', description: 'Main text color' },
          { field: 'textSecondaryColor', label: 'Text Secondary', description: 'Secondary text' },
          { field: 'borderColor', label: 'Border', description: 'Border color' }
        ].map(({ field, label, description }) => (
          <div key={field} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {label}
            </label>
            <p className="text-xs text-gray-500">{description}</p>
            
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData[field as keyof BrandingFormData] as string}
                onChange={(e) => handleColorChange(field as keyof BrandingFormData, e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData[field as keyof BrandingFormData] as string}
                onChange={(e) => handleColorChange(field as keyof BrandingFormData, e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="#000000"
              />
            </div>
            
            <div 
              className="w-full h-8 rounded border"
              style={{ backgroundColor: formData[field as keyof BrandingFormData] as string }}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderTypographyTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Font
          </label>
          <p className="text-xs text-gray-500 mb-2">Main font for headings and important text</p>
          <select
            value={formData.primaryFont}
            onChange={(e) => handleInputChange('primaryFont', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Lato">Lato</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Poppins">Poppins</option>
            <option value="Source Sans Pro">Source Sans Pro</option>
            <option value="Nunito">Nunito</option>
            <option value="Raleway">Raleway</option>
            <option value="Playfair Display">Playfair Display</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Secondary Font
          </label>
          <p className="text-xs text-gray-500 mb-2">Font for body text and UI elements</p>
          <select
            value={formData.secondaryFont}
            onChange={(e) => handleInputChange('secondaryFont', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Lato">Lato</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Poppins">Poppins</option>
            <option value="Source Sans Pro">Source Sans Pro</option>
            <option value="Nunito">Nunito</option>
            <option value="Raleway">Raleway</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Font Source
          </label>
          <select
            value={formData.fontSource}
            onChange={(e) => handleInputChange('fontSource', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="google">Google Fonts</option>
            <option value="system">System Fonts</option>
            <option value="custom">Custom Fonts</option>
          </select>
        </div>
      </div>
      
      {/* Font Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Font Preview</h3>
        <div className="border rounded-lg p-6 space-y-4">
          <div style={{ fontFamily: formData.primaryFont }}>
            <h1 className="text-3xl font-bold text-gray-900">Main Heading</h1>
            <h2 className="text-2xl font-semibold text-gray-800 mt-2">Subheading</h2>
            <h3 className="text-xl font-medium text-gray-700 mt-2">Section Title</h3>
          </div>
          <div style={{ fontFamily: formData.secondaryFont }}>
            <p className="text-base text-gray-600">
              This is how your body text will appear. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Small text and captions will look like this.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContactTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Support Email
          </label>
          <input
            type="email"
            value={formData.supportEmail}
            onChange={(e) => handleInputChange('supportEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="support@yourcompany.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Support Phone
          </label>
          <input
            type="tel"
            value={formData.supportPhone}
            onChange={(e) => handleInputChange('supportPhone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="+1 (555) 123-4567"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Support Hours
          </label>
          <input
            type="text"
            value={formData.supportHours}
            onChange={(e) => handleInputChange('supportHours', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Mon-Fri 9AM-5PM EST"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Address
          </label>
          <textarea
            value={formData.contactAddress}
            onChange={(e) => handleInputChange('contactAddress', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="123 Main St, City, State 12345"
          />
        </div>
      </div>
    </div>
  );

  const renderSocialTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { field: 'socialFacebook', label: 'Facebook', placeholder: 'https://facebook.com/yourcompany' },
          { field: 'socialTwitter', label: 'Twitter', placeholder: 'https://twitter.com/yourcompany' },
          { field: 'socialLinkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany' },
          { field: 'socialInstagram', label: 'Instagram', placeholder: 'https://instagram.com/yourcompany' },
          { field: 'socialYoutube', label: 'YouTube', placeholder: 'https://youtube.com/yourcompany' }
        ].map(({ field, label, placeholder }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label}
            </label>
            <input
              type="url"
              value={formData[field as keyof BrandingFormData] as string}
              onChange={(e) => handleInputChange(field as keyof BrandingFormData, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderLegalTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {[
          { field: 'termsUrl', label: 'Terms of Service URL', placeholder: 'https://yourcompany.com/terms' },
          { field: 'privacyUrl', label: 'Privacy Policy URL', placeholder: 'https://yourcompany.com/privacy' },
          { field: 'cookiePolicyUrl', label: 'Cookie Policy URL', placeholder: 'https://yourcompany.com/cookies' }
        ].map(({ field, label, placeholder }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label}
            </label>
            <input
              type="url"
              value={formData[field as keyof BrandingFormData] as string}
              onChange={(e) => handleInputChange(field as keyof BrandingFormData, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={placeholder}
            />
          </div>
        ))}
        
        <div className="mt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.showPlatformBranding}
              onChange={(e) => handleInputChange('showPlatformBranding', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Show "Powered by TutorKai" branding
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Display platform attribution in your footer (required for Starter plan)
          </p>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'company', label: 'Company', icon: Settings },
    { id: 'logos', label: 'Logos', icon: Image },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'social', label: 'Social', icon: Link },
    { id: 'legal', label: 'Legal', icon: Shield }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Management</h1>
          <p className="text-gray-600 mt-2">
            Customize your company's branding and visual identity
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={togglePreview}
            className={`inline-flex items-center px-4 py-2 border rounded-md font-medium ${
              showPreview 
                ? 'bg-indigo-600 text-white border-indigo-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Exit Preview' : 'Preview'}
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white border border-transparent rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <BrandedCard padding="sm">
            <nav className="space-y-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {label}
                </button>
              ))}
            </nav>
          </BrandedCard>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <BrandedCard>
            {activeTab === 'company' && renderCompanyTab()}
            {activeTab === 'logos' && renderLogosTab()}
            {activeTab === 'colors' && renderColorsTab()}
            {activeTab === 'typography' && renderTypographyTab()}
            {activeTab === 'contact' && renderContactTab()}
            {activeTab === 'social' && renderSocialTab()}
            {activeTab === 'legal' && renderLegalTab()}
          </BrandedCard>
        </div>
      </div>
    </div>
  );
};

export default TenantBrandingDashboard;