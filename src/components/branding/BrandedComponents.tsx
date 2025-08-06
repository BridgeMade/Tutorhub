import React from 'react';
import { useBrand } from '../../contexts/BrandContext';

// ===========================================
// BRANDED COMPONENTS FOR MULTI-TENANT UI
// ===========================================

/**
 * Branded Logo Component
 * Displays the appropriate logo based on theme and context
 */
export interface BrandedLogoProps {
  variant?: 'primary' | 'dark' | 'light' | 'icon' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

export const BrandedLogo: React.FC<BrandedLogoProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  showFallback = true
}) => {
  const { brand } = useBrand();

  const getLogoUrl = () => {
    if (!brand) return null;
    
    switch (variant) {
      case 'dark':
        return brand.logoDarkUrl || brand.logoUrl;
      case 'light':
        return brand.logoLightUrl || brand.logoUrl;
      case 'icon':
        return brand.logoIconUrl || brand.faviconUrl;
      case 'wordmark':
        return brand.logoUrl; // Wordmark would be stored as primary logo
      default:
        return brand.logoUrl;
    }
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'h-6 w-auto',
      md: 'h-8 w-auto',
      lg: 'h-12 w-auto',
      xl: 'h-16 w-auto'
    };
    return sizes[size];
  };

  const logoUrl = getLogoUrl();
  const sizeClasses = getSizeClasses();

  // If no logo URL and fallback is enabled, show company name
  if (!logoUrl && showFallback && brand) {
    return (
      <div 
        className={`font-bold text-[var(--color-primary)] ${sizeClasses} flex items-center ${className}`}
        style={{ color: brand.colors.primary }}
      >
        {brand.companyName}
      </div>
    );
  }

  // If no logo and no fallback, return null
  if (!logoUrl) {
    return null;
  }

  return (
    <img
      src={logoUrl}
      alt={brand?.companyName || 'Logo'}
      className={`${sizeClasses} ${className}`}
      onError={(e) => {
        // If image fails to load and fallback is enabled, show text
        if (showFallback && brand) {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.textContent = brand.companyName;
          fallback.className = `font-bold text-[var(--color-primary)] ${sizeClasses} flex items-center ${className}`;
          fallback.style.color = brand.colors.primary;
          target.parentNode?.replaceChild(fallback, target);
        }
      }}
    />
  );
};

/**
 * Branded Button Component
 * Uses tenant's primary color and styling
 */
export interface BrandedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const BrandedButton: React.FC<BrandedButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button'
}) => {
  const { brand } = useBrand();

  const getVariantClasses = () => {
    if (!brand) return '';

    const baseClasses = 'font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} text-white shadow-sm hover:opacity-90 focus:ring-[var(--color-primary)]`;
      case 'secondary':
        return `${baseClasses} border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-[var(--color-primary)]`;
      case 'outline':
        return `${baseClasses} border-2 bg-transparent hover:bg-[var(--color-primary)] hover:text-white focus:ring-[var(--color-primary)]`;
      case 'ghost':
        return `${baseClasses} bg-transparent hover:bg-[var(--color-primary)]/10 focus:ring-[var(--color-primary)]`;
      default:
        return baseClasses;
    }
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    return sizes[size];
  };

  const variantClasses = getVariantClasses();
  const sizeClasses = getSizeClasses();

  const buttonStyle: React.CSSProperties = {};
  
  if (brand && variant === 'primary') {
    buttonStyle.backgroundColor = brand.colors.primary;
  } else if (brand && variant === 'outline') {
    buttonStyle.borderColor = brand.colors.primary;
    buttonStyle.color = brand.colors.primary;
  } else if (brand && variant === 'ghost') {
    buttonStyle.color = brand.colors.primary;
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variantClasses} ${sizeClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={buttonStyle}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
        </svg>
      )}
      {children}
    </button>
  );
};

/**
 * Branded Header Component
 * Company name and logo with tenant styling
 */
