import React, { useState, useEffect } from 'react';
import {
  Search,
  TrendingUp,
  Globe,
  BarChart3,
  Settings,
  FileText,
  ExternalLink,
  Eye,
  Edit,
  Plus,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Target,
  Map
} from 'lucide-react';
import { BrandedCard, BrandedButton, BrandedSpinner } from '../branding/BrandedComponents';
import { seoService, SEOPageConfig, SEOAnalytics } from '../../services/seoService';
import { logger, LogCategory } from '../../lib/logger';
import toast from 'react-hot-toast';

// ===========================================
// SEO MANAGEMENT DASHBOARD
// ===========================================

interface SEOManagementDashboardProps {
  tenantId?: string;
  tenantName?: string;
}

export const SEOManagementDashboard: React.FC<SEOManagementDashboardProps> = ({
  tenantId,
  tenantName
}) => {
  const [seoPages, setSeoPages] = useState<SEOPageConfig[]>([]);
  const [seoAnalytics, setSeoAnalytics] = useState<SEOAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddPage, setShowAddPage] = useState(false);
  const [editingPage, setEditingPage] = useState<SEOPageConfig | null>(null);

  const [overallAudit, setOverallAudit] = useState<{
    score: number;
    issues: string[];
    recommendations: string[];
  } | null>(null);

  useEffect(() => {
    loadSEOData();
  }, [tenantId]);

  const loadSEOData = async () => {
    try {
      setIsLoading(true);
      
      const [analytics] = await Promise.all([
        seoService.getSEOAnalytics(tenantId, 30)
      ]);
      
      setSeoAnalytics(analytics);
      
      // Run overall audit
      const audit = await seoService.auditPageSEO('/', tenantId);
      setOverallAudit(audit);
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to load SEO data', error as Error);
      toast.error('Failed to load SEO data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSitemap = async () => {
    try {
      const sitemap = await seoService.generateSitemap(tenantId);
      
      // Create download
      const blob = new Blob([sitemap], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sitemap.xml';
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Sitemap generated and downloaded');
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to generate sitemap', error as Error);
      toast.error('Failed to generate sitemap');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* SEO Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BrandedCard padding="lg" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">SEO Performance</h3>
            <BrandedButton variant="outline" size="sm" onClick={loadSEOData}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Run Audit
            </BrandedButton>
          </div>
          
          {overallAudit && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-4xl font-bold ${getScoreColor(overallAudit.score)}`}>
                    {overallAudit.score}
                  </div>
                  <p className="text-sm text-gray-500">Overall SEO Score</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${getScoreBadgeColor(overallAudit.score)}`}>
                  {overallAudit.score >= 90 ? 'Excellent' : 
                   overallAudit.score >= 70 ? 'Good' : 'Needs Work'}
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    overallAudit.score >= 90 ? 'bg-green-500' :
                    overallAudit.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${overallAudit.score}%` }}
                />
              </div>
              
              {overallAudit.issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-3">Issues to Fix</h4>
                  <div className="space-y-2">
                    {overallAudit.issues.slice(0, 3).map((issue, index) => (
                      <div key={index} className="flex items-start">
                        <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{issue}</span>
                      </div>
                    ))}
                    {overallAudit.issues.length > 3 && (
                      <p className="text-sm text-gray-500 ml-6">
                        +{overallAudit.issues.length - 3} more issues
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </BrandedCard>

        <div className="space-y-6">
          <BrandedCard padding="md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Page Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {seoAnalytics.reduce((sum, page) => sum + (page.impressions || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </BrandedCard>

          <BrandedCard padding="md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. CTR</p>
                <p className="text-2xl font-bold text-gray-900">
                  {seoAnalytics.length > 0 
                    ? (seoAnalytics.reduce((sum, page) => sum + page.ctr, 0) / seoAnalytics.length).toFixed(1)
                    : '0.0'}%
                </p>
              </div>
            </div>
          </BrandedCard>

          <BrandedCard padding="md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Position</p>
                <p className="text-2xl font-bold text-gray-900">
                  {seoAnalytics.length > 0 
                    ? (seoAnalytics.reduce((sum, page) => sum + page.avgPosition, 0) / seoAnalytics.length).toFixed(1)
                    : '0.0'}
                </p>
              </div>
            </div>
          </BrandedCard>
        </div>
      </div>

      {/* Top Performing Pages */}
      <BrandedCard>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Pages</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impressions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {seoAnalytics.slice(0, 5).map((page, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {page.pageTitle}
                          </div>
                          <div className="text-sm text-gray-500">
                            {page.pageUrl}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {page.impressions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {page.clicks.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        page.ctr >= 5 ? 'bg-green-100 text-green-800' :
                        page.ctr >= 2 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {page.ctr.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {page.avgPosition.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => window.open(page.pageUrl, '_blank')}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {seoAnalytics.length === 0 && (
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  SEO analytics will appear here once data is collected.
                </p>
              </div>
            )}
          </div>
        </div>
      </BrandedCard>
    </div>
  );

  const renderPagesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">SEO Page Management</h3>
          <p className="text-sm text-gray-500">
            Manage meta tags, titles, and descriptions for all pages
          </p>
        </div>
        <BrandedButton onClick={() => setShowAddPage(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Page
        </BrandedButton>
      </div>

      <BrandedCard>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {seoPages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {page.metaTags.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {page.pagePath}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                        {page.pageType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {page.priority}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        page.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {page.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(page.lastModified).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingPage(page)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => window.open(page.pagePath, '_blank')}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {seoPages.length === 0 && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pages configured</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add your first page to start managing SEO.
                </p>
                <div className="mt-6">
                  <BrandedButton onClick={() => setShowAddPage(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Page
                  </BrandedButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </BrandedCard>
    </div>
  );

  const renderToolsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BrandedCard padding="lg">
          <div className="text-center">
            <Map className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Sitemap</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create an XML sitemap for search engines
            </p>
            <BrandedButton onClick={generateSitemap} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Generate Sitemap
            </BrandedButton>
          </div>
        </BrandedCard>

        <BrandedCard padding="lg">
          <div className="text-center">
            <Search className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">SEO Audit</h3>
            <p className="text-sm text-gray-500 mb-4">
              Run comprehensive SEO analysis
            </p>
            <BrandedButton onClick={loadSEOData} className="w-full">
              <BarChart3 className="h-4 w-4 mr-2" />
              Run Full Audit
            </BrandedButton>
          </div>
        </BrandedCard>

        <BrandedCard padding="lg">
          <div className="text-center">
            <Globe className="mx-auto h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Robots.txt</h3>
            <p className="text-sm text-gray-500 mb-4">
              Configure search engine crawling
            </p>
            <BrandedButton variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </BrandedButton>
          </div>
        </BrandedCard>
      </div>

      {/* Quick Tips */}
      <BrandedCard>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Quick Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Title Tags</h4>
                  <p className="text-sm text-gray-600">Keep titles between 50-60 characters</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Meta Descriptions</h4>
                  <p className="text-sm text-gray-600">Write compelling descriptions under 160 characters</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Keywords</h4>
                  <p className="text-sm text-gray-600">Focus on 3-5 relevant keywords per page</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Structured Data</h4>
                  <p className="text-sm text-gray-600">Add Schema.org markup for better visibility</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Page Speed</h4>
                  <p className="text-sm text-gray-600">Aim for loading times under 3 seconds</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Mobile Friendly</h4>
                  <p className="text-sm text-gray-600">Ensure responsive design for all devices</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BrandedCard>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'pages', label: 'Pages', icon: FileText },
    { id: 'keywords', label: 'Keywords', icon: Target },
    { id: 'tools', label: 'Tools', icon: Settings }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <BrandedSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SEO Management</h1>
          <p className="text-gray-600 mt-2">
            Optimize search engine visibility for {tenantName || 'TutorKai'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <BrandedButton variant="outline" onClick={generateSitemap}>
            <Download className="h-4 w-4 mr-2" />
            Download Sitemap
          </BrandedButton>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'pages' && renderPagesTab()}
      {activeTab === 'keywords' && (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Keyword tracking coming soon</h3>
          <p className="mt-1 text-sm text-gray-500">
            Keyword ranking and tracking features will be available here.
          </p>
        </div>
      )}
      {activeTab === 'tools' && renderToolsTab()}
    </div>
  );
};

export default SEOManagementDashboard;