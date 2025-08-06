import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileText,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Trash2,
  Eye,
  Settings,
  BarChart3,
  Calendar
} from 'lucide-react';
import { BrandedCard, BrandedButton, BrandedSpinner } from '../branding/BrandedComponents';
import { dataPrivacyService, PrivacySettings, DataSubjectRequest } from '../../services/dataPrivacyService';
import { logger, LogCategory } from '../../lib/logger';
import toast from 'react-hot-toast';

// ===========================================
// PRIVACY COMPLIANCE DASHBOARD
// ===========================================

interface PrivacyComplianceDashboardProps {
  tenantId: string;
  tenantName: string;
}

export const PrivacyComplianceDashboard: React.FC<PrivacyComplianceDashboardProps> = ({
  tenantId,
  tenantName
}) => {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [dataSubjectRequests, setDataSubjectRequests] = useState<DataSubjectRequest[]>([]);
  const [complianceAudit, setComplianceAudit] = useState<{
    score: number;
    issues: string[];
    recommendations: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadPrivacyData();
  }, [tenantId]);

  const loadPrivacyData = async () => {
    try {
      setIsLoading(true);
      
      const [settings, audit] = await Promise.all([
        dataPrivacyService.getPrivacySettings(tenantId),
        dataPrivacyService.auditPrivacyCompliance(tenantId)
      ]);
      
      setPrivacySettings(settings);
      setComplianceAudit(audit);
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to load privacy data', error as Error);
      toast.error('Failed to load privacy compliance data');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePrivacySettings = async (updates: Partial<PrivacySettings>) => {
    try {
      await dataPrivacyService.updatePrivacySettings(tenantId, updates);
      setPrivacySettings(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Privacy settings updated successfully');
    } catch (error) {
      logger.error(LogCategory.PRIVACY, 'Failed to update privacy settings', error as Error);
      toast.error('Failed to update privacy settings');
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRequestStatusBadge = (status: DataSubjectRequest['status']) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return badges[status] || badges.pending;
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Compliance Score */}
      <BrandedCard>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Privacy Compliance Score</h3>
            <Shield className="h-6 w-6 text-indigo-600" />
          </div>
          
          {complianceAudit && (
            <div className="space-y-4">
              <div className="flex items-center">
                <div className={`text-3xl font-bold ${getComplianceColor(complianceAudit.score).split(' ')[0]}`}>
                  {complianceAudit.score}%
                </div>
                <div className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${getComplianceColor(complianceAudit.score)}`}>
                  {complianceAudit.score >= 90 ? 'Excellent' : 
                   complianceAudit.score >= 70 ? 'Good' : 'Needs Improvement'}
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    complianceAudit.score >= 90 ? 'bg-green-600' :
                    complianceAudit.score >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${complianceAudit.score}%` }}
                />
              </div>
              
              {complianceAudit.issues.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-red-600 mb-2">Issues to Address:</h4>
                  <ul className="space-y-1">
                    {complianceAudit.issues.map((issue, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-600">
                        <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {complianceAudit.recommendations.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-blue-600 mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {complianceAudit.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </BrandedCard>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BrandedCard padding="md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Data Subject Requests</p>
              <p className="text-2xl font-bold text-gray-900">{dataSubjectRequests.length}</p>
            </div>
          </div>
        </BrandedCard>

        <BrandedCard padding="md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Consents</p>
              <p className="text-2xl font-bold text-gray-900">0</p> {/* Would fetch from service */}
            </div>
          </div>
        </BrandedCard>

        <BrandedCard padding="md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Retention Period</p>
              <p className="text-2xl font-bold text-gray-900">
                {privacySettings?.dataRetentionDefaultMonths || 24}m
              </p>
            </div>
          </div>
        </BrandedCard>
      </div>

      {/* Regulation Compliance Status */}
      <BrandedCard>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Regulation Compliance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">GDPR</p>
                <p className="text-sm text-gray-500">European Union</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                privacySettings?.gdprEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {privacySettings?.gdprEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">POPI</p>
                <p className="text-sm text-gray-500">South Africa</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                privacySettings?.popiEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {privacySettings?.popiEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">CCPA</p>
                <p className="text-sm text-gray-500">California, USA</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                privacySettings?.ccpaEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {privacySettings?.ccpaEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
        </div>
      </BrandedCard>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <BrandedCard>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Privacy Settings</h3>
          
          <div className="space-y-6">
            {/* Regulation Compliance */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Regulation Compliance</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={privacySettings?.gdprEnabled || false}
                    onChange={(e) => updatePrivacySettings({ gdprEnabled: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable GDPR compliance (EU)</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={privacySettings?.popiEnabled || false}
                    onChange={(e) => updatePrivacySettings({ popiEnabled: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable POPI compliance (South Africa)</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={privacySettings?.ccpaEnabled || false}
                    onChange={(e) => updatePrivacySettings({ ccpaEnabled: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable CCPA compliance (California, USA)</span>
                </label>
              </div>
            </div>

            {/* Data Retention */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Data Retention</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Retention Period (months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={privacySettings?.dataRetentionDefaultMonths || 24}
                    onChange={(e) => updatePrivacySettings({ 
                      dataRetentionDefaultMonths: parseInt(e.target.value) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="flex items-center h-full">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={privacySettings?.automaticDataDeletion || false}
                      onChange={(e) => updatePrivacySettings({ automaticDataDeletion: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable automatic data deletion</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Data Protection Officer</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DPO Email Address
                  </label>
                  <input
                    type="email"
                    value={privacySettings?.dataProtectionOfficerEmail || ''}
                    onChange={(e) => updatePrivacySettings({ 
                      dataProtectionOfficerEmail: e.target.value 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="dpo@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Privacy Documentation */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Privacy Documentation</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Privacy Policy URL
                  </label>
                  <input
                    type="url"
                    value={privacySettings?.privacyPolicyUrl || ''}
                    onChange={(e) => updatePrivacySettings({ privacyPolicyUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://yourcompany.com/privacy"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cookie Policy URL
                  </label>
                  <input
                    type="url"
                    value={privacySettings?.cookiePolicyUrl || ''}
                    onChange={(e) => updatePrivacySettings({ cookiePolicyUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://yourcompany.com/cookies"
                  />
                </div>
              </div>
            </div>

            {/* Consent Management */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Consent Management</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={privacySettings?.consentBannerEnabled || false}
                    onChange={(e) => updatePrivacySettings({ consentBannerEnabled: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable consent banner</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={privacySettings?.consentWithdrawalEnabled || false}
                    onChange={(e) => updatePrivacySettings({ consentWithdrawalEnabled: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow consent withdrawal</span>
                </label>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consent Banner Text
                  </label>
                  <textarea
                    value={privacySettings?.consentBannerText || ''}
                    onChange={(e) => updatePrivacySettings({ consentBannerText: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="We use cookies and collect data to improve your experience."
                  />
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
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'requests', label: 'Data Requests', icon: FileText },
    { id: 'audit', label: 'Audit Log', icon: Eye }
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
          <h1 className="text-3xl font-bold text-gray-900">Privacy Compliance</h1>
          <p className="text-gray-600 mt-2">
            GDPR, POPI, and CCPA compliance management for {tenantName}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <BrandedButton variant="outline" onClick={loadPrivacyData}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Run Audit
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
      {activeTab === 'settings' && renderSettingsTab()}
      {activeTab === 'requests' && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data subject requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            Data subject requests will appear here when users submit them.
          </p>
        </div>
      )}
      {activeTab === 'audit' && (
        <div className="text-center py-12">
          <Eye className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Audit log coming soon</h3>
          <p className="mt-1 text-sm text-gray-500">
            Privacy audit logs will be displayed here.
          </p>
        </div>
      )}
    </div>
  );
};

export default PrivacyComplianceDashboard;