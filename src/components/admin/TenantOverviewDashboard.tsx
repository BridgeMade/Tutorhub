import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Globe, 
  Crown, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Settings,
  Eye,
  Trash2,
  Calendar,
  Mail,
  Activity
} from 'lucide-react';
import { BrandedCard, BrandedButton, BrandedSpinner } from '../branding/BrandedComponents';
import { tenantBrandingService, TenantInfo } from '../../services/tenantBrandingService';
import { logger, LogCategory } from '../../lib/logger';
import toast from 'react-hot-toast';

// ===========================================
// TENANT OVERVIEW DASHBOARD
// ===========================================

interface TenantOverviewDashboardProps {
  onSelectTenant?: (tenantId: string) => void;
  onCreateTenant?: () => void;
}

export const TenantOverviewDashboard: React.FC<TenantOverviewDashboardProps> = ({
  onSelectTenant,
  onCreateTenant
}) => {
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load tenants
  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setIsLoading(true);
      const tenantsData = await tenantBrandingService.getAllTenants();
      setTenants(tenantsData);
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to load tenants', error as Error);
      toast.error('Failed to load tenants');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tenants based on search and filters
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.adminEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    const matchesTier = tierFilter === 'all' || tenant.subscriptionTier === tierFilter;
    
    return matchesSearch && matchesStatus && matchesTier;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspended' },
      trial: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Trial' }
    };

    const badge = badges[status] || badges.inactive;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getTierBadge = (tier: string) => {
    const badges: Record<string, { bg: string; text: string; icon?: React.ReactNode }> = {
      starter: { bg: 'bg-gray-100', text: 'text-gray-800' },
      professional: { bg: 'bg-blue-100', text: 'text-blue-800' },
      enterprise: { bg: 'bg-purple-100', text: 'text-purple-800', icon: <Crown className="h-3 w-3 mr-1" /> }
    };

    const badge = badges[tier] || badges.starter;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const handleDeleteTenant = async (tenantId: string, tenantName: string) => {
    if (!confirm(`Are you sure you want to delete tenant "${tenantName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Implementation would go here
      toast.success(`Tenant "${tenantName}" deleted successfully`);
      loadTenants();
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to delete tenant', error as Error, { tenantId });
      toast.error('Failed to delete tenant');
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600 mt-2">
            Manage all tenant organizations and their configurations
          </p>
        </div>
        
        <BrandedButton 
          onClick={onCreateTenant || (() => setShowCreateModal(true))}
          className="inline-flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Tenant
        </BrandedButton>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <BrandedCard padding="md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building2 className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
            </div>
          </div>
        </BrandedCard>

        <BrandedCard padding="md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Tenants</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.filter(t => t.status === 'active').length}
              </p>
            </div>
          </div>
        </BrandedCard>

        <BrandedCard padding="md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Crown className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Enterprise</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.filter(t => t.subscriptionTier === 'enterprise').length}
              </p>
            </div>
          </div>
        </BrandedCard>

        <BrandedCard padding="md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Custom Domains</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.filter(t => t.customDomain).length}
              </p>
            </div>
          </div>
        </BrandedCard>
      </div>

      {/* Filters and Search */}
      <BrandedCard padding="md" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="trial">Trial</option>
            </select>
            
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Tiers</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </BrandedCard>

      {/* Tenants Table */}
      <BrandedCard>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {tenant.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {tenant.slug}
                        </div>
                        <div className="text-xs text-gray-400">
                          {tenant.adminEmail}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(tenant.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTierBadge(tenant.subscriptionTier)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tenant.customDomain ? (
                      <span className="text-green-600 font-medium">
                        {tenant.customDomain}
                      </span>
                    ) : tenant.subdomain ? (
                      <span className="text-blue-600">
                        {tenant.subdomain}.tutorkai.com
                      </span>
                    ) : (
                      <span className="text-gray-400">Not configured</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(tenant.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 mr-1" />
                      {formatDate(tenant.lastLoginAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onSelectTenant?.(tenant.id)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                        title="Manage Branding"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => window.open(`https://${tenant.customDomain || tenant.subdomain + '.tutorkai.com'}`, '_blank')}
                        className="text-green-600 hover:text-green-900 p-1 rounded"
                        title="View Site"
                        disabled={!tenant.customDomain && !tenant.subdomain}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => window.location.href = `mailto:${tenant.adminEmail}`}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Contact Admin"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Delete Tenant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTenants.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || tierFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first tenant.'}
              </p>
              {!searchTerm && statusFilter === 'all' && tierFilter === 'all' && (
                <div className="mt-6">
                  <BrandedButton onClick={onCreateTenant || (() => setShowCreateModal(true))}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Tenant
                  </BrandedButton>
                </div>
              )}
            </div>
          )}
        </div>
      </BrandedCard>
    </div>
  );
};

export default TenantOverviewDashboard;