export interface BrandedHeaderProps {
  showLogo?: boolean;
  showCompanyName?: boolean;
  showTagline?: boolean;
  className?: string;
  logoSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BrandedHeader: React.FC<BrandedHeaderProps> = ({
  showLogo = true,
  showCompanyName = true,
  showTagline = false,
  className = '',
  logoSize = 'lg'
}) => {
  const { brand } = useBrand();

  if (!brand) return null;

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {showLogo && (
        <BrandedLogo size={logoSize} />
      )}
      
      <div className="flex flex-col">
        {showCompanyName && (
          <h1 
            className="text-2xl font-bold"
            style={{ color: brand.colors.textPrimary }}
          >
            {brand.companyName}
          </h1>
        )}
        
        {showTagline && brand.companyTagline && (
          <p 
            className="text-sm"
            style={{ color: brand.colors.textSecondary }}
          >
            {brand.companyTagline}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Branded Footer Component
 * Company information and links with tenant styling
 */
export interface BrandedFooterProps {
  showContact?: boolean;
  showSocial?: boolean;
  showLegal?: boolean;
  showPlatformCredit?: boolean;
  className?: string;
}

export const BrandedFooter: React.FC<BrandedFooterProps> = ({
  showContact = true,
  showSocial = true,
  showLegal = true,
  showPlatformCredit = true,
  className = ''
}) => {
  const { brand } = useBrand();

  if (!brand) return null;

  return (
    <footer 
      className={`border-t py-8 px-4 ${className}`}
      style={{ borderColor: brand.colors.border }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Information */}
          <div className="col-span-1 md:col-span-2">
            <BrandedLogo size="md" className="mb-4" />
            
            {brand.companyDescription && (
              <p 
                className="text-sm mb-4 max-w-md"
                style={{ color: brand.colors.textSecondary }}
              >
                {brand.companyDescription}
              </p>
            )}

            {showContact && (
              <div className="space-y-2">
                {brand.contact.supportEmail && (
                  <p className="text-sm">
                    <span style={{ color: brand.colors.textSecondary }}>Email: </span>
                    <a 
                      href={`mailto:${brand.contact.supportEmail}`}
                      className="hover:underline"
                      style={{ color: brand.colors.primary }}
                    >
                      {brand.contact.supportEmail}
                    </a>
                  </p>
                )}
                
                {brand.contact.supportPhone && (
                  <p className="text-sm">
                    <span style={{ color: brand.colors.textSecondary }}>Phone: </span>
                    <a 
                      href={`tel:${brand.contact.supportPhone}`}
                      className="hover:underline"
                      style={{ color: brand.colors.primary }}
                    >
                      {brand.contact.supportPhone}
                    </a>
                  </p>
                )}
                
                {brand.contact.supportHours && (
                  <p 
                    className="text-sm"
                    style={{ color: brand.colors.textSecondary }}
                  >
                    Hours: {brand.contact.supportHours}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Legal Links */}
          {showLegal && (
            <div>
              <h3 
                className="font-semibold mb-4"
                style={{ color: brand.colors.textPrimary }}
              >
                Legal
              </h3>
              <div className="space-y-2">
                {brand.legal.termsUrl && (
                  <a 
                    href={brand.legal.termsUrl}
                    className="block text-sm hover:underline"
                    style={{ color: brand.colors.textSecondary }}
                  >
                    Terms of Service
                  </a>
                )}
                
                {brand.legal.privacyUrl && (
                  <a 
                    href={brand.legal.privacyUrl}
                    className="block text-sm hover:underline"
                    style={{ color: brand.colors.textSecondary }}
                  >
                    Privacy Policy
                  </a>
                )}
                
                {brand.legal.cookiePolicyUrl && (
                  <a 
                    href={brand.legal.cookiePolicyUrl}
                    className="block text-sm hover:underline"
                    style={{ color: brand.colors.textSecondary }}
                  >
                    Cookie Policy
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Social Media */}
          {showSocial && (
            <div>
              <h3 
                className="font-semibold mb-4"
                style={{ color: brand.colors.textPrimary }}
              >
                Follow Us
              </h3>
              <div className="space-y-2">
                {brand.social.facebook && (
                  <a 
                    href={brand.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm hover:underline"
                    style={{ color: brand.colors.textSecondary }}
                  >
                    Facebook
                  </a>
                )}
                
                {brand.social.twitter && (
                  <a 
                    href={brand.social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm hover:underline"
                    style={{ color: brand.colors.textSecondary }}
                  >
                    Twitter
                  </a>
                )}
                
                {brand.social.linkedin && (
                  <a 
                    href={brand.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm hover:underline"
                    style={{ color: brand.colors.textSecondary }}
                  >
                    LinkedIn
                  </a>
                )}
                
                {brand.social.instagram && (
                  <a 
                    href={brand.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm hover:underline"
                    style={{ color: brand.colors.textSecondary }}
                  >
                    Instagram
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div 
          className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center"
          style={{ borderColor: brand.colors.border }}
        >
          <p 
            className="text-sm"
            style={{ color: brand.colors.textSecondary }}
          >
            © {new Date().getFullYear()} {brand.companyName}. All rights reserved.
          </p>
          
          {showPlatformCredit && brand.showPlatformBranding && (
            <p 
              className="text-xs mt-2 md:mt-0"
              style={{ color: brand.colors.textSecondary }}
            >
              Powered by{' '}
              <a 
                href="#" 
                className="hover:underline"
                style={{ color: brand.colors.primary }}
              >
                TutorKai
              </a>
            </p>
          )}
        </div>
      </div>
    </footer>
  );
};

/**
 * Branded Loading Spinner
 * Uses tenant's primary color
 */
export interface BrandedSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandedSpinner: React.FC<BrandedSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  const { brand } = useBrand();

  const getSizeClasses = () => {
    const sizes = {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12'
    };
    return sizes[size];
  };

  const sizeClasses = getSizeClasses();

  return (
    <svg 
      className={`animate-spin ${sizeClasses} ${className}`}
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4" 
        className="opacity-25"
        style={{ color: brand?.colors.textSecondary }}
      />
      <path 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
        className="opacity-75"
        style={{ color: brand?.colors.primary }}
      />
    </svg>
  );
};

/**
 * Branded Card Component
 * Uses tenant's surface and border colors
 */
export interface BrandedCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
}

export const BrandedCard: React.FC<BrandedCardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = true
}) => {
  const { brand } = useBrand();

  const getPaddingClasses = () => {
    const paddings = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };
    return paddings[padding];
  };

  const paddingClasses = getPaddingClasses();
  const shadowClasses = shadow ? 'shadow-sm' : '';

  return (
    <div 
      className={`rounded-lg border ${paddingClasses} ${shadowClasses} ${className}`}
      style={{ 
        backgroundColor: brand?.colors.surface,
        borderColor: brand?.colors.border
      }}
    >
      {children}
    </div>
  );
};

export default {
  BrandedLogo,
  BrandedButton,
  BrandedHeader,
  BrandedFooter,
  BrandedSpinner,
  BrandedCard
};