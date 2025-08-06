import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { seoService, SEOPageConfig } from '../services/seoService';
import { useBrand } from '../contexts/BrandContext';
import { logger, LogCategory } from '../lib/logger';

// ===========================================
// SEO HOOK FOR DYNAMIC META TAG MANAGEMENT
// ===========================================

interface UseSEOOptions {
  tenantId?: string;
  customData?: Record<string, any>;
  trackPageView?: boolean;
}

interface SEOState {
  isLoading: boolean;
  seoConfig: SEOPageConfig | null;
  error: string | null;
}

export const useSEO = (options: UseSEOOptions = {}) => {
  const location = useLocation();
  const { brand } = useBrand();
  const [seoState, setSeoState] = useState<SEOState>({
    isLoading: true,
    seoConfig: null,
    error: null
  });

  const { tenantId, customData, trackPageView = true } = options;

  useEffect(() => {
    loadAndApplySEO();
  }, [location.pathname, tenantId]);

  const loadAndApplySEO = async () => {
    try {
      setSeoState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get SEO configuration for current page
      const seoConfig = await seoService.getPageSEO(location.pathname, tenantId);
      
      if (seoConfig) {
        // Apply meta tags to document head
        applyMetaTags(seoConfig, customData);
        
        setSeoState({
          isLoading: false,
          seoConfig,
          error: null
        });
      } else {
        // Apply default meta tags if no specific config found
        applyDefaultMetaTags();
        
        setSeoState({
          isLoading: false,
          seoConfig: null,
          error: null
        });
      }

      // Track page view for analytics
      if (trackPageView) {
        await seoService.trackPageView(
          `${window.location.origin}${location.pathname}`,
          navigator.userAgent,
          document.referrer
        );
      }

    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to load SEO configuration', error as Error);
      setSeoState({
        isLoading: false,
        seoConfig: null,
        error: (error as Error).message
      });

      // Apply fallback meta tags
      applyDefaultMetaTags();
    }
  };

  const applyMetaTags = (config: SEOPageConfig, customData?: Record<string, any>) => {
    try {
      // Process dynamic content in meta tags
      const processedTags = processDynamicContent(config.metaTags, customData);

      // Update document title
      document.title = processedTags.title;

      // Update or create meta tags
      updateMetaTag('description', processedTags.description);
      updateMetaTag('keywords', processedTags.keywords.join(', '));
      updateMetaTag('robots', processedTags.robots || 'index, follow');

      // Open Graph tags
      updateMetaProperty('og:title', processedTags.ogTitle || processedTags.title);
      updateMetaProperty('og:description', processedTags.ogDescription || processedTags.description);
      updateMetaProperty('og:type', processedTags.ogType || 'website');
      updateMetaProperty('og:url', window.location.href);
      
      if (processedTags.ogImage) {
        updateMetaProperty('og:image', processedTags.ogImage);
      }

      // Twitter Card tags
      updateMetaName('twitter:card', processedTags.twitterCard || 'summary_large_image');
      updateMetaName('twitter:title', processedTags.twitterTitle || processedTags.title);
      updateMetaName('twitter:description', processedTags.twitterDescription || processedTags.description);
      
      if (processedTags.twitterImage) {
        updateMetaName('twitter:image', processedTags.twitterImage);
      }

      // Canonical URL
      updateCanonicalLink(processedTags.canonical || window.location.href);

      // Structured data (JSON-LD)
      if (processedTags.schema) {
        updateStructuredData(processedTags.schema);
      }

      // Theme color from brand
      if (brand?.colors.primary) {
        updateMetaName('theme-color', brand.colors.primary);
      }

    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to apply meta tags', error as Error);
    }
  };

  const applyDefaultMetaTags = () => {
    const defaultTitle = brand?.companyName 
      ? `${brand.companyName} - Professional Tutoring Services`
      : 'TutorKai - The Future of Tutoring Business Management';
    
    const defaultDescription = brand?.companyDescription
      ? `${brand.companyDescription} Powered by TutorKai.`
      : 'Revolutionary multi-tenant SaaS platform for tutoring businesses. Manage students, sessions, and grow your tutoring business.';

    document.title = defaultTitle;
    updateMetaTag('description', defaultDescription);
    updateMetaTag('keywords', 'tutoring, education, learning, students, teachers');
    
    updateMetaProperty('og:title', defaultTitle);
    updateMetaProperty('og:description', defaultDescription);
    updateMetaProperty('og:type', 'website');
    updateMetaProperty('og:url', window.location.href);

    updateMetaName('twitter:card', 'summary_large_image');
    updateMetaName('twitter:title', defaultTitle);
    updateMetaName('twitter:description', defaultDescription);

    if (brand?.colors.primary) {
      updateMetaName('theme-color', brand.colors.primary);
    }
  };

  const processDynamicContent = (metaTags: any, customData?: Record<string, any>) => {
    if (!customData) return metaTags;

    const processString = (str: string): string => {
      return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return customData[key] || match;
      });
    };

    return {
      ...metaTags,
      title: processString(metaTags.title),
      description: processString(metaTags.description),
      ogTitle: metaTags.ogTitle ? processString(metaTags.ogTitle) : undefined,
      ogDescription: metaTags.ogDescription ? processString(metaTags.ogDescription) : undefined,
      twitterTitle: metaTags.twitterTitle ? processString(metaTags.twitterTitle) : undefined,
      twitterDescription: metaTags.twitterDescription ? processString(metaTags.twitterDescription) : undefined
    };
  };

  // Helper functions for updating meta tags
  const updateMetaTag = (name: string, content: string) => {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  const updateMetaProperty = (property: string, content: string) => {
    let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  const updateMetaName = (name: string, content: string) => {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  const updateCanonicalLink = (href: string) => {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = href;
  };

  const updateStructuredData = (schema: any) => {
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  };

  // Method to manually update SEO for dynamic content
  const updateSEO = (newMetaTags: Partial<any>, newCustomData?: Record<string, any>) => {
    if (seoState.seoConfig) {
      const updatedConfig = {
        ...seoState.seoConfig,
        metaTags: {
          ...seoState.seoConfig.metaTags,
          ...newMetaTags
        }
      };
      applyMetaTags(updatedConfig, newCustomData || customData);
    }
  };

  // Method to generate page schema for different content types
  const generatePageSchema = (type: 'article' | 'product' | 'person' | 'organization', data: any) => {
    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': type === 'article' ? 'Article' : 
               type === 'product' ? 'Product' :
               type === 'person' ? 'Person' : 'Organization',
      ...data
    };

    updateStructuredData(baseSchema);
    return baseSchema;
  };

  return {
    ...seoState,
    updateSEO,
    generatePageSchema,
    refreshSEO: loadAndApplySEO
  };
};

// Higher-order component for pages that need SEO
export const withSEO = <P extends object>(
  Component: React.ComponentType<P>,
  seoOptions?: UseSEOOptions
) => {
  return (props: P) => {
    useSEO(seoOptions);
    return React.createElement(Component, props);
  };
};

// Hook for tracking specific SEO events
export const useSEOEvents = () => {
  const trackEvent = async (eventType: string, eventData: any) => {
    try {
      // This would integrate with analytics service
      logger.info(LogCategory.ANALYTICS, `SEO Event: ${eventType}`, eventData);
    } catch (error) {
      logger.error(LogCategory.ANALYTICS, 'Failed to track SEO event', error as Error);
    }
  };

  const trackSearchQuery = async (query: string, resultsCount: number) => {
    await trackEvent('search_query', {
      query,
      resultsCount,
      timestamp: new Date().toISOString()
    });
  };

  const trackPageExit = async (timeOnPage: number) => {
    await trackEvent('page_exit', {
      timeOnPage,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  };

  return {
    trackEvent,
    trackSearchQuery,
    trackPageExit
  };
};

export default useSEO;