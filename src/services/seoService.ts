import { supabase } from '../lib/supabase';
import { logger, LogCategory } from '../lib/logger';

// ===========================================
// SEO OPTIMIZATION SERVICE
// ===========================================

export interface SEOMetaTags {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  robots?: string;
  schema?: any; // JSON-LD structured data
}

export interface SEOPageConfig {
  id: string;
  tenantId?: string;
  pagePath: string;
  pageType: 'landing' | 'product' | 'blog' | 'profile' | 'search' | 'dynamic';
  metaTags: SEOMetaTags;
  isActive: boolean;
  priority: number; // For sitemap
  changeFreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastModified: string;
}

export interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: string;
  priority: number;
}

export interface SEOAnalytics {
  pageUrl: string;
  pageTitle: string;
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
  topQueries: string[];
  topCountries: string[];
  lastUpdated: string;
}

class SEOService {
  
  // ===========================================
  // META TAGS MANAGEMENT
  // ===========================================
  
  async updatePageSEO(pageConfig: Omit<SEOPageConfig, 'id' | 'lastModified'>): Promise<SEOPageConfig> {
    try {
      const { data, error } = await supabase
        .from('seo_page_configs')
        .upsert({
          tenant_id: pageConfig.tenantId,
          page_path: pageConfig.pagePath,
          page_type: pageConfig.pageType,
          meta_tags: pageConfig.metaTags,
          is_active: pageConfig.isActive,
          priority: pageConfig.priority,
          change_freq: pageConfig.changeFreq,
          last_modified: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      logger.info(LogCategory.SYSTEM, 'SEO page config updated', {
        tenantId: pageConfig.tenantId,
        pagePath: pageConfig.pagePath
      });

      return this.mapSEOPageConfig(data);
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to update page SEO', error as Error);
      throw error;
    }
  }

  async getPageSEO(pagePath: string, tenantId?: string): Promise<SEOPageConfig | null> {
    try {
      let query = supabase
        .from('seo_page_configs')
        .select('*')
        .eq('page_path', pagePath)
        .eq('is_active', true);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      } else {
        query = query.is('tenant_id', null);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') throw error;

      return data ? this.mapSEOPageConfig(data) : null;
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get page SEO', error as Error);
      return null;
    }
  }

  generateMetaTags(config: SEOPageConfig, customData?: any): string {
    const { metaTags } = config;
    
    // Replace dynamic variables in meta tags
    const processedTags = this.processDynamicContent(metaTags, customData);
    
    return `
      <title>${processedTags.title}</title>
      <meta name="description" content="${processedTags.description}" />
      <meta name="keywords" content="${processedTags.keywords.join(', ')}" />
      ${processedTags.canonical ? `<link rel="canonical" href="${processedTags.canonical}" />` : ''}
      <meta name="robots" content="${processedTags.robots || 'index, follow'}" />
      
      <!-- Open Graph -->
      <meta property="og:title" content="${processedTags.ogTitle || processedTags.title}" />
      <meta property="og:description" content="${processedTags.ogDescription || processedTags.description}" />
      <meta property="og:type" content="${processedTags.ogType || 'website'}" />
      ${processedTags.ogImage ? `<meta property="og:image" content="${processedTags.ogImage}" />` : ''}
      
      <!-- Twitter Card -->
      <meta name="twitter:card" content="${processedTags.twitterCard || 'summary_large_image'}" />
      <meta name="twitter:title" content="${processedTags.twitterTitle || processedTags.title}" />
      <meta name="twitter:description" content="${processedTags.twitterDescription || processedTags.description}" />
      ${processedTags.twitterImage ? `<meta name="twitter:image" content="${processedTags.twitterImage}" />` : ''}
      
      <!-- JSON-LD Structured Data -->
      ${processedTags.schema ? `<script type="application/ld+json">${JSON.stringify(processedTags.schema)}</script>` : ''}
    `.trim();
  }

  // ===========================================
  // SITEMAP GENERATION
  // ===========================================
  
  async generateSitemap(tenantId?: string): Promise<string> {
    try {
      const entries = await this.getSitemapEntries(tenantId);
      
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

      // Store sitemap for caching
      await this.storeSitemap(sitemapXml, tenantId);

      return sitemapXml;
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to generate sitemap', error as Error);
      throw error;
    }
  }

  private async getSitemapEntries(tenantId?: string): Promise<SitemapEntry[]> {
    try {
      let query = supabase
        .from('seo_page_configs')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      } else {
        query = query.is('tenant_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      const baseUrl = tenantId ? await this.getTenantBaseUrl(tenantId) : 'https://tutorkai.com';

      return data.map((config: any) => ({
        url: `${baseUrl}${config.page_path}`,
        lastmod: config.last_modified.split('T')[0], // ISO date format
        changefreq: config.change_freq,
        priority: config.priority
      }));
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get sitemap entries', error as Error);
      return [];
    }
  }

  // ===========================================
  // STRUCTURED DATA (SCHEMA.ORG)
  // ===========================================
  
  generateBusinessSchema(tenantData: {
    name: string;
    description: string;
    url: string;
    email: string;
    phone?: string;
    address?: any;
    logo?: string;
  }): any {
    return {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": tenantData.name,
      "description": tenantData.description,
      "url": tenantData.url,
      "email": tenantData.email,
      "telephone": tenantData.phone,
      "logo": tenantData.logo,
      "address": tenantData.address ? {
        "@type": "PostalAddress",
        "streetAddress": tenantData.address.street,
        "addressLocality": tenantData.address.city,
        "addressRegion": tenantData.address.state,
        "postalCode": tenantData.address.zipCode,
        "addressCountry": tenantData.address.country
      } : undefined,
      "serviceType": "Tutoring Services",
      "areaServed": "Global",
      "availableLanguage": ["English"]
    };
  }

  generateCourseSchema(courseData: {
    name: string;
    description: string;
    provider: string;
    category: string;
    duration?: string;
    price?: number;
    currency?: string;
  }): any {
    return {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": courseData.name,
      "description": courseData.description,
      "provider": {
        "@type": "Organization",
        "name": courseData.provider
      },
      "category": courseData.category,
      "timeRequired": courseData.duration,
      "offers": courseData.price ? {
        "@type": "Offer",
        "price": courseData.price,
        "priceCurrency": courseData.currency || "USD"
      } : undefined
    };
  }

  generatePersonSchema(tutorData: {
    name: string;
    email: string;
    bio: string;
    subjects: string[];
    rating?: number;
    reviewCount?: number;
    image?: string;
  }): any {
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": tutorData.name,
      "email": tutorData.email,
      "description": tutorData.bio,
      "image": tutorData.image,
      "knowsAbout": tutorData.subjects,
      "aggregateRating": tutorData.rating ? {
        "@type": "AggregateRating",
        "ratingValue": tutorData.rating,
        "reviewCount": tutorData.reviewCount || 0
      } : undefined,
      "jobTitle": "Tutor",
      "hasOccupation": {
        "@type": "Occupation",
        "name": "Education Professional"
      }
    };
  }

  // ===========================================
  // SEO ANALYTICS
  // ===========================================
  
  async trackPageView(pageUrl: string, userAgent?: string, referer?: string): Promise<void> {
    try {
      await supabase
        .from('seo_analytics')
        .insert({
          page_url: pageUrl,
          user_agent: userAgent,
          referer: referer,
          viewed_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to track page view', error as Error);
      // Don't throw - analytics shouldn't break user experience
    }
  }

  async getSEOAnalytics(tenantId?: string, days: number = 30): Promise<SEOAnalytics[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // This would integrate with Google Search Console API in production
      // For now, return mock data structure
      return [
        {
          pageUrl: '/',
          pageTitle: 'TutorKai - The Future of Tutoring Business Management',
          impressions: 1250,
          clicks: 89,
          ctr: 7.12,
          avgPosition: 8.5,
          topQueries: ['tutoring software', 'tutor management system', 'online tutoring platform'],
          topCountries: ['United States', 'United Kingdom', 'Canada'],
          lastUpdated: new Date().toISOString()
        }
      ];
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get SEO analytics', error as Error);
      return [];
    }
  }

  // ===========================================
  // SEO OPTIMIZATION RECOMMENDATIONS
  // ===========================================
  
  async auditPageSEO(pageUrl: string, tenantId?: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const issues: string[] = [];
      const recommendations: string[] = [];
      let score = 100;

      const seoConfig = await this.getPageSEO(pageUrl, tenantId);
      
      if (!seoConfig) {
        issues.push('No SEO configuration found for this page');
        recommendations.push('Add SEO meta tags configuration');
        score -= 30;
      } else {
        // Check title length
        if (seoConfig.metaTags.title.length < 30 || seoConfig.metaTags.title.length > 60) {
          issues.push('Title length should be between 30-60 characters');
          recommendations.push('Optimize title length for search engines');
          score -= 10;
        }

        // Check description length
        if (seoConfig.metaTags.description.length < 120 || seoConfig.metaTags.description.length > 160) {
          issues.push('Description length should be between 120-160 characters');
          recommendations.push('Optimize meta description length');
          score -= 10;
        }

        // Check keywords
        if (seoConfig.metaTags.keywords.length === 0) {
          issues.push('No keywords defined');
          recommendations.push('Add relevant keywords for the page');
          score -= 15;
        }

        // Check Open Graph tags
        if (!seoConfig.metaTags.ogTitle || !seoConfig.metaTags.ogDescription) {
          issues.push('Missing Open Graph tags');
          recommendations.push('Add Open Graph tags for social media sharing');
          score -= 10;
        }

        // Check structured data
        if (!seoConfig.metaTags.schema) {
          issues.push('No structured data found');
          recommendations.push('Add JSON-LD structured data for better search visibility');
          score -= 15;
        }
      }

      return {
        score: Math.max(0, score),
        issues,
        recommendations
      };
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to audit page SEO', error as Error);
      throw error;
    }
  }

  // ===========================================
  // HELPER METHODS
  // ===========================================
  
  private processDynamicContent(metaTags: SEOMetaTags, customData?: any): SEOMetaTags {
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
  }

  private async getTenantBaseUrl(tenantId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('custom_domain, subdomain, slug')
        .eq('id', tenantId)
        .single();

      if (error) throw error;

      if (data.custom_domain) {
        return `https://${data.custom_domain}`;
      } else if (data.subdomain) {
        return `https://${data.subdomain}.tutorkai.com`;
      } else {
        return `https://${data.slug}.tutorkai.com`;
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get tenant base URL', error as Error);
      return 'https://tutorkai.com';
    }
  }

  private async storeSitemap(sitemapXml: string, tenantId?: string): Promise<void> {
    try {
      await supabase
        .from('seo_sitemaps')
        .upsert({
          tenant_id: tenantId,
          sitemap_xml: sitemapXml,
          generated_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to store sitemap', error as Error);
    }
  }

  private mapSEOPageConfig(data: any): SEOPageConfig {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      pagePath: data.page_path,
      pageType: data.page_type,
      metaTags: data.meta_tags,
      isActive: data.is_active,
      priority: data.priority,
      changeFreq: data.change_freq,
      lastModified: data.last_modified
    };
  }

  // ===========================================
  // TENANT-SPECIFIC SEO DEFAULTS
  // ===========================================
  
  async initializeTenantSEO(tenantId: string, tenantData: {
    name: string;
    description: string;
    domain?: string;
  }): Promise<void> {
    try {
      const baseUrl = tenantData.domain || `https://${tenantId}.tutorkai.com`;
      
      const defaultPages = [
        {
          pagePath: '/',
          pageType: 'landing' as const,
          metaTags: {
            title: `${tenantData.name} - Professional Tutoring Services`,
            description: `${tenantData.description} Professional tutoring services powered by TutorKai.`,
            keywords: ['tutoring', 'education', 'learning', tenantData.name.toLowerCase()],
            canonical: baseUrl,
            ogTitle: `${tenantData.name} - Professional Tutoring Services`,
            ogDescription: `${tenantData.description} Professional tutoring services.`,
            ogType: 'website',
            schema: this.generateBusinessSchema({
              name: tenantData.name,
              description: tenantData.description,
              url: baseUrl,
              email: 'info@example.com' // Would be from tenant data
            })
          },
          isActive: true,
          priority: 1.0,
          changeFreq: 'monthly' as const
        },
        {
          pagePath: '/tutors',
          pageType: 'product' as const,
          metaTags: {
            title: `Our Tutors - ${tenantData.name}`,
            description: `Meet our qualified tutors at ${tenantData.name}. Expert educators ready to help you succeed.`,
            keywords: ['tutors', 'teachers', 'educators', tenantData.name.toLowerCase()],
            canonical: `${baseUrl}/tutors`
          },
          isActive: true,
          priority: 0.8,
          changeFreq: 'weekly' as const
        },
        {
          pagePath: '/about',
          pageType: 'product' as const,
          metaTags: {
            title: `About ${tenantData.name} - Our Story`,
            description: `Learn about ${tenantData.name} and our mission to provide excellent tutoring services.`,
            keywords: ['about', 'story', 'mission', tenantData.name.toLowerCase()],
            canonical: `${baseUrl}/about`
          },
          isActive: true,
          priority: 0.6,
          changeFreq: 'monthly' as const
        }
      ];

      for (const pageConfig of defaultPages) {
        await this.updatePageSEO({
          tenantId,
          ...pageConfig
        });
      }

      logger.info(LogCategory.SYSTEM, 'Tenant SEO initialized', { tenantId });
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to initialize tenant SEO', error as Error);
      throw error;
    }
  }
}

export const seoService = new SEOService();
export default seoService;