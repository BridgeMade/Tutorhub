import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Check,
  X,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Settings,
  Shield
} from 'lucide-react';
import { BrandedCard, BrandedButton, BrandedSpinner } from '../branding/BrandedComponents';
import { domainRoutingService, DomainConfig } from '../../services/domainRoutingService';
import { logger, LogCategory } from '../../lib/logger';
import toast from 'react-hot-toast';

// ===========================================
// DOMAIN MANAGEMENT COMPONENT
// ===========================================

interface DomainManagementProps {
  tenantId: string;
  tenantName: string;
  onDomainConfigured?: (config: DomainConfig) => void;
}

export const DomainManagement: React.FC<DomainManagementProps> = ({
  tenantId,
  tenantName,
  onDomainConfigured
}) => {
  const [domains, setDomains] = useState<{
    customDomain?: string;
    subdomain?: string;
    defaultDomain: string;
    allDomains: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [subdomainInput, setSubdomainInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<{
    [domain: string]: 'pending' | 'verified' | 'failed';
  }>({});

  useEffect(() => {
    loadDomains();
  }, [tenantId]);

  const loadDomains = async () => {
    try {
      setIsLoading(true);
      const domainsData = await domainRoutingService.getTenantDomains(tenantId);
      setDomains(domainsData);
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to load domains', error as Error);
      toast.error('Failed to load domain configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const validateDomain = async (domain: string) => {
    if (!domain.trim()) {
      setValidationResults(null);
      return;
    }

    setIsValidating(true);
    try {
      const results = await domainRoutingService.validateDomain(domain);
      setValidationResults(results);
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Domain validation failed', error as Error);
      setValidationResults({
        isValid: false,
        isAvailable: false,
        errors: ['Validation failed']
      });
    } finally {
      setIsValidating(false);
    }
  };

  const configureDomain = async () => {
    if (!domainInput.trim() && !subdomainInput.trim()) {
      toast.error('Please enter a domain or subdomain');
      return;
    }

    setIsConfiguring(true);
    try {
      const config = await domainRoutingService.configureDomain(tenantId, {
        customDomain: domainInput.trim() || undefined,
        subdomain: subdomainInput.trim() || undefined
      });

      toast.success('Domain configured successfully!');
      setShowAddDomain(false);
      setDomainInput('');
      setSubdomainInput('');
      setValidationResults(null);
      loadDomains();
      
      if (onDomainConfigured) {
        onDomainConfigured(config);
      }
    } catch (error: any) {
      logger.error(LogCategory.SYSTEM, 'Failed to configure domain', error);
      toast.error(error.message || 'Failed to configure domain');
    } finally {
      setIsConfiguring(false);
    }
  };

  const verifyDomain = async (domain: string) => {
    try {
      setVerificationStatus(prev => ({ ...prev, [domain]: 'pending' }));
      
      const result = await domainRoutingService.verifyDomain(tenantId, domain);
      
      if (result.isVerified) {
        setVerificationStatus(prev => ({ ...prev, [domain]: 'verified' }));
        toast.success(`Domain ${domain} verified successfully!`);
        loadDomains();
      } else {
        setVerificationStatus(prev => ({ ...prev, [domain]: 'failed' }));
        toast.error(`Domain verification failed: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Domain verification failed', error as Error);
      setVerificationStatus(prev => ({ ...prev, [domain]: 'failed' }));
      toast.error('Domain verification failed');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getDomainStatus = (domain: string) => {
    const status = verificationStatus[domain];
    if (status === 'verified') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Check className="h-3 w-3 mr-1" />
          Verified
        </span>
      );
    } else if (status === 'failed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <X className="h-3 w-3 mr-1" />
          Failed
        </span>
      );
    } else if (status === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Verifying
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pending
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <BrandedSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Domain Management</h2>
          <p className="text-gray-600 mt-1">
            Configure custom domains and subdomains for {tenantName}
          </p>
        </div>
        <BrandedButton onClick={() => setShowAddDomain(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Domain
        </BrandedButton>
      </div>

      {/* Current Domains */}
      <BrandedCard>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Active Domains</h3>
          
          <div className="space-y-4">
            {domains?.allDomains.map((domain, index) => {
              const isCustom = domain === domains.customDomain;
              const isSubdomain = domain.includes('.tutorkai.com') && domain !== domains.defaultDomain;
              const isDefault = domain === domains.defaultDomain;
              
              return (
                <div key={domain} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{domain}</span>
                        {isDefault && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            Default
                          </span>
                        )}
                        {isCustom && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                            Custom
                          </span>
                        )}
                        {isSubdomain && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            Subdomain
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {isCustom && 'Custom domain with SSL certificate'}
                        {isSubdomain && 'TutorKai subdomain'}
                        {isDefault && 'Default platform domain'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getDomainStatus(domain)}
                    
                    <button
                      onClick={() => copyToClipboard(`https://${domain}`)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded"
                      title="Copy URL"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => window.open(`https://${domain}`, '_blank')}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded"
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    
                    {isCustom && verificationStatus[domain] !== 'verified' && (
                      <BrandedButton
                        variant="outline"
                        size="sm"
                        onClick={() => verifyDomain(domain)}
                        disabled={verificationStatus[domain] === 'pending'}
                      >
                        {verificationStatus[domain] === 'pending' ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Verify
                          </>
                        )}
                      </BrandedButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </BrandedCard>

      {/* Add Domain Modal */}
      {showAddDomain && (
        <BrandedCard>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Domain</h3>
              <button
                onClick={() => {
                  setShowAddDomain(false);
                  setDomainInput('');
                  setSubdomainInput('');
                  setValidationResults(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Custom Domain */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Domain
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={domainInput}
                    onChange={(e) => {
                      setDomainInput(e.target.value);
                      validateDomain(e.target.value);
                    }}
                    placeholder="yourcompany.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {isValidating && <BrandedSpinner size="sm" />}
                </div>
                
                {validationResults && (
                  <div className="mt-2">
                    {validationResults.isValid && validationResults.isAvailable ? (
                      <p className="text-sm text-green-600 flex items-center">
                        <Check className="h-4 w-4 mr-1" />
                        Domain is available and valid
                      </p>
                    ) : (
                      <div className="text-sm text-red-600">
                        {validationResults.errors?.map((error: string, index: number) => (
                          <p key={index} className="flex items-center">
                            <X className="h-4 w-4 mr-1" />
                            {error}
                          </p>
                        ))}
                        {validationResults.suggestions && (
                          <div className="mt-2">
                            <p className="font-medium">Suggestions:</p>
                            {validationResults.suggestions.map((suggestion: string, index: number) => (
                              <button
                                key={index}
                                onClick={() => setDomainInput(suggestion)}
                                className="block text-indigo-600 hover:text-indigo-800 underline"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subdomain */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TutorKai Subdomain
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={subdomainInput}
                    onChange={(e) => setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="yourcompany"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-gray-500">.tutorkai.com</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Choose a unique subdomain for your organization
                </p>
              </div>

              {/* DNS Instructions for Custom Domain */}
              {domainInput && validationResults?.isValid && validationResults?.isAvailable && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">DNS Configuration Required</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Add these DNS records to your domain provider:
                  </p>
                  <div className="space-y-2 text-sm font-mono">
                    <div className="flex items-center justify-between bg-white p-2 rounded border">
                      <span>CNAME {domainInput} → proxy.tutorkai.com</span>
                      <button
                        onClick={() => copyToClipboard('proxy.tutorkai.com')}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t">
                <BrandedButton
                  onClick={configureDomain}
                  disabled={Boolean(isConfiguring || (!domainInput.trim() && !subdomainInput.trim()) || 
                           (domainInput.trim() && (!validationResults?.isValid || !validationResults?.isAvailable)))}
                >
                  {isConfiguring ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Configuring...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Domain
                    </>
                  )}
                </BrandedButton>
                
                <BrandedButton
                  variant="outline"
                  onClick={() => {
                    setShowAddDomain(false);
                    setDomainInput('');
                    setSubdomainInput('');
                    setValidationResults(null);
                  }}
                >
                  Cancel
                </BrandedButton>
              </div>
            </div>
          </div>
        </BrandedCard>
      )}
    </div>
  );
};

export default DomainManagement;